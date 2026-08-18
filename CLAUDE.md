# CLAUDE.md — contexto para trabajar en este repo

Lee esto completo antes de tocar nada. La mayoría de los errores posibles aquí
no son errores de código: son errores de dominio que compilan perfecto.

## Qué es esto

Herramienta educativa abierta para que una persona en Colombia entienda hasta
dónde llega su póliza. Nació después del sismo del 10 de agosto de 2026
(M 7,4, epicentro en San José del Palmar, Chocó), cuando miles de personas
quedaron con un clausulado en la mano que nunca habían leído.

Público: gente sin formación en seguros, muchas veces angustiada, leyendo en
celular. No son analistas. La página tiene que ser entendible en un scroll.

## Reglas que no se negocian

1. **No inventar datos de aseguradoras reales.** Nunca escribas un deducible,
   un sublímite o una exclusión atribuida a una compañía específica si no salió
   de un clausulado verificado. Si es un rango típico, va como
   `verificado: false` y se muestra con la etiqueta "referencia de mercado".
   Una cifra inventada aquí puede hacer que alguien no reclame.

2. **La herramienta trabaja PARA el asesor, no contra él.** Quien la publica
   es un intermediario de seguros y sus clientes son quienes la usan. El
   objetivo es que la persona llegue **resuelta y con la carpeta lista**, no
   que llegue con preguntas. Nunca generes listas de "preguntas para tu
   asesor", ni frases tipo "exige por escrito" o "una respuesta verbal no
   sirve". Cada duda anticipada se **responde** en `generarRespuestas()`, y
   cada acción se traduce en un documento de `DOCUMENTOS`. Si dudas entre
   informar y armar al cliente contra alguien, informa.
   Cubierto por `test/tono.test.mjs`.

3. **Nunca inventar precisión, y nunca desincentivar el reporte.** Si falta
   un dato que mueve el resultado —sobre todo el deducible— se muestra un
   **rango** declarado y se dice qué falta, jamás una cifra única. Y ningún
   resultado, ni el que da cero, puede sonar a veredicto: el aviso a la
   aseguradora es gratis y el plazo se vence, así que la herramienta siempre
   empuja a reportar. Cubierto por `test/tono.test.mjs` y por las pruebas de
   rango en `test/motor.test.mjs`. Antes de publicar cambios que toquen
   cifras, lee `VALIDACION.md`.

4. **No prometer resultados.** El copy dice "recibirías aprox.", nunca
   "recibirás". El único documento válido es el clausulado firmado. El
   descargo del pie no se quita ni se achica.

5. **Cero telemetría, cero cookies, cero login, cero red.** El archivo tiene
   que funcionar abierto con doble clic, sin internet, en un celular con
   datos agotados. No agregues analíticas, fuentes remotas obligatorias ni
   llamadas a APIs. Las tipografías de Google son la única excepción y
   degradan a las del sistema.

6. **Nada de `localStorage` para datos de la persona.** Si alguien comparte el
   computador —muy común en una emergencia— no queremos dejar sus cifras ahí.
   El estado vive en memoria y se pierde al recargar. Es a propósito.

7. **Español colombiano, tono de vecino que sabe.** Frases cortas. Nada de
   "asegurado", "tomador" ni "siniestro" sin explicarlos primero. Si un
   párrafo necesita releerse, está mal escrito.

## El motor: orden de aplicación

`src/js/motor.js` es la única fuente de verdad del cálculo. Es puro, no toca
el DOM, y está cubierto por `test/motor.test.mjs`. El orden importa y está
tomado del Código de Comercio colombiano:

```
1. Regla proporcional por infraseguro   (art. 1102)
      factor = valorAsegurado / valorReal   (solo si VA < VR)
      Pajustada = pérdida × factor
2. Deducible
      base = valorAsegurado  ← lo normal en TERREMOTO
             o la pérdida ajustada, si así lo pactó la póliza
      D = MAYOR entre (base × %) , (mínimo en SMMLV) , (monto fijo)
3. Tope
      indemnización = MIN(Pajustada − D, sublímite o valor asegurado)
```

