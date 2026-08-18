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
npm test        # 25 pruebas: motor, rangos, empaquetado y tono
npm run build   # → dist/hasta-donde.html y docs/index.html (copia idéntica, para GitHub Pages)
npm run check   # ambas
```

No hay dependencias. Solo necesitas Node 18 o superior para construir; la
página en sí no necesita nada.

## Si eres asesor de seguros

Configura tus datos en `src/js/asesor.js` (nombre, agencia, WhatsApp, correo)
y tu firma aparece en la página. La herramienta está diseñada para que tu
cliente llegue resuelto y con la carpeta de documentos lista, no con una lista
de preguntas: cada duda frecuente se responde en pantalla y el botón de envío
te manda un pre-diagnóstico estructurado por WhatsApp. Con `mostrar: false`
la página queda genérica y sin marca.

## Cómo aportar un clausulado

No necesitas saber programar. Abre la página, ve a **Biblioteca de
clausulados**, usa *Agregar un clausulado* con tu carátula a la vista, luego
*Exportar JSON* y envía el archivo. Solo entra información leída de un
clausulado real: los rangos típicos van marcados como referencia de mercado.

## Esto no es asesoría

Los cálculos son estimaciones educativas basadas en lo que tú ingresas. La
única fuente válida es tu clausulado. Si tu aseguradora objeta, puedes acudir
al Defensor del Consumidor Financiero de la entidad y a la Superintendencia
Financiera de Colombia.

## Licencia

MIT. Cópiala, cámbiala, publícala.
