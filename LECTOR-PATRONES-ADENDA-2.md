# Patrones reales — Adenda 2

Tercera compañía, y primer ramo distinto: **PYME multirriesgo**. Documento de
unas 20 páginas con carátula, hojas anexas y varios clausulados. Todas las
cifras van enmascaradas y no aparece ningún dato del tomador, del asegurado
ni del intermediario.

Esta póliza corrige una afirmación central de la herramienta. Empezamos por
ahí.

---

## A. CORRECCIÓN IMPORTANTE — en PYME el deducible de terremoto sí puede ir sobre la pérdida

La herramienta afirma hoy, en la sección "El malentendido #1", que el
deducible de terremoto casi nunca se calcula sobre lo que perdiste. **Eso es
cierto en copropiedad y no lo es en esta póliza PYME.**

```
Ramo: 11 - TERREMOTO (AMPARO INCENDIO)
Categoria: 7-EDIFICIO
   COBERTURA DE TERREMOTO - INC.
   LIMITE AGREGADO POR VIGENCIA   #.###.###.###
   Deducible: 3.00%  DEL VALOR DE LA PERDIDA  Mínimo 1.00 SMMLV  NINGUNO
```

Comparado con las dos pólizas de copropiedad ya analizadas:

| Ramo | Base del deducible de terremoto | Mínimo |
|---|---|---|
| Copropiedad, compañía 1 | valor asegurable del ítem afectado | sin mínimo |
| Copropiedad, compañía 2 | valor asegurable del bien afectado | sin mínimo |
| **PYME, compañía 3** | **valor de la pérdida** | **1 SMMLV** |

**La base depende del ramo y de la compañía. No hay una regla única.**

Qué hacer:
- El motor ya soporta las dos bases, así que no hay error de cálculo. El
  problema es el **copy**: la sección del malentendido está redactada como
  si la regla fuera universal.
- Reescribirla para que diga lo que de verdad importa: que la base cambia,
  que casi nadie sabe cuál le aplica, y que la diferencia entre una y otra
  puede ser de decenas de millones. El deslizador sigue sirviendo; lo que
  cambia es la afirmación.
- `RANGO_DEDUCIBLE.pyme` debe reflejar que en PYME el rango razonable de
  terremoto va alrededor del 3% **sobre la pérdida**, con mínimo de 1 SMMLV,
  que es un escenario muy distinto al 1% sobre el valor asegurable de PH.
  Conviene que el rango guarde también la **base**, no solo el porcentaje.

---

## B. El mismo amparo tiene deducible distinto según la categoría del bien

Dentro del mismo ramo de terremoto, en la misma póliza:

```
Categoria:  7-EDIFICIO                    Deducible: 3.00% ... Mínimo 1.00 SMMLV
Categoria: 10-MAQUINARIA Y EQUIPO         Deducible: 3.00% ... Mínimo 1.00 SMMLV
Categoria: 17-MUEBLES Y ENSERES           Deducible: 3.00% ... Mínimo 1.00 SMMLV
Categoria: 55-EQUIPO ELECTRONICO          Deducible: 10.00% ... Mínimo 1.00 SMMLV
```

Equipo electrónico paga **más del triple** de deducible que el edificio, por
el mismo terremoto. Si el lector toma "el deducible de terremoto" y lo
aplica a todo, se equivoca en el ítem que más se daña en un sismo.

La clave para el usuario: **hay que preguntar qué se dañó**, y luego usar el
deducible de esa categoría.

---

## C. Estructura jerárquica y muy parseable

Esta compañía usa una jerarquía limpia de tres niveles, repetida:

```
Ramo: N - NOMBRE DEL RAMO
Categoria: NN-NOMBRE DE LA CATEGORIA
AMPAROS CONTRATADOS
No.  Amparo                    Valor Asegurado   AcumVA   Prima
 7   NOMBRE DEL AMPARO                             NO      #.###
       LIMITE AGREGADO POR VIGENCIA   #.###.###.###
       LIMITE POR EVENTO O PERSONA    0.00
       Deducible: 3.00%  DEL VALOR DE LA PERDIDA  Mínimo 1.00 SMMLV  NINGUNO
```

La línea del deducible empieza literalmente con `Deducible:` y sigue un
formato fijo:

```
Deducible: <porcentaje>%  <base en texto>  Mínimo <cantidad> <unidad>  <palabra>
```

Es el patrón más limpio de las tres compañías. Vale la pena implementarlo
como caso de alta confianza. La palabra final (`NINGUNO`) parece un tercer
campo de deducible fijo; si trae un valor distinto, hay que capturarlo.

