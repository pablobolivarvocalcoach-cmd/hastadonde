import { test } from 'node:test';
import assert from 'node:assert/strict';
import { agruparLineas, aplanarPaginas, calidadTexto, extraerCandidatos,
  buscarDeducibleTerremoto, buscarVigencia, buscarValorAsegurado, pareceImagen } from '../src/js/lector.js';

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
  assert.equal(positivo.pagina, 3);
  assert.equal(positivo.linea, 5);
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
