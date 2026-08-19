# Hasta Dónde

Herramienta abierta y gratuita para entender hasta dónde llega tu póliza en
Colombia: copropiedades, PYME, autos y hogar. Deducibles, infraseguro y
coberturas explicados en lenguaje claro, con números.

Nació después del sismo del 10 de agosto de 2026.

**Úsala en línea:** https://pablobolivarvocalcoach-cmd.github.io/hastadonde/

- **Un solo archivo.** `dist/hasta-donde.html` se abre con doble clic.
- **Sin servidor, sin cuentas, sin cookies, sin internet.**
- **Nada se guarda.** Las cifras que ingresas se pierden al recargar, a propósito.

## Empezar

```bash
npm install     # trae pdfjs-dist, solo para construir — la página no la necesita
npm test        # motor, escenarios, empaquetado, tono y lector de PDF
npm run build   # → dist/hasta-donde.html y docs/index.html (copia idéntica, para GitHub Pages)
npm run check   # ambas
```

La página publicada no tiene dependencias: es un archivo autocontenido. Para
construirla necesitas Node 18 o superior y `npm install`, que trae `pdfjs-dist`
(el lector de PDF en el navegador — ver más abajo). Esa librería queda
embebida dentro del único archivo HTML; nadie que use la página instala nada.

## Lector de PDF (prototipo)

Puedes subir el PDF de tu póliza y la herramienta te muestra qué encontró
— vigencia, valor asegurado por ítem, código de clausulado, coaseguro, y
la tabla completa de deducibles por amparo (no existe "el deducible" de
una póliza: cada amparo puede calcular sobre una base distinta, y esta
tabla lo muestra) — con la página exacta para que lo verifiques. También
busca fragmentos del clausulado (exclusiones, definiciones clave como
"pérdida total" o "regla proporcional", plazos modificados, demérito por
uso), siempre marcados como candidato a revisar, nunca como el texto
completo verificado. Si el texto de una página sale mal decodificado, esa
página se descarta en vez de tratarse como contenido. El PDF se lee entero
en tu navegador con [pdf.js](https://mozilla.github.io/pdf.js/): nunca se
sube a ningún servidor ni se guarda. Solo funciona con PDF de texto (no
fotos ni escaneos), y si un dato no se puede leer con confianza, la
herramienta lo
dice en vez de inventarlo. Es una primera versión: todavía no llena el
cuestionario por ti ni reemplaza la entrada principal de la página.

Al final del resultado hay un botón para **exportar la huella de la
póliza**: un resumen técnico pensado para compartir con quien esté
mejorando el lector, sin un solo dato del cliente — nunca nombres, NIT,
cédulas, direcciones, contacto ni cifras en pesos, solo qué campo se
encontró y en qué página. Se muestra en un cuadro de texto para que lo
revises tú antes de copiarlo.

## Si eres asesor de seguros

Configura tus datos en `src/js/asesor.js` (nombre, agencia, WhatsApp, correo)
y tu firma aparece en la página. La herramienta está diseñada para que tu
cliente llegue resuelto y con la carpeta de documentos lista, no con una lista
de preguntas: cada duda frecuente se responde en pantalla y el botón de envío
te manda un pre-diagnóstico estructurado por WhatsApp. Con `mostrar: false`
la página queda genérica y sin marca.

## Cómo aportar un clausulado o un deducible observado

No necesitas saber programar. Abre la página, ve a **Biblioteca de
clausulados**. Ahí hay dos tablas separadas a propósito: *Agregar un
clausulado* es para condiciones generales (qué existe, qué verificar) y
nunca lleva deducible — el deducible varía de póliza a póliza, incluso
dentro de la misma aseguradora, así que ponerlo ahí lo haría ver como una
regla del producto. Si tienes un deducible real a la vista en una carátula,
va en *Agregar una observación*, con fecha: es el dato de esa póliza, no una
promesa sobre la tuya. En los dos casos, *Exportar JSON* y envía el archivo.

## Esto no es asesoría

Los cálculos son estimaciones educativas basadas en lo que tú ingresas. La
única fuente válida es tu clausulado. Si tu aseguradora objeta, puedes acudir
al Defensor del Consumidor Financiero de la entidad y a la Superintendencia
Financiera de Colombia.

## Licencia

MIT. Cópiala, cámbiala, publícala.