**El error más caro que puedes cometer** es calcular el deducible sobre la
pérdida cuando la póliza lo calcula sobre el valor asegurado. En un edificio
de $2.000 M con deducible del 2%, eso es la diferencia entre descontar
$1,6 M y descontar $40 M. Ese malentendido es la razón de existir de la
página entera: la sección "El malentendido #1" lo demuestra con deslizadores.

**Invariante que ninguna refactorización puede romper:**

```
deducible + porInfraseguro + porTope + indemnización === pérdida
```

Está en el test 10. Si un cambio lo rompe, la barra de la cinta miente y hay
plata que desaparece sin explicación en pantalla.

Otros invariantes: la indemnización nunca es negativa, nunca supera el valor
asegurado, y el deducible mostrado nunca excede la pérdida.

## Constantes que caducan

`src/js/config.js`:

- `SMMLV`: **$1.750.905** para 2026 (Decreto 1469 de 2025). Se actualiza cada
  enero. Muchos deducibles mínimos están expresados en SMMLV, así que un valor
  viejo produce cifras erradas en silencio.
- Los plazos en `src/js/plazos.js` citan artículos del Código de Comercio:
  1075 (aviso, 3 días), 1077 (carga de la prueba), 1080 (pago en un mes),
  1081 (prescripción, 2 años), 1102 (regla proporcional). Si cambias un
  número, verifica la norma; no la deduzcas.

## Arquitectura

```
src/index.html      Estructura. Marcadores <!--@css--> y <!--@js-->
src/estilos.css     Todo el CSS. Los colores son semánticos, no decorativos:
                      --recibe (verde)  = plata que llega
                      --deduce (ámbar)  = se la lleva el deducible
                      --fuera  (vino)   = no cubierto / infraseguro
                    No los reasignes ni los uses "porque combinan".
src/js/config.js      Constantes del país + formateo de pesos
src/js/asesor.js      ASESOR (marca y contacto del intermediario),
                      DOCUMENTOS (carpeta por ramo) y PROCESO
                      (quién hace qué). Es el módulo que baja llamadas. ← nutrir
src/js/motor.js       Cálculo puro. Sin DOM. Con tests.
src/js/catalogo.js    RAMOS: preguntas y semáforo por tipo de póliza ← nutrir
src/js/glosario.js    Términos en lenguaje claro                    ← nutrir
src/js/clausulados.js Semilla de la biblioteca abierta              ← nutrir
src/js/plazos.js      Línea de tiempo legal                         ← nutrir
src/js/lector.js      Lector de pólizas en PDF (prototipo). Sin DOM: recibe
                      un File, devuelve datos. pdf.js corre en el navegador,
                      nunca por red — ver "Lector de PDF" más abajo.
src/js/ui.js          Todo lo que toca el DOM. Solo aquí.
build.mjs             Concatena a dist/hasta-donde.html, un archivo
datos/clausulados.json  Si existe junto al HTML, sobreescribe la semilla
```

Separación dura: `motor.js` no conoce el DOM, `ui.js` no calcula. Si te ves
poniendo aritmética de indemnizaciones en `ui.js`, va en el motor con su test.

## Empaquetado

`node build.mjs` inlinea CSS y JS en `dist/hasta-donde.html`. Los módulos son
ESM; el build quita las líneas `import`/`export` y concatena en el orden de
`ORDEN`. Si agregas un módulo nuevo, agrégalo a ese arreglo respetando
dependencias.

**Trampa conocida:** los reemplazos usan función (`() => js`) y no string,
porque `String.replace` interpreta `$'` y `$&` en el reemplazo — y el código
contiene `'$'` del formateador de pesos. Esto ya rompió el bundle una vez.
Está cubierto por `test/build.test.mjs`.

**Trampa conocida #2:** cualquier `export {...}` de un módulo propio tiene
que quedar en **una sola línea**. `limpiar()` lo detecta con una regex por
línea; si el export queda partido en dos, no se elimina, y el bundle final
tiene un `export` suelto que revienta en tiempo de ejecución. También
cubierto por `test/build.test.mjs` (ya atrapó este bug una vez, en
`lector.js`).

## Lector de PDF (prototipo, `src/js/lector.js`)

