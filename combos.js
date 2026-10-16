/* Combos en la bienvenida (y, si se quiere, en el menú digital).
   Lee en vivo los combos de la categoría "Combos" de la app de pedidos:
   solo los NO descontinuados, en el mismo orden que la app (orden → id).
   Si se cambia precio, foto o disponibilidad en el admin, aquí se refleja solo.
   Si no hay combos o no hay internet, el botón no aparece.
   Para usarlo: poner <div id="combosBoton"></div> donde va el botón
   y <script src="/combos.js" defer></script> al final. */
(function () {
  'use strict';
  var SUPABASE_URL = 'https://rtfegumafcmgqmuxiwzh.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZmVndW1hZmNtZ3FtdXhpd3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTUzMzQsImV4cCI6MjEwMTg3MTMzNH0.TCgd7FBIHIPcZ3m6pejAPHXhwZPzrd3sC3PQSQXtkjA'; // llave pública (la misma que usa la app)
  var APP_URL = '/';

  var host = document.getElementById('combosBoton');
  if (!host) return;

  function api(ruta) {
    return fetch(SUPABASE_URL + '/rest/v1/' + ruta, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function dinero(n) { return '$' + Number(n || 0).toLocaleString('es-MX', { maximumFractionDigits: 2 }); }

  api('categorias?select=id,nombre&nombre=ilike.*combo*')
    .then(function (cats) {
      if (!cats || !cats.length) return [];
      var ids = cats.map(function (c) { return '"' + c.id + '"'; }).join(',');
      return api('productos?select=id,nombre,descripcion,precio_base,imagen_url,disponible,orden&descontinuado=eq.false&categoria_id=in.(' + ids + ')&order=orden.asc,id.asc');
    })
    .then(function (combos) { if (combos && combos.length) iniciar(combos); })
    .catch(function () { /* sin internet o error: no se muestra nada */ });

  function iniciar(combos) {
    var css = '' +
      '#combosBoton{width:100%;}' +
      /* El botón usa las clases .mosaico de la página; si la página no las tiene, este respaldo lo hace verse bien */
      '.cb-respaldo{display:flex;flex-direction:column;align-items:flex-start;gap:4px;width:100%;padding:14px;border-radius:18px;cursor:pointer;text-align:left;font:inherit;color:#FBF6EC;background:linear-gradient(150deg,rgba(227,177,85,.30),rgba(227,177,85,.08));border:1.5px solid rgba(227,177,85,.8);}' +
      '.cb-fondo{position:fixed;inset:0;background:rgba(0,0,0,.62);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);opacity:0;pointer-events:none;transition:opacity .25s ease;z-index:70;}' +
      '.cb-fondo.cb-abierta{opacity:1;pointer-events:auto;}' +
      '.cb-hoja{position:fixed;left:0;right:0;bottom:0;margin:0 auto;max-width:480px;max-height:92dvh;display:flex;flex-direction:column;z-index:71;text-align:left;color:#FBF6EC;font-family:Inter,-apple-system,sans-serif;' +
        'background:var(--hoja-fondo,linear-gradient(180deg,rgba(24,36,80,.96) 0%,rgba(9,16,40,.98) 100%));backdrop-filter:blur(18px) saturate(1.2);-webkit-backdrop-filter:blur(18px) saturate(1.2);' +
        'border:1.5px solid rgba(255,255,255,.2);border-bottom:none;border-radius:26px 26px 0 0;box-shadow:0 -18px 50px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.12);' +
        'transform:translateY(105%);visibility:hidden;transition:transform .3s cubic-bezier(.2,.8,.2,1),visibility 0s linear .3s;}' +
      '.cb-hoja.cb-abierta{transform:translateY(0);visibility:visible;transition:transform .3s cubic-bezier(.2,.8,.2,1);}' +
      '.cb-cab{padding:10px 18px 12px;flex-shrink:0;}' +
      '.cb-asa{width:42px;height:4px;border-radius:4px;background:rgba(255,255,255,.28);margin:0 auto 14px;}' +
      '.cb-cab-fila{display:flex;align-items:center;gap:12px;}' +
      '.cb-ico{width:42px;height:42px;border-radius:13px;background:rgba(227,177,85,.18);color:#E3B155;display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
      '.cb-ico svg{width:22px;height:22px;}' +
      '.cb-cab h2{flex:1;font-family:"Baloo 2",sans-serif;font-weight:800;font-size:18px;line-height:1.15;}' +
      '.cb-cab p{font-size:11.5px;opacity:.8;margin-top:1px;font-family:Inter,sans-serif;font-weight:400;}' +
      '.cb-x{width:36px;height:36px;border-radius:50%;flex-shrink:0;background:rgba(0,0,0,.35);border:1.5px solid rgba(255,255,255,.18);color:#FBF6EC;font-size:22px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;}' +
      '.cb-lista{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:2px 16px 8px;display:flex;flex-direction:column;gap:12px;-webkit-overflow-scrolling:touch;}' +
      '.cb-combo{flex-shrink:0;border-radius:20px;overflow:hidden;background:linear-gradient(160deg,rgba(255,255,255,.10),rgba(255,255,255,.04));border:1.5px solid rgba(255,255,255,.16);}' +
      '.cb-combo.cb-agotado{opacity:.55;}' +
      '.cb-foto{position:relative;aspect-ratio:16/10;background:rgba(255,255,255,.06) center/cover no-repeat;}' +
      '.cb-foto::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0) 45%,rgba(0,0,0,.85) 100%);}' +
      '.cb-precio{position:absolute;right:12px;bottom:10px;z-index:1;font-family:"Baloo 2",sans-serif;font-weight:800;font-size:28px;line-height:1;color:#E3B155;text-shadow:0 2px 10px rgba(0,0,0,.5);}' +
      '.cb-nombre{position:absolute;left:14px;bottom:12px;right:110px;z-index:1;font-family:"Baloo 2",sans-serif;font-weight:800;font-size:19px;line-height:1.1;text-shadow:0 2px 10px rgba(0,0,0,.6);}' +
      '.cb-marca{position:absolute;top:10px;left:10px;z-index:1;font-size:10.5px;font-weight:800;padding:3px 9px;border-radius:99px;}' +
      '.cb-marca.hoy{background:#FBF6EC;color:#0E1D46;}' +
      '.cb-marca.ago{background:#5A6178;color:#fff;}' +
      '.cb-cuerpo{padding:11px 14px 13px;}' +
      '.cb-desc{font-size:13px;line-height:1.45;opacity:.9;white-space:pre-line;}' +
      '.cb-pedir{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:11px;width:100%;text-decoration:none;font-family:"Baloo 2",sans-serif;font-weight:700;font-size:14.5px;color:#fff;border-radius:14px;padding:10px 14px;' +
        'background:linear-gradient(135deg,#FF9843 0%,#F07C1D 60%,#D96812 100%);box-shadow:0 8px 18px rgba(240,124,29,.32),inset 0 1px 0 rgba(255,255,255,.35);}' +
      '.cb-pie{flex-shrink:0;padding:10px 18px calc(16px + env(safe-area-inset-bottom,0px));font-size:11px;opacity:.65;text-align:center;line-height:1.45;border-top:1px solid rgba(255,255,255,.1);}' +
      '@media (prefers-reduced-motion:reduce){.cb-hoja,.cb-fondo,.cb-btn{transition:none;}}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    // ---------- botón ----------
    var ICO = '<svg viewBox="0 0 24 24" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d="M3 17.5h18"/><path d="M4.5 17.5a7.5 7.5 0 0 1 15 0"/><path d="M12 10V8.6"/><circle cx="12" cy="7.6" r="1"/><path d="M8 14.2a4.6 4.6 0 0 1 2.4-2.1"/><path d="M5 20h14"/></svg>';
    if (host.getAttribute('data-formato') === 'chip') {
      host.innerHTML = '<button type="button" class="atajo" aria-haspopup="dialog"><span class="atajo-ico">' + ICO + '<i class="fila-num">' + combos.length + '</i></span><span class="atajo-txt">Combos</span><span class="atajo-fl" aria-hidden="true">›</span></button>';
    } else if (host.getAttribute('data-formato') === 'fila') {
      // Renglón dentro del panel de la bienvenida (usa los estilos .fila de la página)
      host.innerHTML = '<button type="button" class="fila fila-dest" aria-haspopup="dialog"><span class="fila-ico">' + ICO + '<i class="fila-num">' + combos.length + '</i></span><span class="fila-txt"><span class="fila-tit">Combos</span><span class="fila-sub">Qué incluye cada uno</span></span><span class="fila-fl" aria-hidden="true">›</span></button>';
    } else {
      host.innerHTML = '<button type="button" class="cb-respaldo" aria-haspopup="dialog"><span class="mosaico-titulo">Combos</span><span class="mosaico-sub">Qué incluye cada uno</span></button>';
    }

    // ---------- ventana ----------
    var fondo = document.createElement('div'); fondo.className = 'cb-fondo';
    var hoja = document.createElement('div');
    hoja.className = 'cb-hoja'; hoja.setAttribute('role', 'dialog'); hoja.setAttribute('aria-modal', 'true'); hoja.setAttribute('aria-labelledby', 'cbTitulo'); hoja.setAttribute('aria-hidden', 'true');
    hoja.innerHTML =
      '<div class="cb-cab"><div class="cb-asa"></div><div class="cb-cab-fila">' +
        '<span class="cb-ico">' + ICO + '</span>' +
        '<h2 id="cbTitulo">Combos<p>Los puedes pedir en la app</p></h2>' +
        '<button type="button" class="cb-x" aria-label="Cerrar">&times;</button>' +
      '</div></div>' +
      '<div class="cb-lista">' + combos.map(function (c) {
        var ago = c.disponible === false;
        return '<article class="cb-combo' + (ago ? ' cb-agotado' : '') + '">' +
          '<div class="cb-foto"' + (c.imagen_url ? ' style="background-image:url(\'' + esc(c.imagen_url) + '\')"' : '') + '>' +
            (ago ? '<span class="cb-marca ago">Agotado hoy</span>' : '') +
            '<span class="cb-nombre">' + esc(c.nombre) + '</span>' +
            '<span class="cb-precio">' + dinero(c.precio_base) + '</span>' +
          '</div>' +
          '<div class="cb-cuerpo">' +
            (c.descripcion ? '<p class="cb-desc">' + esc(c.descripcion) + '</p>' : '') +
            (ago ? '' : '<a class="cb-pedir" href="' + APP_URL + '">Pedir este combo ›</a>') +
          '</div>' +
        '</article>';
      }).join('') + '</div>' +
      '<p class="cb-pie">Precios y disponibilidad de hoy. En la app eliges sabores y estilos de cada combo.</p>';
    document.body.appendChild(fondo); document.body.appendChild(hoja);

    var foco = null, enHistorial = false;
    function abrir() {
      foco = document.activeElement;
      fondo.classList.add('cb-abierta'); hoja.classList.add('cb-abierta'); hoja.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      // El botón "atrás" del celular cierra la ventana en lugar de salir de la página
      try { history.pushState({ cbCapa: 1 }, ''); enHistorial = true; } catch (e) {}
      setTimeout(function () { var x = hoja.querySelector('.cb-x'); if (x) x.focus(); }, 320);
    }
    function cerrar(desdeAtras) {
      if (!hoja.classList.contains('cb-abierta')) return;
      fondo.classList.remove('cb-abierta'); hoja.classList.remove('cb-abierta'); hoja.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      if (enHistorial && !desdeAtras) { enHistorial = false; try { history.back(); } catch (e) {} }
      enHistorial = false;
      if (foco && foco.focus) foco.focus();
    }
    host.querySelector('button').addEventListener('click', abrir);
    hoja.querySelector('.cb-x').addEventListener('click', function () { cerrar(false); });
    fondo.addEventListener('click', function () { cerrar(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrar(false); });
    window.addEventListener('popstate', function () { if (hoja.classList.contains('cb-abierta')) cerrar(true); });
  }
})();
