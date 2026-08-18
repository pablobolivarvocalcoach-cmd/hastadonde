import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const archivos = ['catalogo', 'ui', 'plazos', 'glosario', 'clausulados', 'asesor']
  .map(f => [f, readFileSync(`src/js/${f}.js`, 'utf8')]);

/* La herramienta es una extensión del servicio del asesor, no un kit para
   auditarlo. Cada frase de abajo convierte una respuesta en una llamada. */
const PROHIBIDO = [
  [/le vas a preguntar/i,               'listas de preguntas para el asesor'],
  [/preguntas para (el|tu) asesor/i,    'listas de preguntas para el asesor'],
  [/exige .{0,25}por escrito/i,         'lenguaje de exigencia hacia el asesor o la aseguradora'],
  [/p[ií]d\w* .{0,25}por escrito/i,     'lenguaje de exigencia hacia el asesor o la aseguradora'],
  [/responsabilidad del (administrador|consejo)/i, 'insinuar responsabilidad de un tercero'],
  [/una respuesta verbal no sirve/i,    'encuadre adversarial frente al asesor']
];

test('el contenido no le arma al cliente un interrogatorio para su asesor', () => {
  for (const [nombre, texto] of archivos)
    for (const [patron, motivo] of PROHIBIDO)
      assert.ok(!patron.test(texto), `src/js/${nombre}.js contiene ${motivo}: ${patron}`);
});

test('el resultado entrega respuestas, carpeta y proceso', () => {
  const ui = archivos.find(([n]) => n === 'ui')[1];
  for (const pieza of ['generarRespuestas', 'DOCUMENTOS', 'PROCESO', 'Tu carpeta', 'cajaAsesor'])
    assert.ok(ui.includes(pieza), `falta ${pieza} en ui.js`);
});

test('la configuración del asesor está completa y es editable', () => {
  const a = archivos.find(([n]) => n === 'asesor')[1];
  for (const campo of ['mostrar', 'nombre', 'empresa', 'whatsapp', 'correo', 'invitacion'])
    assert.ok(new RegExp(`\\b${campo}:`).test(a), `falta el campo ${campo} en ASESOR`);
  for (const ramo of ['comun', 'ph', 'pyme', 'auto', 'hogar'])
    assert.ok(new RegExp(`\\b${ramo}: \\[`).test(a), `falta la lista de documentos de ${ramo}`);
});
