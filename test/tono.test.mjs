import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const archivos = ['catalogo', 'ui', 'plazos', 'glosario', 'clausulados', 'deducibles-observados', 'escenarios', 'asesor', 'lector']
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

test('el resultado nunca desincentiva reportar el siniestro', () => {
  const ui = archivos.find(([n]) => n === 'ui')[1];
  assert.ok(/Repórtalo de todas formas/.test(ui),
    'falta el mensaje que empuja a reportar cuando la indemnización da cero');
  assert.ok(!/la póliza no pagaría nada/.test(ui),
    'un titular que suena a veredicto puede hacer que alguien no reclame');
});

test('sin el deducible, la herramienta muestra escenarios reales y no una cifra inventada', () => {
  const ui = archivos.find(([n]) => n === 'ui')[1];
  for (const pieza of ['dedConocido', 'calcularEscenarios', 'no se puede estimar'])
    assert.ok(ui.includes(pieza), `falta ${pieza}: se estaría inventando precisión`);
  assert.ok(!ui.includes('calcularRango') && !ui.includes('RANGO_DEDUCIBLE'),
    'el estimador de rango de mercado quedó eliminado a propósito: el deducible no se puede estimar (regla 8)');
});

/* ============================================================
   Regla 8: el deducible nunca es una característica de una aseguradora o
   de un producto, y nunca se explica por qué varía entre pólizas — no lo
   sabemos y no hace falta afirmarlo. Siempre es dato de UNA póliza
   individual, leído de su carátula.
   ============================================================ */
test('clausulados.js no lleva deducible ni mínimo: eso no es un dato del producto', () => {
  const clausulados = archivos.find(([n]) => n === 'clausulados')[1];
  assert.ok(!/\bded\s*:/.test(clausulados), 'clausulados.js no debería tener un campo "ded" — el deducible varía por póliza, no por producto');
  assert.ok(!/\bmin\s*:/.test(clausulados), 'clausulados.js no debería tener un campo "min" junto al deducible — mismo motivo');
});

test('deducibles-observados.js siempre fecha y cita la fuente de cada observación', () => {
  const observados = archivos.find(([n]) => n === 'deducibles-observados')[1];
  assert.ok(/fecha\s*:/.test(observados), 'falta el campo fecha: sin fecha, una observación puntual se lee como regla permanente');
  assert.ok(/fuente\s*:/.test(observados), 'falta el campo fuente: hay que poder verificar de dónde salió cada fila');
});

test('nadie explica por qué el deducible varía entre pólizas o aseguradoras: no lo sabemos', () => {
  const PROHIBIDO_REGLA8 = [
    [/cada asegurador\w*\s+(decide|fija|elige)/i, 'especula sobre por qué una aseguradora fija su deducible así'],
    [/seg[uú]n\s+(su|el)\s+(apetito|an[aá]lisis|pol[ií]tica)\s+de\s+riesgo/i, 'inventa una razón de negocio no verificada'],
    [/var[ií]a\s+(de|entre)\s+p[oó]liza\w*[^.]{0,60}(porque|debido a|ya que|puesto que)/i, 'intenta explicar por qué varía, cuando no lo sabemos'],
    [/el\s+deducible\s+t[ií]pico\s+de\s+(esta|la)\s+asegurador/i, 'presenta un deducible como característica de una aseguradora específica']
  ];
  for (const [nombre, texto] of archivos)
    for (const [patron, motivo] of PROHIBIDO_REGLA8)
      assert.ok(!patron.test(texto), `src/js/${nombre}.js ${motivo}: ${patron}`);
});
