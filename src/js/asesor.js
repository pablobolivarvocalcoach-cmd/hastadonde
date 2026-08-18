/* ASESOR — configuración del intermediario y contenido que reduce llamadas.
   Este módulo existe porque la herramienta NO es para que el cliente audite
   a su asesor: es para que llegue resuelto y con la carpeta lista.
   Hasta Dónde  ·  licencia MIT  */

/* Edita este bloque con tus datos. Si `mostrar` es false, la página queda
   genérica y sin marca. El WhatsApp va en formato internacional sin signos. */
const ASESOR = {
  mostrar: true,
  nombre: 'Pablo David Bolívar',
  // Si no tienes razón social, deja el descriptor de tu rol. Puede ir vacío.
  empresa: 'Asesor de seguros',
  whatsapp: '573105007749',        // indicativo + celular, sin espacios ni +
  correo: 'pablodavidbolivar@hotmail.com',
  // Frase que ve el cliente antes de enviar su pre-diagnóstico.
  invitacion: 'Cuando tengas la carpeta lista, mándamela por aquí y yo radico la reclamación.'
};

/* Documentos que hay que reunir. Es lo que de verdad destraba una
   reclamación: el 90% de las llamadas al asesor son por un papel faltante. */
const DOCUMENTOS = {
  comun: [
    'Cédula del titular de la póliza, por ambas caras',
    'Fotos y video del daño con fecha visible, desde varios ángulos',
    'Fotos del bien completo, no solo del detalle dañado',
    'Número de la póliza (está en la carátula, primera hoja)'
  ],
  ph: [
    'Certificado de existencia y representación de la copropiedad',
    'Acta de nombramiento del administrador vigente',
    'Registro fotográfico de cada área común afectada, identificada',
    'Dos cotizaciones de reparación, en lo posible',
    'Informe del ingeniero estructural, si ya lo hicieron',
    'Certificado de afectación del Consejo Municipal de Gestión del Riesgo'
  ],
  pyme: [
    'RUT y certificado de cámara de comercio',
    'Facturas de compra de la maquinaria o equipos afectados',
    'Kardex o inventario a la fecha del sismo',
    'Cotizaciones de reparación o reposición',
    'Contrato de arrendamiento, si el local es arrendado',
    'Si hay lucro cesante: estados de resultados, declaraciones de renta e IVA y facturación de los 12 meses anteriores'
  ],
  auto: [
    'Tarjeta de propiedad del vehículo',
    'Licencia de conducción de quien lo manejaba',
    'SOAT y revisión tecnomecánica vigentes',
    'Fotos en el sitio, antes de mover el vehículo',
    'Informe de tránsito o croquis, si hubo terceros',
    'Cotización del taller'
  ],
  hogar: [
    'Certificado de tradición, escritura o promesa de compraventa',
    'Recibo de servicio público reciente como prueba de dirección',
    'Inventario de contenidos, con facturas o fotos anteriores si existen',
    'Cotizaciones de reparación',
    'Certificado de afectación de la alcaldía, si la vivienda quedó inhabitable',
    'Si el seguro viene del crédito: número de obligación y certificación de saldo'
  ]
};

/* Qué va a pasar y quién lo hace. Existe para bajar la ansiedad y evitar
   la llamada de "¿ya hay noticias?". No prometas tiempos que no controlas. */
const PROCESO = [
  ['Tú', 'Reúnes la carpeta de arriba',
   'Es el único paso que depende de ti y es el que más demora todo el proceso cuando queda incompleto.'],
  ['Tu asesor', 'Radica el aviso y la reclamación',
   'No tienes que hablar con la aseguradora ni entender el trámite. Para eso está el intermediario: él arma el expediente y lo presenta.'],
  ['La aseguradora', 'Asigna un ajustador y programa visita',
   'Por el volumen de la emergencia los tiempos se alargaron. Es normal y le está pasando a todo el mundo; no significa que tu caso esté detenido.'],
  ['El ajustador', 'Valora el daño en sitio',
   'Su cifra puede no coincidir con la tuya. También es normal: se sustenta con cotizaciones y soportes, y ahí es donde tu asesor pelea el número.'],
  ['La aseguradora', 'Paga dentro del mes siguiente a la reclamación acreditada',
   'El mes corre desde que el expediente está completo, no desde el día del sismo. Por eso importa tanto la carpeta.'],
  ['Tu asesor', 'Te avisa cuando haya novedad',
   'No necesitas hacer seguimiento diario. Si algo se traba o falta un documento, te van a buscar a ti.']
];

export { ASESOR, DOCUMENTOS, PROCESO };