Lee la carátula y el clausulado de una póliza directo en el navegador, sin
subir el archivo a ningún lado (reglas 3 y 5). Todavía no llena el
cuestionario: solo muestra lo que encontró, con página y línea, para que la
persona lo verifique. Detalles que importan si tocas esto:

- **pdf.js es la única librería viable** para leer PDFs reales sin arriesgar
  texto mal decodificado (tildes, ñ, fuentes con codificación rara). Pero
  agrega ~1,8 MB al archivo (de 88 KB a ~1,9 MB): es una decisión consciente,
  no un descuido. Ver el PR que lo introdujo para la investigación completa.
- Se embebe como texto plano en dos constantes (`PDFJS_LIB_SRC`,
  `PDFJS_WORKER_SRC`) generadas por `build.mjs` desde
  `node_modules/pdfjs-dist/legacy/build/`. **Nunca pasan por `limpiar()`**:
  es un módulo ya minificado con su propio `export{}`, y la regex de línea
  lo corrompería. Se ejecuta en tiempo real desde un `Blob` local
  (`cargarPdfjs()` en `lector.js`) — sigue siendo cero red y un solo archivo.
- Bajo `file://` (abrir con doble clic) Chromium no deja crear un Worker real
  desde un Blob de origen `null`: pdf.js cae solo a "fake worker" y el parseo
  corre en el hilo principal. Medido con una póliza sintética de 60 páginas
  bajo CPU 4x más lenta (celular gama media): ~1,5–2,3 s totales, con un
  bloqueo visible de hasta ~1,2 s en el peor frame. Aceptable para un
  prototipo; si esto se vuelve el flujo principal, vale la pena revisar
  cómo dar una señal de progreso más granular.
- `pdfjs-dist` es una dependencia de **build**, no de la página publicada:
  quien abre `dist/hasta-donde.html` no la necesita instalada, solo Node
  para reconstruirla. `node_modules/` está en `.gitignore`;
  `package-lock.json` sí se commitea para reproducibilidad.
- Los buscadores de campos (`buscarDeducibleTerremoto`, `buscarVigencia`,
  `buscarValorAsegurado`, `buscarCodigoClausulado`) son puros y solo aceptan
  coincidencias de alta precisión en la **misma línea reconstruida**: si el
  dato está en una celda de tabla que pdf.js extrae en otro orden, o
  repartido en dos líneas, no lo encuentran — y eso es a propósito. Mejor un
  "no lo encontré" que un dato mal leído. Si agregas un buscador nuevo,
  escribe el test primero en `test/lector.test.mjs`, igual que con el motor.
