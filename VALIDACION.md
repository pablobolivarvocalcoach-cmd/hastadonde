# Protocolo de validación

Antes de entregarle esto a una persona real. No es papeleo: es la diferencia
entre una herramienta que ayuda y una que hace que alguien no reclame.

Nadie tiene que ser programador para hacer esto. Lo que se valida son
números de seguros, no código.

---

## Qué está verificado y qué no

No hace falta tener siniestros ya pagados para empezar: las fases 1A y 1B se
hacen hoy con las carátulas y los expedientes que ya tienes en trámite.

**Verificado por pruebas automáticas** (`npm test`, 24 pruebas): las
matemáticas. Que el infraseguro se aplique antes del deducible, que se tome
el mayor entre porcentaje y mínimo en SMMLV, que la indemnización nunca sea
negativa ni supere el valor asegurado, que las partes de la barra sumen
exactamente la pérdida, y que sin el deducible se muestre un rango en vez de
una cifra inventada.

**No verificado, y es lo que falta:** si los rangos de mercado de
`src/js/config.js`, los textos del catálogo y las semillas de clausulados
corresponden a pólizas colombianas reales. Eso solo lo confirma alguien con
clausulados en la mano.

---

## Fase 1A — Verificar las entradas (se hace hoy, sin esperar a nadie)

No necesitas un caso pagado. Necesitas una carátula.

La afirmación más riesgosa de la herramienta es que **el deducible de
terremoto se calcula sobre el valor asegurado del bien, no sobre la pérdida,
y que se aplica el mayor entre el porcentaje y el mínimo en SMMLV**. Eso se
comprueba leyendo una sola línea de cualquier póliza vigente.

Toma las carátulas de los casos que tengas en trámite y llena esto:

| # | Ramo | Aseguradora | ¿Sobre qué se calcula? | % | Mínimo SMMLV | ¿Cae dentro del rango del código? |
|---|------|-------------|------------------------|---|--------------|-----------------------------------|
| 1 |      |             |                        |   |              |                                   |
| 2 |      |             |                        |   |              |                                   |
| 3 |      |             |                        |   |              |                                   |
| 4 |      |             |                        |   |              |                                   |
| 5 |      |             |                        |   |              |                                   |

Los rangos están en `src/js/config.js`, en `RANGO_DEDUCIBLE`.

**Cómo leerlo:**

- Si en todas dice que se calcula sobre el valor asegurable o asegurado, la
  premisa central está confirmada.
- Si alguna dice que se calcula sobre la pérdida, no es un error: la
  herramienta ya permite elegirlo. Solo significa que ese caso hay que
  contestarlo distinto en el cuestionario.
- Si algún deducible real cae **fuera** del rango declarado, el rango está
  mal y hay que ampliarlo. Es corrección obligatoria: mientras no se haga,
  la herramienta le muestra rangos equivocados a quien no conozca su dato.

Con cinco carátulas revisadas ya sabes si la herramienta miente o no en lo
que más importa.

---

## Fase 1B — Clave de respuesta parcial (revisa si ya la tienes)

En un caso en trámite muchas veces ya hay una cifra oficial aunque no haya
pago. Revisa tus expedientes buscando cualquiera de estos documentos:

- Liquidación preliminar u oferta de indemnización
- Informe del ajustador con valoración
- Carta de objeción (casi siempre explica el cálculo del deducible)
- Cualquier correo donde la compañía diga el deducible **en pesos**

Ese número en pesos es una respuesta exacta. Métele a la herramienta el
valor asegurado y el deducible de la carátula, y mira si el deducible
calculado coincide. Si coincide, el motor está bien aunque el siniestro no
se haya pagado.

| # | Deducible que dijo la compañía | Deducible que dio la herramienta | ¿Coincide? |
|---|--------------------------------|----------------------------------|------------|
| 1 |                                |                                  |            |
| 2 |                                |                                  |            |
| 3 |                                |                                  |            |

---

## Fase 1C — Bitácora de predicciones (se llena hoy, se cierra después)

Para cada caso en trámite, corre el diagnóstico **ahora** y anota la cifra
antes de saber el resultado. Cuando la aseguradora liquide, vuelves y cierras
la fila. Sin trabajo extra: son casos que ya estás atendiendo.

