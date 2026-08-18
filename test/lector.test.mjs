import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agruparLineas, aplanarPaginas, calidadTexto, extraerCandidatos,
  buscarDeducibleTerremoto, buscarVigencia, buscarValorAsegurado, buscarCodigoClausulado,
  buscarDefiniciones, buscarExclusiones, extraerTablaDeducibles, extraerValoresPorItem,
  extraerCoaseguro, buscarPlazoAviso, buscarAnticipoIndemnizacion, buscarDemeritoPorUso,
  paginaLegible, limpiarNotaAlPie, pareceImagen } from '../src/js/lector.js';

/* Helper: arma líneas numeradas a partir de un arreglo de texto plano, todas
   en la misma página salvo que se indique lo contrario. Los ejemplos de
   abajo vienen de LECTOR-PATRONES.md — cifras anonimizadas, estructura y
   vocabulario reales, tomados de una póliza colombiana real de copropiedad. */
const enPagina = (pagina, textos) => textos.map((texto, i) => ({ pagina, linea: i + 1, texto }));

/* pdf.js entrega y creciente hacia arriba de la página. transform = [a,b,c,d,x,y] */
const item = (str, x, y) => ({ str, transform: [1, 0, 0, 1, x, y] });

test('agruparLineas reconstruye el orden de lectura a partir de posiciones sueltas', () => {
  const items = [
    item('mundo', 40, 700), item('Hola', 10, 700),      // misma línea, fuera de orden
    item('línea', 60, 650), item('Segunda', 10, 650.5)   // otra línea, y con leve ruido
  ];
  const lineas = agruparLineas(items);
  assert.deepEqual(lineas, ['Hola mundo', 'Segunda línea']);
});

test('agruparLineas no funde dos renglones distintos', () => {
  const items = [item('Arriba', 10, 700), item('Abajo', 10, 680)];
  assert.equal(agruparLineas(items).length, 2);
});

test('aplanarPaginas numera página y línea empezando en 1', () => {
  const lineas = aplanarPaginas([['a', 'b'], ['c']]);
  assert.deepEqual(lineas, [
    { pagina: 1, linea: 1, texto: 'a' },
    { pagina: 1, linea: 2, texto: 'b' },
    { pagina: 2, linea: 1, texto: 'c' }
  ]);
});

test('calidadTexto penaliza caracteres de reemplazo', () => {
  const limpio = calidadTexto([{ texto: 'Deducible terremoto 2% del valor asegurado' }]);
  const sucio  = calidadTexto([{ texto: '����������deducible' }]);
  assert.ok(limpio > 0.9, `texto limpio debería dar calidad alta, dio ${limpio}`);
  assert.ok(sucio < 0.5, `texto corrupto debería dar calidad baja, dio ${sucio}`);
});

test('buscarDeducibleTerremoto exige el evento Y un número en la misma línea', () => {
  const positivo = buscarDeducibleTerremoto([
    { pagina: 3, linea: 5, texto: 'Deducible terremoto: 2% del valor asegurado, mínimo 3 SMMLV' }
  ]);
  assert.ok(positivo);
  assert.equal(positivo.pct, '2');
  assert.equal(positivo.smmlv, '3');
  assert.equal(positivo.smdlv, null);
  assert.equal(positivo.pagina, 3);
  assert.equal(positivo.linea, 5);
});

/* ============================================================
   Punto 0 (LECTOR-PATRONES.md): SMDLV (diario) no es SMMLV (mensual).
   15 SMDLV es medio salario mensual, no quince — confundirlos multiplica
   el deducible por ~30. Nunca se convierte uno en otro: son campos
   separados siempre.
   ============================================================ */
test('SMDLV y SMMLV nunca se mezclan: un mínimo en SMDLV no aparece como smmlv', () => {
  const r = buscarDeducibleTerremoto([
    { pagina: 1, linea: 1, texto: 'Deducible terremoto: 1% del valor asegurable mínimo 15 SMDLV' }
  ]);
  assert.ok(r);
  assert.equal(r.smdlv, '15');
  assert.equal(r.smmlv, null, 'un mínimo en SMDLV jamás debe terminar en el campo de SMMLV');
});

test('acepta SMLDV como variante de SMDLV (siglas trocadas, vista en pólizas reales)', () => {
  const r = buscarDeducibleTerremoto([
    { pagina: 1, linea: 1, texto: 'Deducible terremoto: 1% de la pérdida mínimo 0.5 SMLDV' }
  ]);
  assert.ok(r);
  assert.equal(r.smdlv, '0.5');
});

