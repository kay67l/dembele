  // Hero title word animation
  const titleWords = "Ashanti Regional Students' Representative Council".split(" ");
  const heroTitle = document.getElementById('heroTitle');
  heroTitle.innerHTML = titleWords.map((w,i) => `<span class="word" style="animation-delay:${0.15*i}s">${w}&nbsp;</span>`).join('');

  // Nav scroll state
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 30);
    document.getElementById('toTop').classList.toggle('show', window.scrollY > 500);
  });

  // Mobile menu
  const burger = document.getElementById('burger');
  const mobileMenu = document.getElementById('mobileMenu');
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
  });
  mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
  }));

  // Scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => revealObserver.observe(el));

  // Counter animation
  const counters = document.querySelectorAll('.stat-num');
  let countersStarted = false;
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !countersStarted) {
        countersStarted = true;
        counters.forEach(counter => {
          const target = parseInt(counter.dataset.count, 10);
          const duration = 1400;
          const startTime = performance.now();
          function update(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            counter.textContent = Math.floor(eased * target).toLocaleString();
            if (progress < 1) requestAnimationFrame(update);
            else counter.textContent = target.toLocaleString() + ((counter === counters[0] || counter === counters[3]) ? "+" : "");
          }
          requestAnimationFrame(update);
        });
      }
    });
  }, { threshold: 0.4 });
  if (counters.length) statsObserver.observe(counters[0].closest('.stats'));

  // Accordion
  document.querySelectorAll('.accordion-item').forEach(item => {
    const head = item.querySelector('.accordion-head');
    const body = item.querySelector('.accordion-body');
    if (item.classList.contains('open')) body.style.maxHeight = body.scrollHeight + 'px';
    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.accordion-body').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  // Executive tabs
  document.querySelectorAll('.exec-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.exec-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.exec-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Ticker duplicate for seamless loop
  const ticker = document.getElementById('ticker');
  ticker.innerHTML += ticker.innerHTML;

  // Contact form is handled by contact-api.js

  // Back to top
  document.getElementById('toTop').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });


function downloadFile(fileName) {
    const link = document.createElement("a");
    link.href = fileName;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);}