Ojo: hay amparos **sin línea de deducible**, que significa sin deducible.
No asumir que la ausencia es un fallo de lectura.

---

## D. Varias ubicaciones aseguradas en la misma póliza

```
Riesgo: 1 -  CIUDAD, DEPARTAMENTO
   ... valores y deducibles ...
Riesgo: 2 -  CIUDAD, DEPARTAMENTO
   ... otros valores, mismos amparos ...
```

En esta póliza el edificio del riesgo 1 y el del riesgo 2 tienen valores
asegurados **muy distintos**, con la misma estructura de amparos.

Si el negocio tiene dos sedes y solo se dañó una, el cálculo debe usar el
valor de **esa** sede. Tomar el total, o el primero que aparezca, produce un
resultado equivocado. El lector debe extraer los riesgos por separado y
preguntar cuál se afectó.

---

## E. Los amparos que NO están contratados vienen marcados — es oro

El documento marca explícitamente lo que no se contrató:

```
Lucro cesante forma inglesa (pérdida de utilidad bruta)  NO CONTRATADO
Amparo adicional de suelos y terrenos por terremoto      NO CONTRATADO
Adaptación a las normas de sismoresistencia              NO CONTRATADO
Bienes Refrigerados                                      NO CONTRATADO
```

Esto es exactamente la alerta más valiosa que puede dar la herramienta. En
este caso concreto: **el negocio no tiene lucro cesante**, así que si el
sismo lo obliga a parar, le reparan el local pero no le cubren los meses sin
facturar.

El lector debe buscar `NO CONTRATADO` y `CONTRATADO` como marcadores y armar
una sección de "lo que tu póliza NO tiene", destacando primero los que más
duelen en un terremoto: lucro cesante, suelos y terrenos, adaptación a
sismorresistencia.

Cuidado con el formato: en algunas líneas los marcadores aparecen **en
bloque al final**, separados del concepto al que corresponden, porque el PDF
extrae una tabla de dos columnas en secuencia. Cuando la correspondencia no
sea inequívoca, marcarlo como dudoso en vez de adivinar.

---

## F. Cláusula de 72 horas para terremoto — muy relevante ahora

```
Cláusula de 72 horas para Terremoto, Temblor, Erupción y Volcánica
```

Todos los movimientos ocurridos dentro de una ventana de 72 horas cuentan
como **un solo evento**, y por tanto se aplica **un solo deducible**. Con
las réplicas que siguieron al sismo, esto le importa a mucha gente y casi
nadie lo sabe. Merece estar en el glosario y aparecer como hallazgo
destacado cuando el lector la encuentre.

---

## G. Margen de tolerancia al infraseguro

```
No aplicación de infraseguro cuando la diferencia entre el valor asegurado
y valor asegurable no supere el 10%
```

Es una cláusula de margen: si estás asegurado por encima del 90% del valor
real, **no aplican la regla proporcional**. El motor hoy aplica infraseguro
desde el primer peso de diferencia.

Hay que agregar un campo opcional de tolerancia al motor, con su prueba, y
que el lector lo detecte. Sin esto, la herramienta le muestra un descuento
por infraseguro a alguien que no lo va a sufrir.

---

## H. Anticipo de indemnización

```
Anticipo de indemnización 50% previa demostración de la ocurrencia y cuantía
```

Se puede pedir la mitad antes de que se cierre el ajuste. Para alguien que
necesita reabrir su negocio ya, esta es la información más útil de toda la
póliza. Debe salir destacada, no enterrada.

---

## I. Plazo de aviso ampliado — tercera compañía consecutiva

```
Ampliación del plazo para el aviso de siniestro a 10 días
```

Compañía 1 lo amplió a 15 días, esta a 10, y la ley dice 3. **Las tres
pólizas revisadas modifican el plazo legal.** Ya no es una excepción: el
lector debe buscarlo siempre y el informe debe mostrar el plazo real de esa
póliza, aclarando que la ley fija 3 días como mínimo y la póliza puede
ampliarlo.

---

## J. GARANTÍAS — el riesgo que nadie mira

Sección propia, con consecuencia grave:

```
GARANTIAS
Queda expresamente declarado y convenido, que este seguro se realiza en
virtud de la garantía otorgada por el asegurado [...]
* Vigilancia de empresa especializada las 24 horas [...]
* Extintores suficientes, adecuados, con carga vigente y debidamente
  señalizados
* Mantenimiento anual a techos, bajantes y canoas, documentado en bitácora
* Mercancía almacenada sobre estibas, a más de 20 cm del piso y 50 cm de
  paredes
NOTA: [...] en caso que una o cualquiera de ellas sea incumplida en todo o
en parte, el presente contrato de seguro será anulable o se dará por
terminado en los términos del artículo 1061 del Código de Comercio
```

