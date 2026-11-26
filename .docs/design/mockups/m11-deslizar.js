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
/* Calendario tal como el módulo 3 «Calendario» (m2-agenda.js): mes, semana con íconos, leyenda, «Hoy, martes 3» y sus filas. */
const EVT = { med: ['pill', 'var(--color-feature-medication-fg)', 'Tomas'], appt: ['calendar', 'var(--color-feature-appointment-fg)', 'Citas'], well: ['heart', 'var(--color-feature-wellbeing-fg)', 'Check-in'], mis: ['route', 'var(--color-feature-mission-fg)', 'Misiones y tareas'] };
const evIcon = (k, z = 12, white = false) => ic(EVT[k][0], z, white ? '#fff' : EVT[k][1], 2.6);
const DAYS = [['D', 1], ['L', 2], ['M', 3], ['M', 4], ['J', 5], ['V', 6], ['S', 7]];
const dots = [['med'], ['med', 'well'], ['med', 'well', 'mis'], ['med'], ['med', 'appt'], ['med'], ['med']];
const weekStrip = (sel = 2) => `<div class="row between g6">${DAYS.map(([d, n], i) => `<div class="col center g4" style="flex:1;padding:8px 0 9px;border-radius:16px;${i === sel ? 'background:var(--color-brand-solid);border:1px solid var(--color-brand-text);border-bottom:3px solid var(--color-brand-edge);color:#fff' : 'background:#fff;border:1px solid var(--color-border);border-bottom-width:3px;color:var(--color-text-secondary)'};font:800 12.5px Nunito"><span>${d}</span><b style="font:900 18px Nunito;color:${i === sel ? '#fff' : 'var(--color-text-primary)'}">${n}</b><span class="row" style="gap:2px;height:12px">${dots[i].map(k => evIcon(k, 11, i === sel)).join('')}</span></div>`).join('')}</div>`;
const legend = () => `<div class="legend">${Object.values(EVT).map(([n, c, l]) => `<span>${ic(n, 14, c, 2.4)}${l}</span>`).join('')}</div>`;
const calEv = (k, t, n, s, right = '') => `<div class="card tight" style="flex-direction:row;align-items:center;border-left:6px solid ${k}"><div class="grow"><div class="t clamp2">${n}</div><div class="s clamp2">${t} · ${s}</div></div>${right}</div>`;
/* Las filas de «Hoy, martes 3» del módulo 3, sin cambios */
const E_TOMADO = calEv('var(--color-motivation-level)', '7:00 a. m.', 'Losartán 50 mg', 'Toma · 1 tableta', chip('Tomado', 'gr', ic('check', 12, 'currentColor', 3)));
const E_TOMA = calEv('var(--color-motivation-level)', '1:00 p. m.', 'Metformina 850 mg', 'Toma · 1 tableta', btn('Tomar', 'ok sm', ic('check', 14, '#fff', 3)));
const E_CHECK = calEv('var(--color-feature-wellbeing-solid)', 'Todo el día', 'Check-in diario', 'Bienestar · 1 min', btn('Hacer', 'sec sm'));
const E_MIS = calEv('var(--color-brand-focus)', 'Hoy', 'Preparar la resonancia', 'Misión · paso 2 de 4', btn('Ver', 'sec sm'));
const E_TAREA = calEv('var(--color-brand-solid)', '5:00 p. m.', 'Recoger fórmula', 'Tarea · en la EPS', btn('Completar', 'sec sm'));
const calHead = `${agHead(0)}<div class="row"><div class="h3 grow">Noviembre 2026</div><div class="iconbtn" aria-label="Semana anterior">${ic('chevL', 16)}</div><div class="iconbtn" aria-label="Semana siguiente">${ic('chevR', 16)}</div></div>${weekStrip()}${legend()}<div class="h3">Hoy, martes 3</div>`;
const calDay = (rows, over) => phone(`${calHead}${rows}`, { tab: 'agenda', fab: 'plus', ...(over ? { over } : {}) });
const calRows = (toma = E_TOMA, tarea = E_TAREA) => `${E_TOMADO}${toma}${E_CHECK}${E_MIS}${tarea}`;

/* Compartidos tal como el módulo 13 «Compartidos» (m5, helper `sh`) */
const shC = (n, d, st, stc, n2 = 'link') => card(`<div class="row">${tile(stc === 'gr' ? 'b' : 'gray', n2)}<div class="grow"><div class="t ell">${n}</div><div class="s">${d}</div></div>${chip(st, stc)}</div>`, 'tight');
const S1 = shC('Orden médica · Resonancia', '2 documentos · vence en 24 h', 'Activo', 'gr');
const S2 = shC('Mochila «Chequeo anual»', '6 documentos · vence en 3 días', 'Activo', 'gr', 'backpack');
const S3 = shC('Hemograma completo', 'Venció el 28 oct', 'Expirado', 'gray');
const S4 = shC('Fórmula · Losartán', 'Revocado el 15 oct', 'Revocado', 'red');
const shared = (first, over) => phone(`${mback('Compartidos', btn('Nuevo', 'sm', ic('plus', 15, '#fff', 2.6)))}${seg(['Todos', 'Activos', 'Inactivos'], 0)}${first}${S2}${S3}${S4}`, { tab: 'mas', ...(over ? { over } : {}) });

