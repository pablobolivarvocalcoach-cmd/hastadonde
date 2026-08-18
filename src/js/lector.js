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
/* SMMLV (mensual) y SMDLV (diario) NO son intercambiables: 15 SMDLV es medio
   salario mensual, no quince. Confundirlos multiplica el deducible por ~30.
   Por eso son dos regex separadas que exigen la palabra completa
   "mensual"/"diario" cuando viene escrita en prosa, y nunca se combinan ni
   se convierte una en otra — cada una alimenta un campo propio. Se acepta
   también SMLMV/SMLDV, que son las mismas siglas con las letras trocadas
   (variante real, vista en pólizas). */
const RX_SMMLV = /(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:smmlv|smlmv|salarios?\s+m[ií]nimos?\s+mensuales?(?:\s+legales?\s+vigentes?)?|salario\s+m[ií]nimo\s+mensual(?:\s+legal\s+vigente)?)/i;
const RX_SMDLV = /(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:smdlv|smldv|salarios?\s+m[ií]nimos?\s+diarios?(?:\s+legales?\s+vigentes?)?|salario\s+m[ií]nimo\s+diario(?:\s+legal\s+vigente)?)/i;
const RX_PESOS = /\$\s*[\d.,]{4,}/;
const RX_FECHA = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b/;