test('el texto en prosa "salarios mínimos diarios" no se confunde con SMMLV', () => {
  // Regresión del bug real: una regex vieja para SMMLV que solo pedía
  // "salarios mínimos" (sin exigir "mensuales") hacía match aunque la frase
  // completa dijera "salarios mínimos diarios legales vigentes" — el mismo
  // error de 30x pero en prosa en vez de sigla.
  const r = buscarDeducibleTerremoto([
    { pagina: 1, linea: 1, texto: 'Deducible terremoto: 2% de la pérdida mínimo 15 salarios mínimos diarios legales vigentes' }
  ]);
  assert.ok(r);
  assert.equal(r.smmlv, null, 'la frase dice "diarios": nunca debe leerse como SMMLV');
  assert.equal(r.smdlv, '15');
});

test('el texto en prosa "salario mínimo mensual legal vigente" sí es SMMLV', () => {
  const r = buscarDeducibleTerremoto([
    { pagina: 1, linea: 1, texto: 'Deducible terremoto: 2% de la pérdida mínimo 3 salario mínimo mensual legal vigente' }
  ]);
  assert.ok(r);
  assert.equal(r.smmlv, '3');
  assert.equal(r.smdlv, null);
});

test('buscarDeducibleTerremoto no inventa nada si falta el evento o el número', () => {
  assert.equal(buscarDeducibleTerremoto([{ pagina: 1, linea: 1, texto: 'Deducible hurto: 10%' }]), null);
  assert.equal(buscarDeducibleTerremoto([{ pagina: 1, linea: 1, texto: 'Amparo de terremoto incluido' }]), null);
});

test('buscarVigencia exige dos fechas en la misma línea', () => {
  const r = buscarVigencia([{ pagina: 1, linea: 2, texto: 'Vigencia: desde 01/01/2026 hasta 01/01/2027' }]);
  assert.ok(r);
  assert.equal(r.desde, '01/01/2026');
  assert.equal(r.hasta, '01/01/2027');
  assert.equal(buscarVigencia([{ pagina: 1, linea: 1, texto: 'Vigencia: un año' }]), null);
});

test('buscarValorAsegurado exige un monto en pesos junto a la etiqueta', () => {
  const r = buscarValorAsegurado([{ pagina: 4, linea: 1, texto: 'Valor asegurado: $2.000.000.000' }]);
  assert.ok(r);
  assert.equal(r.monto, '$2.000.000.000');
  assert.equal(buscarValorAsegurado([{ pagina: 1, linea: 1, texto: 'Valor asegurable a definir' }]), null);
});

test('pareceImagen no marca como imagen una carátula corta pero real', () => {
  // Regresión: una carátula de una sola página con pocas líneas es legítima
  // y no debe rechazarse como si fuera un escaneo. Un PDF de verdad
  // escaneado devuelve prácticamente 0 caracteres, no "pocos pero reales".
  const textoCortoReal = 'CARÁTULA DE PRUEBAVigencia: desde 01/01/2026 hasta 01/01/2027Valor asegurado: $2.000.000.000';
  assert.equal(pareceImagen(textoCortoReal.length), false);
});

test('pareceImagen sí marca un documento prácticamente sin texto', () => {
  assert.equal(pareceImagen(0), true);
  assert.equal(pareceImagen(5), true);
});

test('extraerCandidatos nunca revienta con líneas vacías o sin coincidencias', () => {
  assert.deepEqual(extraerCandidatos([]), []);
  assert.deepEqual(extraerCandidatos([{ pagina: 1, linea: 1, texto: 'texto cualquiera sin nada útil' }]), []);
});

test('buscarCodigoClausulado exige la etiqueta correcta junto al código', () => {
  const r = buscarCodigoClausulado([
    { pagina: 8, linea: 3, texto: 'Código de clausulado depositado: CGP-2024-0451' }
  ]);
  assert.ok(r);
  assert.equal(r.codigo, 'CGP-2024-0451');
  assert.equal(buscarCodigoClausulado([{ pagina: 1, linea: 1, texto: 'Código postal: 110111' }]), null);
});

test('buscarDefiniciones toma la primera aparición de cada término, con contexto de la misma página', () => {
  const lineas = [
    { pagina: 5, linea: 1, texto: 'Se entiende por pérdida total' },
    { pagina: 5, linea: 2, texto: 'cuando el costo de reparación' },
    { pagina: 5, linea: 3, texto: 'supere el 75% del valor asegurado.' },
    { pagina: 6, linea: 1, texto: 'Nada relevante en esta página' }
  ];
  const r = buscarDefiniciones(lineas);
  const pt = r.find(d => d.termino === 'Pérdida total');
  assert.ok(pt);
  assert.equal(pt.pagina, 5);
  assert.ok(pt.contexto.includes('costo de reparación'));
  assert.equal(r.some(d => d.termino === 'Valor admitido'), false);
});

