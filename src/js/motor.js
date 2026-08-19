/* MOTOR DE CÁLCULO — puro, sin DOM, cubierto por test/motor.test.mjs.
   Orden de aplicación (no lo cambies sin leer CLAUDE.md):
   1) regla proporcional por infraseguro  2) deducible  3) tope
   Hasta Dónde — https://github.com/  ·  licencia MIT  */

import { CONFIG } from './config.js';

/* El deducible tiene tres modalidades reales de mercado (ver CLAUDE.md,
   regla 8 y LECTOR-PATRONES.md):
   - 'pct' (por defecto): el mayor entre porcentaje, mínimo en SMMLV
     (mensual) y mínimo en SMDLV (diario). Nunca se convierte un SMDLV en
     SMMLV o viceversa: son campos separados, cada uno multiplicado por su
     propia constante.
   - 'fijo': un monto fijo en pesos, sin porcentaje ni mínimo.
   - 'mixto': un monto fijo MÁS un porcentaje — una suma, no un máximo.
   d.modoDeducible decide cuál aplica; si no viene, es 'pct'. */
function calcular(d) {
  const P  = Math.max(0, +d.perdida || 0);
  const VA = Math.max(0, +d.valorAsegurado || 0);
  const VR = Math.max(0, +d.valorReal || 0);

  // Infraseguro / regla proporcional — art. 1102 C.Co.
  const hayInfra = VR > 0 && VA > 0 && VA < VR;
  const factor   = hayInfra ? VA / VR : 1;
  const Pajust   = P * factor;
  const porInfra = P - Pajust;

  const base       = d.baseDeducible === 'perdida' ? Pajust : VA;
  const porPct     = base * (+d.dedPct || 0) / 100;
  const porMinMes  = (+d.dedMinSMMLV || 0) * CONFIG.SMMLV;
  const porMinDia  = (+d.dedMinSMDLV || 0) * CONFIG.SMMLV / 30;
  const fijo       = +d.dedFijo || 0;

  const modo = d.modoDeducible || 'pct';
  const Dteorico = modo === 'fijo' ? fijo
    : modo === 'mixto' ? fijo + porPct
    : Math.max(porPct, porMinMes, porMinDia);

  // Indemnización, con tope por sublímite o por valor asegurado
  const sinTope = Math.max(0, Pajust - Dteorico);
  const tope    = +d.sublimite > 0 ? +d.sublimite : (VA > 0 ? VA : Infinity);
  const indem   = Math.min(sinTope, tope);
  const porTope = sinTope - indem;
  const dedAplicado = Math.min(Dteorico, Pajust);

  const mandaMinimo = modo === 'pct' && Math.max(porMinMes, porMinDia) > porPct && Math.max(porMinMes, porMinDia) > 0;

  return {
    perdida: P,
    indemnizacion: indem,
    deducible: dedAplicado,
    deducibleTeorico: Dteorico,
    porInfraseguro: porInfra,
    porTope,
    hayInfra, factor,
    modo,
    mandaMinimo,
    mandaMinimoDiario: mandaMinimo && porMinDia >= porMinMes && porMinDia > 0,
    topeAplicado: porTope > 0, tope,
    pctRecuperado: P > 0 ? indem / P * 100 : 0,
    deTuBolsillo: P - indem
  };
}

export { calcular };
