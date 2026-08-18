# Patrones reales — Adenda 1

Segunda compañía analizada, mediante huella de extracción anonimizada.
Producto: copropiedad. 240 páginas. Compañía distinta a la del documento
principal. Todas las cifras van enmascaradas; no hay datos de ningún cliente.

---

## A. HALLAZGO CRUZADO — corregir el rango de deducible de terremoto

Dos compañías distintas, dos pólizas de copropiedad distintas, **el mismo
deducible de terremoto**:

```
Compañía 1:  1% del valor asegurable del ítem afectado
Compañía 2:  1.00 % DEL VALOR ASEGURABLE DEL BIEN AFECTADO
```

En ambos casos la línea **termina ahí**: no hay mínimo en SMMLV ni en SMDLV,
aunque los demás amparos de esas mismas pólizas sí lo tienen.

`RANGO_DEDUCIBLE.ph` en `src/js/config.js` dice hoy `min:{pct:1, smmlv:3}`.
El piso del porcentaje está bien, pero **el mínimo debe ser 0**: estamos
inventando un mínimo de 3 SMMLV que ninguna de las dos pólizas pactó.

Esto no es un ajuste del lector, es una corrección del motor, y sale de
datos reales. Es la primera fila validada de la Fase 1A del VALIDACION.md.

---

## B. Pólizas con un certificado por unidad — deduplicar

Esta póliza tiene **240 páginas prácticamente idénticas**: una por cada
apartamento de la copropiedad. El mismo bloque de deducibles se repite en
todas.

Consecuencia en la extracción:

```
- Tabla de deducibles por amparo: OK (1200 filas)
- Valor asegurado por ítem:       OK (720 filas)
```

1200 filas son 5 deducibles repetidos 240 veces. 720 son 3 valores repetidos
240 veces. **No son 1200 deducibles distintos.** Si eso llega al informe tal
cual, la pantalla es inservible.

Qué hacer:
- Deduplicar filas idénticas antes de mostrar, y decir cuántas veces se
  repetía cada una: "5 deducibles, repetidos en 240 certificados".
- Detectar el patrón "una página por unidad" y avisarlo en el informe: es
  información útil, significa que la póliza ampara áreas privadas unidad
  por unidad.
- Si aparecen filas **distintas** entre certificados, eso sí hay que
  mostrarlo destacado: significa que una unidad tiene condiciones
  diferentes, y eso normalmente nadie lo nota.

**La huella misma necesita la misma deduplicación.** La que se generó
imprimió las 240 páginas con el mismo contenido y quedó gigante. Debe
colapsar líneas repetidas a una sola con un contador: `× 240 páginas`.

---

## C. Vocabulario de la compañía 2 — muy distinto

Todo en mayúsculas, sin tildes, con encabezado terminado en dos puntos y
líneas que empiezan con guion:

```
VALOR ASEGURABLE AREA COMUN      $ #.###.###
VALOR ASEGURABLE AREA PRIVADA    $ #.###.###
VALOR ASEGURABLE TOTAL           $ #.###.###
COBERTURAS: * INCENDIO Y/O RAYO * TERREMOTO TEMBLOR O ERUPCIÓN
DEDUCIBLES :
- DEMÁS EVENTOS: 5.00% DE LA PERDIDA, MINIMO:15 SMDLV
- TERREMOTO: 1.00 % DEL VALOR ASEGURABLE DEL BIEN AFECTADO
- EXTENDED COVERAGE 5.00% DE LA PERDIDA, MINIMO:15 SMDLV
- INUNDACIÓN 5.00% DE LA PERDIDA, MINIMO:15 SMDLV
- AMIT 5.00% DE LA PERDIDA, MINIMO:15 SMDLV
```

Diferencias que rompen patrones escritos para la compañía 1:

| Compañía 1 | Compañía 2 |
|---|---|
| tabla con columnas | lista con guiones bajo `DEDUCIBLES :` |
| `Amparo básico todo riesgo daño material` | `DEMÁS EVENTOS` |
| `Extensión adicional del amparo básico` | `EXTENDED COVERAGE` (en inglés) |
| `Sabotaje y terrorismo` | `AMIT` (sigla suelta, sin explicar) |
| `del ítem afectado` | `DEL BIEN AFECTADO` |
| `valor asegurado` | `VALOR ASEGURABLE` |
| `mínimo 15 SMDLV` | `MINIMO:15 SMDLV` (dos puntos pegados, sin espacio) |
| `5%` | `5.00%` y también `1.00 %` (con espacio antes del signo) |
| con tildes | `PERDIDA`, `MINIMO` sin tilde |

Reglas que se desprenden:
- Normalizar antes de buscar: mayúsculas, tildes fuera, espacios colapsados.
- Aceptar el separador `:` pegado al número y el espacio antes del `%`.
- Aceptar decimales con punto y con coma: `1.00`, `1,00`, `0.5`.
- El bloque de deducibles puede ser una **lista con viñetas**, no solo una
  tabla con columnas. Detectar el encabezado `DEDUCIBLES` seguido de dos
  puntos y leer las líneas siguientes que empiecen con guion.
- `AMIT` y `HAMCCOP` son siglas de amparos de eventos sociopolíticos.
  Nunca confundirlas con terremoto.
- `EXTENDED COVERAGE` es la extensión del amparo básico. Hay más
  anglicismos sueltos en el mercado; conviene un diccionario de sinónimos
  por concepto, no patrones por compañía.

---

## D. PDFs que solo traen la carátula

En esta póliza el lector reportó como NO ENCONTRADO: código de clausulado,
coaseguro, exclusiones, definiciones clave, plazo de aviso, anticipo y
demérito por uso.

No falló. **Ese PDF no incluye el clausulado**, solo los certificados. El
documento de condiciones generales viene aparte.

Decirle a la persona "no encontramos las exclusiones" sugiere que el lector
se equivocó. Lo correcto es detectar que el PDF no contiene condiciones
generales y decirlo distinto:

> Este archivo trae solo la carátula, no el clausulado. Las exclusiones y
> las definiciones están en el documento de condiciones generales, que la
> aseguradora entrega aparte. Puedes pegarlo como texto más abajo, o
> buscarlo en el depósito público de la Superintendencia Financiera.

Heurística: si no aparece ninguna de las palabras `EXCLUSIONES`, `RIESGOS
EXCLUIDOS`, `CONDICIONES GENERALES`, `DEFINICIONES` en todo el documento, es
una carátula sola.

---

## E. Confirmación de SMDLV

La compañía 2 también usa **SMDLV** en cuatro de sus cinco deducibles. Ya no
es una particularidad de una aseguradora: es práctica de mercado. La alerta
del punto 0 del documento principal queda confirmada y sube de prioridad.
