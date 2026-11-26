/* 14 · Acciones al deslizar (propuesta, issue #127) — alternativas para elegir antes de cambiar MASTER y el código.
   Reemplaza el «⋮» de las tarjetas de lista en móvil: deslizar a la izquierda muestra la acción principal y «Más»;
   «Más» abre una hoja con todas las acciones (lo destructivo al final, como enlace rojo, MASTER §7).
   Deslizar a la derecha solo donde hay una acción positiva clara. Web conserva el «⋮».
   Estilo elegido: 1A, paneles sólidos a toda la altura como la lista de chats de iOS. Animación y háptica en
   ../system/movimiento.html, sección «Acciones al deslizar». */
{
const SW = mod('deslizar', '14 · Acciones al deslizar (propuesta)', 'Issue #127. Las tarjetas de lista en móvil (cita, medicamento, documento, mochila) dejan el «⋮» y muestran sus acciones al deslizar, con paneles de color a toda la altura como en la lista de chats de iOS: a la izquierda, la acción principal y «Más»; «Más» abre una hoja con todas las acciones y lo destructivo al final, como enlace rojo. A la derecha, solo una acción positiva clara. Estilo elegido: 1A, paneles sólidos como en iOS. Si se sigue deslizando, se aplica la acción del extremo (con háptica al mostrar las acciones y al pasar el umbral; ver movimiento.html). Se muestran las hojas «Más» de cada tarjeta y dos formas de descubrir el gesto. Accesibilidad: las mismas acciones como acciones de VoiceOver de la tarjeta. Web conserva el «⋮».');

/* Al abrirse, en las variantes «de una pieza» la tarjeta pierde las esquinas del lado de los paneles */
document.head.insertAdjacentHTML('beforeend', '<style>.swp-r>.card{border-top-right-radius:0;border-bottom-right-radius:0;border-right:0}.swp-l>.card{border-top-left-radius:0;border-bottom-left-radius:0;border-left:0}</style>');

/* ── Contenido de las tarjetas (sin «⋮») ── */
const apptC = (n, s, d, m = 'Presencial') => card(`<div class="row">${tile('pk', 'calendar')}<div class="grow"><div class="t">${n}</div><div class="s">${s}</div></div></div><div class="row g8 wrap">${chip(d, 'gray', ic('clock', 12))}${chip(m, 'gray')}</div>`, 'tight');
const medC = (n, s, p, next, act = btn('Tomar', 'ok sm', ic('check', 14, '#fff', 3))) => card(`<div class="row">${tile('am', 'pill')}<div class="grow"><div class="t">${n}</div><div class="s">${s}</div></div>${act}</div>${bar(p, 'var(--color-success-graphic)', 'var(--color-border)', 8)}<div class="row between"><span class="s">${next}</span><span class="s">${Math.round(p * 30)} de 30 días</span></div>`, 'tight');
const docC = (n, ty, d) => card(`<div class="row">${tile('sky', 'fileText')}<div class="grow"><div class="t clamp2">${n}</div><div class="s">${d} · ${ty}</div></div></div>`, 'tight');
const bpC = (n, d, c) => card(`<div class="row">${tile('teal', 'backpack')}<div class="grow"><div class="t">${n}</div><div class="s ell">${d}</div></div></div><div class="row g6 wrap">${chip(c, 'gray', ic('file', 12))}</div>`, 'tight');

const A1 = apptC('Control de odontología', 'Dra. Ruiz · Clínica Central', 'Mar 2 dic · 10:00 a. m.');
const A2 = apptC('Resonancia de rodilla', 'Examen · Clínica Central', 'Vie 4 dic · 7:30 a. m.');
const A3 = apptC('Terapia física', 'Sesión 5 de 10 · Centro Movimiento', 'Lun 7 dic · 4:00 p. m.');
const M1 = medC('Metformina 850 mg', 'Tableta · cada 12 horas', .4, 'Próxima toma: hoy 1:00 p. m.');
const M2 = medC('Losartán 50 mg', 'Tableta · cada 24 horas', .47, 'Próxima toma: mañana 7:00 a. m.', chip('Tomado', 'gr', ic('check', 12, 'currentColor', 3)));
const M3 = medC('Ibuprofeno 400 mg', 'Tableta · cada 8 horas', .2, 'Próxima toma: hoy 3:00 p. m.');
const D1c = docC('Orden resonancia de rodilla', 'Orden médica', '24 nov');
const B1c = bpC('Cita de ortopedia', 'Para el viernes con el Dr. Mejía', '4 documentos');

/* «Más» se dibuja como «⋯» horizontal (el ícono del kit es vertical) */
const icx = (n, z, c, w) => n === 'more' ? `<span style="display:inline-grid;transform:rotate(90deg)">${ic(n, z, c, w)}</span>` : ic(n, z, c, w);

/* ── Colores de los paneles: { bg, fg, edge } ── */
const C = {
  brand: { bg: 'var(--color-brand-solid)', fg: '#fff', edge: 'var(--color-brand-edge)' },
  more: { bg: 'var(--primitive-color-slate-500)', fg: '#fff', edge: 'var(--primitive-color-slate-600)' },
  ok: { bg: 'var(--button-success-bg)', fg: '#fff', edge: 'var(--button-success-edge)' },
};
const act = (c, n, t, w = 88) => ({ ...C[c], n, t, w });
const MORE = (c = 'more', w = 88) => act(c, 'more', 'Más', w);

/* La tarjeta desplazada sobre sus paneles.
   side 'right' = se desliza a la izquierda (paneles a la derecha); 'left' = a la derecha.
   shape 'classic': la tarjeta conserva sus esquinas y pasa por encima de los paneles (iOS).
   shape 'piece': la tarjeta y los paneles forman una sola pieza con el mismo canto. */
const swipe = (cardHtml, items, side, shape = 'classic') => {
  const off = items.reduce((a, x) => a + x.w, 0);
  const R = side === 'right';
  const piece = shape === 'piece';
  const under = piece ? 0 : 20;
  const list = R ? items : [...items].reverse();
  const panels = list.map((x, i) => {
    const pad = !piece && ((R && i === 0) || (!R && i === list.length - 1)) ? `padding-${R ? 'left' : 'right'}:${under}px;` : '';
    const sep = piece && i > 0 ? 'box-shadow:inset 1px 0 0 rgba(255,255,255,.22);' : '';
    return `<div style="flex:0 0 ${x.w + (pad ? under : 0)}px;${pad}${sep}background:${x.bg};color:${x.fg};${piece ? `border-bottom:3px solid ${x.edge};` : ''}${x.line ? `border-top:1px solid ${x.edge};` : ''}display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font:800 12.5px Nunito">${icx(x.n, 22, x.fg, 2.4)}${x.t}</div>`;
  }).join('');
  const box = `<div style="position:absolute;top:0;bottom:${piece ? '-3px' : '3px'};${side}:0;width:${off + under}px;display:flex;border-radius:${R ? '0 18px 18px 0' : '18px 0 0 18px'};overflow:hidden">${panels}</div>`;
  return `<div style="position:relative">${box}<div class="${piece ? (R ? 'swp-r' : 'swp-l') : ''}" style="position:relative;z-index:1;transform:translateX(${R ? -off : off}px)">${cardHtml}</div></div>`;
};

/* ── Pantallas base ── */
const agTabs = ['Calendario', 'Citas', 'Medicamentos', 'Bienestar'];
const agHead = i => `${mtitle('Agenda')}${seg(agTabs, i)}`;
const citas = (first, note = '') => phone(`${agHead(1)}${search('Buscar por nombre, especialidad o doctor')}<div class="ey" style="color:var(--color-text-secondary)">PRÓXIMAS</div>${first}${A2}${A3}${note}`, { tab: 'agenda', fab: 'plus' });
const meds = first => phone(`${agHead(2)}${search('Buscar por nombre...')}<div class="ey" style="color:var(--color-text-secondary)">ACTIVOS</div>${first}${M2}${M3}`, { tab: 'agenda', fab: 'plus' });
const docsBps = (d, b) => phone(`${mtitle('Documentos')}${d}${docC('Resultado hemograma', 'Laboratorio', '20 nov')}<div class="h1" style="margin-top:12px">Mochilas</div>${b}${bpC('Control de odontología', 'Radiografías y fórmula', '2 documentos')}`, { tab: 'docs' });

/* ── Mapa de acciones por tarjeta ── */
const mapRow = (tone, n, t, left, right, inMore, last = false) => `<tr style="${last ? '' : 'border-bottom:1px solid var(--line)'}"><td style="padding:14px 12px 14px 0;vertical-align:top"><div class="row g10">${tile(tone, n)}<b style="font:800 15px Nunito">${t}</b></div></td><td style="padding:14px 12px;vertical-align:top">${left}</td><td style="padding:14px 12px;vertical-align:top">${right}</td><td style="padding:14px 0 14px 12px;vertical-align:top" class="s">${inMore}</td></tr>`;
const pill = (n, t, k = 'b') => chip(t, k, ic(n, 12, 'currentColor', 2.6));
const red = t => `<span style="color:var(--color-danger-fg);font-weight:600">${t}</span>`;
const MAP = `<div class="card" style="width:900px;gap:6px"><div class="h2">Qué muestra cada tarjeta</div><div class="sub">Opciones para decidir. «Más» siempre va junto a la principal; lo rojo solo vive dentro de «Más».</div><table style="width:100%;border-collapse:collapse;margin-top:6px"><thead><tr style="text-align:left;font:800 12px Nunito;letter-spacing:.06em;color:var(--color-text-secondary)"><th style="padding:8px 12px 8px 0">TARJETA</th><th style="padding:8px 12px">← IZQUIERDA (PRINCIPAL)</th><th style="padding:8px 12px">DERECHA →</th><th style="padding:8px 0 8px 12px">EN «MÁS»</th></tr></thead><tbody>
${mapRow('pk', 'calendar', 'Cita', pill('calendar', 'Reprogramar'), `${pill('check', 'Asistí', 'gr')}<div class="s" style="margin-top:6px">Solo desde la hora de la cita, como «¿Pudiste asistir?».</div>`, `Ver detalle, reprogramar, editar, agregar a una mochila, compartir · ${red('Cancelar cita, Eliminar cita')} (resuelve #120)`)}
${mapRow('am', 'pill', 'Medicamento', pill('edit', 'Editar'), `${pill('check', 'Tomar', 'gr')}<div class="s" style="margin-top:6px">Atajo del botón «Tomar» de la tarjeta.</div>`, `Registrar toma, editar, nuevo ciclo, historial de tomas, finalizar ciclo · ${red('Eliminar medicamento')}`)}
${mapRow('sky', 'fileText', 'Documento', pill('share', 'Compartir'), pill('backpack', 'A mochila', 'teal'), `Ver, compartir, agregar a una mochila, editar, descargar · ${red('Eliminar documento')} (con «Deshacer»)`)}
${mapRow('teal', 'backpack', 'Mochila', pill('share', 'Compartir'), '<span class="s">—</span>', `Ver, compartir con QR, agregar documentos, editar · ${red('Eliminar mochila')}`, true)}
</tbody></table><div class="hint" style="margin-top:8px">${mas(32, 'point')}<span class="grow">Deslizamiento completo: si se sigue deslizando, se aplica la acción del extremo (la principal o la de la derecha). Nunca es destructiva, y «Tomar» y «Asistí» muestran un toast con «Deshacer».</span></div></div>`;
SW.m('Mapa de acciones', MAP, 'Acciones por tarjeta.');

/* ── Hoy ── */
const kebabC = c => c.replace(/<\/div><\/div><div class="row g8 wrap">/, `</div>${kebab('Opciones de la cita')}</div><div class="row g8 wrap">`);
SW.m('Hoy (con «⋮»)', phone(`${agHead(1)}${search('Buscar por nombre, especialidad o doctor')}<div class="ey" style="color:var(--color-text-secondary)">PRÓXIMAS</div>${kebabC(A1)}${kebabC(A2)}${kebabC(A3)}`, { tab: 'agenda', fab: 'plus' }), 'Como está en la app: «⋮» con un menú flotante («Editar», «Eliminar»).');

/* ── Variantes de los paneles ── */
const VAR = [
  {
    k: '1A · Paneles', shape: 'classic',
    L: [MORE(), act('brand', 'calendar', 'Reprogramar')], R: [act('ok', 'check', 'Tomar', 96)],
    D: [MORE(), act('brand', 'share', 'Compartir')], B: [MORE(), act('brand', 'share', 'Compartir')],
    note: 'Como la lista de chats de iOS: paneles sólidos a toda la altura, pegados al borde; la tarjeta conserva sus esquinas y pasa por encima. La principal queda en el extremo. Blanco sobre azul 5,2:1 y sobre gris pizarra 4,8:1.',
  },
];
for (const v of VAR) {
  SW.m(`${v.k} · cita a la izquierda`, citas(swipe(A1, v.L, 'right', v.shape)), v.note);
  SW.m(`${v.k} · medicamento a la derecha`, meds(swipe(M1, v.R, 'left', v.shape)), 'Una sola acción positiva. Abre la misma confirmación de la toma.');
  SW.m(`${v.k} · documento y mochila`, docsBps(swipe(D1c, v.D, 'right', v.shape), swipe(B1c, v.B, 'right', v.shape)), 'En tarjetas bajas los paneles se ajustan a la altura de la tarjeta.');
}

/* ── Hojas «Más» (iguales en todas las variantes) ── */
const optRow = (n, t, s = '') => row('gray', n, t, s, ic('chevR', 18, 'var(--color-text-muted)'));
const citaHead = sheetHead('pk', 'calendar', 'CITA · MAR 2 DIC · 10:00 A. M.', 'Control de odontología');
const citaOpts = optRow('eye', 'Ver detalle') + optRow('calendar', 'Reprogramar') + optRow('edit', 'Editar') + optRow('backpack', 'Agregar a una mochila', 'Para llevar los documentos') + optRow('share', 'Compartir');
const citaSheet = bottom => phone(`${agHead(1)}${search('Buscar por nombre, especialidad o doctor')}${A1}${A2}`, { tab: 'agenda', over: sheet(`${citaHead}${bottom}`) });
/* Hoja «Más» (v2.34): lista de acciones y, aparte, lo destructivo como su propia tarjeta de filas rojas con subtítulo.
   Fila destructiva: el mismo ListRow con el ícono en cuadro rojo y el texto en rojo; sin chevrón porque abre una confirmación. */
const dRow = (n, t, s = '') => `<div class="row">${tile('red', n)}<div class="grow"><div class="t" style="color:var(--color-danger-fg)">${t}</div>${s ? `<div class="s">${s}</div>` : ''}</div></div>`;
SW.m('«Más» · Cita', citaSheet(`${card(citaOpts, 'tight')}${card(dRow('x', 'Cancelar cita', 'Queda en tu historial como cancelada') + dRow('trash', 'Eliminar cita', 'Se borra de tu agenda'), 'tight')}`), 'Encabezado de hoja del sistema y la lista de acciones. Lo destructivo va en su propia tarjeta, con la misma fila de lista en rojo y un subtítulo que dice qué pasa (región común; MASTER §11: cancelar ≠ eliminar). Es el patrón de hoja de acciones de iOS y resuelve #120.');
SW.m('«Más» · Medicamento', phone(`${agHead(2)}${M1}${M2}`, { tab: 'agenda', over: sheet(`${sheetHead('am', 'pill', 'MEDICAMENTO · CADA 12 HORAS', 'Metformina 850 mg')}${card(optRow('check', 'Registrar toma', 'Próxima: hoy 1:00 p. m.') + optRow('edit', 'Editar') + optRow('plus', 'Nuevo ciclo') + optRow('list', 'Historial de tomas') + optRow('x', 'Finalizar ciclo', 'Dejamos de recordarte las tomas'), 'tight')}${card(dRow('trash', 'Eliminar medicamento', 'Se borran sus ciclos, tomas y recordatorios'), 'tight')}`) }), '«Finalizar ciclo» no es destructivo (se conserva el historial), así que va en la lista y no en rojo.');
SW.m('«Más» · Documento', phone(`${mtitle('Documentos')}${D1c}`, { tab: 'docs', over: sheet(`${sheetHead('sky', 'fileText', 'ORDEN MÉDICA · 24 NOV', 'Orden resonancia de rodilla')}${card(optRow('eye', 'Ver documento') + optRow('share', 'Compartir', 'Enlace o QR') + optRow('backpack', 'Agregar a una mochila') + optRow('edit', 'Editar datos') + optRow('download', 'Descargar'), 'tight')}${card(dRow('trash', 'Eliminar documento', 'Puedes deshacerlo durante 5 s'), 'tight')}`) }), 'Eliminar un documento se deshace con el toast de 5 s, sin modal (MASTER §7).');
SW.m('«Más» · Mochila', phone(`${mtitle('Mochilas')}${B1c}`, { tab: 'mochilas', over: sheet(`${sheetHead('teal', 'backpack', 'MOCHILA · 4 DOCUMENTOS', 'Cita de ortopedia')}${card(optRow('eye', 'Ver mochila') + optRow('qr', 'Compartir con QR') + optRow('plus', 'Agregar documentos') + optRow('edit', 'Editar nombre'), 'tight')}${card(dRow('trash', 'Eliminar mochila', 'Tus documentos no se borran'), 'tight')}`) }), '');

/* ── Cómo se descubre el gesto ── */
const peek = cardHtml => `<div style="position:relative"><div style="position:absolute;top:0;bottom:3px;right:0;width:64px;border-radius:0 18px 18px 0;overflow:hidden;display:flex;justify-content:flex-end"><div style="width:44px;background:${C.brand.bg}"></div></div><div style="position:relative;z-index:1;transform:translateX(-44px)">${cardHtml}</div></div>`;
SW.m('D1 · Asomo la primera vez', citas(peek(A1), hint('Desliza una tarjeta a la izquierda para ver sus acciones.', 'point')), 'La primera vez que se abre una lista, la primera tarjeta se corre 44 px y vuelve (350 ms, movimiento-interacciones.md), con el aviso de la mascota. No se repite.');
SW.m('D2 · Mantener presionado', phone(`${agHead(1)}${search('Buscar por nombre, especialidad o doctor')}<div style="transform:scale(.98);border-radius:18px;box-shadow:0 0 0 3px var(--color-brand-focus)">${A1}</div>${A2}`, { tab: 'agenda', over: sheet(`${sheetHead('pk', 'calendar', 'CITA · MAR 2 DIC · 10:00 A. M.', 'Control de odontología')}${card(optRow('eye', 'Ver detalle') + optRow('calendar', 'Reprogramar') + optRow('edit', 'Editar'), 'tight')}<div class="s" style="text-align:center">… y el resto de la hoja «Más»</div>`) }), 'Mantener presionada la tarjeta (500 ms, con háptica) abre la misma hoja «Más». Es la vía para quien no desliza; VoiceOver la ofrece como acción de la tarjeta.');
}
