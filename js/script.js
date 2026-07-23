(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;

  const loader = $('#siteLoader');
  const header = $('#siteHeader');
  const menuToggle = $('.menu-toggle');
  const mainNav = $('#mainNav');
  const navLinks = $$('.main-nav a');
  const progressBar = $('.page-progress span');

  window.addEventListener('load', () => {
    window.setTimeout(() => {
      loader?.classList.add('hidden');
      document.body.classList.add('loaded');
    }, reduceMotion ? 0 : 520);
  });

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

  function updateScrollUI() {
    const scrollY = window.scrollY;
    header?.classList.toggle('scrolled', scrollY > 34);
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = height > 0 ? Math.min(scrollY / height, 1) : 0;
    if (progressBar) progressBar.style.width = `${ratio * 100}%`;
  }
  updateScrollUI();
  window.addEventListener('scroll', updateScrollUI, { passive: true });

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
    }, { threshold: 0.14, rootMargin: '0px 0px -50px' });

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
    }, { threshold: 0.22, rootMargin: '-25% 0px -58%' });
    sections.forEach((section) => sectionObserver.observe(section));
  }

  const heroImage = $('.hero-picture img');
  if (heroImage && !reduceMotion) {
    window.addEventListener('scroll', () => {
      if (window.scrollY < window.innerHeight * 1.2) {
        heroImage.style.transform = `translate3d(0,${window.scrollY * 0.09}px,0) scale(1.06)`;
      }
    }, { passive: true });
  }

  const craftSticky = $('#craftSticky');
  const craftSteps = $$('.craft-step');
  const craftImages = $$('.craft-image');
  const craftNumber = $('#craftVisualNumber');
  const craftTitle = $('#craftVisualTitle');
  let activeCraftIndex = 0;

  function setCraftStage(index) {
    if (!craftSteps.length) return;
    const safeIndex = Math.max(0, Math.min(index, craftSteps.length - 1));
    if (safeIndex === activeCraftIndex && craftSteps[safeIndex].classList.contains('active')) return;
    activeCraftIndex = safeIndex;
    craftSteps.forEach((step, i) => step.classList.toggle('active', i === safeIndex));
    craftImages.forEach((image, i) => image.classList.toggle('active', i === safeIndex));
    if (craftNumber) craftNumber.textContent = String(safeIndex + 1).padStart(2, '0');
    if (craftTitle) craftTitle.textContent = craftSteps[safeIndex].dataset.title || '';
  }

  craftSteps.forEach((step, index) => {
    step.addEventListener('mouseenter', () => setCraftStage(index));
    step.addEventListener('click', () => setCraftStage(index));
  });

  if (craftSticky && craftSteps.length && !reduceMotion && window.innerWidth > 860) {
    const craftObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const index = Number(entry.target.dataset.index || 0);
        setCraftStage(index);
      });
    }, { threshold: 0.55, rootMargin: '-18% 0px -32%' });
    craftSteps.forEach((step) => craftObserver.observe(step));
  }

  const comparison = $('#comparison');
  const comparisonRange = $('#comparison input[type="range"]');
  comparisonRange?.addEventListener('input', () => {
    comparison?.style.setProperty('--position', `${comparisonRange.value}%`);
  });

  const counters = $$('[data-counter]');
  function animateCounter(element) {
    const target = Number(element.dataset.counter || 0);
    if (!Number.isFinite(target)) return;
    if (reduceMotion) {
      element.textContent = String(target);
      return;
    }
    const duration = 1300;
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
    }, { threshold: 0.65 });
    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach(animateCounter);
  }

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

  if (!reduceMotion && finePointer) {
    $$('.tilt-card').forEach((card) => {
      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${(-y * 5).toFixed(2)}deg) rotateY(${(x * 6).toFixed(2)}deg) translateY(-7px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });

    $$('.magnetic').forEach((element) => {
      element.addEventListener('mousemove', (event) => {
        const rect = element.getBoundingClientRect();
        const x = event.clientX - rect.left - rect.width / 2;
        const y = event.clientY - rect.top - rect.height / 2;
        element.style.transform = `translate(${x * 0.08}px, ${y * 0.12}px)`;
      });
      element.addEventListener('mouseleave', () => {
        element.style.transform = '';
      });
    });
  }

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
      'Merhaba Yanar Seramik, web sitenizden keşif / teklif talebi bırakıyorum.',
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

  $('#currentYear').textContent = String(new Date().getFullYear());
})();