const none = t => `<span class="s">— ${t}</span>`;
const MAP2 = `<div class="card" style="width:900px;gap:6px"><div class="h2">Calendario y Compartidos</div><div class="sub">Las filas del día del Calendario y los enlaces compartidos siguen las mismas reglas, con las acciones que ya tienen sus hojas y detalles. Lo que solo tiene una acción no se desliza.</div><table style="width:100%;border-collapse:collapse;margin-top:6px"><thead><tr style="text-align:left;font:800 12px Nunito;letter-spacing:.06em;color:var(--color-text-secondary)"><th style="padding:8px 12px 8px 0">FILA</th><th style="padding:8px 12px">← IZQUIERDA (PRINCIPAL)</th><th style="padding:8px 12px">DERECHA →</th><th style="padding:8px 0 8px 12px">EN «MÁS»</th></tr></thead><tbody>
${mapRow('am', 'pill', 'Toma', pill('x', 'No la tomé'), `${pill('check', 'Tomar', 'gr')}<div class="s" style="margin-top:6px">Solo si está pendiente: es «Sí, la tomé», con toast y «Deshacer».</div>`, 'Sí, la tomé · la tomé a otra hora · no la tomé · ver medicamento. Las mismas opciones de «¿Tomaste esta dosis?»; sin grupo rojo')}
${mapRow('b', 'checkSquare', 'Tarea', pill('calendar', 'Reprogramar'), `${pill('check', 'Completar', 'gr')}<div class="s" style="margin-top:6px">Abre «Completar tarea» (comentario opcional).</div>`, 'Ver detalle · completar tarea · reprogramar · editar. Sin grupo rojo: hoy una tarea no se elimina')}
${mapRow('pk', 'calendar', 'Cita del día', pill('calendar', 'Reprogramar'), pill('check', 'Asistí', 'gr'), `La misma hoja «Más» de Citas · ${red('Cancelar cita, Eliminar cita')}`)}
${mapRow('em', 'heart', 'Check-in y paso de misión', none('sin deslizar'), none('sin deslizar'), 'Una sola acción («Hacer», «Ver»): tocar la fila basta.')}
${mapRow('b', 'link', 'Enlace compartido activo', pill('copy', 'Copiar enlace'), '<span class="s">—</span>', `Ver detalle · mostrar QR · copiar enlace · extender plazo, como en «Detalle compartido» · ${red('Revocar acceso')}`)}
${mapRow('gray', 'link', 'Enlace vencido o revocado', none('sin deslizar'), none('sin deslizar'), 'Solo se puede ver: tocar abre el detalle.', true)}
</tbody></table><div class="hint" style="margin-top:8px">${mas(32, 'point')}<span class="grow">Una toma ya registrada o una tarea completada pierden la acción de la derecha y conservan «Más».</span></div></div>`;
SW.m('Mapa · Calendario y Compartidos', MAP2, 'v2.35 · Filas del día y enlaces.');

SW.m('Calendario · toma a la derecha', calDay(calRows(swipe(E_TOMA, [act('ok', 'check', 'Tomar', 96)], 'left'))), 'El Calendario del módulo 3 sin cambios. La toma pendiente a la derecha: «Tomar», en verde, igual que su botón. El check-in y el paso de misión no se deslizan.');
SW.m('Calendario · tarea a la izquierda', phone(`${agHead(0)}<div class="h3">Hoy, martes 3</div>${calRows(E_TOMA, swipe(E_TAREA, [MORE(), act('brand', 'calendar', 'Reprogramar')], 'right'))}`, { tab: 'agenda', fab: 'plus' }), 'Con la lista desplazada (la semana quedó arriba). «Más» y «Reprogramar», como los botones de «Detalle de tarea». A la derecha, «Completar» en verde.');
SW.m('Calendario · toma a la izquierda', calDay(calRows(swipe(E_TOMA, [MORE(), act('brand', 'x', 'No la tomé')], 'right'))), '«No la tomé» es la otra respuesta de «¿Tomaste esta dosis?»: abre los motivos («Se me olvidó», «No lo compré», «Otro»).');

const tomaHead = sheetHead('am', 'pill', 'TOMA · HOY 1:00 P. M.', 'Metformina 850 mg');
SW.m('«Más» · Toma', calDay(calRows(), sheet(`${tomaHead}${card(optRow('check', 'Sí, la tomé', 'Se registra a la hora actual') + optRow('clock', 'La tomé a otra hora') + optRow('x', 'No la tomé', 'Elige el motivo') + optRow('pill', 'Ver medicamento'), 'tight')}`)), 'Las opciones de «¿Tomaste esta dosis?» (módulo 3) más ir al medicamento. «No la tomé» no va en rojo: es un registro, no un borrado.');
SW.m('«Más» · Tarea', calDay(calRows(), sheet(`${sheetHead('b', 'checkSquare', 'TAREA · HOY 5:00 P. M.', 'Recoger fórmula en la EPS')}${card(optRow('eye', 'Ver detalle') + optRow('check', 'Completar tarea', 'Con un comentario opcional') + optRow('calendar', 'Reprogramar') + optRow('edit', 'Editar'), 'tight')}`)), 'Las acciones de «Detalle de tarea» (módulo 3).');

SW.m('Compartidos · enlace activo', shared(swipe(S1, [MORE(), act('brand', 'copy', 'Copiar enlace')], 'right')), 'La lista del módulo 13 sin cambios. «Copiar enlace» es la principal. Los enlaces vencidos o revocados no se deslizan.');
SW.m('«Más» · Enlace compartido', shared(S1, sheet(`${sheetHead('b', 'link', 'COMPARTIDO · VENCE EN 24 H', 'Orden médica · Resonancia')}${card(optRow('eye', 'Ver detalle', 'Visto 3 veces') + optRow('qr', 'Mostrar QR') + optRow('copy', 'Copiar enlace') + optRow('clock', 'Extender plazo'), 'tight')}${card(dRow('x', 'Revocar acceso', 'El enlace deja de funcionar'), 'tight')}`)), 'Las acciones de «Detalle compartido» (módulo 13). «Revocar acceso» abre su confirmación (MASTER §7).');

}
