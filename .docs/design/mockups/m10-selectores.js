/* 13 · Selectores de formulario (propuesta) — alternativas para elegir antes de cambiar el código.
   Casos: tipo de documento, subtipo («Orden de» / «Autorización para») y los selectores de la cita.
   Todo con piezas del kit y las reglas de pages/formularios.md §4. «A» es lo que hay hoy en la app. */
const S = mod('selectores', '13 · Selectores de formulario (propuesta)', 'Alternativas para las listas de los formularios: tipo y subtipo del documento, y especialidad y profesional de la cita. «A» es como está hoy en la app; «B» y «C» son propuestas dentro del sistema de diseño. Elegimos una por caso y la llevamos a formularios.md y al código.');

/* Piezas de este módulo */
const shTitle = t => `<div class="row"><div class="h2 grow" style="font-size:19px">${t}</div>${xbtn()}</div>`;
// Fila de lista simple (hoy): texto y ✓ en la elegida
const plainOpt = (t, on) => `<div class="row" style="min-height:48px;padding:0 12px;border-radius:12px;${on ? 'background:var(--b50);' : ''}"><span class="grow" style="font:${on ? 600 : 400} 15px Inter;color:${on ? 'var(--b7)' : 'var(--tx)'}">${t}</span>${on ? ic('check', 18, 'var(--b7)', 3) : ''}</div>`;
// Fila con ícono gris, ayuda corta y radio (ListRow + radio)
const iconOpt = (n, t, s, on) => `<div class="row" style="min-height:56px;padding:8px 10px;border-radius:14px;${on ? 'background:var(--b50);' : ''}">${tile('gray', n)}<div class="grow"><div class="t">${t}</div>${s ? `<div class="s">${s}</div>` : ''}</div>${radio(on)}</div>`;
// Tarjeta de opción (OptionCard): borde y canto azul cuando está elegida
const optCard = (tone, n, t, s, on, st = '') => `<div class="card tight" style="flex-direction:row;align-items:center;gap:12px;${on ? 'border-color:var(--b5);box-shadow:0 3px 0 var(--b5);background:var(--b50);' : ''}${st}">${tile(tone, n)}<div class="grow"><div class="t">${t}</div>${s ? `<div class="s">${s}</div>` : ''}</div>${radio(on)}</div>`;
// Chip de opción con ícono
const pickI = (n, t, on) => `<span class="pick ${on ? 'on' : ''}">${on ? '' : ic(n, 14, 'currentColor', 2.4)}${t}</span>`;
const docForm = (tipo, extra = '') => card(`<div class="h3">Datos del documento</div>${field('Título', { val: 'Orden resonancia de rodilla' })}${tipo}${extra}${field('Fecha (opcional)', { icon: 'calendar', val: 'Mar 24 nov' })}`);
const fileCard = card(`<div class="row">${tile('sky', 'fileText')}<div class="grow"><div class="t">orden_resonancia.pdf</div><div class="s">1,2 MB · máximo 25 MB</div></div><span class="link" style="font-size:13px">Cambiar</span></div>`);
const upload = (inner, over) => phone(`${mback('Subir archivo')}${fileCard}${inner}`, { bar: btn('Guardar documento', 'block'), over });

const TYPES = [
  ['fileText', 'Historia clínica', 'Resúmenes, epicrisis'],
  ['droplet', 'Examen de laboratorio', 'Sangre, orina y otros'],
  ['image', 'Imagen diagnóstica', 'Rayos X, ecografía, resonancia'],
  ['pill', 'Fórmula médica', 'Medicamentos recetados'],
  ['checkSquare', 'Orden médica', 'Para un examen, terapia o cita'],
  ['shield', 'Autorización EPS', 'Aprobación de tu EPS'],
  ['file', 'Otro documento', ''],
];
const SUB = [
  ['pk', 'calendar', 'Cita con especialista', 'Te acompañamos hasta la cita'],
  ['sky', 'activity', 'Examen', 'De la orden al resultado'],
  ['vi', 'heart', 'Terapia', 'Todas tus sesiones'],
  ['gray', 'activity', 'Procedimiento', ''],
];

/* ─ Caso 1 · Tipo de documento (7 opciones del servidor) ─ */
S.m('1A · Tipo · hoja con lista (hoy)',
  upload(docForm(select('Tipo', 'Orden médica')), sheet(`${shTitle('Tipo')}${search('Buscar')}<div class="col" style="gap:2px">${TYPES.map(([, t]) => plainOpt(t, t === 'Orden médica')).join('')}</div>`)),
  'Hoy: SelectField. Hoja con búsqueda y filas de solo texto; la elegida en azul con ✓. Sirve para listas largas, pero con 7 tipos la búsqueda sobra y las filas no ayudan a reconocer cada tipo.');

