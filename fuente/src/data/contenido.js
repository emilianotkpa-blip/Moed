/* ============================================================
   CONTENIDO DE LA PORTADA
   ------------------------------------------------------------
   Todo el texto y todas las fotos de la portada viven aqui, para
   cambiarlos sin tocar los componentes.

   FOTOS PROVISIONALES: son de Unsplash (licencia libre) mientras
   MOED entrega las de sus bodas. Las referencias que le gustaron
   (Touche, Creare) son 70 % fotografia propia: con las reales el
   sitio cambia mas que con cualquier ajuste de diseno.
   TESTIMONIOS: de ejemplo, marcados como tales en la pagina.
   ============================================================ */

const u = (id, w = 1600) => `https://images.unsplash.com/photo-${id}?w=${w}&q=78&auto=format&fit=crop`;

export const hero = {
  rotulo: 'Wedding planners · Valladolid, Yucatán',
  linea1: 'Bodas que se sienten',
  linea2: 'como ustedes',
  bajada: 'Diseñamos y coordinamos bodas destino en haciendas, cenotes y playas del sureste mexicano, para que ustedes solo vivan el día.',
  foto: u('1546032996-6dfacbacbf3f', 2400),
};

export const intro = {
  texto: 'Creemos que una boda no se organiza: se diseña. Cada detalle cuenta una parte de su historia, y nuestro trabajo es que todo encaje sin que tengan que pensar en nada más que en celebrar.',
  firma: 'MOËD · Wedding & Events',
  foto: u('1550005809-91ad75fb315f', 900),
  foto2: u('1606800052052-a08af7148866', 700),
};

export const servicios = [
  {
    nombre: 'Coordinación Integral',
    frase: 'De la primera idea al último baile',
    texto: 'Les acompañamos todo el camino: visión, venue, proveedores, diseño, presupuesto y la coordinación completa del gran día.',
    incluye: ['Sesión de visión y estética', 'Selección de venue y proveedores', 'Presupuesto y control de costos', 'Cronograma maestro'],
    foto: u('1523438885200-e635ba2c371e', 900),
  },
  {
    nombre: 'Boda Destino',
    frase: 'El sureste como escenario',
    texto: 'Para parejas que llegan de cualquier parte del mundo: hospedaje, trámites, welcome dinner y brunch, en español o en inglés.',
    incluye: ['Scouting de venues en el destino', 'Hospedaje para invitados', 'Trámites civiles y religiosos', 'Fin de semana completo'],
    foto: u('1537633552985-df8429e8048b', 900),
  },
  {
    nombre: 'Coordinación Personalizada',
    frase: 'El apoyo exacto que necesitan',
    texto: 'Si ya avanzaron en su planeación, entramos donde haga falta: desde revisar contratos hasta coordinar el día.',
    incluye: ['Diagnóstico sin costo', 'Plan modular a su medida', 'Revisión de proveedores', 'Coordinación del día'],
    foto: u('1520854221256-17451cc331bf', 900),
  },
];

export const destinos = [
  { nombre: 'Valladolid', nota: 'Conventos, cenotes y a 40 minutos de Chichén Itzá', foto: u('1518638150340-f706e86654de', 1400) },
  { nombre: 'Mérida', nota: 'Haciendas henequeneras y noches de luces cálidas', foto: u('1510076857177-7470076d4098', 1400) },
  { nombre: 'Riviera Maya', nota: 'Playas de arena blanca y atardeceres sobre el Caribe', foto: u('1519046904884-53103b34b206', 1400) },
  { nombre: 'Bacalar', nota: 'La laguna de los siete colores para bodas íntimas', foto: u('1505881502353-a1986add3762', 1400) },
];

export const momentos = [
  { nombre: 'Parejas', fotos: [u('1541250848049-b4f7141dca3f', 1000), u('1460978812857-470ed1c77af0', 800)] },
  { nombre: 'Ceremonia', fotos: [u('1469371670807-013ccf25f16a', 1000), u('1522673607200-164d1b6ce486', 800)] },
  { nombre: 'Recepción', fotos: [u('1527529482837-4698179dc6ce', 1000), u('1530023367847-a683933f4172', 800)] },
  { nombre: 'Detalles', fotos: [u('1525258946800-98cfd641d0de', 1000), u('1535254973040-607b474cb50d', 800)] },
];

export const marquesina = ['Haciendas', 'Cenotes', 'Conventos', 'Playas', 'Selva maya', 'Lagunas'];

export const proceso = [
  { cuando: '12 meses antes', titulo: 'Su visión', texto: 'Nos sentamos a escucharlos: estilo, invitados, presupuesto y lo que no quieren.' },
  { cuando: '9 meses antes', titulo: 'El escenario', texto: 'Recorremos venues con ustedes y reservamos a los proveedores clave.' },
  { cuando: '6 meses antes', titulo: 'El diseño', texto: 'Moodboard, flores, mobiliario y papelería: todo con una sola mirada.' },
  { cuando: 'El último mes', titulo: 'Cada minuto', texto: 'Armamos el minuto a minuto y lo confirmamos con cada proveedor.' },
  { cuando: 'El gran día', titulo: 'Ustedes, a vivirlo', texto: 'Nosotros nos encargamos de todo lo demás.' },
];

export const testimonios = [
  {
    pareja: ['Mariana', 'Andrés'],
    lugar: 'Hacienda en Mérida',
    texto: 'Desde la primera llamada sentimos que estábamos en buenas manos. El día de la boda no tuvimos que resolver nada: solo disfrutamos.',
    foto: u('1591604466107-ec97de577aff', 700),
  },
  {
    pareja: ['Emily', 'James'],
    lugar: 'Boda destino en Valladolid',
    texto: 'Planeamos todo desde Texas y nunca nos sentimos lejos. Nuestros invitados todavía hablan del welcome dinner.',
    foto: u('1583939003579-730e3918a45a', 700),
  },
  {
    pareja: ['Regina', 'Pablo'],
    lugar: 'Convento de San Bernardino',
    texto: 'Teníamos a nuestros proveedores, pero nos faltaba quien los dirigiera. Con MOËD todo salió a tiempo y con calma.',
    foto: u('1563808599481-34a342e44508', 700),
  },
];

export const contacto = {
  titulo: 'Empecemos a diseñar',
  cursiva: 'su boda',
  texto: 'Cuéntennos un poco de ustedes. Respondemos en menos de 24 horas, en español o en inglés.',
  foto: u('1473116763249-2faaef81ccda', 2000),
};
