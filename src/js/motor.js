/* MOTOR DE CÁLCULO — puro, sin DOM, cubierto por test/motor.test.mjs.
   Orden de aplicación (no lo cambies sin leer CLAUDE.md):
   1) regla proporcional por infraseguro  2) deducible  3) tope
   Hasta Dónde — https://github.com/  ·  licencia MIT  */

import { CONFIG, RANGO_DEDUCIBLE } from './config.js';

function calcular(d) {
  const P  = Math.max(0, +d.perdida || 0);
  const VA = Math.max(0, +d.valorAsegurado || 0);
  const VR = Math.max(0, +d.valorReal || 0);

  // Infraseguro / regla proporcional — art. 1102 C.Co.
  const hayInfra = VR > 0 && VA > 0 && VA < VR;
  const factor   = hayInfra ? VA / VR : 1;
  const Pajust   = P * factor;
  const porInfra = P - Pajust;

  // Deducible: se aplica el mayor entre porcentaje, mínimo en SMMLV y monto fijo
  const base   = d.baseDeducible === 'perdida' ? Pajust : VA;
  const porPct = base * (+d.dedPct || 0) / 100;
  const porMin = (+d.dedMinSMMLV || 0) * CONFIG.SMMLV;
  const Dteorico = Math.max(porPct, porMin, +d.dedFijo || 0);

  // Indemnización, con tope por sublímite o por valor asegurado
  const sinTope = Math.max(0, Pajust - Dteorico);
  const tope    = +d.sublimite > 0 ? +d.sublimite : (VA > 0 ? VA : Infinity);
  const indem   = Math.min(sinTope, tope);
  const porTope = sinTope - indem;
  const dedAplicado = Math.min(Dteorico, Pajust);

  return {
    perdida: P,
    indemnizacion: indem,
    deducible: dedAplicado,
    deducibleTeorico: Dteorico,
    porInfraseguro: porInfra,
    porTope,
    hayInfra, factor,
    mandaMinimo: porMin > porPct && porMin > 0,
    topeAplicado: porTope > 0, tope,
    pctRecuperado: P > 0 ? indem / P * 100 : 0,
    deTuBolsillo: P - indem
  };
}

/* Cuando no se conoce el deducible, se devuelven los dos extremos del
   mercado. `optimista` es el mejor caso posible, `pesimista` el peor.
   Mostrar solo uno de los dos sería inventar precisión. */
function calcularRango(d, ramo) {
  const r = RANGO_DEDUCIBLE[ramo] || RANGO_DEDUCIBLE.hogar;
  const con = e => calcular({ ...d, dedPct: e.pct, dedMinSMMLV: e.smmlv });
  const a = con(r.min), b = con(r.max);
  const optimista = a.indemnizacion >= b.indemnizacion ? a : b;
  const pesimista = a.indemnizacion >= b.indemnizacion ? b : a;
  return { optimista, pesimista, rango: r, esRango: true };
}

export { calcular, calcularRango };
