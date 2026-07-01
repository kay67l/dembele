// contact-api.js — Phase 1: wires the contact form to /api/contact
// Add AFTER <script src="app.js"></script> in index.html
// This overrides whatever submit behaviour app.js sets for contactForm

(function () {
  const form    = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');
  const btn     = form ? form.querySelector('.submit-btn') : null;

  if (!form) return; // safety: do nothing if element isn't on this page

  // Remove any prior submit listeners app.js may have attached
  const freshForm = form.cloneNode(true);
  form.parentNode.replaceChild(freshForm, form);

  // Re-grab references after the clone
  const liveForm    = document.getElementById('contactForm');
  const liveSuccess = document.getElementById('formSuccess');
  const liveBtn     = liveForm.querySelector('.submit-btn');

  liveForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    // ── UI: loading state ──────────────────────────────────────────────────
    liveBtn.disabled    = true;
    liveBtn.textContent = 'Sending…';

    const body = {
      name:    liveForm.querySelector('input[type="text"]').value,
      email:   liveForm.querySelector('input[type="email"]').value,
      subject: liveForm.querySelectorAll('input[type="text"]')[1]
               ? liveForm.querySelectorAll('input[type="text"]')[1].value
               : '',
      message: liveForm.querySelector('textarea').value,
    };

    try {
      const res  = await fetch('/api/contact.js', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        // Server returned a validation or 500 error
        showError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      // ── Success ────────────────────────────────────────────────────────────
      liveForm.reset();
      if (liveSuccess) {
        liveSuccess.textContent = '✓ Message sent! The council will respond shortly.';
        liveSuccess.classList.add('show');
        // Auto-hide after 6 seconds
        setTimeout(() => liveSuccess.classList.remove('show'), 6000);
      }

    } catch (err) {
      // Network failure (offline, DNS, etc.)
      showError('Network error — please check your connection and try again.');
      console.error('[ARSRC] Contact form fetch error:', err);
    } finally {
      liveBtn.disabled    = false;
      liveBtn.textContent = 'Send Message';
    }
  });

  function showError(msg) {
    if (!liveSuccess) return;
    liveSuccess.textContent = '✗ ' + msg;
    liveSuccess.style.background = 'rgba(220,38,38,0.12)';
    liveSuccess.style.color      = '#fca5a5';
    liveSuccess.style.border     = '1px solid rgba(220,38,38,0.3)';
    liveSuccess.classList.add('show');
    setTimeout(() => {
      liveSuccess.classList.remove('show');
      liveSuccess.style.cssText = '';
    }, 6000);
  }
})();