test('buscarDefiniciones no cruza el contexto a la página siguiente', () => {
  const lineas = [
    { pagina: 1, linea: 9, texto: 'Valor admitido' },
    { pagina: 2, linea: 1, texto: 'esto ya es de otra página' }
  ];
  const r = buscarDefiniciones(lineas).find(d => d.termino === 'Valor admitido');
  assert.equal(r.contexto, 'Valor admitido');
});

test('buscarDefiniciones no arrastra el encabezado siguiente dentro del contexto', () => {
  // Regresión real: encontrada probando con una póliza sintética. Cuando el
  // PDF no deja una línea en blanco real entre el final de una cláusula y
  // el siguiente encabezado, "líneas de contexto" sin límite de frase se
  // comía el título de la sección de al lado — en este caso, la definición
  // de "valor real" arrastraba "Exclusiones" como si fuera parte de ella.
  const lineas = [
    { pagina: 3, linea: 1, texto: 'la Compañía pagará la indemnización por su valor real.' },
    { pagina: 3, linea: 2, texto: 'Exclusiones' },
    { pagina: 3, linea: 3, texto: 'a) Guerra y actos de terrorismo.' }
  ];
  const r = buscarDefiniciones(lineas).find(d => d.termino === 'Valor real');
  assert.ok(r);
  assert.equal(r.contexto, 'la Compañía pagará la indemnización por su valor real.');
});

test('buscarExclusiones junta el bloque hasta el siguiente encabezado, sin cruzar de página', () => {
  const lineas = [
    { pagina: 4, linea: 1, texto: 'Exclusiones' },
    { pagina: 4, linea: 2, texto: 'a) Guerra y actos de terrorismo.' },
    { pagina: 4, linea: 3, texto: 'b) Energía nuclear.' },
    { pagina: 4, linea: 4, texto: 'OBLIGACIONES DEL ASEGURADO' },
    { pagina: 4, linea: 5, texto: 'c) Esto ya no debería entrar' },
    { pagina: 5, linea: 1, texto: 'd) Esto es de otra página, tampoco entra' }
  ];
  const r = buscarExclusiones(lineas);
  assert.ok(r);
  assert.equal(r.pagina, 4);
  assert.deepEqual(r.items, ['a) Guerra y actos de terrorismo.', 'b) Energía nuclear.']);
});

test('buscarExclusiones no inventa una sección que no existe', () => {
  assert.equal(buscarExclusiones([{ pagina: 1, linea: 1, texto: 'texto normal de la póliza' }]), null);
});

/* ============================================================
   Punto 1: si la póliza no pacta mínimo para terremoto, el mínimo es
   cero — no se inventa uno por defecto. La fila real de terremoto de
   LECTOR-PATRONES.md no dice "mínimo" en ninguna parte.
   ============================================================ */
test('extraerTablaDeducibles no inventa un mínimo cuando la póliza no lo pactó', () => {
  const filas = extraerTablaDeducibles(
    enPagina(6, ['Terremoto    1% del valor asegurable del ítem afectado'])
  );
  assert.equal(filas.length, 1);
  assert.equal(filas[0].amparo, 'Terremoto');
  assert.equal(filas[0].pct, '1');
  assert.equal(filas[0].base, 'valorAsegurable');
  assert.equal(filas[0].smmlv, null);
  assert.equal(filas[0].smdlv, null);
});

/* ============================================================
   Punto 2: no existe "el deducible" de una póliza — existe una tabla, y
   distintos amparos calculan sobre bases distintas en el mismo documento.
   ============================================================ */
test('extraerTablaDeducibles distingue base "de la pérdida" vs "valor asegurable" en la misma póliza', () => {
  const filas = extraerTablaDeducibles(enPagina(6, [
    'Amparo básico todo riesgo daño material   5% de la pérdida mínimo 15 SMDLV',
    'Terremoto                                 1% del valor asegurable del ítem afectado',
    'Extensión adicional del amparo básico     5% de la pérdida mínimo 15 SMDLV',
    'Inundación                                5% de la pérdida mínimo 15 SMDLV',
    'Sabotaje y terrorismo                     10% de la pérdida mínimo 2 SMMLV'
  ]));
  assert.equal(filas.length, 5);

  const terremoto = filas.find(f => f.amparo.startsWith('Terremoto'));
  assert.equal(terremoto.base, 'valorAsegurable');
  assert.equal(terremoto.smdlv, null);

  const sabotaje = filas.find(f => f.amparo.startsWith('Sabotaje'));
  assert.equal(sabotaje.base, 'perdida');
  assert.equal(sabotaje.smmlv, '2');
  assert.equal(sabotaje.smdlv, null);

  const basico = filas.find(f => f.amparo.startsWith('Amparo básico'));
  assert.equal(basico.base, 'perdida');
  assert.equal(basico.smdlv, '15');
  assert.equal(basico.smmlv, null);
});