Incumplir una garantía puede anular el contrato. Es una de las cosas más
serias que trae una póliza PYME y casi ningún asegurado sabe que la firmó.

El lector debe extraer la sección `GARANTIAS` completa y presentarla como
una lista de verificación, con una advertencia clara. Es contenido de alta
prioridad para el informe.

---

## K. Un mismo documento trae varios clausulados

```
CLAUSULADO: PRPYP-002     (multirriesgo PYME)
CLAUSULADO: PRACP-003     (transporte de valores)
CLAUSULADO: RCP-016       (RC extracontractual)
CLAUSULADO: MAP-001       (manejo global)
```

El código de clausulado **no es un dato único**: es uno por sección. Va
precedido de la palabra `CLAUSULADO:` y el formato es corto, con letras,
guion y números — distinto del formato largo de la compañía 1. Hay que
extraerlos todos, asociados a su sección.

---

## L. Gastos con ocasión del siniestro, sin deducible ni infraseguro

```
hasta el 20% de la suma asegurada de los bienes afectados [...] no
incrementará la suma asegurada, ni estará sujeto a la aplicación de
infraseguro ni deducibles
```

Cubre remoción de escombros, honorarios profesionales, licencias para
reconstruir, reparaciones provisionales, gastos para demostrar la
ocurrencia y la cuantía, horas extras y fletes.

Que **no le apliquen deducible ni infraseguro** lo vuelve el amparo más
rentable de reclamar, y el más olvidado. Merece bloque propio en el informe.

---

## M. Zonas del PDF que NO se deben parsear

Dos regiones de este documento salen del extractor completamente
desordenadas, porque el PDF las maqueta en dos columnas y el texto se lee
en secuencia:

1. **La tabla resumen de deducibles al final.** Salen todos los porcentajes
   juntos, luego todas las frases "Del valor de la perdida Minimo N", luego
   todas las unidades "SMMLV SMMLV SMMLV". La correspondencia entre
   concepto y valor se pierde por completo.
2. **La lista de exclusiones de RC**, donde los numerales 5.1 y 5.12 quedan
   intercalados en la misma línea.

**Regla:** cuando en una región aparezcan varios valores seguidos sin su
etiqueta, o numerales fuera de orden, marcarla como no confiable y no
extraer datos de ahí. Para los deducibles hay que preferir siempre las
líneas individuales `Deducible: ...` de cada categoría, que sí son limpias.

Este documento es un buen recordatorio de por qué la regla de "no rellenar
un campo del que no estás seguro" es la más importante del proyecto.

---

## N. Vocabulario nuevo

| Concepto | Cómo lo escribe esta compañía |
|---|---|
| Deducible | `Deducible: X.XX% DEL VALOR DE LA PERDIDA Mínimo X.XX SMMLV` |
| Valor asegurado | `Valor Asegurado`, `LIMITE AGREGADO POR VIGENCIA`, `LIMITE POR EVENTO O PERSONA` |
| Ítem | `Categoria: NN-NOMBRE` |
| Ubicación | `Riesgo: N -` |
| Terremoto | `TERREMOTO (AMPARO INCENDIO)`, `COBERTURA DE TERREMOTO - INC.` |
| Sociopolíticos | `AMIT Y HMACC`, `AHMCCOP` |
| No contratado | `NO CONTRATADO` |
| Sin deducible | ausencia de línea `Deducible:`, o `Sin deducible` |
| Clausulado | `CLAUSULADO: XXXX-000` |
| Unidades | el documento define `SMMLV: SALARIO MÍNIMO MENSUAL LEGAL VIGENTE` y `SMDLV: SALARIO MÍNIMO DIARIO LEGAL VIGENTE` en el pie |

---

## Prioridad de esta adenda

1. Corregir el copy del "malentendido #1": la base del deducible varía (A)
2. Deducible por categoría, no uno global (B)
3. Marcadores `NO CONTRATADO` como alertas del informe (E)
4. Patrón `Deducible:` de alta confianza (C)
5. Detección de regiones de dos columnas no confiables (M)
6. Varias ubicaciones `Riesgo: N` (D)
7. Garantías como lista de verificación (J)
8. Margen de tolerancia al infraseguro en el motor (G)
9. Cláusula de 72 horas, anticipo, plazo de aviso, gastos sin deducible (F, H, I, L)
