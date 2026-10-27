/* ==========================================================================
   ВЯЧЕСЛАВ ЛАРИОНОВ (SHAMAN) — v2
   Ванильный JS. Без зависимостей и без сборки.
   Список работ для лайтбокса берётся из DOM, поэтому добавление
   фотографии не требует правок здесь.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.dataset.motion = reduceMotion ? 'off' : 'on';
  // Ставим класс сразу: только после этого CSS вообще разрешает прятать
  // блоки. Если скрипт упал раньше — контент останется видимым.
  document.documentElement.classList.add('js');

  // Аварийный таймер: что бы ни случилось ниже, через 3 секунды
  // показываем всё, что осталось скрытым.
  var revealAll = function () {
    $$('.reveal').forEach(function (el) { el.classList.add('in', 'force-in'); });
  };
  setTimeout(function () {
    $$('.reveal:not(.in)').forEach(function (el) { el.classList.add('in', 'force-in'); });
  }, 3000);

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ------------------------------------------------------------ прелоадер */
  var pre = $('.preloader');
  if (pre) {
    var dropPre = function () {
      pre.classList.add('done');
      setTimeout(function () { if (pre.parentNode) pre.parentNode.removeChild(pre); }, 250);
    };
    if (document.readyState === 'complete' || document.readyState === 'interactive') dropPre();
    else {
      window.addEventListener('DOMContentLoaded', dropPre);
      window.addEventListener('load', dropPre);
      setTimeout(dropPre, 2500);
    }
  }

  /* ---------------------------------------------------- туман и искры костра */
  var canvas = $('.mist');
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    var blobs = [];
    var embers = [];
    var raf = null;

    function sizeCanvas() {
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function seed() {
      var count = window.innerWidth < 720 ? 5 : 9;
      blobs = [];
      for (var i = 0; i < count; i++) {
        blobs.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: 180 + Math.random() * 340,
          dx: (Math.random() - 0.5) * 0.16,
          dy: (Math.random() - 0.5) * 0.1,
          a: 0.012 + Math.random() * 0.022
        });
      }

      // Искры ритуального костра
      var emberCount = window.innerWidth < 720 ? 24 : 48;
      var colors = ['255,215,0', '255,100,15', '255,165,30', '245,60,20'];
      embers = [];
      for (var j = 0; j < emberCount; j++) {
        embers.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: Math.random() * 2.6 + 1.2,
          dy: Math.random() * 0.55 + 0.28,
          sway: Math.random() * 1.8 + 0.8,
          phase: Math.random() * Math.PI * 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          baseA: Math.random() * 0.45 + 0.45
        });
      }
    }

    function paint() {
      var w = window.innerWidth, h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // 1. Ритуальный туман
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        b.x += b.dx; b.y += b.dy;
        if (b.x < -b.r) b.x = w + b.r; if (b.x > w + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = h + b.r; if (b.y > h + b.r) b.y = -b.r;

        var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, 'rgba(212,175,55,' + b.a + ')');
        g.addColorStop(0.55, 'rgba(185,197,209,' + (b.a * 0.35) + ')');
        g.addColorStop(1, 'rgba(7,9,11,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Искры священного огня (летят снизу вверх с живым свечением)
      ctx.shadowBlur = 8;
      for (var k = 0; k < embers.length; k++) {
        var em = embers[k];
        em.y -= em.dy;
        em.phase += 0.025;
        var ex = em.x + Math.sin(em.phase) * em.sway;
        if (em.y < -15) {
          em.y = h + 15;
          em.x = Math.random() * w;
        }
        var currentAlpha = em.baseA * (0.65 + Math.sin(em.phase * 2.2) * 0.35);
        ctx.shadowColor = 'rgba(' + em.color + ',0.9)';
        ctx.fillStyle = 'rgba(' + em.color + ',' + currentAlpha.toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(ex, em.y, em.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      raf = window.requestAnimationFrame(paint);
    }

    sizeCanvas(); seed(); paint();

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { sizeCanvas(); seed(); }, 200);
    });

    // не жжём батарею в фоновой вкладке
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { if (raf) { cancelAnimationFrame(raf); raf = null; } }
      else if (!raf) { paint(); }
    });
  } else if (canvas) {
    canvas.style.background =
      'radial-gradient(90% 60% at 50% 0%, rgba(212,175,55,.09), transparent 60%)';
  }

  /* -------------------------------------------------------------------- шапка */
  /* ----------------------------------------------------------------- шапка */
  var nav = $('.nav');
  var burger = $('.nav__burger');
  var links  = $('.nav__links');

  if (nav) {
    var lastY = window.scrollY || 0;
    var onScroll = function () {
      if (links && links.classList.contains('open')) return;
      var y = window.scrollY || 0;
      nav.classList.toggle('is-solid', y > 40);
      if (y > 420 && y > lastY + 4) nav.classList.add('is-hidden');
      else if (y < lastY - 4) nav.classList.remove('is-hidden');
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  if (burger && links) {
    burger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-locked', open);
    });

    links.addEventListener('click', function (e) {
      if (e.target.closest('a') && links.classList.contains('open')) {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('is-locked');
      }
    });

    document.addEventListener('click', function (e) {
      if (links.classList.contains('open') && !e.target.closest('.nav')) {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('is-locked');
      }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('open')) {
        links.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('is-locked');
      }
    });
  }

  /* --------------------------------------------------------------- появление */
  var revealables = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealables.forEach(function (el, i) {
      el.style.transitionDelay = Math.min(i % 4, 3) * 90 + 'ms';
      io.observe(el);
    });
  } else {
    revealables.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------------------------------------------------- счётчик в тексте */
  var countEls = $$('[data-count]');
  if (countEls.length && 'IntersectionObserver' in window) {
    // Сразу ставим верное значение: если наблюдатель почему-то не сработает
    // (элемент не попал в 40% вьюпорта), пользователь не должен увидеть «0».
    countEls.forEach(function (el) { el.textContent = String(parseInt(el.dataset.count, 10) || 0); });

    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var target = parseInt(el.dataset.count, 10) || 0;
        if (reduceMotion) { el.textContent = String(target); cio.unobserve(el); return; }
        var t0 = null, dur = 1100;
        var step = function (ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(step);
        };
        el.textContent = '0';
        requestAnimationFrame(step);
        cio.unobserve(el);
      });
    }, { threshold: 0.4 });
    countEls.forEach(function (el) { cio.observe(el); });
  }

  /* --------------------------------------------------- полоса и отсвет курсора */
  var bar = $('.progress');
  if (bar) {
    var ticking = false;
    var upd = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (h > 0 ? (window.scrollY / h) * 100 : 0) + '%';
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(upd); }
    }, { passive: true });
    upd();
  }

  var spot = $('.spotlight');
  if (spot && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    var mx = 0, my = 0, tx = 0, ty = 0, live = false;
    window.addEventListener('pointermove', function (e) {
      tx = e.clientX; ty = e.clientY;
      if (!live) { live = true; spot.style.opacity = '1'; }
    }, { passive: true });
    (function loop() {
      mx += (tx - mx) * 0.08;
      my += (ty - my) * 0.08;
      spot.style.setProperty('--mx', mx + 'px');
      spot.style.setProperty('--my', my + 'px');
      requestAnimationFrame(loop);
    })();
  }

  /* ------------------------------------------------- буквы заголовка и параллакс */
  var hTitle = $('.hero__title');
  var SEP_SVG =
    '<svg viewBox="0 0 40 40" aria-hidden="true" focusable="false">' +
    '<circle cx="20" cy="20" r="7" fill="none" stroke="currentColor" stroke-width="2.6"/>' +
    '<circle cx="20" cy="20" r="14.5" fill="none" stroke="currentColor" stroke-width="1.3" stroke-dasharray="2.2 5.5"/>' +
    '<path d="M20 1.5v6M20 32.5v6M1.5 20h6M32.5 20h6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>' +
    '</svg>';

  if (hTitle) {
    /* Слова берём из готовых .wd. Разбивать textContent нельзя: в шаблоге между
       span'ами нет пробела, и «ВячеславЛарионов» приходит одним куском —
       тогда разделитель не вставляется ни разу. */
    var words = [].slice.call(hTitle.querySelectorAll('.wd'));
    if (words.length < 2) {
      words = hTitle.textContent.trim().split(/\s+/).filter(Boolean);
    }
    var texts = words.map(function (w) { return w.textContent.trim(); });

    hTitle.textContent = '';
    texts.forEach(function (word, wi) {
      var ws = document.createElement('span');
      ws.className = 'wd';
      word.split('').forEach(function (ch, ci) {
        var s = document.createElement('span');
        s.className = 'ch';
        s.textContent = ch;
        s.style.transitionDelay = ((wi * 2 + ci) * 26) + 'ms';
        if (reduceMotion) s.style.transitionDelay = '0ms';
        ws.appendChild(s);
      });
      hTitle.appendChild(ws);
      if (wi < texts.length - 1) {
        var sep = document.createElement('span');
        sep.className = 'wdsep';
        sep.setAttribute('aria-hidden', 'true');
        sep.innerHTML = SEP_SVG;
        hTitle.appendChild(sep);
      }
    });
    requestAnimationFrame(function () { hTitle.classList.add('hm-ready'); });
  }

  var heroMedia = $('.hero__media');
  if (heroMedia && !reduceMotion) {
    var pt = false;
    window.addEventListener('scroll', function () {
      if (pt) return; pt = true;
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y < window.innerHeight * 1.2) {
          heroMedia.style.transform = 'translate3d(0,' + (y * 0.22) + 'px,0) scale(' + (1 + y * 0.00012) + ')';
        }
        pt = false;
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------------- лайтбокс */
  var lb = $('.lb');
  if (!lb) return;  // на странице нет разметки лайтбокса — остальное уже отработало

  var lbImg = $('.lb__img', lb);
  var lbCap = $('.lb__caption', lb);
  var lbPos = $('.lb__pos', lb);
  var lbClose = $('.lb__close', lb);
  var lbPrev = $('.lb__btn--prev', lb);
  var lbNext = $('.lb__btn--next', lb);
  var lbStage = $('.lb__stage', lb);

  /* ---------------- клик-зум по фото (как на рабочем сайте) ---------------- */
  var isZoomed = false;

  function resetZoom() {
    if (!isZoomed) return;
    isZoomed = false;
    lb.classList.remove('is-zoomed');
    lbImg.classList.remove('is-zoom');
    lbImg.style.transform = '';
    lbImg.style.transformOrigin = '';
  }

  function toggleZoom(e) {
    if (isZoomed) {
      resetZoom();
      return;
    }
    isZoomed = true;
    lb.classList.add('is-zoomed');
    lbImg.classList.add('is-zoom');

    var rect = lbImg.getBoundingClientRect();
    var cx = (e && typeof e.clientX === 'number') ? e.clientX : (rect.left + rect.width / 2);
    var cy = (e && typeof e.clientY === 'number') ? e.clientY : (rect.top + rect.height / 2);

    var ox = Math.max(0, Math.min(100, ((cx - rect.left) / (rect.width || 1)) * 100));
    var oy = Math.max(0, Math.min(100, ((cy - rect.top) / (rect.height || 1)) * 100));

    lbImg.style.transformOrigin = ox + '% ' + oy + '%';
    lbImg.style.transform = 'scale(2.2)';
  }

  function normalizeUrl(url) {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
      return url;
    }
    return '/' + url;
  }

  // единственный источник правды — разметка
  var shots = $$('.shot').map(function (el, i) {
    return {
      full: normalizeUrl(el.dataset.full),
      cap:  el.dataset.caption || ('Работа ' + (i + 1)),
      series: el.dataset.series || '',
      tech: el.dataset.tech || '',
      year: el.dataset.year || '',
      status: el.dataset.status || '',
      i: i + 1,
      el: el
    };
  });

  var current = 0;
  var opener = null;
  var FOCUSABLE = 'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])';

  function preload(n) {
    if (n < 0 || n >= shots.length) return;
    var im = new Image();
    im.src = shots[n].full;
  }

  function render() {
    var s = shots[current];
    if (!s) return;
    lbImg.classList.remove('is-loaded');
    lbImg.src = normalizeUrl(s.full);
    lbImg.alt = s.cap;
    var tags = [];
    if (s.series) tags.push('<span class="lb__tag lb__tag--series">' + s.series + '</span>');
    if (s.tech) tags.push('<span class="lb__tag lb__tag--tech">' + s.tech + '</span>');
    if (s.year) tags.push('<span class="lb__tag lb__tag--year">' + s.year + '</span>');
    if (s.status) tags.push('<span class="lb__tag lb__tag--status">' + s.status + '</span>');
    lbCap.innerHTML = '<div class="lb__card">' +
      '<div class="lb__title">' + s.cap + '</div>' +
      (tags.length ? '<div class="lb__meta">' + tags.join('') + '</div>' : '') +
      '</div>';
    lbPos.textContent = (current + 1) + ' / ' + shots.length;
    lbImg.onload = function () { lbImg.classList.add('is-loaded'); };
    preload(current + 1);
    preload(current - 1);
  }

  function open(index, from) {
    current = index;
    opener = from || null;
    render();
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    lbClose.focus();
  }

  function close() {
    resetZoom();
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('is-locked');
    lbImg.removeAttribute('src');
    if (opener) opener.focus();
  }

  function go(step) {
    current = (current + step + shots.length) % shots.length;
    render();
  }

  // Делегирование клика на документе для надежного открытия ЛЮБЫХ фото
  document.addEventListener('click', function (e) {
    // 1. Проверяем клик по интерактивной карточке .shot
    var card = e.target.closest && e.target.closest('.shot');
    if (card) {
      var normCardFull = normalizeUrl(card.dataset.full);
      var idx = shots.findIndex(function (s) {
        return s.el === card || (normCardFull && s.full === normCardFull);
      });
      if (idx > -1) {
        playDrum(0.9);
        triggerShockwave(e.clientX, e.clientY);
        open(idx, card);
        return;
      }
    }

    // 2. Страховка: клик по любому изображению на странице
    var img = e.target.closest && e.target.closest('img');
    if (img && !img.closest('.lb') && !img.closest('.preloader')) {
      var rawSrc = img.currentSrc || img.src || img.getAttribute('src');
      if (!rawSrc || rawSrc.includes('mc.yandex.ru') || rawSrc.includes('data:')) return;

      if (img.closest('a') && !img.closest('.work__media') && !img.closest('.hero__portrait') && !img.closest('.manifest__figure')) {
        return;
      }

      var fullUrl = img.dataset.full || rawSrc;
      if (img.srcset) {
        var parts = img.srcset.split(',').map(function (s) { return s.trim(); });
        var best = parts[parts.length - 1];
        if (best) {
          var bestUrl = best.split(' ')[0];
          if (bestUrl) fullUrl = bestUrl;
        }
      }
      var normFull = normalizeUrl(fullUrl);
      var caption = img.alt || img.title || 'Вячеслав Ларионов · Русский Север';

      var existingIdx = shots.findIndex(function (s) {
        return s.el === img || s.full === normFull;
      });

      if (existingIdx > -1) {
        playDrum(0.9);
        triggerShockwave(e.clientX, e.clientY);
        open(existingIdx, img);
      } else {
        var newShot = {
          full: normFull,
          cap: caption,
          series: 'Русский Север',
          tech: 'Фотография',
          year: '',
          status: '',
          i: shots.length + 1,
          el: img
        };
        shots.push(newShot);
        playDrum(0.9);
        triggerShockwave(e.clientX, e.clientY);
        open(shots.length - 1, img);
      }
    }
  });

  lbPrev.addEventListener('click', function () { playDrum(0.4); go(-1); });
  lbNext.addEventListener('click', function () { playDrum(0.4); go(1); });
  lbClose.addEventListener('click', close);

  // Клик по фото переключает увеличение (зум)
  lbImg.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleZoom(e);
  });

  // Плавное панорамирование за курсором мыши при увеличении
  if (lbStage) {
    lbStage.addEventListener('pointermove', function (e) {
      if (!isZoomed || e.pointerType === 'touch') return;
      var rect = lbStage.getBoundingClientRect();
      var ox = Math.max(0, Math.min(100, ((e.clientX - rect.left) / (rect.width || 1)) * 100));
      var oy = Math.max(0, Math.min(100, ((e.clientY - rect.top) / (rect.height || 1)) * 100));
      lbImg.style.transformOrigin = ox + '% ' + oy + '%';
    });
  }

  lb.addEventListener('click', function (e) {
    if (isZoomed) {
      resetZoom();
      return;
    }
    if (e.target === lb || e.target === lbStage) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') { e.preventDefault(); if (isZoomed) { resetZoom(); } else { close(); } }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    else if (e.key === 'Tab') {
      // ловушка фокуса
      var f = $$(FOCUSABLE, lb);
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ------------------------------------------------------------ свайп на тач */
  var x0 = null, dx = 0;
  lbImg.addEventListener('touchstart', function (e) {
    x0 = e.touches[0].clientX; dx = 0;
    lbImg.classList.add('is-dragging');
  }, { passive: true });

  lbImg.addEventListener('touchmove', function (e) {
    if (x0 === null) return;
    dx = e.touches[0].clientX - x0;
    lbImg.style.transform = 'translateX(' + dx * 0.35 + 'px)';
  }, { passive: true });

  function endSwipe() {
    if (x0 === null) return;
    lbImg.classList.remove('is-dragging');
    lbImg.style.transform = '';
    if (Math.abs(dx) > 55) go(dx < 0 ? 1 : -1);
    x0 = null;
  }
  lbImg.addEventListener('touchend', endSwipe, { passive: true });
  lbImg.addEventListener('touchcancel', endSwipe, { passive: true });

  /* --------------------------------------------------- показ номера по клику */
  var phoneBtn = $('#phoneBtn');
  var phoneDisplay = $('#phoneDisplay');
  var phoneDigits = $('#phoneDigits');
  var phoneHint = $('#phoneHint');

  if (phoneBtn && phoneDisplay && phoneDigits) {
    var revealed = false;
    var revealPhone = function () {
      if (revealed) return;
      revealed = true;
      var raw = ['+', '7', '9', '9', '6', '9', '2', '0', '8', '3', '2', '2'].join('');
      var formatted = '+7 996 920-83-22';
      phoneDigits.textContent = formatted;

      var link = document.createElement('a');
      link.className = 'cta__phone-num revealed';
      link.href = 'tel:' + raw;
      link.setAttribute('aria-label', 'Позвонить Вячеславу Ларионову: ' + formatted);
      link.innerHTML = phoneDisplay.innerHTML;
      phoneDisplay.parentNode.replaceChild(link, phoneDisplay);

      if (phoneBtn && phoneBtn.parentNode) {
        phoneBtn.parentNode.removeChild(phoneBtn);
      }
      if (phoneHint) {
        phoneHint.textContent = 'Нажмите на номер, чтобы позвонить';
      }
    };

    phoneBtn.addEventListener('click', revealPhone);
    phoneDisplay.addEventListener('click', revealPhone);
    phoneDisplay.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        revealPhone();
      }
    });
  }

  /* ==========================================================================
     ШАМАНСКИЙ САУНД-ДИЗАЙН (WEB AUDIO API)
     Чистый процедурный синтез в реальном времени. Вес: 0 КБ.
     ========================================================================== */
  var audioCtx = null;
  var masterGain = null;
  var droneOsc1 = null;
  var droneOsc2 = null;
  var droneGain = null;
  var windSource = null;
  var windGain = null;
  var isAudioPlaying = false;

  function initAudio() {
    if (audioCtx) return;
    try {
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.75, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
    } catch (e) {}
  }

  function playDrum(velocity) {
    try {
      if (!audioCtx) initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var t = audioCtx.currentTime;
      var v = typeof velocity === 'number' ? velocity : 0.85;

      // 1. Мембрана бубна (нисходящий фундаментальный тон с мощным ударом)
      var osc1 = audioCtx.createOscillator();
      var gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(135, t);
      osc1.frequency.exponentialRampToValueAtTime(38, t + 0.42);

      gain1.gain.setValueAtTime(0.85 * v, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
      osc1.connect(gain1);
      gain1.connect(masterGain);
      osc1.start(t);
      osc1.stop(t + 1.0);

      // 2. Деревянный обод и низкий резонанс
      var osc2 = audioCtx.createOscillator();
      var gain2 = audioCtx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(78, t);
      osc2.frequency.exponentialRampToValueAtTime(48, t + 0.5);

      gain2.gain.setValueAtTime(0.45 * v, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc2.start(t);
      osc2.stop(t + 0.7);

      // 3. Удар колотушки по коже (шумовой импульс с НЧ-фильтром)
      var bufferLen = Math.floor(audioCtx.sampleRate * 0.05);
      var buffer = audioCtx.createBuffer(1, bufferLen, audioCtx.sampleRate);
      var d = buffer.getChannelData(0);
      for (var i = 0; i < bufferLen; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferLen * 0.28));
      }
      var noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      var filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(750, t);
      var noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.55 * v, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(t);
      noise.stop(t + 0.08);

      // 4. Подвески / колокольчики на ободе
      var chime = audioCtx.createOscillator();
      var chimeGain = audioCtx.createGain();
      chime.type = 'sine';
      chime.frequency.setValueAtTime(432, t);
      chimeGain.gain.setValueAtTime(0.06 * v, t);
      chimeGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
      chime.connect(chimeGain);
      chimeGain.connect(masterGain);
      chime.start(t);
      chime.stop(t + 0.45);
    } catch (err) {}
  }

  function startAmbient() {
    try {
      if (!audioCtx) initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      var t = audioCtx.currentTime;

      // Медитативный низкий гул (дрон 55 Гц + 110.2 Гц с медленным биением)
      droneOsc1 = audioCtx.createOscillator();
      droneOsc1.type = 'sine';
      droneOsc1.frequency.setValueAtTime(55, t);

      droneOsc2 = audioCtx.createOscillator();
      droneOsc2.type = 'triangle';
      droneOsc2.frequency.setValueAtTime(110.25, t);

      var droneFilter = audioCtx.createBiquadFilter();
      droneFilter.type = 'lowpass';
      droneFilter.frequency.setValueAtTime(160, t);

      droneGain = audioCtx.createGain();
      droneGain.gain.setValueAtTime(0.001, t);
      droneGain.gain.linearRampToValueAtTime(0.24, t + 2.5);

      droneOsc1.connect(droneFilter);
      droneOsc2.connect(droneFilter);
      droneFilter.connect(droneGain);
      droneGain.connect(masterGain);

      droneOsc1.start(t);
      droneOsc2.start(t);

      // Северный ветер (розовый шум с плавающим полосовым фильтром)
      var windLen = Math.floor(audioCtx.sampleRate * 2.5);
      var windBuf = audioCtx.createBuffer(1, windLen, audioCtx.sampleRate);
      var wd = windBuf.getChannelData(0);
      var b0 = 0, b1 = 0, b2 = 0;
      for (var j = 0; j < windLen; j++) {
        var w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.96900 * b2 + w * 0.1538520;
        wd[j] = (b0 + b1 + b2 + w * 0.05) * 0.14;
      }
      windSource = audioCtx.createBufferSource();
      windSource.buffer = windBuf;
      windSource.loop = true;

      var windFilter = audioCtx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(380, t);
      windFilter.Q.setValueAtTime(2.2, t);

      // LFO для завываний ветра
      var lfo = audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(0.09, t);
      var lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(220, t);
      lfo.connect(windFilter.frequency);
      lfo.start(t);

      windGain = audioCtx.createGain();
      windGain.gain.setValueAtTime(0.001, t);
      windGain.gain.linearRampToValueAtTime(0.19, t + 3.0);

      windSource.connect(windFilter);
      windFilter.connect(windGain);
      windGain.connect(masterGain);
      windSource.start(t);

      // Удар бубна в начале практики
      playDrum(0.7);
    } catch (err) {}
  }

  function stopAmbient() {
    try {
      if (!audioCtx || !droneGain) return;
      var t = audioCtx.currentTime;
      droneGain.gain.linearRampToValueAtTime(0.001, t + 1.2);
      if (windGain) windGain.gain.linearRampToValueAtTime(0.001, t + 1.2);
      setTimeout(function () {
        try {
          if (droneOsc1) { droneOsc1.stop(); droneOsc1.disconnect(); droneOsc1 = null; }
          if (droneOsc2) { droneOsc2.stop(); droneOsc2.disconnect(); droneOsc2 = null; }
          if (windSource) { windSource.stop(); windSource.disconnect(); windSource = null; }
        } catch (e) {}
      }, 1300);
    } catch (err) {}
  }

  var audioBtn = $('#audioToggle');
  if (audioBtn) {
    audioBtn.addEventListener('click', function () {
      initAudio();
      isAudioPlaying = !isAudioPlaying;
      if (isAudioPlaying) {
        startAmbient();
        audioBtn.classList.add('is-playing');
        audioBtn.setAttribute('aria-label', 'Выключить ритуальный звук Севера');
      } else {
        stopAmbient();
        audioBtn.classList.remove('is-playing');
        audioBtn.setAttribute('aria-label', 'Включить ритуальный звук Севера');
      }
    });
  }

  function triggerShockwave(x, y) {
    var wave = $('#ritualShockwave');
    if (!wave) return;
    wave.style.left = (typeof x === 'number' ? x : window.innerWidth / 2) + 'px';
    wave.style.top = (typeof y === 'number' ? y : window.innerHeight / 2) + 'px';
    wave.classList.remove('is-active');
    void wave.offsetWidth;
    wave.classList.add('is-active');
  }

  /* ---------------------------------------------------- Шаманский факел во тьме */
  var torch = $('#torchlight');
  if (torch && !reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    torch.classList.add('is-active');
    window.addEventListener('pointermove', function (e) {
      torch.style.setProperty('--tx', e.clientX + 'px');
      torch.style.setProperty('--ty', e.clientY + 'px');
    }, { passive: true });
    document.addEventListener('mouseleave', function () {
      torch.classList.remove('is-active');
    });
    document.addEventListener('mouseenter', function () {
      torch.classList.add('is-active');
    });
  }

  /* -------------------------------------------------- 3D-наклон и блик экспонатов */
  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var shotCards = $$('.shot');
    shotCards.forEach(function (card) {
      var glare = document.createElement('div');
      glare.className = 'shot__glare';
      card.appendChild(glare);

      card.addEventListener('pointermove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left;
        var y = e.clientY - rect.top;
        var dx = (x / rect.width) - 0.5;
        var dy = (y / rect.height) - 0.5;
        var rotX = (-dy * 11).toFixed(2);
        var rotY = (dx * 11).toFixed(2);
        card.style.transform = 'perspective(850px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) scale3d(1.025, 1.025, 1.025)';
        glare.style.setProperty('--gx', (x / rect.width * 100).toFixed(1) + '%');
        glare.style.setProperty('--gy', (y / rect.height * 100).toFixed(1) + '%');
      }, { passive: true });

      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }

})();
