import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

execFileSync('node', ['build.mjs']);
const html = readFileSync('dist/hasta-donde.html', 'utf8');
const js = html.slice(html.indexOf('<script>') + 8, html.indexOf('</script>'));

test('el bundle no deja marcadores ni módulos sin resolver', () => {
  assert.ok(!html.includes('<!--@'), 'quedó un marcador @ sin reemplazar');
  assert.ok(!/^\s*(import|export)\s/m.test(js), 'quedó un import/export en el bundle');
});

test('el bundle contiene todos los módulos', () => {
  for (const marca of ['function calcular', 'const RAMOS', 'const GLOSARIO',
                       'CLAUSULADOS_SEED', 'const PLAZOS', 'function pintarWizard'])
    assert.ok(js.includes(marca), `falta ${marca} en el bundle`);
});

test('el bundle es JavaScript sintácticamente válido', () => {
  assert.doesNotThrow(() => new Function(js));
});

test('el formateador de pesos sobrevive al empaquetado', () => {
  // Regresión: String.replace interpreta $' y $& en el reemplazo.
  assert.ok(js.includes("'$' +"), "el símbolo de peso se corrompió al empaquetar");
});

test('el HTML queda autocontenido: sin <link> a CSS ni <script src>', () => {
  assert.ok(!/<script[^>]+src=/.test(html));
  assert.ok(!/<link[^>]+stylesheet[^>]+estilos\.css/.test(html));
});

test('docs/index.html existe y es idéntico a dist/hasta-donde.html, para GitHub Pages', () => {
  const docs = readFileSync('docs/index.html', 'utf8');
  assert.equal(docs, html, 'docs/index.html quedó desincronizado de dist/hasta-donde.html');
});
