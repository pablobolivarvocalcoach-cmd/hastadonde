# ROADMAP — tareas listas para Claude Code

Cada bloque está redactado para pegarlo tal cual en Claude Code. Van en orden
de valor por esfuerzo. Lee `CLAUDE.md` antes de empezar cualquiera.

---
## 1. Lector de carátula (el que más fricción quita)

> Agrega un módulo que permita subir una foto o PDF de la carátula de la
> póliza y extraiga: valor asegurado por ítem, amparos otorgados y la línea de
> deducible de terremoto. Debe funcionar sin enviar el archivo a ningún
> servidor: usa un OCR que corra en el navegador. Si no logra leer un campo,
> déjalo vacío y dilo — nunca adivines un valor. Precarga el resultado en el
> paso de números del cuestionario para que la persona solo confirme.
> Respeta la regla de cero red del CLAUDE.md: el OCR se empaqueta o se
> descarga bajo demanda con aviso explícito.

---
## 2. Detector de infraseguro por metro cuadrado

> La mayoría no sabe cuánto cuesta reconstruir su edificio, así que deja el
> campo "valor real" vacío y el infraseguro queda invisible. Agrega un
> estimador: metros cuadrados construidos × costo de reconstrucción por m²
> según estrato y ciudad, con los rangos como constantes editables en
> `config.js` y citando la fuente. Muéstralo como ayuda opcional en el paso de
> números, nunca como dato duro. Tests en el motor si tocas el cálculo.

---
## 3. Formulario real para la biblioteca de clausulados

> Reemplaza los `prompt()` de "Agregar un clausulado" por un formulario en
> línea con validación. Agrega búsqueda y filtro por ramo y aseguradora sobre
> la tabla. Mantén el import/export de JSON funcionando igual y conserva la
> distinción visual entre `verificado: true` y "referencia de mercado".

---
## 4. Comparador de escenarios

> Permite ver dos configuraciones lado a lado sobre la misma pérdida: por
> ejemplo, deducible del 2% vs 3%, o valor asegurado actual vs actualizado.
> Reutiliza `calcular()` sin modificarlo y renderiza dos cintas apiladas.
> El objetivo es que la persona pueda llevarle un argumento concreto a su
> asesor en la renovación.

---
## 5. Reporte PDF de verdad

> El `window.print()` actual sirve, pero el resultado depende del navegador.
> Genera un PDF de una página con las cifras, el semáforo, las respuestas
> anticipadas y la carpeta de documentos, sin dependencias pesadas ni
> llamadas de red. Debe verse bien impreso en blanco y negro.

---
## 6. Accesibilidad y pruebas de pantalla

> Audita con teclado y lector de pantalla: el cuestionario debe ser navegable
> con Tab y Enter, los cambios de paso deben anunciarse con `aria-live`, y la
> cinta del dinero necesita una alternativa textual con las cifras. Verifica
> contraste AA en los tres colores semánticos. Agrega pruebas de humo del DOM.

---
## 7. Contenido: nutrir el catálogo

No requiere código. Con clausulados reales en la mano:

- Cargar deducibles verificados en `src/js/clausulados.js` o en
  `datos/clausulados.json`, marcando `verificado: true` y anotando el código
  de registro del clausulado.
- Ampliar `RAMOS` con exclusiones frecuentes por ramo, redactadas en lenguaje
  claro, con el numeral del clausulado como referencia.
- Ampliar el glosario con los términos que la gente pregunte de verdad.

---
## 7.b Panel del asesor

> Hoy los datos del asesor se editan en `src/js/asesor.js`. Agrega una pantalla
> de configuración oculta (por ejemplo con `?config` en la URL) donde el asesor
> escriba nombre, agencia, WhatsApp, correo e invitación, y exporte el archivo
> ya personalizado. El objetivo es que un asesor sin conocimientos técnicos
> pueda publicar su propia versión. Respeta la regla 2 del CLAUDE.md.

---
## 8. Publicación

> Prepara el repo para GitHub Pages: workflow de Actions que corra `npm run
> check` y publique `dist/`. Agrega LICENSE MIT, CONTRIBUTING.md explicando
> cómo aportar un clausulado sin saber programar, y un README con capturas.
