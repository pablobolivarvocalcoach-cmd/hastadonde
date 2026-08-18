import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcular } from '../src/js/motor.js';
import { CONFIG } from '../src/js/config.js';

const base = { baseDeducible:'valorAsegurado', dedPct:2, dedMinSMMLV:0 };
const cerca = (a,b,tol=1) => assert.ok(Math.abs(a-b)<=tol, `${a} ≠ ${b}`);

test('el deducible se calcula sobre el valor asegurado, no sobre la pérdida', () => {
  const r = calcular({ ...base, perdida:80e6, valorAsegurado:2000e6, valorReal:2000e6 });
  cerca(r.deducibleTeorico, 40e6);   // 2% de 2.000M, no 2% de 80M
  cerca(r.indemnizacion, 40e6);
});

test('si el deducible supera la pérdida, la indemnización es cero (nunca negativa)', () => {
  const r = calcular({ ...base, perdida:30e6, valorAsegurado:2000e6, valorReal:2000e6 });
  assert.equal(r.indemnizacion, 0);
  assert.ok(r.deducible <= r.perdida, 'el deducible mostrado no puede exceder la pérdida');
});

test('base "perdida" cambia el resultado y se calcula sobre la pérdida ya ajustada', () => {
  const r = calcular({ perdida:8e6, valorAsegurado:60e6, valorReal:60e6,
                       baseDeducible:'perdida', dedPct:10, dedMinSMMLV:0 });
  cerca(r.deducibleTeorico, 800_000);
  cerca(r.indemnizacion, 7.2e6);
});

test('manda el mínimo en SMMLV cuando supera al porcentaje', () => {
  const r = calcular({ perdida:20e6, valorAsegurado:200e6, valorReal:200e6,
                       baseDeducible:'valorAsegurado', dedPct:1, dedMinSMMLV:6 });
  cerca(r.deducibleTeorico, 6 * CONFIG.SMMLV);
  assert.equal(r.mandaMinimo, true);
});

test('regla proporcional del art. 1102: infraseguro reduce antes del deducible', () => {
  const r = calcular({ ...base, perdida:100e6, valorAsegurado:250e6, valorReal:500e6, dedPct:2, dedMinSMMLV:1 });
  assert.equal(r.hayInfra, true);
  cerca(r.factor, 0.5);
  cerca(r.porInfraseguro, 50e6);      // se pierde la mitad por infraseguro
  cerca(r.deducibleTeorico, 5e6);     // 2% de 250M
  cerca(r.indemnizacion, 45e6);       // (100-50) - 5
});

test('sin valorReal declarado no se inventa infraseguro', () => {
  const r = calcular({ ...base, perdida:50e6, valorAsegurado:500e6, valorReal:0 });
  assert.equal(r.hayInfra, false);
  assert.equal(r.porInfraseguro, 0);
});

test('sobreseguro no premia: asegurar de más no aumenta la indemnización', () => {
  const r = calcular({ ...base, perdida:50e6, valorAsegurado:900e6, valorReal:500e6, dedPct:0 });
  assert.equal(r.factor, 1);
  cerca(r.indemnizacion, 50e6);
});

test('el sublímite topa la indemnización y el faltante queda contabilizado', () => {
  const r = calcular({ ...base, perdida:200e6, valorAsegurado:2000e6, valorReal:2000e6,
                       dedPct:0, sublimite:100e6 });
  cerca(r.indemnizacion, 100e6);
  assert.equal(r.topeAplicado, true);
  cerca(r.porTope, 100e6);
});

test('la indemnización nunca supera el valor asegurado', () => {
  const r = calcular({ ...base, perdida:900e6, valorAsegurado:300e6, valorReal:300e6, dedPct:0 });
  assert.ok(r.indemnizacion <= 300e6);
});

test('INVARIANTE: deducible + infraseguro + sobre-el-límite + indemnización = pérdida', () => {
  const casos = [
    { perdida:80e6,  valorAsegurado:2000e6, valorReal:2000e6, dedPct:2,  dedMinSMMLV:3 },
    { perdida:100e6, valorAsegurado:250e6,  valorReal:500e6,  dedPct:2,  dedMinSMMLV:1 },
    { perdida:200e6, valorAsegurado:2000e6, valorReal:2000e6, dedPct:1,  sublimite:50e6 },
    { perdida:5e6,   valorAsegurado:60e6,   valorReal:80e6,   dedPct:10, dedMinSMMLV:2 },
    { perdida:0,     valorAsegurado:100e6,  valorReal:100e6,  dedPct:2 }
  ];
  for (const c of casos) {
    const r = calcular({ baseDeducible:'valorAsegurado', ...c });
    cerca(r.deducible + r.porInfraseguro + r.porTope + r.indemnizacion, r.perdida);
  }
});

test('entradas basura no rompen el motor', () => {
  for (const c of [{}, {perdida:'abc'}, {perdida:-500}, {perdida:1e6, valorAsegurado:null}]) {
    const r = calcular(c);
    assert.ok(Number.isFinite(r.indemnizacion) && r.indemnizacion >= 0);
  }
});
