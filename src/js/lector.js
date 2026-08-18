/* LECTOR DE PÓLIZAS EN PDF — prototipo, no integrado al cuestionario todavía.
   El PDF nunca sale del navegador: se abre con pdf.js embebido en este mismo
   archivo (PDFJS_LIB_SRC / PDFJS_WORKER_SRC, inyectados por build.mjs) y se
   ejecuta desde Blobs locales — sin red, sin guardarlo. Ver CLAUDE.md, reglas
   3 y 5. Regla de oro de este módulo: si la lectura es dudosa, no se rellena
   nada — se dice que falta y se deja para que la persona lo escriba.
   Hasta Dónde — https://github.com/  ·  licencia MIT  */

/* ============================================================
   Carga perezosa de pdf.js: solo se ejecuta si alguien usa el lector.
   ============================================================ */
let pdfjsPromise = null;

function cargarPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      const libUrl = URL.createObjectURL(new Blob([PDFJS_LIB_SRC], { type: 'text/javascript' }));
      const pdfjsLib = await import(libUrl);
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        URL.createObjectURL(new Blob([PDFJS_WORKER_SRC], { type: 'text/javascript' }));
      return pdfjsLib;
    })();
  }
  return pdfjsPromise;
}

/* ============================================================
   Reconstrucción de líneas — PURO, sin pdf.js ni DOM.
   pdf.js entrega cada palabra/fragmento con su posición (transform),
   no en orden de lectura. Se agrupan por altura (misma línea) y se
   ordenan por x (izquierda a derecha). Tolerancia en unidades de PDF
   (~1/72"): 3 alcanza para no partir una línea por redondeo, sin fundir
   dos renglones distintos.
   ============================================================ */