S.m('1B · Tipo · hoja con íconos y ayuda · elegida',
  upload(docForm(select('Tipo', 'Orden médica')), sheet(`${shTitle('Tipo de documento')}<div class="col" style="gap:4px">${TYPES.map(([n, t, s]) => iconOpt(n, t, s, t === 'Orden médica')).join('')}</div>`)),
  'v2.32 · Elegida. Mismo campo cerrado. La hoja muestra cada tipo con su ícono gris (MASTER v2.1: en menús y selectores, gris o azul) y una ayuda corta, con radio. Sin búsqueda: 7 opciones caben enteras. El campo cerrado puede mostrar el ícono del tipo elegido.');

S.m('1C · Tipo · chips en el formulario',
  upload(docForm(`<div class="lbl">Tipo</div><div class="row g8 wrap">${TYPES.map(([n, t]) => pickI(n, t, t === 'Orden médica')).join('')}</div>`)),
  'Sin hoja: formularios §4 pide chips para 3 a 8 opciones conocidas. Se ven todos los tipos de un vistazo y elegir es un toque. Contra: ocupa más alto (3 a 4 filas de chips) y, si el catálogo crece de 8, hay que volver al selector.');

/* ─ Caso 2 · Subtipo («Orden de», 4 opciones fijas, opcional) ─ */
S.m('2A · Subtipo · chips (hoy)',
  upload(docForm(select('Tipo', 'Orden médica'), `<div class="lbl">Orden de (opcional)</div><div class="row g8 wrap">${SUB.map(([, , t], i) => `<span class="pick ${i === 1 ? 'on' : ''}">${t}</span>`).join('')}</div>`)),
  'Hoy: ChoiceChips sin ícono; tocar el elegido lo desmarca. Cumple la regla, pero no dice qué pasa después: este dato decide qué misión sugerimos.');

S.m('2B · Subtipo · tarjetas de opción',
  upload(docForm(select('Tipo', 'Orden médica'), `<div class="lbl">Orden de (opcional)</div><div class="col" style="gap:8px">${SUB.map(([tone, n, t, s], i) => optCard(tone, n, t, s, i === 1)).join('')}</div>`)),
  'OptionCard («elección con explicación», formularios §4) con el ícono y el color del tipo de misión, igual que «Nueva misión» y la hoja «¿Te acompañamos con esto?». Anticipa la misión que vamos a sugerir. Contra: el formulario crece unos 260 px.');

S.m('2C · Subtipo · chips con ícono · elegida',
  upload(docForm(select('Tipo', 'Orden médica'), `<div class="lbl">Orden de (opcional)</div><div class="row g8 wrap">${SUB.map(([, n, t], i) => pickI(n, t, i === 1)).join('')}</div><div class="s">Con esto te sugerimos la misión correcta.</div>`)),
  'v2.32 · Elegida. Punto medio: los mismos chips de hoy con el ícono del tipo de misión (gris; el elegido en azul con ✓) y una ayuda persistente debajo. Ocupa lo mismo que hoy.');

/* ─ Caso 3 · Cita: Especialidad y Profesional (listas del servidor) ─ */
const SPEC = ['Cardiología', 'Dermatología', 'Laboratorio', 'Medicina general', 'Neurología', 'Nutrición', 'Odontología'];

S.m('3A · Especialidad · hoja con lista (hoy)',
  phone(`${mback('Nueva cita')}${card(`<div class="h3">Profesional</div>${select('Especialidad', '', 'Seleccionar especialidad')}${select('Profesional de salud', '', 'Seleccionar profesional')}`)}`, { bar: btn('Guardar cita', 'block'), over: sheet(`${shTitle('Especialidad')}${search('Buscar')}<div class="col" style="gap:2px">${SPEC.map(t => plainOpt(t, false)).join('')}</div>`) }),
  'Hoy: la misma hoja de solo texto. Para especialidades (lista larga) la búsqueda sí sirve.');

S.m('3B · Especialidad · recientes arriba',
  phone(`${mback('Nueva cita')}${card(`<div class="h3">Profesional</div>${select('Especialidad', '', 'Seleccionar especialidad')}${select('Profesional de salud', '', 'Seleccionar profesional')}`)}`, { bar: btn('Guardar cita', 'block'), over: sheet(`${shTitle('Especialidad')}${search('Buscar especialidad')}<div class="ey" style="color:var(--tx2)">USADAS EN TUS CITAS</div><div class="row g8 wrap">${['Odontología', 'Cardiología'].map(t => `<span class="pick">${t}</span>`).join('')}</div><div class="ey" style="color:var(--tx2)">TODAS</div><div class="col" style="gap:2px">${SPEC.slice(0, 5).map(t => plainOpt(t, false)).join('')}</div>`) }),
  'Selector con atajo: arriba, como chips, las especialidades que ya usaste; abajo, la lista completa con búsqueda. La mayoría de las citas repite especialidad.');

