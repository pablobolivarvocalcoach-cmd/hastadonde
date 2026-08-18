/* Empaqueta src/ en un solo archivo HTML autocontenido.
   Sin dependencias: node build.mjs                                        */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const ORDEN = ['config','motor','asesor','catalogo','glosario','clausulados','plazos','ui'];

const limpiar = src => src
  .split('\n')
  .filter(l => !/^\s*import\s.*from\s.*;\s*$/.test(l))
  .filter(l => !/^\s*export\s*\{[^}]*\}\s*;\s*$/.test(l))
  .map(l => l.replace(/^\s*export\s+(const|let|function|class)\s/, '$1 '))
  .join('\n');

const js  = ORDEN.map(m => limpiar(readFileSync(`src/js/${m}.js`, 'utf8'))).join('\n\n');
const css = readFileSync('src/estilos.css', 'utf8');

let html = readFileSync('src/index.html', 'utf8')
  .replace('<!--@css-->', () => `<style>\n${css}\n</style>`)   // función: evita que $' y $& se interpreten
  .replace('<script type="module">', '<script>')
  .replace('<!--@js-->', () => js);

mkdirSync('dist', { recursive: true });
writeFileSync('dist/hasta-donde.html', html);
console.log(`dist/hasta-donde.html — ${(html.length/1024).toFixed(1)} KB`);

// Copia idéntica para GitHub Pages, que solo sirve desde la raíz o /docs.
mkdirSync('docs', { recursive: true });
writeFileSync('docs/index.html', html);
console.log(`docs/index.html — ${(html.length/1024).toFixed(1)} KB`);
