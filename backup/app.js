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


// ─── Phase 3: Dynamic news section ───────────────────────────────────────────
// Fetches published posts from /api/posts and renders them in #newsContainer.
// Falls back to an empty state if no posts exist yet.
(function () {
  const container = document.getElementById('newsContainer');
  if (!container) return; // not on the news page

  // Show loading skeletons while fetching
  container.innerHTML = [1,2,3].map(() => `
    <div class="news-card skeleton-card" aria-hidden="true">
      <div class="news-top" style="background:rgba(255,255,255,0.04);"></div>
      <div class="news-body">
        <div class="skel skel-title"></div>
        <div class="skel skel-line"></div>
        <div class="skel skel-line short"></div>
      </div>
    </div>
  `).join('');

  fetch('/api/posts')
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(({ posts }) => {
      if (!posts || posts.length === 0) {
        container.innerHTML = `
          <div class="news-empty">
            <p>No posts yet. Check back soon for council updates.</p>
          </div>
        `;
        return;
      }

      const categoryGradients = {
        'News':         'linear-gradient(135deg, #3b82f6, #1d4ed8)',
        'Announcement': 'linear-gradient(135deg, #ef4444, #9f1414)',
        'Achievement':  'linear-gradient(135deg, #10b981, #047857)',
        'Event':        'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        'Press Release':'linear-gradient(135deg, #f59e0b, #b45309)',
      };

      container.innerHTML = posts.map(post => {
        const gradient = categoryGradients[post.category] || categoryGradients['News'];
        const date = new Date(post.created_at).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric'
        });
        return `
          <div class="news-card reveal">
            <div class="news-top" style="background:${gradient};">
              <span class="news-date">${date}</span>
            </div>
            <div class="news-body">
              <span style="font-size:11px;font-weight:700;color:var(--blue-light);
                text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px;">
                ${esc(post.category)}
              </span>
              <h4>${esc(post.title)}</h4>
              <p>${esc(post.excerpt)}</p>
              <span class="news-link">
                By ${esc(post.author)} &rarr;
              </span>
            </div>
          </div>
        `;
      }).join('');

      // Re-run scroll reveal on newly added cards
      container.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
      });

    })
    .catch(err => {
      console.warn('[ARSRC] News section failed to load:', err);
      container.innerHTML = `
        <div class="news-empty">
          <p>Could not load posts right now. Please try again later.</p>
        </div>
      `;
    });

  function esc(str) {
    return String(str || '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
})();