const citaBase = (esp = '') => `${mback('Nueva cita')}${card(`<div class="h3">Profesional</div>${select('Especialidad', esp, 'Seleccionar especialidad')}${select('Profesional de salud', '', 'Seleccionar profesional')}`)}`;
const eyb = t => `<div class="ey" style="color:var(--tx2)">${t}</div>`;
// Tarjeta compacta de una especialidad usada: ícono, nombre y la última cita
const recentCard = (t, s, n) => `<div class="card tight" style="flex:1;gap:8px;padding:12px">${tile('gray', 'stetho')}<div><div class="t">${t}</div><div class="s">${s}</div></div><div class="s" style="font-weight:600;color:var(--tx3)">${n}</div></div>`;

S.m('3B2 · Especialidad · recientes con contexto',
  phone(citaBase(), { bar: btn('Guardar cita', 'block'), over: sheet(`${shTitle('Especialidad')}${search('Buscar especialidad')}${eyb('USADAS EN TUS CITAS')}<div class="row g10" style="align-items:stretch">${recentCard('Odontología', 'Dra. Ruiz · 3 dic', '2 citas')}${recentCard('Cardiología', 'Dr. Pardo · 26 nov', '1 cita')}</div>${eyb('TODAS')}<div class="col" style="gap:2px">${SPEC.slice(0, 4).map(t => iconOpt('stetho', t, '', false)).join('')}</div>`) }),
  'La 3B con más información: cada especialidad usada es una tarjeta con la última cita (profesional y fecha) y cuántas llevas. La lista completa usa filas con ícono y radio, como 1B, para que todos los selectores se vean iguales.');

S.m('3B3 · Especialidad · repetir con tu profesional · elegida',
  phone(citaBase(), { bar: btn('Guardar cita', 'block'), over: sheet(`${shTitle('Especialidad')}${search('Buscar especialidad')}${eyb('REPETIR UNA CITA')}<div class="col" style="gap:8px">${[['DR', 'Odontología', 'Con Dra. Ruiz · última el 3 dic'], ['LP', 'Cardiología', 'Con Dr. Pardo · última el 26 nov']].map(([ini, t, s]) => `<div class="card tight" style="flex-direction:row;align-items:center;gap:12px">${avatar(40, ini, 'var(--color-text-muted)')}<div class="grow"><div class="t">${t}</div><div class="s">${s}</div></div>${ic('chevR', 18, 'var(--color-text-muted)')}</div>`).join('')}</div>${eyb('TODAS LAS ESPECIALIDADES')}<div class="col" style="gap:2px">${SPEC.slice(0, 3).map(t => iconOpt('stetho', t, '', false)).join('')}</div>`) }),
  'v2.32 · Elegida. Un paso más: lo reciente es la pareja especialidad + profesional. Un toque llena los dos campos (la mayoría de los controles se repiten con el mismo médico). Si quiere otra, elige abajo como siempre y después el profesional.');

S.m('3C · Profesional · selector con creación · elegida',
  phone(`${mback('Nueva cita')}${card(`<div class="h3">Profesional</div>${select('Especialidad', 'Odontología')}${select('Profesional de salud', '', 'Seleccionar profesional')}`)}`, { bar: btn('Guardar cita', 'block'), over: sheet(`${shTitle('Profesional de salud')}${search('Buscar por nombre')}<div class="row" style="min-height:52px;padding:0 10px;border-radius:14px;color:var(--b7)">${ic('plus', 20, 'currentColor', 2.6)}<span class="grow" style="font:800 15px Nunito">Agregar nuevo profesional</span></div><div class="col" style="gap:4px">${[['DR', 'Dra. Ruiz', 'Odontología', true], ['JM', 'Dr. Mejía', 'Odontología', false], ['LP', 'Dr. Pardo', 'Cardiología', false]].map(([ini, t, s, on]) => `<div class="row" style="min-height:56px;padding:8px 10px;border-radius:14px;${on ? 'background:var(--b50);' : ''}">${avatar(40, ini, 'var(--color-text-muted)')}<div class="grow"><div class="t">${t}</div><div class="s">${s}</div></div>${radio(on)}</div>`).join('')}</div>`) }),
  'v2.32 · Elegida. formularios §4 «Selector con creación»: «+ Agregar nuevo profesional» va primero dentro de la hoja (hoy es un enlace suelto en el formulario). Cada profesional con sus iniciales y su especialidad; los de la especialidad elegida, arriba.');
