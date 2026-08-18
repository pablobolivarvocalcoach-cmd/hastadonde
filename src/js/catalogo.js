/* CATÁLOGO DE RAMOS — aquí se nutre el conocimiento de coberturas.
   Hasta Dónde — https://github.com/  ·  licencia MIT  */

import { CONFIG, cop } from './config.js';

const NUM = (l1,l2,l3,p1,p2,p3) => ({
  tipo:'campos', preg:'Los tres números que lo deciden todo',
  ayuda:'Están en la carátula de tu póliza (primera hoja). Si no los tienes a la mano, pon un estimado: después los ajustas.',
  campos:[
    {k:'valorAsegurado', l:l1, pista:p1},
    {k:'valorReal',      l:l2, pista:p2},
    {k:'perdida',        l:l3, pista:p3}
  ]
});

const PASO_DEDUCIBLE = {
  tipo:'campos', preg:'El deducible de terremoto',
  ayuda:'Búscalo en la carátula bajo “deducibles”. Suele decir algo como “2% del valor asegurable del ítem afectado, mínimo 3 SMMLV”. Si no lo tienes, dilo: preferimos darte un rango honesto antes que un número inventado.',
  campos:[
    {k:'dedConocido', l:'¿Tienes el deducible a la vista?', tipo:'select',
     ops:[['si','Sí, lo estoy leyendo en la carátula'],['no','No lo encuentro o no lo sé']],
     pista:'Si respondes que no, te mostramos un rango en vez de una cifra falsa.'},
    {k:'baseDeducible', l:'Se calcula sobre', tipo:'select',
     ops:[['valorAsegurado','El valor asegurado del bien (lo más común)'],['perdida','El valor de la pérdida']],
     pista:'Esta sola línea puede cambiar tu indemnización en decenas de millones.'},
    {k:'dedPct', l:'Porcentaje (%)', def:2, paso:0.25, pista:'Terremoto en PH y PYME suele ir entre 1% y 3%.'},
    {k:'dedMinSMMLV', l:'Mínimo en SMMLV', def:3, paso:1, pista:`1 SMMLV 2026 = ${cop(CONFIG.SMMLV)}. Se aplica el que resulte mayor: el % o el mínimo.`}
  ]
};