test('extraerTablaDeducibles reconoce "Sin deducible" como un valor explícito, no como ausencia de dato', () => {
  const filas = extraerTablaDeducibles(enPagina(7, ['Rotura de maquinaria   Sin deducible']));
  assert.equal(filas.length, 1);
  assert.equal(filas[0].sinDeducible, true);
  assert.equal(filas[0].amparo, 'Rotura de maquinaria');
});

test('extraerTablaDeducibles no confunde un porcentaje de coaseguro con una fila de deducible', () => {
  // Mismo problema que ya resolvimos para terremoto: un % suelto no basta.
  const filas = extraerTablaDeducibles(enPagina(2, ['Asegurador   COMPAÑÍA A (Líder) - 10%']));
  assert.equal(filas.length, 0);
});

/* ============================================================
   Punto 3: el valor asegurado es un desglose por ítem, no un total. Los
   ítems en $0 son cobertura no contratada y hay que marcarlos, no
   perderlos.
   ============================================================ */
test('extraerValoresPorItem captura el desglose completo, incluidos los ítems en $0', () => {
  const filas = extraerValoresPorItem(enPagina(9, [
    'Áreas e inmuebles de propiedad común   $ 15.000.000.000',
    'Cimientos                              $ 0',
    'Áreas privadas                         $  9.000.000.000',
    'Muebles y enseres                      $ 0'
  ]));
  assert.equal(filas.length, 4);
  const cimientos = filas.find(f => f.item === 'Cimientos');
  assert.equal(cimientos.enCero, true);
  const comunes = filas.find(f => f.item.startsWith('Áreas e inmuebles'));
  assert.equal(comunes.enCero, false);
  assert.equal(comunes.monto, '$ 15.000.000.000');
});

test('extraerValoresPorItem no se confunde con la fila-etiqueta "valores asegurados"', () => {
  const filas = extraerValoresPorItem(enPagina(9, ['COBERTURA   VALORES ASEGURADOS']));
  assert.equal(filas.length, 0);
});

/* ============================================================
   Punto 4: el código del clausulado va en prosa después de la frase
   "REGISTRO CONDICIONADO GENERAL", no en el pie de página — y el PDF
   parte ese párrafo en varias líneas al ajustarlo al ancho de la hoja.
   ============================================================ */
test('buscarCodigoClausulado encuentra el código en prosa, partido en varias líneas', () => {
  const r = buscarCodigoClausulado(enPagina(22, [
    'Clausulado   PÓLIZA DE TODO RIESGO PARA COPROPIEDADES. A este producto de',
    'seguro le serán aplicables los términos y condiciones del',
    'condicionado general Código REGISTRO CONDICIONADO GENERAL',
    '00000000-0000-P-00-PRODUCTOXXX-D00I y que ha sido previamente',
    'depositado en la Superintendencia Financiera de Colombia'
  ]));
  assert.ok(r);
  assert.equal(r.codigo, '00000000-0000-P-00-PRODUCTOXXX-D00I');
  assert.equal(r.pagina, 22);
});

test('buscarCodigoClausulado cae al patrón de línea corta si no hay prosa con REGISTRO CONDICIONADO GENERAL', () => {
  const r = buscarCodigoClausulado(enPagina(8, ['Código de clausulado depositado: CGP-2024-0451']));
  assert.ok(r);
  assert.equal(r.codigo, 'CGP-2024-0451');
});

/* ============================================================
   Punto 5: las condiciones particulares pueden modificar los plazos de
   ley — si esta póliza amplió el plazo de aviso, el informe debe mostrar
   el plazo real, no el de la ley por defecto.
   ============================================================ */
test('buscarPlazoAviso encuentra el plazo modificado en condiciones particulares', () => {
  const r = buscarPlazoAviso(enPagina(3, [
    '3. Con la finalidad de ofrecer mayor comodidad a nuestros clientes, el plazo',
    'de aviso del siniestro se amplía a 15 días.'
  ]));
  assert.ok(r);
  assert.equal(r.dias, '15');
});

