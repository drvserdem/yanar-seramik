(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const header = $('#siteHeader');
  const menuToggle = $('.menu-toggle');
  const mainNav = $('#mainNav');
  const navLinks = $$('.main-nav a');

  function setMenu(open) {
    if (!menuToggle || !mainNav) return;
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Menüyü kapat' : 'Menüyü aç');
    mainNav.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  }

  menuToggle?.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });

  navLinks.forEach((link) => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') setMenu(false);
  });

  function updateHeader() {
    header?.classList.toggle('scrolled', window.scrollY > 30);
  }

  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const revealItems = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -45px' });

    revealItems.forEach((item, index) => {
      item.style.transitionDelay = `${Math.min(index % 4, 3) * 70}ms`;
      revealObserver.observe(item);
    });
  }

  const sections = $$('main section[id]');
  if ('IntersectionObserver' in window && sections.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { threshold: 0.25, rootMargin: '-25% 0px -60%' });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  const counters = $$('[data-counter]');
  function animateCounter(element) {
    const target = Number(element.dataset.counter || 0);
    if (!Number.isFinite(target)) return;
    if (reduceMotion) {
      element.textContent = String(target);
      return;
    }
    const duration = 1250;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = String(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });
    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }

  const filterButtons = $$('.project-filters button');
  const projectCards = $$('.project-card');
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      filterButtons.forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.filter || 'all';
      projectCards.forEach((card) => {
        const show = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !show);
      });
    });
  });

  const testimonials = $$('.testimonial');
  const dotsWrap = $('.slider-dots');
  let testimonialIndex = 0;
  let autoSlideTimer;

  function showTestimonial(index) {
    if (!testimonials.length) return;
    testimonialIndex = (index + testimonials.length) % testimonials.length;
    testimonials.forEach((item, i) => item.classList.toggle('active', i === testimonialIndex));
    $$('.slider-dots button').forEach((dot, i) => {
      dot.classList.toggle('active', i === testimonialIndex);
      dot.setAttribute('aria-current', i === testimonialIndex ? 'true' : 'false');
    });
  }

  if (dotsWrap && testimonials.length) {
    testimonials.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `${index + 1}. yorumu göster`);
      dot.addEventListener('click', () => {
        showTestimonial(index);
        restartAutoSlide();
      });
      dotsWrap.append(dot);
    });
    showTestimonial(0);
  }

  function restartAutoSlide() {
    window.clearInterval(autoSlideTimer);
    if (!reduceMotion && testimonials.length > 1) {
      autoSlideTimer = window.setInterval(() => showTestimonial(testimonialIndex + 1), 6500);
    }
  }

  $('.slider-button.prev')?.addEventListener('click', () => {
    showTestimonial(testimonialIndex - 1);
    restartAutoSlide();
  });
  $('.slider-button.next')?.addEventListener('click', () => {
    showTestimonial(testimonialIndex + 1);
    restartAutoSlide();
  });
  restartAutoSlide();

  $$('.accordion-item > button').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.accordion-item');
      const willOpen = !item.classList.contains('active');
      $$('.accordion-item').forEach((accordionItem) => {
        accordionItem.classList.remove('active');
        accordionItem.querySelector('button')?.setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        item.classList.add('active');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });

  const quoteForm = $('#quoteForm');
  const formStatus = $('#formStatus');
  quoteForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!quoteForm.checkValidity()) {
      quoteForm.reportValidity();
      return;
    }

    const data = new FormData(quoteForm);
    const name = String(data.get('name') || '').trim();
    const phone = String(data.get('phone') || '').trim();
    const service = String(data.get('service') || '').trim();
    const location = String(data.get('location') || '').trim();
    const message = String(data.get('message') || '').trim();

    const text = [
      'Merhaba Yanar Seramik, web sitenizden teklif almak istiyorum.',
      '',
      `Ad Soyad: ${name}`,
      `Telefon: ${phone}`,
      `Hizmet: ${service}`,
      `Bölge: ${location || 'Belirtilmedi'}`,
      `Proje Detayı: ${message || 'Belirtilmedi'}`
    ].join('\n');

    if (formStatus) formStatus.textContent = 'WhatsApp mesajınız hazırlanıyor…';
    const url = `https://wa.me/905415807369?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => {
      if (formStatus) formStatus.textContent = 'Mesaj penceresi açıldı. WhatsApp üzerinden gönderebilirsiniz.';
    }, 450);
  });

  const heroMedia = $('.hero-media img');
  if (heroMedia && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('scroll', () => {
      if (window.scrollY < window.innerHeight) {
        heroMedia.style.transform = `translateY(${window.scrollY * 0.08}px) scale(1.03)`;
      }
    }, { passive: true });
  }

  $('#currentYear').textContent = String(new Date().getFullYear());
})();
