/* 14 · Acciones al deslizar (propuesta, issue #127) — alternativas para elegir antes de cambiar MASTER y el código.
   Reemplaza el «⋮» de las tarjetas de lista en móvil: deslizar a la izquierda muestra la acción principal y «Más»;
   «Más» abre una hoja con todas las acciones (lo destructivo al final, como enlace rojo, MASTER §7).
   Deslizar a la derecha solo donde hay una acción positiva clara. Web conserva el «⋮». */
{
const SW = mod('deslizar', '14 · Acciones al deslizar (propuesta)', 'Issue #127. Las tarjetas de lista en móvil (cita, medicamento, documento, mochila) dejan el «⋮» y muestran sus acciones al deslizar, como la lista de chats de iOS: a la izquierda, la acción principal y «Más»; «Más» abre una hoja con todas las acciones y lo destructivo al final, como enlace rojo. A la derecha, solo una acción positiva clara. Se comparan tres estilos para los botones (1 · paneles, 2 · botones del kit, 3 · íconos redondos), las hojas «Más» de cada tarjeta y dos formas de descubrir el gesto. Accesibilidad: las mismas acciones como acciones de VoiceOver de la tarjeta. Web conserva el «⋮».');

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

/* ── Acciones reveladas: [tono, ícono, texto] ── */
const BRAND = ['var(--color-brand-solid)', 'var(--color-brand-edge)'];
const MORE = ['var(--primitive-color-slate-500)', 'var(--primitive-color-slate-600)'];
const OK = ['var(--button-success-bg)', 'var(--button-success-edge)'];
const TEAL = ['var(--color-feature-backpack-solid)', 'var(--color-feature-backpack-fg)'];
const more = [MORE, 'more', 'Más'];

/* La tarjeta desplazada sobre sus acciones. side: 'right' (deslizar a la izquierda) o 'left' (a la derecha). */
const swipe = (cardHtml, actions, side, off) => `<div style="position:relative">${actions(side)}<div style="position:relative;z-index:1;transform:translateX(${side === 'right' ? -off : off}px)">${cardHtml}</div></div>`;

/* 1 · Paneles de color a toda la altura, pegados al borde (como iOS). La principal queda en el extremo. */
const panels = (items, off) => side => `<div style="position:absolute;top:0;bottom:3px;${side}:0;width:${off + 20}px;display:flex;flex-direction:${side === 'right' ? 'row' : 'row-reverse'};border-radius:${side === 'right' ? '0 18px 18px 0' : '18px 0 0 18px'};overflow:hidden">${items.map(([[bg], n, t], i) => `<div style="flex:${i === 0 ? `0 0 ${off / items.length + 20}px` : 1};${i === 0 ? `padding-${side === 'right' ? 'left' : 'right'}:20px;` : ''}background:${bg};color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font:800 12.5px Nunito">${ic(n, 22, '#fff', 2.4)}${t}</div>`).join('')}</div>`;

/* 2 · Botones del kit: radio 14 y canto; la principal sólida y «Más» secundario. */
const kitBtns = items => side => `<div style="position:absolute;top:0;bottom:3px;${side}:0;display:flex;flex-direction:${side === 'right' ? 'row' : 'row-reverse'};gap:8px">${items.map(([[bg, edge], n, t]) => {
  const sec = bg === MORE[0];
  return `<div style="width:88px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font:800 12.5px Nunito;${sec ? 'background:var(--card-bg);color:var(--color-brand-text);border:1.5px solid var(--line);box-shadow:0 3px 0 var(--line)' : `background:${bg};color:#fff;box-shadow:0 3px 0 ${edge}`}">${ic(n, 22, sec ? 'var(--color-brand-text)' : '#fff', 2.4)}${t}</div>`;
}).join('')}</div>`;

/* 3 · Íconos redondos de 48 px con la etiqueta debajo, sobre el fondo de la pantalla. */
const rounds = items => side => `<div style="position:absolute;top:0;bottom:3px;${side}:0;display:flex;flex-direction:${side === 'right' ? 'row' : 'row-reverse'};align-items:center;gap:4px">${items.map(([[bg, edge], n, t]) => `<div style="width:84px;display:flex;flex-direction:column;align-items:center;gap:6px;font:800 12.5px Nunito;color:var(--color-text-secondary)"><div style="width:48px;height:48px;border-radius:50%;background:${bg};box-shadow:0 3px 0 ${edge};display:grid;place-items:center">${ic(n, 22, '#fff', 2.4)}</div>${t}</div>`).join('')}</div>`;

const STY = {
  1: { name: 'Paneles', L: items => panels(items, 192), offL: 192, R: items => panels(items, 96), offR: 96 },
  2: { name: 'Botones del kit', L: kitBtns, offL: 192, R: kitBtns, offR: 96 },
  3: { name: 'Íconos redondos', L: rounds, offL: 176, R: rounds, offR: 88 },
};

/* ── Pantallas base ── */
const agTabs = ['Calendario', 'Citas', 'Medicamentos', 'Bienestar'];
const agHead = i => `${mtitle('Agenda')}${seg(agTabs, i)}`;
const citas = (first, note = '') => phone(`${agHead(1)}${search('Buscar por nombre, especialidad o doctor')}<div class="ey" style="color:var(--color-text-secondary)">PRÓXIMAS</div>${first}${A2}${A3}${note}`, { tab: 'agenda', fab: 'plus' });
const meds = first => phone(`${agHead(2)}${search('Buscar por nombre...')}<div class="ey" style="color:var(--color-text-secondary)">ACTIVOS</div>${first}${M2}${M3}`, { tab: 'agenda', fab: 'plus' });

/* Mapa de acciones por tarjeta */
const mapRow = (tone, n, t, left, right, inMore, last = false) => `<tr style="${last ? '' : 'border-bottom:1px solid var(--line)'}"><td style="padding:14px 12px 14px 0;vertical-align:top"><div class="row g10">${tile(tone, n)}<b style="font:800 15px Nunito">${t}</b></div></td><td style="padding:14px 12px;vertical-align:top">${left}</td><td style="padding:14px 12px;vertical-align:top">${right}</td><td style="padding:14px 0 14px 12px;vertical-align:top" class="s">${inMore}</td></tr>`;
const pill = (n, t, k = 'b') => chip(t, k, ic(n, 12, 'currentColor', 2.6));
const none = `<span class="s">—</span>`;
const MAP = `<div class="card" style="width:900px;gap:6px"><div class="h2">Qué muestra cada tarjeta</div><div class="sub">Opciones para decidir. «Más» siempre va junto a la principal; lo rojo solo vive dentro de «Más».</div><table style="width:100%;border-collapse:collapse;margin-top:6px"><thead><tr style="text-align:left;font:800 12px Nunito;letter-spacing:.06em;color:var(--color-text-secondary)"><th style="padding:8px 12px 8px 0">TARJETA</th><th style="padding:8px 12px">← IZQUIERDA (PRINCIPAL)</th><th style="padding:8px 12px">DERECHA →</th><th style="padding:8px 0 8px 12px">EN «MÁS»</th></tr></thead><tbody>
${mapRow('pk', 'calendar', 'Cita', pill('calendar', 'Reprogramar'), `${pill('check', 'Asistí', 'gr')}<div class="s" style="margin-top:6px">Solo desde la hora de la cita, como «¿Pudiste asistir?».</div>`, 'Ver detalle, reprogramar, editar, agregar a una mochila, compartir · <span style="color:var(--color-danger-fg);font-weight:600">Cancelar cita, Eliminar cita</span> (resuelve #120)')}
${mapRow('am', 'pill', 'Medicamento', pill('edit', 'Editar'), `${pill('check', 'Tomar', 'gr')}<div class="s" style="margin-top:6px">Atajo del botón «Tomar» de la tarjeta.</div>`, 'Registrar toma, editar, nuevo ciclo, historial de tomas, finalizar ciclo · <span style="color:var(--color-danger-fg);font-weight:600">Eliminar medicamento</span>')}
${mapRow('sky', 'fileText', 'Documento', pill('share', 'Compartir'), pill('backpack', 'A mochila', 'teal'), 'Ver, compartir, agregar a una mochila, editar, descargar · <span style="color:var(--color-danger-fg);font-weight:600">Eliminar documento</span> (con «Deshacer»)')}
${mapRow('teal', 'backpack', 'Mochila', pill('share', 'Compartir'), none, 'Ver, compartir con QR, agregar documentos, editar · <span style="color:var(--color-danger-fg);font-weight:600">Eliminar mochila</span>', true)}
</tbody></table><div class="hint" style="margin-top:8px">${mas(32, 'point')}<span class="grow">Sin deslizamiento completo: ninguna acción se ejecuta solo con deslizar, siempre pide un toque. Evita tomas o citas marcadas por error.</span></div></div>`;
SW.m('Mapa de acciones', MAP, 'Propuesta de acciones por tarjeta para elegir junto con el estilo.');

/* Hoy */
const kebabC = c => c.replace(/<\/div><\/div><div class="row g8 wrap">/, `</div>${kebab('Opciones de la cita')}</div><div class="row g8 wrap">`);
SW.m('A · Hoy (con «⋮»)', phone(`${agHead(1)}${search('Buscar por nombre, especialidad o doctor')}<div class="ey" style="color:var(--color-text-secondary)">PRÓXIMAS</div>${kebabC(A1)}${kebabC(A2)}${kebabC(A3)}`, { tab: 'agenda', fab: 'plus' }), 'Como está en la app: «⋮» con un menú flotante («Editar», «Eliminar»).');

/* Los tres estilos: cita a la izquierda y medicamento a la derecha */
for (const k of [1, 2, 3]) {
  const s = STY[k];
  SW.m(`${k} · ${s.name} · deslizar a la izquierda`, citas(swipe(A1, s.L([more, [BRAND, 'calendar', 'Reprogramar']]), 'right', s.offL)),
    { 1: 'Como la lista de chats de iOS: paneles a toda la altura, pegados al borde; la principal en el extremo. Blanco sobre azul 5,2:1 y sobre gris pizarra 4,8:1.', 2: 'Los botones del sistema (radio 14 y canto): la principal sólida y «Más» como secundario. Se lee como el resto de Helu y se separa bien de la tarjeta.', 3: 'Círculos de 48 px con la etiqueta debajo, sobre el fondo. Es el más liviano; la etiqueta queda en gris y el área táctil es el círculo más el texto (84 × 76).' }[k]);
  SW.m(`${k} · ${s.name} · deslizar a la derecha`, meds(swipe(M1, s.R([[OK, 'check', 'Tomar']]), 'left', s.offR)),
    'Una sola acción positiva, en verde (MASTER §4.3: el verde es «completado»). Abre la misma confirmación de la toma.');
}

/* Documento y mochila en el estilo 2, para ver las otras tarjetas */
SW.m('2 · Documento · izquierda', phone(`${mtitle('Documentos')}${search('Buscar documentos')}${swipe(docC('Orden resonancia de rodilla', 'Orden médica', '24 nov'), kitBtns([more, [BRAND, 'share', 'Compartir']]), 'right', 192)}${docC('Resultado hemograma', 'Laboratorio', '20 nov')}${docC('Fórmula Losartán', 'Fórmula médica', '18 nov')}`, { tab: 'docs', fab: 'upload' }), 'Con el estilo 2. A la derecha iría «A mochila» en verde azulado (color de Mochilas).');
SW.m('2 · Mochila · izquierda', phone(`${mtitle('Mochilas')}${search('Buscar mochilas')}${swipe(bpC('Cita de ortopedia', 'Para el viernes con el Dr. Mejía', '4 documentos'), kitBtns([more, [BRAND, 'share', 'Compartir']]), 'right', 192)}${bpC('Control de odontología', 'Radiografías y fórmula', '2 documentos')}`, { tab: 'mochilas', fab: 'plus' }), 'Sin acción a la derecha: ninguna es lo bastante clara para hacerla con un gesto.');

/* ── Hojas «Más» (iguales en los tres estilos) ── */
const optRow = (n, t, s = '') => row('gray', n, t, s, ic('chevR', 18, 'var(--color-text-muted)'));
const redLinks = (...xs) => `<div class="col g4">${xs.map(([t, n]) => redLink(t, n)).join('')}</div>`;
SW.m('«Más» · Cita', phone(`${agHead(1)}${search('Buscar por nombre, especialidad o doctor')}${A1}${A2}`, { tab: 'agenda', over: sheet(`${sheetHead('pk', 'calendar', 'CITA · MAR 2 DIC · 10:00 A. M.', 'Control de odontología')}${card(optRow('eye', 'Ver detalle') + optRow('calendar', 'Reprogramar') + optRow('edit', 'Editar') + optRow('backpack', 'Agregar a una mochila', 'Para llevar los documentos') + optRow('share', 'Compartir'), 'tight')}${redLinks(['Cancelar cita', 'x'], ['Eliminar cita', 'trash'])}`) }), 'Encabezado de hoja del sistema y la lista como en «Opciones de la misión». «Cancelar cita» (queda en el historial) y «Eliminar cita» (se borra) van al final en rojo; resuelve #120.');
SW.m('«Más» · Medicamento', phone(`${agHead(2)}${M1}${M2}`, { tab: 'agenda', over: sheet(`${sheetHead('am', 'pill', 'MEDICAMENTO · CADA 12 HORAS', 'Metformina 850 mg')}${card(optRow('check', 'Registrar toma', 'Próxima: hoy 1:00 p. m.') + optRow('edit', 'Editar') + optRow('plus', 'Nuevo ciclo') + optRow('list', 'Historial de tomas') + optRow('x', 'Finalizar ciclo', 'Dejamos de recordarte las tomas'), 'tight')}${redLinks(['Eliminar medicamento', 'trash'])}`) }), '«Finalizar ciclo» no es destructivo (se conserva el historial), así que va en la lista y no en rojo.');
SW.m('«Más» · Documento', phone(`${mtitle('Documentos')}${docC('Orden resonancia de rodilla', 'Orden médica', '24 nov')}`, { tab: 'docs', over: sheet(`${sheetHead('sky', 'fileText', 'ORDEN MÉDICA · 24 NOV', 'Orden resonancia de rodilla')}${card(optRow('eye', 'Ver documento') + optRow('share', 'Compartir', 'Enlace o QR') + optRow('backpack', 'Agregar a una mochila') + optRow('edit', 'Editar datos') + optRow('download', 'Descargar'), 'tight')}${redLinks(['Eliminar documento', 'trash'])}`) }), 'Eliminar un documento se deshace con el toast de 5 s, sin modal (MASTER §7).');
SW.m('«Más» · Mochila', phone(`${mtitle('Mochilas')}${bpC('Cita de ortopedia', 'Para el viernes con el Dr. Mejía', '4 documentos')}`, { tab: 'mochilas', over: sheet(`${sheetHead('teal', 'backpack', 'MOCHILA · 4 DOCUMENTOS', 'Cita de ortopedia')}${card(optRow('eye', 'Ver mochila') + optRow('qr', 'Compartir con QR') + optRow('plus', 'Agregar documentos') + optRow('edit', 'Editar nombre'), 'tight')}${redLinks(['Eliminar mochila', 'trash'])}`) }), '');

/* ── Cómo se descubre el gesto ── */
SW.m('D1 · Asomo la primera vez', citas(swipe(A1, kitBtns([more, [BRAND, 'calendar', 'Reprogramar']]), 'right', 44), hint('Desliza una tarjeta a la izquierda para ver sus acciones.', 'point')), 'La primera vez que se abre una lista, la primera tarjeta se corre 44 px y vuelve (350 ms, movimiento-interacciones.md), con el aviso de la mascota. No se repite.');
SW.m('D2 · Mantener presionado', phone(`${agHead(1)}${search('Buscar por nombre, especialidad o doctor')}<div style="transform:scale(.98);border-radius:18px;box-shadow:0 0 0 3px var(--color-brand-focus)">${A1}</div>${A2}`, { tab: 'agenda', over: sheet(`${sheetHead('pk', 'calendar', 'CITA · MAR 2 DIC · 10:00 A. M.', 'Control de odontología')}${card(optRow('eye', 'Ver detalle') + optRow('calendar', 'Reprogramar') + optRow('edit', 'Editar'), 'tight')}<div class="s" style="text-align:center">… y el resto de la hoja «Más»</div>`) }), 'Mantener presionada la tarjeta (500 ms, con háptica) abre la misma hoja «Más». Es la vía para quien no desliza; VoiceOver la ofrece como acción de la tarjeta.');
}