test('buscarAnticipoIndemnizacion detecta la mención sin inventar una cifra', () => {
  const r = buscarAnticipoIndemnizacion(enPagina(3, [
    'El asegurado podrá solicitar por escrito un anticipo de indemnización',
    'antes de que se formalice la reclamación.'
  ]));
  assert.ok(r);
  assert.equal(r.pagina, 3);
  assert.equal(buscarAnticipoIndemnizacion(enPagina(1, ['nada relacionado aquí'])), null);
});

/* ============================================================
   Punto 6: demérito por uso cambia lo que te pagan a partir de cierta
   antigüedad — el umbral (ej. 70%) es el dato que hay que mostrar.
   ============================================================ */
test('buscarDemeritoPorUso extrae el umbral cuando está en el mismo bloque', () => {
  const r = buscarDemeritoPorUso(enPagina(11, [
    '9. Demérito por Uso (Aplica para Copropiedades a partir de los 10 años de',
    'construcción): Se aplicará demérito por uso a las Pérdidas Totales',
    'cuando la reparación o reposición supere el 70% del valor a nuevo del bien',
    'siniestrado, la Compañía pagará la indemnización por su valor real.'
  ]));
  assert.ok(r);
  assert.equal(r.umbralPct, '70');
});

test('buscarDemeritoPorUso avisa la cláusula aunque no encuentre el umbral', () => {
  const r = buscarDemeritoPorUso(enPagina(11, ['9. Demérito por Uso: se aplicará según tabla anexa.']));
  assert.ok(r, 'debe avisar que existe la cláusula, aunque no pueda dar el número');
  assert.equal(r.umbralPct, null);
});

/* ============================================================
   Punto 7: coaseguro — dos compañías responden por porcentaje.
   ============================================================ */
test('extraerCoaseguro lee las filas de aseguradoras con su porcentaje', () => {
  const filas = extraerCoaseguro(enPagina(2, [
    'Asegurador   COMPAÑÍA A (Líder) - 10%',
    'Asegurador   COMPAÑÍA B - 90%'
  ]));
  assert.equal(filas.length, 2);
  assert.equal(filas[0].pct, '10');
  assert.equal(filas[0].lider, true);
  assert.equal(filas[1].pct, '90');
  assert.equal(filas[1].lider, false);
});

/* ============================================================
   Punto 8: problemas de extracción de texto.
   ============================================================ */
test('paginaLegible descarta una página con la fuente mal codificada', () => {
  // "8VWHG FXHQWD FRQ" es lo que devuelve el extractor cuando el PDF dice
  // "Usted cuenta con", con una fuente sin tabla de caracteres correcta.
  assert.equal(paginaLegible('8VWHG FXHQWD FRQ HVWD S OL]D GH WRGR ULHVJR'), false);
  assert.equal(paginaLegible('Usted cuenta con esta póliza de todo riesgo para copropiedades'), true);
});

test('paginaLegible no descarta una página con poco texto para juzgar', () => {
  assert.equal(paginaLegible('Pág. 4'), true);
});

test('limpiarNotaAlPie quita el dígito pegado al nombre o al signo de pesos, sin tocar el monto', () => {
  assert.equal(
    limpiarNotaAlPie('Amparo básico todo riesgo daño material1 $ 28.000.000.000'),
    'Amparo básico todo riesgo daño material $ 28.000.000.000'
  );
  assert.equal(
    limpiarNotaAlPie('Manejo e infidelidad de empleados3$ 20.000.000'),
    'Manejo e infidelidad de empleados$ 20.000.000'
  );
  assert.equal(
    limpiarNotaAlPie('Equipos eléctricos y electrónicos2 $ 100.000.000'),
    'Equipos eléctricos y electrónicos $ 100.000.000'
  );
});

test('buscarVigencia lee "Fecha inicio vigencia" / "Fecha fin vigencia" en la misma línea', () => {
  const r = buscarVigencia(enPagina(1, [
    'Fecha inicio vigencia 15/02/2026 desde las 16 HH Fecha fin vigencia 15/02/2027 hasta las 16 HH'
  ]));
  assert.ok(r);
  assert.equal(r.desde, '15/02/2026');
  assert.equal(r.hasta, '15/02/2027');
});

test('buscarVigencia no se confunde si una fecha ajena aparece antes de las etiquetadas', () => {
  const r = buscarVigencia(enPagina(1, [
    'Vigencia Fecha de expedición 01/01/2026 Fecha inicio vigencia 15/02/2026 Fecha fin vigencia 15/02/2027'
  ]));
  assert.ok(r);
  assert.equal(r.desde, '15/02/2026');
  assert.equal(r.hasta, '15/02/2027');
});
