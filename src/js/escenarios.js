/* ESCENARIOS DE DEDUCIBLE — el deducible no se puede estimar: varía de
   póliza a póliza. Las aseguradoras fijan condiciones y tarifas bajo el
   régimen de libertad de competencia del art. 184 del EOSF, así que cada
   producto — y cada póliza dentro del mismo producto — puede traer una
   fórmula distinta. En autos hay documentados al menos 17 tipos de
   deducible en el mercado colombiano. No hay un "típico".

   Estos escenarios NO son una estimación: son fórmulas REALES, vistas en
   pólizas colombianas (LECTOR-PATRONES.md y sus adendas — huellas
   anonimizadas, nunca datos de un cliente), aplicadas a los números que la
   persona ya puso. El objetivo es que entienda que la BASE (pérdida vs.
   valor asegurable) y el mínimo pesan más que el porcentaje solo. Nunca se
   presentan como "el deducible típico" de un ramo ni de una aseguradora —
   cada uno cita dónde se observó. Ver CLAUDE.md, regla 8.
   Hasta Dónde — https://github.com/  ·  licencia MIT  */

import { calcular } from './motor.js';

const ESCENARIOS_DEDUCIBLE = [
  {
    id: 'asegurable-sin-minimo',
    etiqueta: '1% del valor asegurable, sin mínimo pactado',
    fuente: 'Terremoto — visto en dos pólizas de copropiedad de aseguradoras distintas',
    params: { baseDeducible: 'valorAsegurado', dedPct: 1, dedMinSMMLV: 0, dedMinSMDLV: 0 }
  },
  {
    id: 'perdida-min-smdlv',
    etiqueta: '5% de la pérdida, mínimo 15 SMDLV (salario mínimo diario)',
    fuente: 'Amparo básico / inundación — visto en dos pólizas de copropiedad de aseguradoras distintas',
    params: { baseDeducible: 'perdida', dedPct: 5, dedMinSMDLV: 15 }
  },
  {
    id: 'perdida-min-smmlv',
    etiqueta: '10% de la pérdida, mínimo 2 SMMLV (salario mínimo mensual)',
    fuente: 'Sabotaje y terrorismo — visto en una póliza de copropiedad',
    params: { baseDeducible: 'perdida', dedPct: 10, dedMinSMMLV: 2 }
  },
  {
    id: 'sin-deducible',
    etiqueta: 'Sin deducible',
    fuente: 'Rotura de maquinaria — visto en una póliza de copropiedad',
    params: { dedPct: 0, dedMinSMMLV: 0, dedMinSMDLV: 0 }
  }
];

/* d = { perdida, valorAsegurado, valorReal }, lo que la persona ya puso.
   Devuelve el resultado de calcular() para cada escenario — sin decidir
   cuál es "el suyo": eso solo lo dice su carátula. */
function calcularEscenarios(d) {
  return ESCENARIOS_DEDUCIBLE.map(e => ({
    ...e,
    resultado: calcular({ ...d, ...e.params })
  }));
}

export { ESCENARIOS_DEDUCIBLE, calcularEscenarios };
