/* SEMILLA DE CLAUSULADOS — condiciones generales: qué existe, cómo se
   estructura, qué verificar. Estable y compartible entre pólizas del mismo
   producto. A propósito NO lleva deducible ni mínimo: eso varía de póliza
   a póliza incluso dentro del mismo producto y de la misma aseguradora
   (art. 184 EOSF), así que presentarlo aquí lo haría ver como una regla
   del producto. Los deducibles que sí se han visto en pólizas reales están
   en deducibles-observados.js, fechados y citando su fuente.
   Ver CLAUDE.md, regla 8.
   Hasta Dónde — https://github.com/  ·  licencia MIT  */

const CLAUSULADOS_SEED = [
 {aseguradora:'Referencia de mercado', producto:'Copropiedad / PH – áreas comunes', ramo:'PH', codigo:'—',
  notas:'La Ley 675 de 2001 obliga a asegurar bienes comunes contra incendio y terremoto. Verifica que el amparo esté otorgado y que el valor asegurado corresponda a costo de reconstrucción actual, no al avalúo catastral. El deducible de terremoto varía por póliza: está en tu carátula.'},
 {aseguradora:'Referencia de mercado', producto:'Multirriesgo PYME', ramo:'PYME', codigo:'—',
  notas:'Edificio, maquinaria, mercancía y equipo electrónico suelen tener deducibles distintos entre sí. El lucro cesante casi siempre usa deducible en días (periodo de carencia), no en pesos. El deducible de terremoto varía por póliza: está en tu carátula.'},
 {aseguradora:'Referencia de mercado', producto:'Hogar voluntario', ramo:'Hogar', codigo:'—',
  notas:'Estructura y contenidos se manejan como ítems separados. Confirma si los contenidos están a valor de reposición a nuevo o a valor real. El deducible de terremoto varía por póliza: está en tu carátula.'},
 {aseguradora:'Referencia de mercado', producto:'Incendio y terremoto ligado a crédito hipotecario', ramo:'Hogar', codigo:'—',
  notas:'Lo contrata el banco y protege su interés asegurable. Con frecuencia cubre solo estructura y por el saldo de la deuda. Los contenidos suelen quedar por fuera. La carátula la tiene el banco y la entrega cuando se solicita.'},
 {aseguradora:'Referencia de mercado', producto:'Automóviles todo riesgo', ramo:'Autos', codigo:'—',
  notas:'Los eventos de la naturaleza suelen entrar en daños parciales y pérdida total. El SOAT no cubre el vehículo en ningún caso. Revisa el umbral de pérdida total y el tratamiento del salvamento. El mercado de autos documenta más de una decena de estructuras de deducible distintas: no hay una "típica".'}
];

export { CLAUSULADOS_SEED };
