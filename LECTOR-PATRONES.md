# Patrones reales de pólizas colombianas — para el lector de PDF

Documento derivado del análisis de una póliza real de copropiedad emitida en
2026 bajo coaseguro. **Todos los ejemplos de abajo están anonimizados**: los
números fueron cambiados y no aparece ningún dato del tomador, del asegurado
ni del intermediario. Lo que se conserva es la **estructura y el vocabulario**,
que es lo que el lector necesita reconocer.

---

## 0. ALERTA CRÍTICA — SMDLV no es SMMLV

En la misma póliza conviven las dos unidades:

```
Amparo básico todo riesgo daño material   5% de la pérdida mínimo 15 SMDLV
Sabotaje y terrorismo                     10% de la pérdida mínimo 2 SMMLV
Rotura de maquinaria                      5% de la pérdida mínimo 1 SMMLV
```

- **SMMLV** = salario mínimo mensual legal vigente
- **SMDLV** = salario mínimo **diario** legal vigente = SMMLV / 30

**15 SMDLV son medio salario mensual, no quince.** Si el lector confunde las
siglas, el deducible sale **30 veces más grande** de lo que es, el cálculo da
una indemnización mucho menor que la real, y la persona puede concluir que no
vale la pena reclamar.

También aparece **SMDLV escrito como SMLDV** y con decimales: `mínimo 0.5
SMMLV`. Hay que aceptar decimales con punto y con coma.

El motor debe manejar las dos unidades como campos distintos, nunca convertir
una en otra en silencio, y mostrar en pantalla cuál está aplicando.

---

## 1. El deducible de terremoto puede NO tener mínimo

```
COBERTURA    VALOR ASEGURADO    DEDUCIBLE
Terremoto    -                  1% del valor asegurable del ítem afectado
```

Esa línea termina ahí. No dice "mínimo X SMMLV". Es un porcentaje puro.

Hoy la herramienta asume un mínimo por defecto cuando no lo encuentra. Eso
**inventa un deducible que la póliza no pactó**. Si no aparece un mínimo en la
línea, el mínimo es cero y hay que decirlo explícitamente: "esta póliza no
pactó mínimo para terremoto".

---

## 2. Los deducibles varían por amparo dentro de la misma póliza

No existe "el deducible" de una póliza. Existe una tabla:

```
COBERTURA                              DEDUCIBLE
Amparo básico todo riesgo daño material   5% de la pérdida mínimo 15 SMDLV
Terremoto                                 1% del valor asegurable del ítem afectado
Extensión adicional del amparo básico     5% de la pérdida mínimo 15 SMDLV
Inundación                                5% de la pérdida mínimo 15 SMDLV
Sabotaje y terrorismo                     10% de la pérdida mínimo 2 SMMLV
```

Fíjate en algo decisivo: **en la misma póliza, unos amparos calculan sobre la
pérdida y terremoto calcula sobre el valor asegurable.** Son bases distintas
en el mismo documento. Extraer un solo deducible global es incorrecto.

Hay una segunda tabla de deducibles más abajo, con columnas `LIMITE AGREGADO`
y `LIMITE POR EVENTO`, donde aparecen amparos como rotura de maquinaria,
hurto, equipos eléctricos, manejo, y valores literales **`Sin deducible`**.

Y una tercera tabla solo de responsabilidad civil extracontractual, con sus
propios deducibles por sub-amparo.

**Conclusión:** el lector debe extraer una lista de `{amparo, límite,
deducible}`, no un dato único. Y el informe debe mostrar la fila de terremoto
destacada, porque es la que importa hoy.

---

## 3. "Valor asegurable del ítem afectado" — hay que saber cuál ítem

El valor asegurado tampoco es un número. Es un desglose:

```
COBERTURA                                VALORES ASEGURADOS
Amparo básico todo riesgo daño material  -
  Áreas e inmuebles de propiedad común   $ 15.000.000.000
  Cimientos                              $ 0
  Áreas privadas                         $  9.000.000.000
  Vidrios, espejos y unidades sanitarias $    800.000.000
  Maquinaria y equipo                    $     10.000.000
  Muebles y enseres                      $ 0
  Equipos eléctricos y electrónicos      $    100.000.000
```

(Cifras de ejemplo, no reales.)

Como el deducible de terremoto se calcula sobre **el ítem afectado**, la
diferencia es enorme: 1% sobre áreas comunes no es lo mismo que 1% sobre
maquinaria. El lector debe extraer todos los ítems y **preguntarle a la
persona cuál se dañó**, en vez de tomar el total.

Ojo con los ítems en **$ 0**: significan cobertura no contratada. El informe
debería marcarlos como alerta, porque suelen sorprender en el siniestro.

---

## 4. El código del clausulado va en prosa, no en el pie de página

```
Clausulado   PÓLIZA DE TODO RIESGO PARA COPROPIEDADES. A este producto de
             seguro le serán aplicables los términos y condiciones del
             condicionado general Código REGISTRO CONDICIONADO GENERAL
             00000000-0000-P-00-PRODUCTOXXX-D00I y que ha sido previamente
             depositado en la Superintendencia Financiera de Colombia
```