- **Dos niveles de confianza, no los mezcles.** Los buscadores de arriba
  devuelven un dato puntual (un número, una fecha) y se muestran como
  "esto encontramos". `buscarDefiniciones()` y `buscarExclusiones()` son
  distintos: el clausulado ahí es prosa legal, no hay patrón que garantice
  "esta es LA exclusión completa". Por eso esas dos siempre se etiquetan
  como **candidato** en la UI ("esto no es la exclusión completa, es dónde
  empieza") y nunca como un dato verificado. Si escribes un buscador nuevo
  de este segundo tipo, mantenlo igual de honesto sobre lo que no garantiza.
  `buscarExclusiones()` nunca cruza de página al juntar el bloque: un
  párrafo cortado a la mitad por un salto de página es peor que no
  mostrarlo.
- **`LECTOR-PATRONES.md`** documenta patrones reales de una póliza
  colombiana real de copropiedad (cifras anonimizadas, estructura y
  vocabulario reales). Si agregas o cambias un buscador, revisa ahí primero
  si ya hay un ejemplo real que lo cubra — y si consigues clausulados de
  otras aseguradoras, amplía ese documento antes que adivinar formatos.
- **SMMLV (mensual) y SMDLV (diario) nunca se convierten uno en el otro.**
  15 SMDLV es medio salario mensual, no quince: confundirlos multiplica el
  deducible por ~30. `RX_SMMLV` y `RX_SMDLV` son regex separadas que exigen
  "mensual"/"diario" completo cuando viene en prosa — la vieja regex de
  SMMLV aceptaba "salarios mínimos" como substring y por eso hacía match
  aunque la frase completa dijera "...diarios legales vigentes". Cada
  candidato de deducible trae `smmlv` y `smdlv` como campos separados,
  nunca uno inventado a partir del otro, y la UI rotula cuál es cuál.
- **No hay "el deducible" de una póliza.** `extraerTablaDeducibles()`
  extrae una fila por amparo (`{amparo, base, pct, smmlv, smdlv,
  sinDeducible}`), porque en la misma póliza distintos amparos calculan
  sobre bases distintas (pérdida vs. valor asegurable). Cada fila exige,
  además del `%`, una señal de que es realmente una fila de deducible (la
  base o una unidad SMMLV/SMDLV) — un `%` suelto no basta, porque una fila
  de coaseguro también tiene `%` y no es un deducible. Tampoco se inventa
  un mínimo cuando la póliza no lo pactó: si no hay SMMLV ni SMDLV en la
  línea, el campo queda en `null`, no en un valor por defecto.
- **`extraerValoresPorItem()`** saca el desglose de valor asegurado por
  ítem (no el total): el deducible de terremoto se calcula sobre el ítem
  afectado. Los ítems en `$0` se marcan con `enCero: true` — es cobertura
  no contratada, y suele sorprender en el siniestro.
- **`ventanas()`** junta cada línea con hasta un puñado de líneas
  siguientes de la MISMA página, para buscar frases que el PDF partió al
  ajustar un párrafo al ancho de la hoja (el código del clausulado, el
  plazo de aviso). A diferencia de una tabla, en un párrafo que fluye sí es
  razonable asumir que el orden de lectura se conserva — pero igual nunca
  cruza de página.
- **Página con codificación rota:** `paginaLegible()` mide la proporción
  de vocales entre las letras de una página; por debajo de 15% se asume
  fuente sin tabla de caracteres correcta (el típico "8VWHG" en vez de
  "Usted") y esa página se saltea entera — no se trata su basura como
  contenido. El umbral es bajo a propósito: peor descartar una página real
  por error que dejar pasar una rota.
- **`limpiarNotaAlPie()`** quita un dígito de nota al pie pegado al nombre
  de un amparo o al `$` (`"material1 $ 28.000.000.000"` →
  `"material $ 28.000.000.000"`). Solo borra UN dígito suelto entre una
  letra y un `$`, nunca una secuencia — para no comerse un número real.
- **Palabras partidas por el extractor** (`"aut omática"` en vez de
  `"automática"`) son un problema conocido y **no resuelto**: arreglarlo
  bien necesitaría un diccionario de español, y un regex mal pensado
  arriesga corromper texto que sí estaba bien. Se deja así a propósito.
- Cuando la calidad del texto es muy baja (`muyDudoso`, por debajo de
  0,4), la página no muestra ninguna cifra: solo el aviso y un enlace al
  cuestionario manual. El umbral normal de "dudoso" (0,75) sigue avisando
  arriba de todo, antes de cualquier dato — nunca solo al lado de cada uno.

## Flujo de trabajo

```bash
npm install      # una vez: trae pdfjs-dist para el build (no la usa la página)
npm test         # motor, rangos, empaquetado, tono y lector de PDF
npm run build    # genera dist/hasta-donde.html y docs/index.html
npm run check    # ambas: úsalo antes de cada commit
```

Antes de dar por terminado cualquier cambio: `npm run check` en verde y abrir
`dist/hasta-donde.html` en el navegador, incluyendo el ancho de un celular.

Al tocar el motor, escribe el test primero. Al tocar contenido (glosario,
catálogo, clausulados), no hacen falta tests, pero sí verificar la fuente.

## Deuda conocida y decisiones tomadas a propósito

- El `prompt()` para agregar clausulados es feo pero funciona sin
  dependencias. Reemplazarlo por un formulario es la mejora #3 del ROADMAP.
- No hay framework y no debería haberlo. El requisito de "un archivo que
  abre con doble clic" pesa más que la comodidad de desarrollo.
- La firma del asesor se configura en `src/js/asesor.js`. Con
  `mostrar: false` la página queda genérica y sin marca, para quien quiera
  publicarla sin atribuirse la asesoría.
- Los cuatro ramos comparten motor pero tienen preguntas distintas. No los
  unifiques: las preguntas son el producto.