| # | Fecha | Ramo | Valor aseg. | Valor real | Pérdida | Deducible | **Predicción** | Pagó de verdad | Δ | ¿Por qué difiere? |
|---|-------|------|-------------|------------|---------|-----------|----------------|----------------|---|-------------------|
| 1 |       |      |             |            |         |           |                | *pendiente*    |   |                   |
| 2 |       |      |             |            |         |           |                | *pendiente*    |   |                   |
| 3 |       |      |             |            |         |           |                | *pendiente*    |   |                   |
| 4 |       |      |             |            |         |           |                | *pendiente*    |   |                   |
| 5 |       |      |             |            |         |           |                | *pendiente*    |   |                   |

**Lo importante es escribir la predicción antes.** Una cifra anotada de
antemano vale como prueba; una explicada después de conocer el resultado, no.

**Cómo leer la diferencia cuando llegue:**

- **Menos del 5%** → normal. Redondeos del ajustador, IVA, depreciación.
- **Diferencia grande con explicación** → casi siempre es un amparo que la
  herramienta no modela todavía: reposición a nuevo, primer riesgo absoluto,
  valor admitido, un sublímite. Anótalo: es tarea del ROADMAP, no un error
  de cálculo.
- **Diferencia grande sin explicación** → alto. No publicar ese ramo.

---

## Fase 2 — Clausulados reales

Toma entre 3 y 5 pólizas vigentes de tu cartera, una por ramo, y busca en
cada carátula la línea de deducible de terremoto.

Compárala con los rangos declarados en `src/js/config.js`
(`RANGO_DEDUCIBLE`). Si un deducible real cae **fuera** del rango, el rango
está mal y hay que ampliarlo: mientras eso no se corrija, la herramienta le
va a mostrar rangos equivocados a quien no conozca su deducible.

Con cada póliza revisada, carga la fila en la **Biblioteca de clausulados**
de la página y márcala como verificada. Cada clausulado cargado hace la
herramienta más precisa para el siguiente que la use.

| Aseguradora | Producto | Código clausulado | Deducible terremoto | ¿Cae en el rango? |
|-------------|----------|-------------------|---------------------|-------------------|
|             |          |                   |                     |                   |

---

## Fase 3 — Segundo par de ojos

Que **alguien que no seas tú** recorra la herramienta completa: un ajustador,
un colega con más años, o el suscriptor de una compañía con la que trabajes.

Pregúntale tres cosas concretas:

1. ¿Hay algo aquí que sea técnicamente falso?
2. ¿Hay algo que, leído por un cliente asustado, se pueda malinterpretar?
3. ¿Falta algún amparo o alguna trampa que tú ves seguido y aquí no está?

Anota todo antes de discutirlo. Las objeciones de un ajustador valen más que
cualquier prueba automática.

---

## Fase 4 — Piloto cerrado

Entre 8 y 12 clientes de confianza, no público abierto. Explícales que es una
herramienta nueva y que quieres su opinión.

Lo que hay que medir no es si les gustó:

- **¿Qué te preguntaron igual, después de usarla?** Cada pregunta que
  llegue es una respuesta que falta en la sección "Lo que ya está
  respondido". Anótalas todas.
- **¿En qué pantalla se trabaron?**
- **¿Cuántos llegaron con la carpeta completa?** Es la métrica que dice si
  la herramienta te está ahorrando trabajo o generándotelo.
- **¿Alguno entendió algo al revés?** Esto es lo grave. Si pasa, para.

---

## Fase 5 — Abrir

Solo con las cuatro fases anteriores hechas y anotadas.

---

## Regla de seguridad, por encima de todo lo demás

**Ninguna versión de esta herramienta puede llevar a que alguien no reporte
su siniestro.** Aunque el cálculo dé cero, aunque el amparo parezca no
existir, aunque la persona crea que no vale la pena. El aviso a la
aseguradora es gratis y el plazo se vence.

Está cubierto por `test/tono.test.mjs`, pero es una regla de criterio antes
que una prueba: si un cambio hace que la herramienta suene a veredicto en
vez de a estimación, el cambio está mal.
