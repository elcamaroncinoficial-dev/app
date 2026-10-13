/* Promociones en la bienvenida y en el menú digital.
   Lee las MISMAS promociones activas que la app de pedidos (tabla "promociones", con el interruptor general "promo_activa").
   Si no hay promociones activas, o no hay internet, no se muestra nada. */
(function () {
  'use strict';
  var SUPABASE_URL = 'https://rtfegumafcmgqmuxiwzh.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0ZmVndW1hZmNtZ3FtdXhpd3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyOTUzMzQsImV4cCI6MjEwMTg3MTMzNH0.TCgd7FBIHIPcZ3m6pejAPHXhwZPzrd3sC3PQSQXtkjA'; // llave pública (la misma que usa la app de pedidos)

  var host = document.getElementById('promosBanner');
  if (!host) return;

  function api(ruta) {
    return fetch(SUPABASE_URL + '/rest/v1/' + ruta, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function formatVigencia(p) {
    var f = function (iso) { return new Date(iso + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }); };
    if (p.vigencia_inicio && p.vigencia_fin) return 'Válida del ' + f(p.vigencia_inicio) + ' al ' + f(p.vigencia_fin);
    if (p.vigencia_inicio) return 'Válida a partir del ' + f(p.vigencia_inicio);
    if (p.vigencia_fin) return 'Válida hasta el ' + f(p.vigencia_fin);
    return '';
  }

  Promise.all([api('configuracion?select=promo_activa&id=eq.1'), api('promociones?select=*&activa=eq.true&order=creado_en.desc')])
    .then(function (r) {
      var cfg = r[0] && r[0][0];
      var promos = (r[1] || []).filter(function (p) { return p.imagen_url; });
      if (!cfg || !cfg.promo_activa || !promos.length) return;
      iniciar(promos);
    })
    .catch(function () { /* sin internet o error: no se muestra nada */ });

  function iniciar(promos) {
    // ---------- estilos ----------
    var css = '' +
      '#promosBanner{width:100%;overflow:hidden;max-height:0;opacity:0;transition:max-height .4s ease,opacity .4s ease,margin .4s ease;}' +
      '#promosBanner.pb-visible{max-height:84px;opacity:1;}' +
      '#promosBanner.pb-listo{overflow:visible;}' +
      '#promosBanner.pb-en-bienvenida.pb-visible{margin-bottom:10px;}' +
      '#promosBanner.pb-en-menu{max-width:640px;margin:0 auto;padding:0 14px;box-sizing:border-box;}' +
      '#promosBanner.pb-en-menu.pb-visible{padding:10px 14px 2px;}' +
      '.pb-banner{position:relative;display:flex;align-items:center;gap:12px;width:100%;padding:7px 14px 7px 8px;border-radius:18px;cursor:pointer;text-align:left;color:#FBF6EC;font-family:"Inter",-apple-system,system-ui,sans-serif;background:linear-gradient(160deg,rgba(227,177,85,.22),rgba(227,177,85,.08));border:1.5px solid rgba(227,177,85,.55);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 10px 24px rgba(0,0,0,.28);animation:pb-pulso 3.2s ease-out infinite;transition:transform .15s ease;-webkit-tap-highlight-color:transparent;}' +
      '.pb-banner:active{transform:scale(.98);}' +
      '@keyframes pb-pulso{0%{box-shadow:0 10px 24px rgba(0,0,0,.28),0 0 0 0 rgba(227,177,85,.45)}70%,100%{box-shadow:0 10px 24px rgba(0,0,0,.28),0 0 0 9px rgba(227,177,85,0)}}' +
      '@media (prefers-reduced-motion:reduce){.pb-banner{animation:none}}' +
      '.pb-tile{position:relative;width:34px;height:34px;border-radius:11px;background:rgba(227,177,85,.22);color:#E3B155;display:flex;align-items:center;justify-content:center;flex-shrink:0;}' +
      '.pb-tile svg{width:18px;height:18px;}' +
      '.pb-num{position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 5px;border-radius:99px;box-sizing:border-box;background:linear-gradient(135deg,#FF9843,#F07C1D);color:#fff;font:700 11px/18px "Baloo 2",system-ui,sans-serif;font-style:normal;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.35);}' +
      '.pb-texto{flex:1;min-width:0;}' +
      '.pb-titulo{display:block;font-family:"Baloo 2",system-ui,sans-serif;font-weight:700;font-size:14.5px;line-height:1.2;}' +
      '.pb-sub{display:block;font-size:11px;opacity:.88;margin-top:1px;line-height:1.3;}' +
      '.pb-flecha{font-size:20px;opacity:.65;flex-shrink:0;line-height:1;}' +
      '@media (max-height:700px){body.pb-activo img.logo{width:min(22vw,88px)!important;margin-bottom:6px!important;}}' +
      '.pb-capa{position:fixed;inset:0;z-index:2147483000;display:none;text-align:left;font-family:"Inter",-apple-system,system-ui,sans-serif;}' +
      '.pb-capa.pb-abierta{display:block;}' +
      '#pb-detalle{background:rgba(5,8,20,.93);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);}' +
      '.pb-x{position:absolute;z-index:3;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,.35);border:1.5px solid rgba(255,255,255,.22);color:#FBF6EC;font-size:22px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:inherit;}' +
      '#pb-detalle .pb-x{top:max(14px,env(safe-area-inset-top,0px));right:14px;width:40px;height:40px;font-size:24px;}' +
      '.pb-detalle-cont{position:absolute;inset:0;}' +
      '.pb-gal-fondo{position:absolute;inset:0;background:rgba(4,7,18,.62);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);}' +
      '.pb-gal-hoja{position:absolute;left:0;right:0;bottom:0;margin:0 auto;max-width:480px;max-height:90vh;max-height:90dvh;overflow-y:auto;background:linear-gradient(180deg,rgba(24,36,80,.94) 0%,rgba(9,16,40,.97) 100%);backdrop-filter:blur(18px) saturate(1.2);-webkit-backdrop-filter:blur(18px) saturate(1.2);border:1.5px solid rgba(255,255,255,.2);border-bottom:none;border-radius:26px 26px 0 0;box-shadow:0 -18px 50px rgba(0,0,0,.45),inset 0 1px 0 rgba(255,255,255,.12);padding:10px 18px calc(20px + env(safe-area-inset-bottom,0px));color:#FBF6EC;}' +
      '.pb-asa{width:42px;height:4px;border-radius:4px;background:rgba(255,255,255,.28);margin:0 auto 14px;}' +
      '.pb-cab{display:flex;align-items:center;gap:12px;margin-bottom:14px;}' +
      '.pb-cab .pb-tile{width:42px;height:42px;border-radius:13px;}' +
      '.pb-cab .pb-tile svg{width:22px;height:22px;}' +
      '.pb-cab .pb-texto h2{margin:0;font-family:"Baloo 2",system-ui,sans-serif;font-weight:700;font-size:16.5px;line-height:1.2;color:#FBF6EC;}' +
      '.pb-cab .pb-texto p{margin:2px 0 0;font-size:11px;opacity:.85;line-height:1.3;}' +
      '.pb-gal-hoja .pb-x{position:static;flex-shrink:0;}' +
      '.pb-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}' +
      '.pb-card{display:block;padding:0;text-align:left;cursor:pointer;border-radius:16px;overflow:hidden;border:1.5px solid rgba(255,255,255,.22);background:rgba(255,255,255,.06);color:#FBF6EC;font-family:inherit;}' +
      '.pb-card:active{transform:scale(.98);}' +
      '.pb-card p{margin:0;padding:8px 10px;font-size:12px;line-height:1.3;font-weight:600;}';
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

    // ---------- franja ----------
    var n = promos.length;
    var TAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z"/><circle cx="7.5" cy="7.5" r="1.3"/></svg>';
    var sub = n === 1 ? '1 activa · toca para verla' : n + ' activas · toca para verlas';
    host.classList.add(document.querySelector('.barra-flotante') ? 'pb-en-menu' : 'pb-en-bienvenida');
    host.innerHTML = '<button type="button" class="pb-banner" aria-haspopup="dialog"><span class="pb-tile">' + TAG + '<i class="pb-num">' + n + '</i></span><span class="pb-texto"><span class="pb-titulo">Promociones</span><span class="pb-sub">' + sub + '</span></span><span class="pb-flecha" aria-hidden="true">›</span></button>';
    document.body.classList.add('pb-activo');
    requestAnimationFrame(function () { requestAnimationFrame(function () { host.classList.add('pb-visible'); }); });
    setTimeout(function () { host.classList.add('pb-listo'); }, 700);

    // ---------- capas (galería y detalle) ----------
    var galeria = document.createElement('div');
    galeria.className = 'pb-capa'; galeria.id = 'pb-galeria';
    galeria.setAttribute('role', 'dialog'); galeria.setAttribute('aria-modal', 'true'); galeria.setAttribute('aria-labelledby', 'pb-gal-titulo');
    galeria.innerHTML = '<div class="pb-gal-fondo"></div><div class="pb-gal-hoja"><div class="pb-asa"></div><div class="pb-cab"><span class="pb-tile">' + TAG + '</span><div class="pb-texto"><h2 id="pb-gal-titulo">Promociones</h2><p>Toca una para verla completa</p></div><button type="button" class="pb-x" aria-label="Cerrar">&times;</button></div><div class="pb-grid"></div></div>';
    var detalle = document.createElement('div');
    detalle.className = 'pb-capa'; detalle.id = 'pb-detalle';
    detalle.setAttribute('role', 'dialog'); detalle.setAttribute('aria-modal', 'true'); detalle.setAttribute('aria-label', 'Promoción');
    detalle.innerHTML = '<button type="button" class="pb-x" aria-label="Cerrar">&times;</button><div class="pb-detalle-cont"></div>';
    document.body.appendChild(galeria); document.body.appendChild(detalle);

    galeria.querySelector('.pb-grid').innerHTML = promos.map(function (p, i) {
      return '<button type="button" class="pb-card" data-i="' + i + '"><img src="' + esc(p.imagen_url) + '" loading="lazy" alt="Promoción ' + (i + 1) + '" style="display:block;width:100%;max-width:none;height:auto;aspect-ratio:4/5;object-fit:contain;background:#000;">' +
        (p.descripcion ? '<p>' + esc(p.descripcion) + '</p>' : '') + '</button>';
    }).join('');

    function renderDetalle(p) {
      var cont = detalle.querySelector('.pb-detalle-cont');
      var vig = formatVigencia(p);
      var vigHtml = vig ? '<p style="font-size:12.5px;color:rgba(255,255,255,.85);margin:6px 0 0;">' + vig + '</p>' : '';
      var pos = p.posicion_texto, hayTexto = !!p.descripcion, texto = hayTexto ? esc(p.descripcion) : '';
      var parrafo = '<p style="color:#fff;font-size:16px;line-height:1.3;font-weight:600;margin:0;">' + texto + '</p>' + vigHtml;
      var banda = (hayTexto && pos !== 'sobre') ? '<div style="flex:0 0 auto;padding:14px 20px;text-align:center;background:linear-gradient(160deg,#FFA451 0%,#F07C1D 55%,#C85E0E 100%);">' + parrafo + '</div>' : '';
      var sobre = (hayTexto && pos === 'sobre') ? '<div style="position:absolute;left:0;right:0;bottom:0;padding:56px 20px 18px;text-align:center;background:linear-gradient(to top,rgba(0,0,0,.78),transparent);">' + parrafo + '</div>' : '';
      var src = esc(p.imagen_url);
      // Marco de protección: la imagen siempre cabe completa en la pantalla (igual que en la app de pedidos)
      cont.innerHTML =
        '<div style="width:100%;height:100%;box-sizing:border-box;display:flex;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top,0px) + 62px) 16px calc(env(safe-area-inset-bottom,0px) + 16px);">' +
          '<div style="display:flex;flex-direction:column;width:min(100%,520px);max-height:100%;border-radius:24px;overflow:hidden;background:#000;border:1.5px solid rgba(255,255,255,.3);box-shadow:0 18px 50px rgba(0,0,0,.55);">' +
            (pos === 'arriba' ? banda : '') +
            '<div style="position:relative;flex:0 1 auto;min-height:0;display:flex;overflow:hidden;background:#000;">' +
              '<img src="' + src + '" alt="" aria-hidden="true" style="position:absolute;inset:0;width:100%;max-width:none;height:100%;object-fit:cover;filter:blur(22px) brightness(.55);transform:scale(1.15);">' +
              '<img src="' + src + '" alt="Promoción" style="position:relative;display:block;width:100%;max-width:none;height:auto;min-height:0;object-fit:contain;">' +
              sobre +
            '</div>' +
            ((pos !== 'arriba' && pos !== 'sobre') ? banda : '') +
          '</div></div>';
    }

    // ---------- abrir / cerrar (con el botón "atrás" del celular) ----------
    var enHistorial = false, vieneDeGaleria = false, foco = null, overflowPrevio = '';
    function hayCapa() { return galeria.classList.contains('pb-abierta') || detalle.classList.contains('pb-abierta'); }
    function bloquear() { if (!hayCapa()) return; overflowPrevio = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
    function desbloquear() { document.body.style.overflow = overflowPrevio; }
    function empujar() { if (!enHistorial) { try { history.pushState({ pbCapa: 1 }, ''); enHistorial = true; } catch (e) {} } }
    function cerrarTodo(desdeAtras) {
      var estabaAbierto = hayCapa();
      galeria.classList.remove('pb-abierta'); detalle.classList.remove('pb-abierta');
      vieneDeGaleria = false;
      if (estabaAbierto) desbloquear();
      if (enHistorial) { enHistorial = false; if (!desdeAtras) { try { history.back(); } catch (e) {} } }
      if (foco && foco.focus) { try { foco.focus(); } catch (e) {} }
    }
    function abrirGaleria() {
      if (!hayCapa()) { foco = document.activeElement; overflowPrevio = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
      detalle.classList.remove('pb-abierta'); galeria.classList.add('pb-abierta'); empujar();
      var x = galeria.querySelector('.pb-x'); if (x) x.focus();
    }
    function abrirDetalle(p, desdeGaleria) {
      if (!hayCapa()) { foco = document.activeElement; overflowPrevio = document.body.style.overflow; document.body.style.overflow = 'hidden'; }
      vieneDeGaleria = !!desdeGaleria;
      renderDetalle(p);
      galeria.classList.remove('pb-abierta'); detalle.classList.add('pb-abierta'); empujar();
      var x = detalle.querySelector('.pb-x'); if (x) x.focus();
    }
    function cerrarDetalle() {
      if (vieneDeGaleria) { vieneDeGaleria = false; detalle.classList.remove('pb-abierta'); galeria.classList.add('pb-abierta'); var x = galeria.querySelector('.pb-x'); if (x) x.focus(); }
      else cerrarTodo(false);
    }

    host.querySelector('.pb-banner').addEventListener('click', function () { if (promos.length === 1) abrirDetalle(promos[0], false); else abrirGaleria(); });
    galeria.querySelector('.pb-x').addEventListener('click', function () { cerrarTodo(false); });
    galeria.querySelector('.pb-gal-fondo').addEventListener('click', function () { cerrarTodo(false); });
    galeria.querySelectorAll('.pb-card').forEach(function (b) { b.addEventListener('click', function () { abrirDetalle(promos[Number(b.dataset.i)], true); }); });
    detalle.querySelector('.pb-x').addEventListener('click', function (e) { e.stopPropagation(); cerrarDetalle(); });
    detalle.querySelector('.pb-detalle-cont').addEventListener('click', cerrarDetalle);
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (detalle.classList.contains('pb-abierta')) cerrarDetalle(); else if (galeria.classList.contains('pb-abierta')) cerrarTodo(false);
    });
    window.addEventListener('popstate', function () { if (hayCapa() || enHistorial) cerrarTodo(true); });
  }
})();