function agruparLineas(items, tolerancia = 3) {
  const conY = items
    .filter(it => it.str !== undefined && it.transform)
    .map(it => ({ texto: it.str, x: it.transform[4], y: it.transform[5] }));

  const grupos = [];
  for (const it of conY) {
    let g = grupos.find(g => Math.abs(g.y - it.y) <= tolerancia);
    if (!g) { g = { y: it.y, items: [] }; grupos.push(g); }
    g.items.push(it);
  }
  // pdf.js entrega y creciente hacia arriba: de mayor a menor es de arriba a abajo.
  grupos.sort((a, b) => b.y - a.y);

  return grupos
    .map(g => g.items.sort((a, b) => a.x - b.x).map(i => i.texto).join(' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

/* ============================================================
   Candidatos — cada buscador es PURO: recibe las líneas de todo el
   documento (con página) y devuelve un candidato o null. Nunca un valor
   parcial: si no hay match de alta precisión, no hay dato.
   ============================================================ */
const RX_PCT   = /(\d{1,2}(?:[.,]\d{1,2})?)\s*%/;
const RX_SMMLV = /(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:smmlv|salarios? m[ií]nimos?)/i;
const RX_PESOS = /\$\s?[\d.,]{4,}/;
const RX_FECHA = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/;

function buscarDeducibleTerremoto(lineas) {
  const rx = /deducible|franquicia/i;
  const rxEvento = /terremoto|sismo|temblor/i;
  for (const l of lineas) {
    if (rx.test(l.texto) && rxEvento.test(l.texto)) {
      const pct = l.texto.match(RX_PCT);
      const smmlv = l.texto.match(RX_SMMLV);
      if (pct || smmlv) {
        return {
          campo: 'Deducible de terremoto',
          pct: pct ? pct[1].replace(',', '.') : null,
          smmlv: smmlv ? smmlv[1].replace(',', '.') : null,
          pagina: l.pagina, linea: l.linea, texto: l.texto
        };
      }
    }
  }
  return null;
}

function buscarVigencia(lineas) {
  const rx = /vigencia/i;
  for (const l of lineas) {
    if (rx.test(l.texto)) {
      const fechas = [...l.texto.matchAll(new RegExp(RX_FECHA, 'g'))].map(m => m[1]);
      if (fechas.length >= 2) {
        return { campo: 'Vigencia', desde: fechas[0], hasta: fechas[1],
          pagina: l.pagina, linea: l.linea, texto: l.texto };
      }
    }
  }
  return null;
}

function buscarValorAsegurado(lineas) {
  const rx = /valor\s+asegurad[oa]/i;
  for (const l of lineas) {
    if (rx.test(l.texto)) {
      const monto = l.texto.match(RX_PESOS);
      if (monto) {
        return { campo: 'Valor asegurado', monto: monto[0],
          pagina: l.pagina, linea: l.linea, texto: l.texto };
      }
    }
  }
  return null;
}

const BUSCADORES = [buscarDeducibleTerremoto, buscarVigencia, buscarValorAsegurado];

/* Corre todos los buscadores sobre las líneas de todo el documento.
   `lineas` = [{ pagina, linea, texto }], ya aplanadas y numeradas. */
function extraerCandidatos(lineas) {
  return BUSCADORES.map(f => f(lineas)).filter(Boolean);
}

/* Aplana páginas [[linea,...], ...] en una sola lista con página y número
   de línea (1-indexados) para poder citar "página X, línea Y" al usuario. */
function aplanarPaginas(paginas) {
  const lineas = [];
  paginas.forEach((ls, pIdx) => ls.forEach((texto, lIdx) => {
    lineas.push({ pagina: pIdx + 1, linea: lIdx + 1, texto });
  }));
  return lineas;
}

/* Heurística de calidad: cuenta caracteres de reemplazo (U+FFFD) y letras
   fuera del alfabeto esperable en español + símbolos de póliza. Un PDF con
   una fuente rara sin tabla ToUnicode produce texto pero mal decodificado:
   preferible avisar "dudoso" a mostrar caracteres corruptos como un dato. */
function calidadTexto(lineas) {
  const todo = lineas.map(l => l.texto).join('');
  if (!todo) return 0;
  const raros = (todo.match(/�/g) || []).length;
  const esperados = (todo.match(/[a-záéíóúñA-ZÁÉÍÓÚÑ0-9\s.,;:%$()/\-]/g) || []).length;
  return Math.max(0, (esperados - raros * 5) / todo.length);
}

/* ============================================================
   Orquestación — la única parte que toca pdf.js / archivos. No hay DOM
   aquí tampoco: devuelve datos, ui.js decide cómo pintarlos.
   ============================================================ */
/* Un PDF realmente escaneado no tiene capa de texto: pdf.js devuelve CERO
   items por página, no "pocos". El umbral se deja bajo a propósito — una
   carátula corta de una sola página puede tener legítimamente 150-200
   caracteres, y un umbral alto la marcaría como "imagen" por error. Mejor
   arriesgarse a no detectar un escaneo raro con texto-fantasma que rechazar
   un PDF real que sí se puede leer. */
const UMBRAL_TEXTO_MINIMO = 40;
const UMBRAL_CALIDAD = 0.75;

/* PURO: separado para poder probarlo sin abrir un PDF de verdad. */
function pareceImagen(totalCaracteres) {
  return totalCaracteres < UMBRAL_TEXTO_MINIMO;
}

async function leerPdf(file) {
  let pdfjsLib;
  try {
    pdfjsLib = await cargarPdfjs();
  } catch {
    return { ok: false, error: 'navegador', mensaje:
      'Tu navegador no pudo cargar el lector de PDF. Prueba actualizándolo, o usa Chrome o Firefox recientes.' };
  }

  const buffer = await file.arrayBuffer();
  let doc;
  try {
    doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  } catch (e) {
    if (e?.name === 'PasswordException') {
      return { ok: false, error: 'password', mensaje:
        'Este PDF tiene contraseña. Pide a tu aseguradora una copia sin contraseña, o quítasela tú antes de subirlo.' };
    }
    return { ok: false, error: 'corrupto', mensaje:
      'No pude abrir este archivo como PDF. Puede estar dañado o no ser un PDF real.' };
  }

  const paginas = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pagina = await doc.getPage(n);
    const contenido = await pagina.getTextContent();
    paginas.push(agruparLineas(contenido.items));
  }

  const lineas = aplanarPaginas(paginas);
  const totalCaracteres = lineas.reduce((s, l) => s + l.texto.length, 0);

  if (pareceImagen(totalCaracteres)) {
    return { ok: false, error: 'imagen', mensaje:
      'Este PDF es una imagen, no puedo leerlo. Pide el PDF original (no escaneado) a tu aseguradora.' };
  }

  const calidad = calidadTexto(lineas);
  const candidatos = extraerCandidatos(lineas);

  return {
    ok: true,
    paginas: doc.numPages,
    totalCaracteres,
    calidad,
    dudoso: calidad < UMBRAL_CALIDAD,
    lineas,
    candidatos
  };
}

export { agruparLineas, aplanarPaginas, calidadTexto, extraerCandidatos, buscarDeducibleTerremoto, buscarVigencia, buscarValorAsegurado, pareceImagen, leerPdf };
