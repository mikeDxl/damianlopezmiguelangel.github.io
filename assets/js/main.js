(() => {
  'use strict';

  const initialize = () => {
    const header = document.querySelector('.site-header');
    const progress = document.querySelector('#scroll-progress');
    const backToTop = document.querySelector('.back-to-top');
    const menuToggle = document.querySelector('#menu-toggle');
    const navigation = document.querySelector('#navbar');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sectionLinks = [...document.querySelectorAll('.nav-link[href^="#"]')]
      .map((link) => ({ link, section: document.getElementById(link.getAttribute('href').slice(1)) }))
      .filter(({ section }) => section);

    let menuOpen = false;
    let scrollFrame = null;

    const setActiveSection = (activeSection) => {
      sectionLinks.forEach(({ link, section }) => {
        const active = section === activeSection;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };

    const updateScroll = () => {
      scrollFrame = null;
      const position = Math.max(0, window.scrollY);
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      const fraction = distance > 0 ? Math.min(1, position / distance) : 0;
      if (progress) progress.style.transform = 'scaleX(' + fraction + ')';
      if (header) header.classList.toggle('is-scrolled', position > 16);
      if (backToTop) backToTop.classList.toggle('is-visible', position > 500);

      if (!sectionLinks.length) return;
      const offset = (header ? header.getBoundingClientRect().height : 0) + 80;
      let activeSection = sectionLinks[0].section;
      sectionLinks.forEach(({ section }) => {
        if (section.getBoundingClientRect().top <= offset) activeSection = section;
      });
      if (distance > 0 && position >= distance - 2) {
        activeSection = sectionLinks[sectionLinks.length - 1].section;
      }
      setActiveSection(activeSection);
    };

    const requestScrollUpdate = () => {
      if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(updateScroll);
    };

    const setMenuOpen = (open, returnFocus = false) => {
      if (!menuToggle || !navigation) return;
      menuOpen = open;
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      navigation.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      if (returnFocus) menuToggle.focus({ preventScroll: true });
    };

    if (menuToggle && navigation) {
      menuToggle.setAttribute('aria-controls', navigation.id);
      setMenuOpen(false);
      menuToggle.addEventListener('click', (event) => {
        const open = !menuOpen;
        setMenuOpen(open);
        if (open && event.detail === 0) {
          const firstLink = navigation.querySelector('a[href]');
          if (firstLink) firstLink.focus();
        }
      });
      document.addEventListener('keydown', (event) => {
        if (!menuOpen) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          setMenuOpen(false, true);
        } else if (event.key === 'Tab') {
          const focusable = [menuToggle, ...navigation.querySelectorAll('a[href], button:not([disabled])')]
            .filter((element) => element.getClientRects().length && element.tabIndex >= 0);
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first && last) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last && first) {
            event.preventDefault();
            first.focus();
          }
        }
      });
      document.addEventListener('click', (event) => {
        if (menuOpen && !navigation.contains(event.target) && !menuToggle.contains(event.target)) {
          setMenuOpen(false);
        }
      });
      window.addEventListener('resize', () => {
        if (menuOpen && window.getComputedStyle(menuToggle).display === 'none') setMenuOpen(false);
      }, { passive: true });
    }

    sectionLinks.forEach(({ link, section }) => {
      link.addEventListener('click', (event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const wasOpen = menuOpen;
        setMenuOpen(false);
        setActiveSection(section);
        if (wasOpen) {
          if (!section.hasAttribute('tabindex')) section.setAttribute('tabindex', '-1');
          window.requestAnimationFrame(() => section.focus({ preventScroll: true }));
        }
      });
    });

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', requestScrollUpdate, { passive: true });
    window.addEventListener('hashchange', requestScrollUpdate);
    window.addEventListener('load', requestScrollUpdate, { once: true });
    updateScroll();

    const revealElements = [...document.querySelectorAll('.reveal')];
    let revealObserver = null;
    const revealAll = () => {
      if (revealObserver) revealObserver.disconnect();
      document.documentElement.classList.remove('reveal-ready');
      revealElements.forEach((element) => element.classList.add('is-visible'));
    };
    if (!reducedMotion.matches && 'IntersectionObserver' in window && revealElements.length) {
      try {
        revealObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              revealObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
        revealElements.forEach((element) => {
          const bounds = element.getBoundingClientRect();
          if (bounds.top < window.innerHeight && bounds.bottom >= 0) element.classList.add('is-visible');
          else revealObserver.observe(element);
        });
        document.documentElement.classList.add('reveal-ready');
      } catch {
        revealAll();
      }
    } else {
      revealAll();
    }

    const filterButtons = [...document.querySelectorAll('.filter-button[data-filter]')];
    const skillCards = [...document.querySelectorAll('.skill-card[data-category]')];
    const skillStatus = document.querySelector('#skill-status');
    const categoryNames = {
      all: 'Todas las áreas', frontend: 'Frontend', backend: 'Backend',
      data: 'Datos', tools: 'Herramientas'
    };
    const filterSkills = (category) => {
      if (!Object.prototype.hasOwnProperty.call(categoryNames, category)) return;
      let visibleCount = 0;
      skillCards.forEach((card) => {
        const visible = category === 'all' || card.dataset.category.split(/\s+/).includes(category);
        card.hidden = !visible;
        if (visible) {
          visibleCount += 1;
          card.classList.add('is-visible');
        }
      });
      filterButtons.forEach((button) => {
        const active = button.dataset.filter === category;
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('is-active', active);
      });
      if (skillStatus) {
        skillStatus.textContent = categoryNames[category] + ': ' + visibleCount +
          (visibleCount === 1 ? ' tarjeta visible.' : ' tarjetas visibles.');
      }
      requestScrollUpdate();
    };
    filterButtons.forEach((button) => {
      button.addEventListener('click', () => filterSkills(button.dataset.filter));
    });
    if (filterButtons.length && skillCards.length) {
      const selected = filterButtons.find((button) => button.getAttribute('aria-pressed') === 'true');
      filterSkills(selected ? selected.dataset.filter : 'all');
    }

    const copyButton = document.querySelector('#copy-email');
    const toast = document.querySelector('#toast');
    let toastTimeout;
    let copyInProgress = false;
    const showToast = (message) => {
      if (!toast) return;
      window.clearTimeout(toastTimeout);
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      toast.hidden = false;
      toast.textContent = message;
      toast.classList.add('is-visible');
      toastTimeout = window.setTimeout(() => toast.classList.remove('is-visible'), 6000);
    };
    const copyWithFallback = (value) => {
      const previousFocus = document.activeElement;
      const field = document.createElement('textarea');
      field.value = value;
      field.setAttribute('readonly', '');
      field.setAttribute('aria-hidden', 'true');
      field.tabIndex = -1;
      field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
      document.body.append(field);
      try {
        field.focus({ preventScroll: true });
        field.select();
        return typeof document.execCommand === 'function' && document.execCommand('copy');
      } finally {
        field.remove();
        if (previousFocus && typeof previousFocus.focus === 'function') {
          previousFocus.focus({ preventScroll: true });
        }
      }
    };
    if (copyButton) {
      copyButton.addEventListener('click', async () => {
        if (copyInProgress) return;
        const email = copyButton.dataset.email;
        if (!email) {
          showToast('No se encontró el correo para copiar.');
          return;
        }
        copyInProgress = true;
        copyButton.setAttribute('aria-busy', 'true');
        try {
          let copied = false;
          if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
            try {
              await navigator.clipboard.writeText(email);
              copied = true;
            } catch {
              copied = copyWithFallback(email);
            }
          } else {
            copied = copyWithFallback(email);
          }
          showToast(copied ? 'Correo copiado: ' + email : 'No se pudo copiar. Correo: ' + email);
        } catch {
          showToast('No se pudo copiar. Correo: ' + email);
        } finally {
          copyInProgress = false;
          copyButton.removeAttribute('aria-busy');
        }
      });
    }

    const yearElement = document.querySelector('#current-year');
    if (yearElement) {
      try {
        yearElement.textContent = new Intl.DateTimeFormat('es-MX', {
          year: 'numeric', timeZone: 'America/Mexico_City'
        }).format(new Date());
      } catch {
        yearElement.textContent = String(new Date().getFullYear());
      }
    }

    const heroVisual = document.querySelector('.hero-visual');
    const portraitFrame = heroVisual ? heroVisual.querySelector('.portrait-frame') : null;
    const precisePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let tiltFrame = null;
    let pointerPosition = null;
    const resetTilt = () => {
      if (tiltFrame !== null) window.cancelAnimationFrame(tiltFrame);
      tiltFrame = null;
      pointerPosition = null;
      if (portraitFrame) {
        portraitFrame.style.setProperty('--tilt-x', '0deg');
        portraitFrame.style.setProperty('--tilt-y', '0deg');
      }
    };
    if (heroVisual && portraitFrame) {
      heroVisual.addEventListener('pointermove', (event) => {
        if (reducedMotion.matches || !precisePointer.matches || event.pointerType === 'touch') return;
        pointerPosition = { x: event.clientX, y: event.clientY };
        if (tiltFrame !== null) return;
        tiltFrame = window.requestAnimationFrame(() => {
          tiltFrame = null;
          if (!pointerPosition) return;
          const bounds = heroVisual.getBoundingClientRect();
          if (!bounds.width || !bounds.height) return;
          const x = Math.max(-0.5, Math.min(0.5, (pointerPosition.x - bounds.left) / bounds.width - 0.5));
          const y = Math.max(-0.5, Math.min(0.5, (pointerPosition.y - bounds.top) / bounds.height - 0.5));
          portraitFrame.style.setProperty('--tilt-x', (-y * 6).toFixed(2) + 'deg');
          portraitFrame.style.setProperty('--tilt-y', (x * 6).toFixed(2) + 'deg');
        });
      }, { passive: true });
      heroVisual.addEventListener('pointerleave', resetTilt);
      heroVisual.addEventListener('pointercancel', resetTilt);
      heroVisual.addEventListener('blur', resetTilt, true);
      window.addEventListener('blur', resetTilt);
    }
    const observePreference = (query, callback) => {
      if (typeof query.addEventListener === 'function') query.addEventListener('change', callback);
      else if (typeof query.addListener === 'function') query.addListener(callback);
    };
    observePreference(reducedMotion, () => {
      if (reducedMotion.matches) {
        revealAll();
        resetTilt();
      }
    });
    observePreference(precisePointer, () => {
      if (!precisePointer.matches) resetTilt();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})();
