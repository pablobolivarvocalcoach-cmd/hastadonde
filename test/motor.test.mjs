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

/* --- Modalidades de deducible: pct (por defecto), fijo, mixto --- */

test('modo "fijo": el deducible es un monto en pesos, sin porcentaje ni mínimo', () => {
  const r = calcular({ perdida:50e6, valorAsegurado:500e6, valorReal:500e6,
                       modoDeducible:'fijo', dedFijo:5e6, dedPct:2, dedMinSMMLV:10 });
  cerca(r.deducibleTeorico, 5e6); // ignora dedPct y dedMinSMMLV: solo manda el fijo
  cerca(r.indemnizacion, 45e6);
  assert.equal(r.mandaMinimo, false);
});

test('modo "mixto": el deducible es un monto fijo MÁS un porcentaje (suma, no máximo)', () => {
  const r = calcular({ perdida:50e6, valorAsegurado:500e6, valorReal:500e6,
                       modoDeducible:'mixto', dedFijo:2e6, dedPct:1, baseDeducible:'valorAsegurado' });
  // 1% de 500M = 5M, más 2M fijo = 7M. Si fuera MAX (como en 'pct') sería solo 5M.
  cerca(r.deducibleTeorico, 7e6);
  cerca(r.indemnizacion, 43e6);
});

test('sin modoDeducible, el comportamiento por defecto sigue siendo "pct" (compatibilidad)', () => {
  const r = calcular({ perdida:80e6, valorAsegurado:2000e6, valorReal:2000e6, dedPct:2, dedMinSMMLV:3 });
  assert.equal(r.modo, 'pct');
  cerca(r.deducibleTeorico, 40e6);
});

test('el mínimo en SMDLV (diario) nunca se confunde con el mínimo en SMMLV (mensual)', () => {
  const r = calcular({ perdida:50e6, valorAsegurado:100e6, valorReal:100e6,
                       baseDeducible:'perdida', dedPct:5, dedMinSMDLV:15 });
  // 5% de 50M = 2.5M; 15 SMDLV = 15 * (SMMLV/30), bastante menor a 15 SMMLV.
  cerca(r.deducibleTeorico, Math.max(2.5e6, 15 * CONFIG.SMMLV / 30));
  assert.ok(r.deducibleTeorico < 15 * CONFIG.SMMLV,
    'un mínimo en SMDLV jamás debe calcularse como si fuera SMMLV (error de ~30x)');
});

test('manda el mínimo diario (SMDLV) cuando supera al porcentaje y al mínimo mensual', () => {
  const r = calcular({ perdida:5e6, valorAsegurado:60e6, valorReal:60e6,
                       baseDeducible:'perdida', dedPct:1, dedMinSMDLV:15, dedMinSMMLV:0 });
  assert.equal(r.mandaMinimo, true);
  assert.equal(r.mandaMinimoDiario, true);
  cerca(r.deducibleTeorico, 15 * CONFIG.SMMLV / 30);
});
