/* DEDUCIBLES OBSERVADOS — dato de UNA póliza puntual, en UNA fecha. Nunca
   una regla del producto ni de la aseguradora: las compañías fijan
   condiciones y tarifas bajo el régimen de libertad de competencia del
   art. 184 del EOSF, así que la póliza de al lado —de la misma
   aseguradora, del mismo producto— puede traer una fórmula distinta. Cada
   fila es una observación fechada y con fuente, no una promesa. Todas las
   cifras de aquí vienen de huellas de extracción anonimizadas: nunca un
   dato de un cliente. Ver CLAUDE.md, regla 8, y LECTOR-PATRONES.md.
   Hasta Dónde — https://github.com/  ·  licencia MIT  */

const DEDUCIBLES_OBSERVADOS_SEED = [
  { aseguradora:'Compañía anonimizada 1', ramo:'PH', amparo:'Terremoto',
    formula:'1% del valor asegurable del ítem afectado, sin mínimo pactado',
    fecha:'2026', fuente:'LECTOR-PATRONES.md (huella anonimizada)' },
  { aseguradora:'Compañía anonimizada 1', ramo:'PH', amparo:'Amparo básico / extensión adicional / inundación',
    formula:'5% de la pérdida, mínimo 15 SMDLV',
    fecha:'2026', fuente:'LECTOR-PATRONES.md (huella anonimizada)' },
  { aseguradora:'Compañía anonimizada 1', ramo:'PH', amparo:'Sabotaje y terrorismo',
    formula:'10% de la pérdida, mínimo 2 SMMLV',
    fecha:'2026', fuente:'LECTOR-PATRONES.md (huella anonimizada)' },
  { aseguradora:'Compañía anonimizada 2', ramo:'PH', amparo:'Terremoto',
    formula:'1,00% del valor asegurable del bien afectado, sin mínimo pactado',
    fecha:'2026', fuente:'LECTOR-PATRONES-ADENDA-1.md (huella anonimizada)' },
  { aseguradora:'Compañía anonimizada 2', ramo:'PH', amparo:'Demás eventos / extended coverage / inundación / AMIT',
    formula:'5,00% de la pérdida, mínimo 15 SMDLV',
    fecha:'2026', fuente:'LECTOR-PATRONES-ADENDA-1.md (huella anonimizada)' }
];

export { DEDUCIBLES_OBSERVADOS_SEED };