El identificador va **después de la frase "REGISTRO CONDICIONADO GENERAL"**,
dentro de un párrafo, y sigue un formato de bloques separados por guiones que
termina en algo tipo `-D00I`. Los anexos usan el mismo formato con una letra
distinta en el bloque intermedio.

Buscarlo en pies de página no funciona en esta compañía.

---

## 5. Las condiciones particulares modifican los plazos de ley

```
3. Con la finalidad de ofrecer mayor comodidad a nuestros clientes, el plazo
   de aviso del siniestro se amplía a 15 días.
```

La herramienta dice hoy que el aviso son 3 días (art. 1075 del Código de
Comercio). **Esta póliza lo amplió a 15.** Si el lector encuentra una cláusula
así, el informe tiene que mostrar el plazo real de esa póliza, no el de la ley.

Vale la pena buscar también menciones a anticipo de indemnización, que esta
póliza permite pedir por escrito antes de que se formalice la reclamación. Es
información muy útil para alguien que necesita plata ya.

---

## 6. Demérito por uso — cambia lo que te pagan

```
9. Demérito por Uso (Aplica para Copropiedades a partir de los 10 años de
   construcción): Se aplicará demérito por uso a las Pérdidas Totales [...]
   cuando la reparación o reposición supere el 70% del valor a nuevo del bien
   siniestrado, la Compañía pagará la indemnización por su valor real.
```

Dos datos que el motor necesita y hoy no captura: el **umbral de pérdida
total (70%)** y que a partir de cierta antigüedad se paga a **valor real, no
a valor a nuevo**. En un edificio viejo eso reduce la indemnización de forma
significativa y casi nadie lo sabe.

También aparecen porcentajes de demérito anual por tipo de bien (por ejemplo
5% anual con tope del 50% para maquinaria con más de cierta antigüedad).

---

## 7. Coaseguro con porcentajes

```
Asegurador   COMPAÑÍA A (Líder) - 10%
Asegurador   COMPAÑÍA B - 90%
```

Dos compañías responden en proporción a su participación. El informe debería
decir con claridad a quién se le reclama (la líder administra el siniestro)
y que ambas responden proporcionalmente. El glosario ya explica coaseguro;
falta conectarlo.

---

## 8. Problemas de extracción de texto que hay que manejar

**Páginas con codificación rota.** La portada de esta póliza extrae texto
desplazado en el código ASCII: donde dice "Usted cuenta con" el extractor
devuelve `8VWHG FXHQWD FRQ`. Es una fuente sin tabla de caracteres correcta.
El lector debe **detectar páginas ilegibles y saltarlas**, no atragantarse ni
tratar esa basura como contenido. Heurística simple: si una página tiene una
proporción anormal de secuencias sin vocales reconocibles, se descarta.

**Notas al pie pegadas a las cifras.** Aparecen así:

```
Amparo básico todo riesgo daño material1 $ 28.000.000.000
Manejo e infidelidad de empleados3$ 20.000.000
Equipos eléctricos y electrónicos2 $ 100.000.000
```

El dígito de la nota al pie queda pegado al nombre del amparo y a veces
directamente contra el `$`. Hay que limpiarlo antes de parsear, sin borrar
dígitos que sí formen parte del nombre.

**Palabras partidas.** Aparece `aut omática` en vez de `automática`. Los
patrones no pueden depender de que las palabras estén completas.

**Etiqueta y valor en la misma línea.** El texto sale como
`Fecha inicio vigencia 15/02/2026 desde las 16 HH Fecha fin vigencia
15/02/2027 hasta las 16 HH` — dos campos en un renglón. Hay que partir por
etiqueta conocida, no por salto de línea.

---

## 9. Vocabulario a reconocer

Sinónimos vistos o esperables para el mismo concepto:

| Concepto | Variantes |
|---|---|
| Deducible | deducible, franquicia, `Sin deducible` |
| Valor asegurado | valor asegurado, valor asegurable, suma asegurada, límite asegurado, valores asegurados |
| Amparo | amparo, cobertura, extensión adicional |
| Terremoto | terremoto, temblor, sismo, erupción volcánica, HAMCCOP y AMIT (siglas de amparos de eventos sociopolíticos que aparecen junto al bloque de deducibles y **no** deben confundirse con terremoto) |
| Mínimo | mínimo, mín., min |
| Unidad | SMMLV, SMDLV, SMLDV, SMLMV |

---

## 10. Prioridad sugerida

1. SMDLV vs SMMLV — es un error de 30x, va primero
2. Deducible sin mínimo — no inventar un mínimo que no existe
3. Tabla de deducibles por amparo, con terremoto destacado
4. Desglose de valores asegurados por ítem, incluidos los que están en $0
5. Detección y descarte de páginas con codificación rota
6. Código del clausulado en prosa
7. Plazo de aviso modificado en condiciones particulares
8. Demérito por uso y umbral de pérdida total