function buscarDeducibleTerremoto(lineas) {
  const rx = /deducible|franquicia/i;
  const rxEvento = /terremoto|sismo|temblor|erupci[oó]n volc[aá]nica/i;
  for (const l of lineas) {
    if (rx.test(l.texto) && rxEvento.test(l.texto)) {
      const pct = l.texto.match(RX_PCT);
      const smmlv = l.texto.match(RX_SMMLV);
      const smdlv = l.texto.match(RX_SMDLV);
      if (pct || smmlv || smdlv) {
        return {
          campo: 'Deducible de terremoto',
          pct: pct ? pct[1].replace(',', '.') : null,
          smmlv: smmlv ? smmlv[1].replace(',', '.') : null,
          smdlv: smdlv ? smdlv[1].replace(',', '.') : null,
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
      // Caso frecuente: "Fecha inicio vigencia 15/02/2026 ... Fecha fin
      // vigencia 15/02/2027 ..." — dos etiquetas y dos fechas en la MISMA
      // línea reconstruida (pdf.js pegó la fila completa). No hay que
      // adivinar el orden: se toma la fecha que sigue a "inicio" como
      // desde, y la que sigue a "fin" como hasta, cada una la más cercana.
      const inicio = l.texto.match(/inicio[^0-9]*?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
      const fin = l.texto.match(/\bfin[^0-9]*?(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i);
      if (inicio && fin) {
        return { campo: 'Vigencia', desde: inicio[1], hasta: fin[1],
          pagina: l.pagina, linea: l.linea, texto: l.texto };
      }
      if (fechas.length >= 2) {
        return { campo: 'Vigencia', desde: fechas[0], hasta: fechas[1],
          pagina: l.pagina, linea: l.linea, texto: l.texto };
      }
    }
  }
  return null;
}

/* Sinónimos vistos en pólizas reales para el mismo concepto (ver
   LECTOR-PATRONES.md, sección de vocabulario): "asegurado" y "asegurable"
   no comparten raíz completa ("asegurAD-" vs "asegurABLE"), por eso van
   como alternativas separadas y no como una sola raíz con comodín. */
const RX_VALOR_ASEGURADO = /valor(?:es)?\s+(?:asegurad\w*|asegurable\w*)|suma\s+asegurada|l[ií]mite\s+asegurado/i;

function buscarValorAsegurado(lineas) {
  for (const l of lineas) {
    if (RX_VALOR_ASEGURADO.test(l.texto)) {
      const monto = l.texto.match(RX_PESOS);
      if (monto) {
        return { campo: 'Valor asegurado', monto: monto[0],
          pagina: l.pagina, linea: l.linea, texto: l.texto };
      }
    }
  }
  return null;
}

/* Junta cada línea con hasta `tam-1` líneas siguientes de la MISMA página
   en un solo texto, para buscar frases que el PDF partió al ajustar un
   párrafo al ancho de la hoja (esto es prosa que fluye, no una tabla: acá
   sí es razonable asumir que el orden de lectura se conserva). Nunca cruza
   de página — seguir un párrafo cortado por un salto de página es peor que
   no encontrarlo. */
function ventanas(lineas, tam = 3) {
  const out = [];
  for (let i = 0; i < lineas.length; i++) {
    const pagina = lineas[i].pagina;
    const grupo = [lineas[i]];
    for (let j = i + 1; j < lineas.length && grupo.length < tam; j++) {
      if (lineas[j].pagina !== pagina) break;
      grupo.push(lineas[j]);
    }
    out.push({ inicio: lineas[i], texto: grupo.map(g => g.texto).join(' ') });
  }
  return out;
}

const RX_CODIGO = /\b([A-Z]{2,}[-/]?\d{2,}[-/A-Z0-9]*)\b/;
/* El identificador va DESPUÉS de esta frase exacta, en medio de un párrafo
   ("...Código REGISTRO CONDICIONADO GENERAL 00000000-0000-P-00-..."), no
   en un pie de página. Exige al menos 3 bloques separados por guion para
   no atrapar cualquier palabra en mayúsculas seguida de un número suelto. */
const RX_CODIGO_PROSA = /registro\s+condicionado\s+general\s+([A-Z0-9]+(?:-[A-Z0-9]+){2,})/i;

function buscarCodigoClausulado(lineas) {
  for (const v of ventanas(lineas, 3)) {
    const m = v.texto.match(RX_CODIGO_PROSA);
    if (m) {
      return { campo: 'Código de clausulado', codigo: m[1],
        pagina: v.inicio.pagina, linea: v.inicio.linea, texto: v.texto };
    }
  }
  // Alternativa: otras compañías sí lo ponen en una línea corta y explícita
  // tipo "Código de clausulado depositado: XXX-000". Vale la pena
  // intentarlo si la frase de arriba no aparece.
  const rx = /c[oó]digo/i;
  const rxCtx = /clausulado|registro|dep[oó]sito/i;
  for (const l of lineas) {
    if (rx.test(l.texto) && rxCtx.test(l.texto)) {
      const cod = l.texto.match(RX_CODIGO);
      if (cod) {
        return { campo: 'Código de clausulado', codigo: cod[1],
          pagina: l.pagina, linea: l.linea, texto: l.texto };
      }
    }
  }
  return null;
}

const BUSCADORES = [buscarDeducibleTerremoto, buscarVigencia, buscarValorAsegurado, buscarCodigoClausulado];

/* Corre todos los buscadores sobre las líneas de todo el documento.
   `lineas` = [{ pagina, linea, texto }], ya aplanadas y numeradas. */
function extraerCandidatos(lineas) {
  return BUSCADORES.map(f => f(lineas)).filter(Boolean);
}

/* ============================================================
   Tabla de deducibles por amparo. NO existe "el deducible" de una póliza:
   existe una tabla, y en la misma póliza unos amparos calculan sobre la
   pérdida y otros (típicamente terremoto) sobre el valor asegurable — son
   bases distintas en el mismo documento. Tomar un solo deducible "global"
   es incorrecto. Cada fila exige, en la MISMA línea, o bien la frase
   "sin deducible", o bien un porcentaje acompañado de al menos una señal
   de que es realmente una fila de deducible (la base "de la pérdida" /
   "valor asegurable", o una unidad SMMLV/SMDLV) — un % suelto no basta:
   una línea de coaseguro como "COMPAÑÍA A (Líder) - 10%" también tiene un
   % y NO es un deducible.
   ============================================================ */
const RX_BASE_PERDIDA    = /de\s+la\s+p[ée]rdida/i;
const RX_BASE_ASEGURABLE = /valor\s+asegurable/i;
const RX_SIN_DEDUCIBLE   = /\bsin\s+deducible\b/i;

function analizarFilaDeducible(texto) {
  if (RX_SIN_DEDUCIBLE.test(texto)) {
    const amparo = texto.slice(0, texto.search(RX_SIN_DEDUCIBLE)).trim();
    if (!amparo) return null;
    return { amparo, sinDeducible: true, pct: null, smmlv: null, smdlv: null, base: null };
  }

  const pct = texto.match(RX_PCT);
  if (!pct) return null;

  const esPerdida    = RX_BASE_PERDIDA.test(texto);
  const esAsegurable = RX_BASE_ASEGURABLE.test(texto);
  const smmlv = texto.match(RX_SMMLV);
  const smdlv = texto.match(RX_SMDLV);
  if (!esPerdida && !esAsegurable && !smmlv && !smdlv) return null; // % suelto: no alcanza

  const amparo = texto.slice(0, pct.index).trim();
  if (!amparo) return null;

  return {
    amparo,
    sinDeducible: false,
    pct: pct[1].replace(',', '.'),
    smmlv: smmlv ? smmlv[1].replace(',', '.') : null,
    smdlv: smdlv ? smdlv[1].replace(',', '.') : null,
    base: esPerdida ? 'perdida' : (esAsegurable ? 'valorAsegurable' : null)
  };
}

function extraerTablaDeducibles(lineas) {
  const filas = [];
  for (const l of lineas) {
    const fila = analizarFilaDeducible(l.texto);
    if (fila) filas.push({ ...fila, pagina: l.pagina, linea: l.linea, texto: l.texto });
  }
  return filas;
}

/* ============================================================
   Valores asegurados por ítem. El "valor asegurado" tampoco es un solo
   número: es un desglose por ítem (áreas comunes, cimientos, maquinaria...),
   y el deducible de terremoto se calcula sobre el ítem AFECTADO, no sobre
   el total. Cada fila exige un nombre de ítem seguido de un monto en pesos
   en la misma línea. Los ítems en $0 se marcan aparte: significan cobertura
   no contratada y suelen sorprender en el siniestro. */
// A diferencia de RX_PESOS (que exige 4+ dígitos para no confundir un
// monto real con cualquier número suelto), aquí un ítem en "$ 0" es
// justamente el caso que no podemos perdernos: por eso no hay mínimo.
const RX_PESOS_ITEM = /\$\s*\d[\d.,]*/;

function extraerValoresPorItem(lineas) {
  const items = [];
  for (const l of lineas) {
    const monto = l.texto.match(RX_PESOS_ITEM);
    if (!monto) continue;
    const nombre = l.texto.slice(0, monto.index).trim();
    if (!nombre || /valor(?:es)?\s+asegurad\w*/i.test(nombre)) continue; // evita la fila-etiqueta misma
    const cero = /^\$\s?0+(?:[.,]0+)*$/.test(monto[0]);
    items.push({ item: nombre, monto: monto[0], enCero: cero, pagina: l.pagina, linea: l.linea, texto: l.texto });
  }
  return items;
}

/* ============================================================
   Coaseguro: dos o más aseguradoras responden por porcentaje. El informe
   necesita decir con claridad a quién se reclama. Exige la etiqueta
   "Asegurador" en la misma línea que el porcentaje, para no confundir
   esto con cualquier otro porcentaje del documento (el mismo problema que
   ya resolvimos para la tabla de deducibles). */
const RX_FILA_COASEGURO = /^asegurador\s+(.+?)\s*-\s*(\d{1,3}(?:[.,]\d{1,2})?)\s*%/i;

function extraerCoaseguro(lineas) {
  const filas = [];
  for (const l of lineas) {
    const m = l.texto.trim().match(RX_FILA_COASEGURO);
    if (!m) continue;
    filas.push({
      nombre: m[1].trim(),
      pct: m[2].replace(',', '.'),
      lider: /l[ií]der/i.test(m[1]),
      pagina: l.pagina, linea: l.linea, texto: l.texto
    });
  }
  return filas;
}

/* ============================================================
   Fragmentos del clausulado — exclusiones y definiciones. A diferencia de
   los candidatos de arriba (un dato puntual, una línea, alta precisión),
   esto es texto legal en prosa: no hay forma confiable de decir "esta es
   LA exclusión completa" solo con patrones. Por eso esto NUNCA se presenta
   como un dato verificado: es un candidato de dónde mirar, con la página
   exacta, para que la persona lea el párrafo completo en su PDF. Ver
   CLAUDE.md — misma lógica que "mejor no encontrar que leer mal", aplicada
   a bloques de texto en vez de a una cifra.
   ============================================================ */
const TERMINOS_CLAVE = [
  ['Pérdida total', /p[ée]rdida\s+total/i],
  ['Reposición a nuevo', /reposici[oó]n\s+a\s+nuevo/i],
  ['Valor real', /valor\s+real/i],
  ['Primer riesgo absoluto', /primer\s+riesgo\s+absoluto/i],
  ['Valor admitido', /valor\s+admitido/i],
  ['Regla proporcional / infraseguro', /regla\s+proporcional|infraseguro/i]
];

/* Una línea corta y toda en mayúscula (o casi) suele ser el título de la
   siguiente sección, no parte del párrafo anterior. Compartida entre
   buscarDefiniciones y buscarExclusiones: a las dos les puede tocar parar
   antes de tiempo para no arrastrar el encabezado siguiente dentro del
   contexto de un término que no tiene nada que ver. */
const esEncabezado = t => t.length < 60 && /^[A-ZÁÉÍÓÚÑ0-9\s.,:-]{6,}$/.test(t);

/* Para cada término clave, la PRIMERA vez que aparece en el documento, con
   hasta dos líneas más de contexto — misma página, y se detiene antes de
   la siguiente si parece un encabezado nuevo (ej. "Exclusiones" pegado
   justo después de la oración que sí nos interesa). Un párrafo cortado a
   la mitad es peor que no mostrar nada, pero arrastrar la sección
   siguiente es peor todavía: se ve como si fuera parte de la definición. */
function buscarDefiniciones(lineas) {
  const hallazgos = [];
  for (const [termino, rx] of TERMINOS_CLAVE) {
    const idx = lineas.findIndex(l => rx.test(l.texto));
    if (idx === -1) continue;
    const pagina = lineas[idx].pagina;
    const contexto = [];
    for (let i = idx; i < lineas.length && contexto.length < 3; i++) {
      const l = lineas[i];
      const t = l.texto.trim();
      if (l.pagina !== pagina) break;
      if (i > idx && esEncabezado(t)) break;
      contexto.push(l.texto);
      if (/[.:]\s*$/.test(t)) break; // fin de la frase: no seguir a lo que venga después
    }
    hallazgos.push({ termino, pagina, linea: lineas[idx].linea, contexto: contexto.join(' ') });
  }
  return hallazgos;
}

const LIMITE_BLOQUE_EXCLUSIONES = 25;

/* Busca un encabezado de "exclusiones" (línea corta, mayúscula o casi) y
   junta las líneas que siguen en la MISMA página, hasta topar con lo que
   parece el siguiente encabezado o un límite de líneas — nunca cruza de
   página en este prototipo, para no inventar continuidad que no verificó. */
function buscarExclusiones(lineas) {
  const idx = lineas.findIndex(l => /^exclusiones?\b/i.test(l.texto.trim()) && l.texto.trim().length < 60);
  if (idx === -1) return null;

  const pagina = lineas[idx].pagina;
  const items = [];
  for (let i = idx + 1; i < lineas.length && items.length < LIMITE_BLOQUE_EXCLUSIONES; i++) {
    const l = lineas[i];
    if (l.pagina !== pagina) break;
    if (esEncabezado(l.texto.trim())) break;
    items.push(l.texto);
  }
  if (!items.length) return null;
  return { pagina, linea: lineas[idx].linea, items };
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
   Condiciones particulares que modifican lo que dice la ley o el
   clausulado general: plazo de aviso, anticipo de indemnización, demérito
   por uso. Van con el mismo trato que exclusiones/definiciones — prosa,
   candidato a revisar, nunca un dato verificado.
   ============================================================ */
function buscarPlazoAviso(lineas) {
  for (const v of ventanas(lineas, 5)) {
    const m = v.texto.match(/plazo\s+de\s+aviso.{0,80}?(\d{1,3})\s*d[ií]as/i);
    if (m) return { dias: m[1], pagina: v.inicio.pagina, linea: v.inicio.linea, texto: v.texto };
  }
  return null;
}

function buscarAnticipoIndemnizacion(lineas) {
  for (const v of ventanas(lineas, 4)) {
    if (/anticipo\s+de\s+(?:la\s+)?indemnizaci[oó]n/i.test(v.texto)) {
      return { pagina: v.inicio.pagina, linea: v.inicio.linea, texto: v.texto };
    }
  }
  return null;
}

/* El umbral (ej. "supere el 70% del valor a nuevo") suele estar en la misma
   cláusula que el encabezado "Demérito por uso", así que se busca en un
   bloque que arranca en el encabezado — no en todo el documento, para no
   agarrar un 70% de una cláusula sin relación. Si el encabezado aparece
   pero no el umbral, se devuelve igual (candidato con umbralPct: null):
   mejor avisar "hay una cláusula de demérito, léela" que no decir nada. */
function buscarDemeritoPorUso(lineas) {
  const idx = lineas.findIndex(l => /dem[ée]rito\s+por\s+uso/i.test(l.texto));
  if (idx === -1) return null;
  const pagina = lineas[idx].pagina;
  const bloque = lineas.slice(idx, idx + 8).filter(l => l.pagina === pagina).map(l => l.texto).join(' ');
  const umbral = bloque.match(/(\d{1,3})\s*%\s+del\s+valor\s+a\s+nuevo/i);
  return { pagina, linea: lineas[idx].linea, umbralPct: umbral ? umbral[1] : null, texto: bloque };
}

/* ============================================================
   Punto 8 de LECTOR-PATRONES.md: problemas de extracción de texto.
   ============================================================ */

/* Una página con la fuente mal codificada (sin tabla de caracteres) da
   texto real pero corrido, tipo "8VWHG" en vez de "Usted": hay letras,
   pero casi ninguna vocal. El español real tiene muchas vocales; un umbral
   bajo (15%) alcanza para distinguir un texto roto de uno real sin
   arriesgarse a descartar una página legítima por error. Con muy poco
   texto para juzgar (menos de 20 letras) se asume legible: mejor dejar
   pasar una página rara que perder contenido real por una muestra chica. */
function paginaLegible(textoPagina) {
  const letras = textoPagina.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g) || [];
  if (letras.length < 20) return true;
  const vocales = textoPagina.match(/[aeiouáéíóúAEIOUÁÉÍÓÚ]/g) || [];
  return (vocales.length / letras.length) > 0.15;
}

/* El dígito de una nota al pie a veces queda pegado al nombre del amparo o
   directo contra el "$" ("material1 $ 28.000.000.000", "empleados3$
   20.000.000"). Se quita SOLO un dígito suelto entre una letra y un "$"
   (con o sin espacio de por medio) — nunca una secuencia de dígitos, para
   no borrar números que sí son parte del texto. */
function limpiarNotaAlPie(texto) {
  return texto.replace(/([a-záéíóúñA-ZÁÉÍÓÚÑ])\d(?=\s*\$)/g, '$1');
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
/* Por debajo de esto no alcanza con avisar al lado de cada dato: hay que
   decirlo primero, arriba de todo, antes de mostrar una sola cifra —
   y ofrecer el cuestionario manual como alternativa, no un informe
   construido sobre texto que probablemente esté mal. */
const UMBRAL_CALIDAD_MUY_BAJA = 0.4;

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
  const paginasSalteadas = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const pagina = await doc.getPage(n);
    const contenido = await pagina.getTextContent();
    const lineasPagina = agruparLineas(contenido.items).map(limpiarNotaAlPie);
    if (lineasPagina.length && !paginaLegible(lineasPagina.join(' '))) {
      paginasSalteadas.push(n);
      paginas.push([]); // se conserva la posición para no correr la numeración de página
    } else {
      paginas.push(lineasPagina);
    }
  }

  const lineas = aplanarPaginas(paginas);
  const totalCaracteres = lineas.reduce((s, l) => s + l.texto.length, 0);

  if (pareceImagen(totalCaracteres)) {
    return { ok: false, error: 'imagen', mensaje:
      'Este PDF es una imagen, no puedo leerlo. Pide el PDF original (no escaneado) a tu aseguradora.' };
  }

  const calidad = calidadTexto(lineas);
  const candidatos = extraerCandidatos(lineas);
  const definiciones = buscarDefiniciones(lineas);
  const exclusiones = buscarExclusiones(lineas);
  const tablaDeducibles = extraerTablaDeducibles(lineas);
  const valoresPorItem = extraerValoresPorItem(lineas);
  const coaseguro = extraerCoaseguro(lineas);
  const plazoAviso = buscarPlazoAviso(lineas);
  const anticipo = buscarAnticipoIndemnizacion(lineas);
  const demeritoPorUso = buscarDemeritoPorUso(lineas);

  return {
    ok: true,
    paginas: doc.numPages,
    paginasSalteadas,
    totalCaracteres,
    calidad,
    dudoso: calidad < UMBRAL_CALIDAD,
    muyDudoso: calidad < UMBRAL_CALIDAD_MUY_BAJA,
    lineas,
    candidatos,
    definiciones,
    exclusiones,
    tablaDeducibles,
    valoresPorItem,
    coaseguro,
    plazoAviso,
    anticipo,
    demeritoPorUso
  };
}

export { agruparLineas, aplanarPaginas, calidadTexto, extraerCandidatos, buscarDeducibleTerremoto, buscarVigencia, buscarValorAsegurado, buscarCodigoClausulado, buscarDefiniciones, buscarExclusiones, extraerTablaDeducibles, extraerValoresPorItem, extraerCoaseguro, buscarPlazoAviso, buscarAnticipoIndemnizacion, buscarDemeritoPorUso, paginaLegible, limpiarNotaAlPie, pareceImagen, leerPdf };
