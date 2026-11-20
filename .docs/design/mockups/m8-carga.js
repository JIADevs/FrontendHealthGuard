/* Módulo 11 · Estados de carga (esqueletos)
   Cada esqueleto se genera a partir de la MISMA pantalla de los módulos anteriores, así coincide
   exacto con lo que va a aparecer (nada se mueve al llegar el contenido).
   Reglas: system/pages/movimiento-interacciones.md §6c · demo animada: system/movimiento.html («Estados de carga»).

   Qué queda real y qué pasa a esqueleto:
   - Real: lo fijo de la pantalla (barra de estado, encabezado, pestañas internas, buscador, filtros,
     barra inferior, barra de acción, botón flotante), la mascota y los íconos sueltos (son locales).
   - Esqueleto de texto (.skt): todo texto que viene del servidor; la barra mide lo mismo que el texto.
   - Bloque (.skb): cuadros de ícono, chips, botones dentro del contenido, avatares, barras, anillos,
     avisos y cualquier bloque con fondo de color.
   - Las tarjetas se quedan (son la forma), pero sin color de acento. */
{
const L=mod('carga','11 · Estados de carga','Esqueletos de las pantallas principales. Cada uno sale de la misma pantalla de los módulos 2 a 6, por eso tiene exactamente su forma: lo fijo (encabezado, pestañas, buscador, filtros, barra inferior) se ve real y solo es esqueleto lo que llega del servidor. En la app, los bloques llevan un brillo de 1,4 s (aquí quedan quietos) y el contenido entra con fundido de 150 ms, por grupos. Reglas: system/pages/movimiento-interacciones.md §6c.');
const CHROME='.sbar,.mhead,.tabbar,.seg,.search,.bbar,.fab,.homeind,.pick,.side,.wtop';
const BLOCK='.tile,.chip,.btn,.avatar,.dot,.bar,.banner,.hint,.iconbtn,.inp,.toast';
function skel(html){
 const t=document.createElement('template');t.innerHTML=html.trim();const ph=t.content.firstElementChild;ph.classList.add('skel');
 /* anillos y gráficos: el contenedor del svg pasa a bloque redondo */
 ph.querySelectorAll('svg').forEach(s=>{if(s.closest(CHROME)||s.classList.contains('mascot')||s.closest('.mascot'))return;const w=+s.getAttribute('width')||0;if(w>=40&&s.parentElement&&s.parentElement!==ph){const p=s.parentElement;p.classList.add('skb');p.style.borderRadius='50%'}});
 ph.querySelectorAll('*').forEach(el=>{
  if(el===ph||el.closest(CHROME)||el.closest('.skb')||el.closest('.skt'))return;
  if(el.closest('svg'))return;
  if(el.matches(BLOCK)){el.classList.add('skb');return}
  if(el.classList.contains('card'))return;
  const st=el.getAttribute('style')||'';
  if(/background(-color)?\s*:/.test(st)&&!/background\s*:\s*(none|transparent)/.test(st)){el.classList.add('skb');return}
  const hasText=[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
  if(hasText)el.classList.add('skt');
 });
 return ph.outerHTML;
}
const pick=(modId,name)=>{const m=MODS.find(x=>x.id===modId);const s=m&&m.mob.find(x=>x.n===name);if(!s)throw new Error('No existe la pantalla '+modId+' › '+name);return s.h};
[
 ['inicio','Inicio','Inicio','El saludo y la mascota son locales y se ven al instante; medicamentos de hoy, próxima cita y racha son esqueleto. Los botones «Tomar» tienen su bloque: no empujan el texto al llegar.'],
 ['agenda','Calendario','Agenda · Calendario','Las pestañas internas y el botón «+» son reales. Los días de la semana son bloques; las filas del día conservan su forma, sin el color del tipo.'],
 ['agenda','Detalle de cita','Detalle de cita','La barra con volver y compartir es real. El encabezado de la cita, los datos y las acciones son esqueleto.'],
 ['docs','Documentos','Documentos','Buscador y filtros funcionan desde el inicio. La lista es esqueleto por grupos (fecha + filas), igual que la lista real.'],
 ['docs','Detalle de documento','Detalle de documento','La vista previa tiene su proporción reservada; los datos que leyó la IA son pares etiqueta–valor en esqueleto.'],
 ['mochilas','Mochilas','Mochilas','Buscador real; cada mochila es una tarjeta con su ícono, nombre y chips en esqueleto.'],
 ['mochilas','Detalle de mochila','Detalle de mochila','Encabezado, «Compartir mochila» y el contenido de la mochila son esqueleto; la barra con volver es real.'],
 ['misiones','Detalle de misión','Detalle de misión','El encabezado (tipo, objetivo, barra) y la línea de pasos conservan su forma. La barra de progreso aparece en su valor, sin animar desde 0 al cargar.'],
].forEach(([mid,src,name,note])=>L.m(name+' · cargando',skel(pick(mid,src)),note));
/* v2.8 · web (W-14): la barra lateral y la cabecera son reales; lo demás, igual que en móvil */
const pickW=(modId,name)=>{const m=MODS.find(x=>x.id===modId);const s=m&&m.web.find(x=>x.n===name);if(!s)throw new Error('No existe la pantalla web '+modId+' › '+name);return s.h};
[
 ['inicio','Inicio','Inicio','El saludo y la mascota son locales. Las tarjetas mantienen su lugar en la grilla, así nada salta al llegar los datos.'],
 ['docs','Documentos','Documentos','Buscador y filtros funcionan desde el inicio; cada documento es una tarjeta en esqueleto.'],
 ['docs','Detalle de documento','Detalle de documento','La lista y el panel cargan a la vez; la vista previa tiene su alto reservado.'],
 ['mochilas','Mochilas','Mochilas','Buscador real; las mochilas y el panel de detalle son esqueleto.'],
].forEach(([mid,src,name,note])=>L.w(name+' · cargando',skel(pickW(mid,src)),'v2.8 · Nuevo en web (W-14). '+note));
}
