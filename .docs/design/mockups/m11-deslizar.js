/* 14 · Acciones al deslizar (propuesta, issue #127) — alternativas para elegir antes de cambiar MASTER y el código.
   Reemplaza el «⋮» de las tarjetas de lista en móvil: deslizar a la izquierda muestra la acción principal y «Más»;
   «Más» abre una hoja con todas las acciones (lo destructivo al final, como enlace rojo, MASTER §7).
   Deslizar a la derecha solo donde hay una acción positiva clara. Web conserva el «⋮».
   Propuesta: paneles sólidos a toda la altura como la lista de chats de iOS. Animación y háptica en
   ../system/movimiento.html, sección «Acciones al deslizar». */
{
const SW = mod('deslizar', '14 · Acciones al deslizar (propuesta)', 'Issue #127. Las tarjetas de lista en móvil (cita, medicamento, documento, mochila), las filas del día del Calendario y los enlaces de Compartidos (v2.35) dejan el «⋮» y muestran sus acciones al deslizar, con paneles de color a toda la altura como en la lista de chats de iOS: a la izquierda, la acción principal y «Más»; «Más» abre una hoja con todas las acciones y lo destructivo aparte, en su propia tarjeta de filas rojas. A la derecha, solo una acción positiva clara. Si se sigue deslizando, se aplica la acción del extremo (con háptica al mostrar las acciones y al pasar el umbral; ver movimiento.html). Se muestran las hojas «Más» de cada tarjeta y dos formas de descubrir el gesto. Accesibilidad: las mismas acciones como acciones de VoiceOver de la tarjeta. Web conserva el «⋮».');


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

/* La tarjeta desplazada sobre sus paneles (como la lista de chats de iOS): la tarjeta conserva sus esquinas y pasa
   por encima; los paneles nacen 20 px debajo de ella. side 'right' = se desliza a la izquierda; 'left' = a la derecha. */
const swipe = (cardHtml, items, side) => {
  const off = items.reduce((a, x) => a + x.w, 0), R = side === 'right', under = 20;
  const list = R ? items : [...items].reverse();
  const panels = list.map((x, i) => {
    const first = (R && i === 0) || (!R && i === list.length - 1);
    return `<div style="flex:0 0 ${x.w + (first ? under : 0)}px;${first ? `padding-${R ? 'left' : 'right'}:${under}px;` : ''}background:${x.bg};color:${x.fg};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;font:800 12.5px Nunito">${icx(x.n, 22, x.fg, 2.4)}${x.t}</div>`;
  }).join('');
  const box = `<div style="position:absolute;top:0;bottom:3px;${side}:0;width:${off + under}px;display:flex;border-radius:${R ? '0 18px 18px 0' : '18px 0 0 18px'};overflow:hidden">${panels}</div>`;
  return `<div style="position:relative">${box}<div style="position:relative;z-index:1;transform:translateX(${R ? -off : off}px)">${cardHtml}</div></div>`;
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
const MAP = `<div class="card" style="width:900px;gap:6px"><div class="h2">Qué muestra cada tarjeta</div><div class="sub">«Más» siempre va junto a la principal; lo rojo solo vive dentro de «Más».</div><table style="width:100%;border-collapse:collapse;margin-top:6px"><thead><tr style="text-align:left;font:800 12px Nunito;letter-spacing:.06em;color:var(--color-text-secondary)"><th style="padding:8px 12px 8px 0">TARJETA</th><th style="padding:8px 12px">← IZQUIERDA (PRINCIPAL)</th><th style="padding:8px 12px">DERECHA →</th><th style="padding:8px 0 8px 12px">EN «MÁS»</th></tr></thead><tbody>
${mapRow('pk', 'calendar', 'Cita', pill('calendar', 'Reprogramar'), `${pill('check', 'Asistí', 'gr')}<div class="s" style="margin-top:6px">Solo desde la hora de la cita, como «¿Pudiste asistir?».</div>`, `Ver detalle, reprogramar, editar, agregar a una mochila, compartir · ${red('Cancelar cita, Eliminar cita')} (resuelve #120)`)}
${mapRow('am', 'pill', 'Medicamento', pill('edit', 'Editar'), `${pill('check', 'Tomar', 'gr')}<div class="s" style="margin-top:6px">Atajo del botón «Tomar» de la tarjeta.</div>`, `Registrar toma, editar, nuevo ciclo, historial de tomas, finalizar ciclo · ${red('Eliminar medicamento')}`)}
${mapRow('sky', 'fileText', 'Documento', pill('share', 'Compartir'), pill('backpack', 'A mochila', 'teal'), `Ver, compartir, agregar a una mochila, editar, descargar · ${red('Eliminar documento')} (con «Deshacer»)`)}
${mapRow('teal', 'backpack', 'Mochila', pill('share', 'Compartir'), '<span class="s">—</span>', `Ver, compartir con QR, agregar documentos, editar · ${red('Eliminar mochila')}`, true)}
</tbody></table><div class="hint" style="margin-top:8px">${mas(32, 'point')}<span class="grow">Deslizamiento completo: si se sigue deslizando, se aplica la acción del extremo (la principal o la de la derecha). Nunca es destructiva, y «Tomar» y «Asistí» muestran un toast con «Deshacer».</span></div></div>`;
SW.m('Mapa de acciones', MAP, 'Acciones por tarjeta.');


/* ── Propuesta ── */
SW.m('Propuesta · cita, deslizar a la izquierda', citas(swipe(A1, [MORE(), act('brand', 'calendar', 'Reprogramar')], 'right')), 'Paneles sólidos a toda la altura, pegados al borde; la tarjeta conserva sus esquinas y pasa por encima. «Más» en gris pizarra y la principal en el extremo, 96 px cada uno. Blanco sobre azul 5,2:1 y sobre gris pizarra 4,8:1.');
SW.m('Propuesta · medicamento, deslizar a la derecha', meds(swipe(M1, [act('ok', 'check', 'Tomar', 96)], 'left')), 'Una sola acción positiva, en verde. Registra la toma como el botón «Tomar» de la tarjeta, con toast y «Deshacer».');
SW.m('Propuesta · documento y mochila', docsBps(swipe(D1c, [MORE(), act('brand', 'share', 'Compartir')], 'right'), swipe(B1c, [MORE(), act('brand', 'share', 'Compartir')], 'right')), 'En tarjetas bajas los paneles se ajustan a la altura de la tarjeta.');

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

/* ── v2.35 · Calendario y Compartidos: mismas reglas en las filas del día y en los enlaces ── */
/* Fila del día del Calendario (mockup «Calendario», helper `ev` de m2): barra de color a la izquierda y la acción a la derecha. */
const calEv = (k, t, n, s, right = '') => `<div class="card tight" style="flex-direction:row;align-items:center;border-left:6px solid ${k}"><div class="grow"><div class="t clamp2">${n}</div><div class="s clamp2">${t} · ${s}</div></div>${right}</div>`;
const K = { med: 'var(--color-motivation-level)', appt: 'var(--color-feature-appointment-fg)', well: 'var(--color-feature-wellbeing-solid)', mis: 'var(--color-brand-focus)', task: 'var(--color-brand-solid)' };
const E_TOMA = calEv(K.med, '1:00 p. m.', 'Metformina 850 mg', 'Toma · 1 tableta', btn('Tomar', 'ok sm', ic('check', 14, '#fff', 3)));
const E_TOMADO = calEv(K.med, '7:00 a. m.', 'Losartán 50 mg', 'Toma · 1 tableta', chip('Tomado', 'gr', ic('check', 12, 'currentColor', 3)));
const E_CITA = calEv(K.appt, '10:00 a. m.', 'Control de odontología', 'Cita · Dra. Ruiz');
const E_CHECK = calEv(K.well, 'Todo el día', 'Check-in diario', 'Bienestar · 1 min', btn('Hacer', 'sec sm'));
const E_MIS = calEv(K.mis, 'Hoy', 'Preparar la resonancia', 'Misión · paso 2 de 4', btn('Ver', 'sec sm'));
const E_TAREA = calEv(K.task, '5:00 p. m.', 'Recoger fórmula', 'Tarea · en la EPS', btn('Completar', 'sec sm'));
const calDay = (rows, over) => phone(`${agHead(0)}<div class="h3">Hoy, martes 3</div>${rows}`, { tab: 'agenda', fab: 'plus', ...(over ? { over } : {}) });

/* Enlace del historial de Compartidos (mockup «Compartidos», helper `sh` de m5) */
const shC = (n, d, st, stc, n2 = 'link') => card(`<div class="row">${tile(stc === 'gr' ? 'b' : 'gray', n2)}<div class="grow"><div class="t ell">${n}</div><div class="s">${d}</div></div>${chip(st, stc)}</div>`, 'tight');
const S1 = shC('Orden médica · Resonancia', '2 documentos · vence en 24 h', 'Activo', 'gr');
const S2 = shC('Mochila «Chequeo anual»', '6 documentos · vence en 3 días', 'Activo', 'gr', 'backpack');
const S3 = shC('Hemograma completo', 'Venció el 28 oct', 'Expirado', 'gray');
const shared = (first, over) => phone(`${mback('Compartidos', btn('Nuevo', 'sm', ic('plus', 15, '#fff', 2.6)))}${seg(['Todos', 'Activos', 'Inactivos'], 0)}${first}${S2}${S3}`, { tab: 'mas', ...(over ? { over } : {}) });

const none = t => `<span class="s">— ${t}</span>`;
const MAP2 = `<div class="card" style="width:900px;gap:6px"><div class="h2">Calendario y Compartidos</div><div class="sub">Las filas del día del Calendario y los enlaces compartidos siguen las mismas reglas. Lo que solo tiene «abrir» no se desliza.</div><table style="width:100%;border-collapse:collapse;margin-top:6px"><thead><tr style="text-align:left;font:800 12px Nunito;letter-spacing:.06em;color:var(--color-text-secondary)"><th style="padding:8px 12px 8px 0">FILA</th><th style="padding:8px 12px">← IZQUIERDA (PRINCIPAL)</th><th style="padding:8px 12px">DERECHA →</th><th style="padding:8px 0 8px 12px">EN «MÁS»</th></tr></thead><tbody>
${mapRow('pk', 'calendar', 'Cita del día', pill('calendar', 'Reprogramar'), `${pill('check', 'Asistí', 'gr')}<div class="s" style="margin-top:6px">Igual que la tarjeta de Citas.</div>`, `La misma hoja «Más» de la cita · ${red('Cancelar cita, Eliminar cita')}`)}
${mapRow('am', 'pill', 'Toma', pill('alarm', 'Más tarde'), `${pill('check', 'Tomar', 'gr')}<div class="s" style="margin-top:6px">Solo si está pendiente; con toast y «Deshacer».</div>`, 'Registrar toma, más tarde, no la tomé (con motivo), ver medicamento · sin nada rojo: no se borra nada')}
${mapRow('b', 'route', 'Tarea', pill('calendar', 'Reprogramar'), `${pill('check', 'Completar', 'gr')}<div class="s" style="margin-top:6px">Abre la misma hoja de «Completar» (nota opcional).</div>`, `Ver detalle, completar, reprogramar, editar · ${red('Eliminar tarea')}`)}
${mapRow('vi', 'heart', 'Check-in y paso de misión', none('sin deslizar'), none('sin deslizar'), 'Una sola acción («Hacer», «Ver»): tocar la fila basta. Sin «Más».')}
${mapRow('b', 'link', 'Enlace compartido activo', pill('copy', 'Copiar enlace'), '<span class="s">—</span>', `Ver detalle, ver QR, copiar enlace, compartir · ${red('Revocar acceso')}`)}
${mapRow('gray', 'link', 'Enlace vencido o revocado', none('sin deslizar'), none('sin deslizar'), 'No hay nada que hacer salvo verlo: tocar abre el detalle.', true)}
</tbody></table><div class="hint" style="margin-top:8px">${mas(32, 'point')}<span class="grow">Una tarea completada o una toma ya registrada pierden la acción de la derecha y conservan «Más». El Calendario usa el mismo aviso de la primera vez que el resto de las listas.</span></div></div>`;
SW.m('Mapa · Calendario y Compartidos', MAP2, 'v2.35 · Filas del día y enlaces.');

SW.m('Calendario · toma y tarea', calDay(`${E_TOMADO}${swipe(E_TOMA, [act('ok', 'check', 'Tomar', 96)], 'left')}${E_CITA}${E_CHECK}${swipe(E_TAREA, [MORE(), act('brand', 'calendar', 'Reprogramar')], 'right')}`), 'La toma pendiente a la derecha: «Tomar», en verde, igual que el botón de la fila. La tarea a la izquierda: «Más» y «Reprogramar». El check-in y el paso de misión no se deslizan: su fila ya es su única acción.');
SW.m('Calendario · toma a la izquierda', calDay(`${E_TOMADO}${swipe(E_TOMA, [MORE(), act('brand', 'alarm', 'Más tarde')], 'right')}${E_CITA}${E_CHECK}${E_TAREA}`), '«Más tarde» pospone la toma como en la hoja de la toma (elige la hora). Es la principal porque es lo que más se hace con una toma que no se puede tomar ahora.');

SW.m('«Más» · Toma', calDay(`${E_TOMADO}${E_TOMA}${E_CITA}`, sheet(`${sheetHead('am', 'pill', 'TOMA · HOY 1:00 P. M.', 'Metformina 850 mg')}${card(optRow('check', 'Registrar toma', '1 tableta') + optRow('alarm', 'Más tarde', 'Te la recordamos de nuevo') + optRow('x', 'No la tomé', 'Anota el motivo') + optRow('pill', 'Ver medicamento'), 'tight')}`)), '«No la tomé» no va en rojo: es un registro que se puede corregir, no un borrado. La hoja no tiene grupo destructivo.');
SW.m('«Más» · Tarea', calDay(`${E_TOMA}${E_TAREA}`, sheet(`${sheetHead('b', 'route', 'TAREA · HOY 5:00 P. M.', 'Recoger fórmula')}${card(optRow('eye', 'Ver detalle') + optRow('check', 'Completar', 'Con una nota opcional') + optRow('calendar', 'Reprogramar') + optRow('edit', 'Editar'), 'tight')}${card(dRow('trash', 'Eliminar tarea', 'Se borra de tu agenda'), 'tight')}`)), '');

SW.m('Compartidos · enlace activo', shared(swipe(S1, [MORE(), act('brand', 'copy', 'Copiar enlace')], 'right')), '«Copiar enlace» es la principal: es lo que se hace para volver a mandarlo. Los enlaces vencidos o revocados no se deslizan.');
SW.m('«Más» · Enlace compartido', shared(S1, sheet(`${sheetHead('b', 'link', 'ENLACE · VENCE EN 24 H', 'Orden médica · Resonancia')}${card(optRow('eye', 'Ver detalle', 'Visto 3 veces') + optRow('qr', 'Ver QR') + optRow('copy', 'Copiar enlace') + optRow('share', 'Compartir'), 'tight')}${card(dRow('x', 'Revocar acceso', 'El enlace deja de funcionar'), 'tight')}`)), 'Revocar abre su confirmación (MASTER §7), como hoy en el detalle del enlace.');

}