const RAMOS = {
  ph: {
    nombre:'Copropiedad / PH', icono:'Edificio',
    intro:'Ley 675 de 2001: toda copropiedad debe asegurar los bienes comunes contra incendio y terremoto. Tu apartamento por dentro es otro cuento.',
    pasos:[
      {tipo:'opciones', preg:'¿Desde dónde estás mirando esto?',
       ayuda:'Cambia quién reclama y ante quién.',
       k:'rol', ops:[
        ['admin','Administrador o consejo','Manejo la póliza de áreas comunes'],
        ['prop','Propietario','Vivo o soy dueño de una unidad'],
        ['arr','Arrendatario','Vivo arrendado en el conjunto']]},
      {tipo:'opciones', preg:'¿Qué quedó afectado?',
       ayuda:'Áreas comunes = fachada, cubierta, muros estructurales, ascensores, tanques, parqueaderos, portería. Área privada = todo lo que hay puertas adentro.',
       k:'que', ops:[
        ['comun','Áreas comunes','Fachada, cubierta, ascensor, estructura'],
        ['privado','Solo mi unidad','Muros internos, acabados, mis cosas'],
        ['ambos','Las dos','Daño en común y en privado'],
        ['nose','Todavía no sé','Aún no hay peritaje']]},
      {tipo:'opciones', preg:'La póliza de áreas comunes, ¿tiene amparo de terremoto activo?',
       ayuda:'Ojo: tener póliza no es lo mismo que tener terremoto amparado. Búscalo en la carátula bajo “amparos” o “coberturas otorgadas”.',
       k:'amparo', ops:[
        ['si','Sí, terremoto está amparado','Lo confirmé en la carátula'],
        ['no','No lo tiene','Solo incendio u otros'],
        ['nose','No lo sé','Nadie me lo ha dicho']]},
      NUM('Valor asegurado del edificio','Costo real de reconstruirlo hoy','Pérdida estimada por el sismo',
          'El que figura en la carátula para bienes comunes.',
          'Si no lo sabes, usa el avalúo más reciente. Si está desactualizado, ya tienes infraseguro.',
          'Estimado de reparación. Ajústalo cuando llegue el perito.'),
      PASO_DEDUCIBLE,
      {tipo:'multi', preg:'¿Qué más aparece en tu carátula?',
       ayuda:'Marca todo lo que reconozcas. Estos amparos suelen estar y casi nadie los reclama.',
       k:'extras', ops:[
        ['escombros','Remoción de escombros','Sublímite propio, suele ser 5%–10%'],
        ['arriendo','Arrendamiento / gastos extraordinarios','Paga tu alojamiento mientras reparan'],
        ['rc','Responsabilidad civil extracontractual','Si algo del edificio dañó a un tercero'],
        ['honorarios','Honorarios profesionales','Arquitecto, ingeniero, licencias'],
        ['maquinaria','Rotura de maquinaria / ascensores','Equipos comunes'],
        ['ninguno','Ninguno / no sé','']]}
    ],
    reglas: d => {
      const s=[];
      if (d.que==='privado') s.push(['no','SOLO PRIVADO','La póliza de áreas comunes no cubre el interior de tu apartamento','Necesitas tu propia póliza de hogar con amparo de terremoto, o la del banco si tienes hipoteca. Reclama por ahí, no por la administración.']);
      if (d.que==='comun'||d.que==='ambos') s.push(['si','ÁREAS COMUNES','Reclama a través de la administración','La copropiedad es la tomadora de la póliza, así que la reclamación la presenta la administración, no cada propietario por separado. Tu parte es reportarle el daño que viste, con fotos.']);
      if (d.amparo==='no') s.push(['no','SIN AMPARO','Sin terremoto amparado no hay indemnización por sismo','La Ley 675 de 2001 obliga a asegurar los bienes comunes contra incendio y terremoto, así que es un tema para la próxima asamblea. Para este siniestro, el camino son las ayudas oficiales: registra la afectación en tu alcaldía.']);
      if (d.amparo==='nose') s.push(['ojo','POR CONFIRMAR','Confirma hoy mismo si terremoto está amparado','Sin ese dato el cálculo de arriba es solo una referencia. La administración tiene la carátula y tu asesor puede verificarlo en un minuto.']);
      if (d.rol==='arr') s.push(['ojo','ARRENDATARIO','El edificio no es tuyo, tus cosas sí','La póliza de la copropiedad cubre el inmueble común, no tus muebles ni electrodomésticos. Eso va en un contenido de hogar a tu nombre.']);
      s.push(['ojo','DESTINO DE LA PLATA','La indemnización va primero a reconstruir','En propiedad horizontal la indemnización se destina en primer término a reconstruir el edificio; solo si eso no ocurre se reparte entre propietarios según coeficiente de copropiedad.']);
      if (d.extras&&d.extras.includes('escombros')) s.push(['si','ESCOMBROS','Tienes remoción de escombros','Se reclama aparte y tiene su propio sublímite. Guarda facturas de volquetas, cuadrillas y disposición.']);
      if (d.extras&&d.extras.includes('arriendo')) s.push(['si','ARRIENDO','Tienes gastos de alojamiento','Si el edificio quedó inhabitable, la póliza puede pagar arriendo temporal. Guarda contrato y recibos desde el día uno.']);
      return s;
    }
  },

  pyme: {
    nombre:'PYME / Comercio', icono:'Negocio',
    intro:'Aquí lo que suele doler no es el local: es el mes que el negocio estuvo cerrado. Y ese amparo casi nadie lo contrata.',
    pasos:[
      {tipo:'opciones', preg:'¿Qué se dañó en el negocio?',
       ayuda:'Cada uno es un ítem distinto en la póliza, con su propio valor asegurado y su propio deducible.',
       k:'que', ops:[
        ['edificio','El local o la bodega','Estructura, techos, muros'],
        ['maquinaria','Maquinaria y equipos','Producción, cómputo, refrigeración'],
        ['mercancia','Mercancía e inventario','Producto terminado, materia prima'],
        ['todo','Varias cosas','Combinado']]},
      {tipo:'opciones', preg:'¿El local es propio o arrendado?',
       ayuda:'Si es arrendado, el edificio lo asegura el dueño; tú aseguras mejoras, contenidos y tu operación.',
       k:'tenencia', ops:[
        ['propio','Propio',''],
        ['arrendado','Arrendado',''],
        ['nose','No estoy seguro','']]},
      {tipo:'opciones', preg:'¿Tienes amparo de lucro cesante o pérdida de beneficio bruto?',
       ayuda:'Es el amparo que te paga la utilidad y los gastos fijos mientras el negocio no factura. Es el más valioso después de un sismo y el más olvidado.',
       k:'lucro', ops:[
        ['si','Sí lo tengo','Aparece en la carátula'],
        ['no','No lo tengo',''],
        ['nose','No sé qué es eso','Te lo explicamos en el reporte']]},
      NUM('Valor asegurado del ítem afectado','Cuánto cuesta reponerlo hoy','Pérdida estimada',
          'Búscalo por ítem, no el total de la póliza.',
          'A precio de hoy, no lo que pagaste hace 6 años.',
          'Incluye reparación y reposición.'),
      PASO_DEDUCIBLE,
      {tipo:'multi', preg:'¿Qué más tiene tu multirriesgo?',
       ayuda:'Marca lo que reconozcas en la carátula.',
       k:'extras', ops:[
        ['escombros','Remoción de escombros',''],
        ['gastosextra','Gastos extraordinarios','Alquilar un local provisional, horas extra'],
        ['rc','Responsabilidad civil','Daños a terceros o vecinos'],
        ['transito','Bienes en tránsito',''],
        ['equipoelec','Equipo electrónico',''],
        ['ninguno','Ninguno / no sé','']]}
    ],
    reglas: d => {
      const s=[];
      if (d.lucro==='no'||d.lucro==='nose') s.push(['no','LUCRO CESANTE','No tienes cubierto el negocio parado','Te pagan reparar el local, pero no los meses sin facturar ni la nómina que igual debes pagar. Para muchas PYMEs esa es la pérdida más grande. Cotízalo en la renovación.']);
      else s.push(['si','LUCRO CESANTE','Tienes cubierto el negocio parado','Reúne ya: declaraciones de renta, IVA, estados de resultados y facturación de los 12 meses previos. Sin eso no se puede probar la cuantía.']);
      if (d.tenencia==='arrendado'&&d.que==='edificio') s.push(['ojo','EDIFICIO AJENO','El local no es tuyo','El daño estructural lo reclama el propietario con su póliza. Lo tuyo son mejoras locativas, contenidos y lucro cesante. Revisa qué dice el contrato de arrendamiento sobre fuerza mayor.']);
      if (d.que==='mercancia'||d.que==='todo') s.push(['ojo','INVENTARIO','Prueba la existencia y el valor','Kardex, facturas de compra, conteos, fotos y video con fecha. La aseguradora paga lo que puedas demostrar que había.']);
      if (d.extras&&d.extras.includes('gastosextra')) s.push(['si','GASTOS EXTRAORDINARIOS','Puedes reabrir en otro lado y cobrarlo','Cubre el sobrecosto de operar provisionalmente. Importante: tiene que autorizarse antes de gastar, así que avisa qué piensas hacer antes de firmar el arriendo del local temporal.']);
      s.push(['ojo','NO BOTES NADA','Conserva los bienes dañados','Salvo riesgo para las personas, no botes ni repares definitivamente antes del ajustador. Fotografía y video todo con fecha visible.']);
      return s;
    }
  },

  auto: {
    nombre:'Automóviles', icono:'Vehículo',
    intro:'El SOAT nunca cubre tu carro: cubre personas lesionadas. Si un muro le cayó encima, esto depende solo de tu todo riesgo.',
    pasos:[
      {tipo:'opciones', preg:'¿Qué tienes contratado?',
       ayuda:'Es la pregunta que define si hay algo que reclamar.',
       k:'tipo', ops:[
        ['todoriesgo','Todo riesgo','Con daños propios'],
        ['rc','Solo responsabilidad civil','Cubre a terceros, no a mí'],
        ['soat','Solo SOAT','Obligatorio, solo personas'],
        ['nose','No estoy seguro','']]},
      {tipo:'opciones', preg:'¿Cómo se dañó el vehículo?',
       ayuda:'Sirve para saber bajo qué amparo entra la reclamación.',
       k:'como', ops:[
        ['cayo','Le cayó algo encima','Muro, techo, poste, escombros'],
        ['choque','Choque durante la emergencia','Evacuación, semáforos caídos'],
        ['total','Quedó destruido','Pérdida total'],
        ['sepulto','Quedó atrapado o sepultado','Parqueadero colapsado']]},
      {tipo:'opciones', preg:'¿Cómo está asegurado el valor?',
       ayuda:'Mira la carátula: dice “valor comercial” o un valor fijo pactado.',
       k:'modo', ops:[
        ['comercial','A valor comercial','Se paga según guía Fasecolda al día del siniestro'],
        ['fijo','A valor fijo pactado',''],
        ['nose','No sé','']]},
      NUM('Valor asegurado del vehículo','Valor comercial hoy (guía Fasecolda)','Costo estimado del daño',
          'El de la carátula.',
          'Si el asegurado es menor al comercial, hay infraseguro.',
          'Cotización del taller o estimado.'),
      PASO_DEDUCIBLE,
      {tipo:'multi', preg:'¿Qué más incluye tu póliza?',
       k:'extras', ayuda:'Marca lo que reconozcas.',
       ops:[
        ['grua','Grúa y asistencia',''],
        ['carroreemplazo','Carro de reemplazo',''],
        ['perdidatotal','Pérdida total sin deducible','Algunas pólizas lo traen'],
        ['accesorios','Accesorios declarados',''],
        ['ninguno','Ninguno / no sé','']]}
    ],
    reglas: d => {
      const s=[];
      if (d.tipo==='soat') s.push(['no','SOAT','El SOAT no repara tu carro','El SOAT solo cubre atención médica, incapacidad, muerte y gastos funerarios de personas lesionadas en un accidente de tránsito. Los daños al vehículo no entran, nunca.']);
      if (d.tipo==='rc') s.push(['no','SOLO RC','La RC cubre a los demás, no a ti','Responsabilidad civil paga el daño que tú causas a un tercero. Tu propio vehículo queda por fuera.']);
      if (d.tipo==='todoriesgo') s.push(['si','TODO RIESGO','Aquí sí puede haber reclamación','Los daños por eventos de la naturaleza suelen entrar en el amparo de daños parciales o pérdida total. Confirma que “terremoto, temblor o erupción” no esté en exclusiones.']);
      if (d.como==='total'||d.como==='sepulto') s.push(['ojo','PÉRDIDA TOTAL','Revisa el umbral de tu póliza','Casi todas declaran pérdida total cuando la reparación supera un porcentaje del valor asegurado (con frecuencia 75%). Ojo con el salvamento: si te quedas con los restos, te descuentan su valor.']);
      if (d.modo==='comercial') s.push(['ojo','VALOR COMERCIAL','Te pagan el valor de hoy, no el de compra','La aseguradora usa la guía de valores de referencia vigente al día del siniestro, no el precio que pagaste. Si el valor que aplican parece bajo, se sustenta con avisos de venta comparables del mismo modelo y año.']);
      if (d.extras&&d.extras.includes('accesorios')) s.push(['ojo','ACCESORIOS','Solo pagan los declarados','Rines, sonido, blindaje o carpas solo se indemnizan si están declarados y valorados en la póliza.']);
      s.push(['ojo','DENUNCIA Y FOTOS','Documenta el lugar','Fotos del vehículo y de lo que lo dañó, en el sitio, antes de moverlo. Si hubo terceros, informe de tránsito.']);
      return s;
    }
  },

  hogar: {
    nombre:'Hogar', icono:'Vivienda',
    intro:'Si tu casa tiene hipoteca, casi seguro tienes un seguro de incendio y terremoto exigido por el banco. Ese seguro protege primero al banco.',
    pasos:[
      {tipo:'opciones', preg:'¿Cómo llegaste a tu seguro?',
       ayuda:'Cambia por completo qué está cubierto y quién cobra.',
       k:'origen', ops:[
        ['banco','Viene con el crédito hipotecario','Lo cobra el banco en la cuota'],
        ['voluntario','Lo contraté yo aparte',''],
        ['ambos','Tengo los dos',''],
        ['ninguno','No tengo seguro','']]},
      {tipo:'opciones', preg:'¿Qué se dañó?',
       ayuda:'Estructura y contenidos son dos bolsillos distintos, con valores y deducibles distintos.',
       k:'que', ops:[
        ['estructura','La construcción','Muros, techo, columnas, pisos'],
        ['contenido','Mis cosas','Muebles, electrodomésticos, ropa'],
        ['ambos','Las dos',''],
        ['inhabitable','Quedó inhabitable','No puedo vivir ahí']]},
      {tipo:'opciones', preg:'¿El amparo de terremoto está activo?',
       ayuda:'Búscalo textualmente en la carátula: “terremoto, temblor, erupción volcánica”.',
       k:'amparo', ops:[
        ['si','Sí',''],
        ['no','No',''],
        ['nose','No sé','']]},
      NUM('Valor asegurado','Costo de reconstrucción hoy','Pérdida estimada',
          'Si es del banco, a veces es solo el saldo de la deuda: eso es infraseguro puro.',
          'Cuánto cuesta reconstruir, sin contar el lote.',
          'Estimado de reparación.'),
      PASO_DEDUCIBLE,
      {tipo:'multi', preg:'¿Qué más aparece?',
       k:'extras', ayuda:'Marca lo que reconozcas.',
       ops:[
        ['arriendo','Arrendamiento mientras reparan',''],
        ['contenidos','Contenidos asegurados aparte',''],
        ['escombros','Remoción de escombros',''],
        ['rc','Responsabilidad civil familiar',''],
        ['ninguno','Ninguno / no sé','']]}
    ],
    reglas: d => {
      const s=[];
      if (d.origen==='banco') s.push(['ojo','SEGURO DEL BANCO','Protege primero la deuda, no tu patrimonio','El seguro asociado al crédito hipotecario suele cubrir solo la estructura y con frecuencia por el saldo de la deuda, no por el costo real de reconstruir. Tus muebles y electrodomésticos casi nunca están incluidos. La carátula la tiene el banco y te la deben entregar cuando la pidas.']);
      if (d.origen==='banco') s.push(['ojo','LA CUOTA SIGUE','El daño no borra el crédito','Aunque la casa esté afectada, la obligación con el banco sigue viva: son dos cosas separadas. Varios bancos abrieron periodos de gracia por la emergencia y se solicitan directamente en la entidad, no por la póliza.']);
      if (d.origen==='ninguno') s.push(['no','SIN PÓLIZA','No hay reclamación posible','Concéntrate en el censo de damnificados y las ayudas oficiales. Radica tu caso en el Consejo Municipal de Gestión del Riesgo de tu alcaldía para el certificado de afectación.']);
      if (d.que==='contenido'&&d.origen==='banco') s.push(['no','CONTENIDOS','Tus cosas probablemente no están cubiertas','El seguro hipotecario típico no incluye contenidos. Verifícalo antes de armar el inventario de reclamación.']);
      if (d.que==='inhabitable') s.push(['ojo','INHABITABLE','Puede haber amparo de arriendo','Muchas pólizas pagan alojamiento temporal. Guarda contrato y recibos desde hoy. Además tramita el certificado de afectación en tu alcaldía.']);
      if (d.amparo==='nose') s.push(['ojo','POR CONFIRMAR','Es el dato que falta para cerrar el cálculo','Sin saber si terremoto está amparado, las cifras de arriba son solo una referencia. Es lo primero que se verifica en la carátula.']);
      return s;
    }
  }
};

export { RAMOS, NUM, PASO_DEDUCIBLE };
