/* Empaqueta src/ en un solo archivo HTML autocontenido.
   Sin dependencias: node build.mjs                                        */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const ORDEN = ['config','motor','asesor','catalogo','glosario','clausulados','plazos','lector','ui'];

const limpiar = src => src
  .split('\n')
  .filter(l => !/^\s*import\s.*from\s.*;\s*$/.test(l))
  .filter(l => !/^\s*export\s*\{[^}]*\}\s*;\s*$/.test(l))
  .map(l => l.replace(/^\s*export\s+(const|let|function|class)\s/, '$1 '))
  .join('\n');

/* pdf.js embebido para el lector de PDF (src/js/lector.js). Se toma tal
   cual de node_modules, ya minificado, y NUNCA pasa por `limpiar()`: es un
   módulo ES completo con su propio export{}, y la regex de línea que nos
   sirve para nuestros módulos lo corrompería. Se inyecta como texto plano
   dentro de una constante y se ejecuta en el navegador desde un Blob local
   (ver cargarPdfjs() en lector.js) — cero red, sigue siendo un solo archivo.
   Escapamos '</script' por si el código de pdf.js trae esa subcadena en
   algún string o comentario: dentro de un <script> del HTML cerraría el
   tag antes de tiempo, sin que tenga nada que ver con ser JS válido. */
function fuentePdfjs(nombre) {
  const src = readFileSync(`node_modules/pdfjs-dist/legacy/build/${nombre}`, 'utf8');
  return JSON.stringify(src).replace(/<\/script/gi, '<\\/script');
}

const pdfjs = `const PDFJS_LIB_SRC = ${fuentePdfjs('pdf.min.mjs')};\n`
  + `const PDFJS_WORKER_SRC = ${fuentePdfjs('pdf.worker.min.mjs')};\n`;

const js  = pdfjs + '\n' + ORDEN.map(m => limpiar(readFileSync(`src/js/${m}.js`, 'utf8'))).join('\n\n');
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
