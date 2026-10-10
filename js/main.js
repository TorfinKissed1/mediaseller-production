(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;
  var cases = toArray(document.querySelectorAll('[data-case]'));
  var lockCount = 0;

  initMenu();
  initHeader();
  initHeroVideo();
  initMarquee();
  initSliders();
  initShowcase();
  initPreviews();
  initPlayer();
  initRequestModal();
  initFaq();
  initForms();
  initReveal();
  initAutoplay();
  initFloatCta();

  function toArray(list) {
    return Array.prototype.slice.call(list);
  }

  function lockScroll() {
    lockCount += 1;
    if (lockCount > 1) {
      return;
    }
    var scrollbar = window.innerWidth - root.clientWidth;
    document.body.style.paddingRight = scrollbar ? scrollbar + 'px' : '';
    root.classList.add('is-locked');
  }

  function unlockScroll() {
    lockCount = Math.max(0, lockCount - 1);
    if (lockCount) {
      return;
    }
    document.body.style.paddingRight = '';
    root.classList.remove('is-locked');
  }

  function trapFocus(container, event) {
    if (event.key !== 'Tab') {
      return;
    }
    var focusable = toArray(container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, video[controls]'))
      .filter(function (element) {
        return element.offsetParent !== null;
      });
    if (!focusable.length) {
      return;
    }
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (!container.contains(document.activeElement)) {
      event.preventDefault();
      first.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function createModal(modal, onClose) {
    var opener = null;

    function open(trigger) {
      if (modal.classList.contains('is-open')) {
        return;
      }
      opener = trigger || document.activeElement;
      if (opener && opener.closest && opener.closest('.menu')) {
        opener = document.querySelector('[data-menu-open]');
      }
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      lockScroll();
      modal.querySelector('[data-modal-close]').focus({ preventScroll: true });
    }

    function close() {
      if (!modal.classList.contains('is-open')) {
        return;
      }
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      unlockScroll();
      if (onClose) {
        onClose();
      }
      if (opener && opener.focus) {
        opener.focus({ preventScroll: true });
      }
    }

    modal.addEventListener('click', function (event) {
      if (event.target === modal || event.target.classList.contains('modal__dialog') ||
          event.target.closest('[data-modal-close]')) {
        close();
      }
    });

    document.addEventListener('keydown', function (event) {
      if (!modal.classList.contains('is-open')) {
        return;
      }
      if (event.key === 'Escape') {
        close();
        return;
      }
      trapFocus(modal, event);
    });

    return { open: open, close: close };
  }

  function initMenu() {
    var menu = document.getElementById('menu');
    var openButton = document.querySelector('[data-menu-open]');
    if (!menu || !openButton) {
      return;
    }

    function setOpen(isOpen) {
      if (menu.classList.contains('is-open') === isOpen) {
        return;
      }
      menu.classList.toggle('is-open', isOpen);
      menu.setAttribute('aria-hidden', String(!isOpen));
      openButton.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) {
        lockScroll();
        menu.querySelector('[data-menu-close]').focus({ preventScroll: true });
      } else {
        unlockScroll();
      }
    }

    openButton.addEventListener('click', function () {
      setOpen(true);
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('[data-menu-close], .menu__link')) {
        setOpen(false);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (!menu.classList.contains('is-open')) {
        return;
      }
      if (event.key === 'Escape') {
        setOpen(false);
        openButton.focus();
        return;
      }
      trapFocus(menu, event);
    });

    var desktop = window.matchMedia('(min-width: 1025px)');
    var onDesktop = function (query) {
      if (query.matches) {
        setOpen(false);
      }
    };
    if (desktop.addEventListener) {
      desktop.addEventListener('change', onDesktop);
    } else {
      desktop.addListener(onDesktop);
    }
  }

  function initHeroVideo() {
    var video = document.querySelector('.hero__video');
    if (video && reduceMotion) {
      video.removeAttribute('autoplay');
      video.pause();
    }
  }

  function initHeader() {
    var header = document.querySelector('[data-header]');
    if (!header) {
      return;
    }

    function sync() {
      header.classList.toggle('header--stuck', window.pageYOffset > 24);
    }

    window.addEventListener('scroll', sync, { passive: true });
    sync();
  }

  function initMarquee() {
    var track = document.querySelector('[data-marquee]');
    if (!track || reduceMotion) {
      return;
    }
    toArray(track.children).forEach(function (item) {
      var clone = item.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
    track.classList.add('is-running');
  }

  function initSliders() {
    toArray(document.querySelectorAll('[data-slider]')).forEach(function (slider) {
      var track = slider.querySelector('.slider__track');
      var scope = slider.closest('section') || slider.parentNode;
      var prev = scope.querySelector('[data-slider-prev]');
      var next = scope.querySelector('[data-slider-next]');
      if (!track || !prev || !next) {
        return;
      }
      var ticking = false;

      function step() {
        var slide = track.querySelector('.slider__slide');
        if (!slide) {
          return 0;
        }
        var gap = parseFloat(window.getComputedStyle(track).columnGap) || 0;
        var size = slide.getBoundingClientRect().width + gap;
        return size * Math.max(1, Math.floor((track.clientWidth + gap) / size));
      }

      function sync() {
        ticking = false;
        var max = track.scrollWidth - track.clientWidth;
        prev.disabled = track.scrollLeft <= 2;
        next.disabled = track.scrollLeft >= max - 2;
      }

      function requestSync() {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(sync);
        }
      }

      prev.addEventListener('click', function () {
        track.scrollBy({ left: -step(), behavior: reduceMotion ? 'auto' : 'smooth' });
      });

      next.addEventListener('click', function () {
        track.scrollBy({ left: step(), behavior: reduceMotion ? 'auto' : 'smooth' });
      });

      track.addEventListener('scroll', requestSync, { passive: true });
      window.addEventListener('resize', sync);
      sync();
    });
  }

  function initShowcase() {
    var showcase = document.querySelector('[data-showcase]');
    if (!showcase || !cases.length) {
      return;
    }
    var ROWS = 3;
    var DRIFT = 0.022;
    var PARALLAX = 0.45;
    var rows = [];
    var running = false;
    var hovered = false;
    var lastTime = 0;
    var lastScroll = window.pageYOffset;

    for (var index = 0; index < ROWS; index += 1) {
      var element = document.createElement('div');
      element.className = 'showcase__row';
      showcase.appendChild(element);
      rows.push({ element: element, direction: index % 2 ? -1 : 1, offset: 0, period: 0, sources: [] });
    }

    cases.forEach(function (source, sourceIndex) {
      rows[sourceIndex % ROWS].sources.push(sourceIndex);
    });

    rows.forEach(function (row) {
      [false, true].forEach(function (isCopy) {
        row.sources.forEach(function (sourceIndex) {
          row.element.appendChild(createItem(sourceIndex, isCopy));
        });
      });
    });

    function createItem(sourceIndex, isCopy) {
      var source = cases[sourceIndex];
      var poster = source.querySelector('.case__poster');
      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'showcase__item' + (source.hasAttribute('data-portrait') ? ' showcase__item--portrait' : '');
      item.setAttribute('data-ref', sourceIndex);
      item.setAttribute('aria-label', 'Смотреть: ' + source.getAttribute('data-title'));
      if (source.getAttribute('data-preview')) {
        item.setAttribute('data-preview', source.getAttribute('data-preview'));
      }
      if (isCopy) {
        item.setAttribute('aria-hidden', 'true');
        item.tabIndex = -1;
      }

      var image = document.createElement('img');
      image.className = 'showcase__poster';
      image.src = poster.getAttribute('src');
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      item.appendChild(image);

      var caption = document.createElement('span');
      caption.className = 'showcase__caption';
      var title = document.createElement('span');
      title.className = 'showcase__title';
      title.textContent = source.getAttribute('data-title');
      var kind = document.createElement('span');
      kind.className = 'showcase__kind';
      kind.textContent = source.getAttribute('data-kind');
      caption.appendChild(title);
      caption.appendChild(kind);
      item.appendChild(caption);
      return item;
    }

    function measure() {
      rows.forEach(function (row) {
        var gap = parseFloat(window.getComputedStyle(row.element).columnGap) || 0;
        row.period = (row.element.scrollWidth + gap) / 2;
      });
      render();
    }

    function render() {
      rows.forEach(function (row) {
        if (!row.period) {
          return;
        }
        row.offset = ((row.offset % row.period) + row.period) % row.period;
        row.element.style.transform = 'translate3d(' + (row.offset - row.period) + 'px, 0, 0)';
      });
    }

    function frame(time) {
      if (!running) {
        return;
      }
      var elapsed = Math.min(time - lastTime, 64);
      var scroll = window.pageYOffset;
      var scrolled = scroll - lastScroll;
      var drift = reduceMotion || hovered ? 0 : DRIFT * elapsed;
      lastTime = time;
      lastScroll = scroll;

      rows.forEach(function (row) {
        row.offset += row.direction * (drift + (reduceMotion ? 0 : scrolled * PARALLAX));
      });
      render();
      window.requestAnimationFrame(frame);
    }

    function setRunning(isRunning) {
      if (running === isRunning) {
        return;
      }
      running = isRunning;
      if (running) {
        lastTime = window.performance.now();
        lastScroll = window.pageYOffset;
        window.requestAnimationFrame(frame);
      }
    }

    showcase.addEventListener('mouseenter', function () {
      hovered = true;
    });

    showcase.addEventListener('mouseleave', function () {
      hovered = false;
    });

    window.addEventListener('resize', measure);
    measure();

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        setRunning(entries[0].isIntersecting);
      }, { rootMargin: '200px 0px' }).observe(showcase);
    } else {
      setRunning(true);
    }
  }

  function attachPreview(trigger, host, source, className) {
    var video = null;

    function start() {
      if (!video) {
        video = document.createElement('video');
        video.className = className;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.src = source;
        video.addEventListener('playing', function () {
          host.classList.add('is-playing');
        });
        trigger.appendChild(video);
      }
      var playing = video.play();
      if (playing && playing.catch) {
        playing.catch(function () {});
      }
    }

    function stop() {
      if (!video) {
        return;
      }
      video.pause();
      host.classList.remove('is-playing');
    }

    return { start: start, stop: stop };
  }

  function initPreviews() {
    if (reduceMotion) {
      return;
    }
    var watched = [];

    cases.forEach(function (item) {
      var source = item.getAttribute('data-preview');
      var media = item.querySelector('.case__media');
      if (!source || !media) {
        return;
      }
      var preview = attachPreview(media, item, source, 'case__preview');
      if (item.hasAttribute('data-autoplay')) {
        watched.push({ element: item, preview: preview });
        return;
      }
      if (canHover) {
        media.addEventListener('mouseenter', preview.start);
        media.addEventListener('mouseleave', preview.stop);
      }
    });

    if (canHover) {
      toArray(document.querySelectorAll('.showcase__item[data-preview]')).forEach(function (item) {
        var preview = attachPreview(item, item, item.getAttribute('data-preview'), 'showcase__preview');
        item.addEventListener('mouseenter', preview.start);
        item.addEventListener('mouseleave', preview.stop);
      });
    }

    if (!watched.length || !('IntersectionObserver' in window)) {
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var match = watched.filter(function (candidate) {
          return candidate.element === entry.target;
        })[0];
        if (!match) {
          return;
        }
        if (entry.isIntersecting) {
          match.preview.start();
        } else {
          match.preview.stop();
        }
      });
    }, { threshold: 0.35 });
    watched.forEach(function (candidate) {
      observer.observe(candidate.element);
    });
  }

  function initPlayer() {
    var modalElement = document.getElementById('modal-player');
    if (!modalElement) {
      return;
    }
    var player = modalElement.querySelector('[data-player]');
    var frame = modalElement.querySelector('[data-player-frame]');
    var title = modalElement.querySelector('[data-player-title]');
    var kind = modalElement.querySelector('[data-player-kind]');
    var list = [];
    var current = 0;
    var modal = createModal(modalElement, clear);

    function clear() {
      var video = frame.querySelector('video');
      if (video) {
        video.pause();
        video.removeAttribute('src');
        video.load();
      }
      frame.textContent = '';
    }

    function show(position) {
      current = (position + list.length) % list.length;
      var item = list[current];
      var poster = item.querySelector('.case__poster');
      var text = item.querySelector('.case__text');
      var videoSource = item.getAttribute('data-video');
      clear();

      player.classList.toggle('player--portrait', item.hasAttribute('data-portrait'));
      player.classList.toggle('player--image', !videoSource);

      if (videoSource) {
        var video = document.createElement('video');
        video.className = 'player__video';
        video.controls = true;
        video.autoplay = true;
        video.playsInline = true;
        video.poster = poster.getAttribute('src');
        video.src = videoSource;
        frame.appendChild(video);
      } else {
        var image = document.createElement('img');
        image.className = 'player__image';
        image.src = item.getAttribute('data-image');
        image.alt = poster.getAttribute('alt');
        frame.appendChild(image);
      }

      title.textContent = item.getAttribute('data-title');
      kind.textContent = text ? text.textContent : item.getAttribute('data-kind');
    }

    document.addEventListener('click', function (event) {
      var clone = event.target.closest('.showcase__item');
      var opener = event.target.closest('[data-case-open]');
      var media = opener
        ? document.getElementById(opener.getAttribute('data-case-open')).querySelector('.case__media')
        : event.target.closest('.case__media');
      if (clone) {
        list = cases;
        show(Number(clone.getAttribute('data-ref')));
        modal.open(clone);
        return;
      }
      if (!media) {
        return;
      }
      var item = media.closest('[data-case]');
      var scope = item.closest('section') || document;
      list = toArray(scope.querySelectorAll('[data-case]'));
      show(list.indexOf(item));
      modal.open(opener || media);
    });

    modalElement.querySelector('[data-player-prev]').addEventListener('click', function () {
      show(current - 1);
    });

    modalElement.querySelector('[data-player-next]').addEventListener('click', function () {
      show(current + 1);
    });

    document.addEventListener('keydown', function (event) {
      if (!modalElement.classList.contains('is-open') || event.target.tagName === 'VIDEO') {
        return;
      }
      if (event.key === 'ArrowLeft') {
        show(current - 1);
      } else if (event.key === 'ArrowRight') {
        show(current + 1);
      }
    });
  }

  function initRequestModal() {
    var modalElement = document.getElementById('modal-request');
    if (!modalElement) {
      return;
    }
    var video = modalElement.querySelector('[data-popup-video]');
    var modal = createModal(modalElement, function () {
      if (video) {
        video.pause();
      }
    });

    document.addEventListener('click', function (event) {
      var trigger = event.target.closest('[data-modal-open="request"]');
      if (!trigger) {
        return;
      }
      modal.open(trigger);
      if (video && !reduceMotion && window.matchMedia('(min-width: 481px)').matches) {
        var playing = video.play();
        if (playing && playing.catch) {
          playing.catch(function () {});
        }
      }
    });
  }

  function initFaq() {
    var list = document.querySelector('[data-faq]');
    if (!list) {
      return;
    }

    list.addEventListener('click', function (event) {
      var button = event.target.closest('.faq__question');
      if (!button) {
        return;
      }
      var item = button.closest('.faq__item');
      var willOpen = !item.classList.contains('is-open');

      toArray(list.querySelectorAll('.faq__item.is-open')).forEach(function (opened) {
        opened.classList.remove('is-open');
        opened.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
      });

      item.classList.toggle('is-open', willOpen);
      button.setAttribute('aria-expanded', String(willOpen));
    });
  }

  function formatPhone(value) {
    var digits = value.replace(/\D/g, '');
    if (digits.charAt(0) === '7' || digits.charAt(0) === '8') {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);
    if (!digits) {
      return '';
    }
    var result = '+7 (' + digits.slice(0, 3);
    if (digits.length > 3) {
      result += ') ' + digits.slice(3, 6);
    }
    if (digits.length > 6) {
      result += '-' + digits.slice(6, 8);
    }
    if (digits.length > 8) {
      result += '-' + digits.slice(8, 10);
    }
    return result;
  }

  function initForms() {
    toArray(document.querySelectorAll('[data-form]')).forEach(function (form) {
      var phone = form.querySelector('input[type="tel"]');

      if (phone) {
        phone.addEventListener('input', function () {
          phone.value = formatPhone(phone.value);
        });
      }

      form.addEventListener('input', clearInvalid);
      form.addEventListener('change', clearInvalid);

      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var invalid = toArray(form.querySelectorAll('[required]')).filter(function (field) {
          var isValid;
          if (field.type === 'checkbox') {
            isValid = field.checked;
          } else if (field.type === 'tel') {
            isValid = field.value.replace(/\D/g, '').length === 11;
          } else {
            isValid = field.value.trim().length > 1;
          }
          field.classList.toggle('is-invalid', !isValid);
          field.setAttribute('aria-invalid', String(!isValid));
          return !isValid;
        });

        if (invalid.length) {
          invalid[0].focus();
          return;
        }
        showDone(form);
      });
    });

    function clearInvalid(event) {
      event.target.classList.remove('is-invalid');
      event.target.removeAttribute('aria-invalid');
    }

    function showDone(form) {
      var done = document.createElement('div');
      done.className = 'form__done';
      var title = document.createElement('p');
      title.className = 'form__done-title';
      title.textContent = 'Спасибо, заявка у нас';
      var text = document.createElement('p');
      text.className = 'form__done-text';
      text.textContent = 'Свяжемся с вами удобным способом и обсудим задачу.';
      done.appendChild(title);
      done.appendChild(text);
      form.textContent = '';
      form.appendChild(done);
      done.setAttribute('tabindex', '-1');
      done.focus({ preventScroll: true });
    }
  }

  function initReveal() {
    var items = toArray(document.querySelectorAll('.reveal'));
    if (!items.length) {
      return;
    }
    if (reduceMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (item) {
        item.classList.add('is-visible');
      });
      return;
    }

    items.forEach(function (item) {
      var siblings = toArray(item.parentNode.children).filter(function (sibling) {
        return sibling.classList.contains('reveal');
      });
      var order = siblings.indexOf(item);
      if (order > 0) {
        item.style.transitionDelay = Math.min(order, 4) * 80 + 'ms';
      }
    });

    function clearDelay(event) {
      if (event.propertyName === 'opacity') {
        event.target.style.transitionDelay = '';
        event.target.removeEventListener('transitionend', clearDelay);
      }
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          entry.target.addEventListener('transitionend', clearDelay);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initAutoplay() {
    var videos = toArray(document.querySelectorAll('video[data-autoplay]'));
    if (!videos.length || reduceMotion || !('IntersectionObserver' in window)) {
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          entry.target.pause();
          return;
        }
        var playing = entry.target.play();
        if (playing && playing.catch) {
          playing.catch(function () {});
        }
      });
    }, { threshold: 0.3 });
    videos.forEach(function (video) {
      observer.observe(video);
    });
  }

  function initFloatCta() {
    var button = document.querySelector('[data-float]');
    var hero = document.querySelector('.hero');
    var request = document.getElementById('request');
    if (!button || !hero || !('IntersectionObserver' in window)) {
      return;
    }
    var hidden = { hero: true, request: false };

    function watch(name, element, options) {
      new IntersectionObserver(function (entries) {
        hidden[name] = entries[0].isIntersecting;
        button.classList.toggle('is-visible', !hidden.hero && !hidden.request);
      }, options).observe(element);
    }

    watch('hero', hero, { threshold: 0.3 });
    if (request) {
      watch('request', request, { threshold: 0.05 });
    }
  }
})();
