// mailchimp-inline.js
(function () {
  const form = document.getElementById('mailchimp-form');
  const emailInput = document.getElementById('mce-EMAIL');
  const iframe = document.getElementById('mc_iframe');

  if (!form || !emailInput || !iframe) return;

  // Optional: basic front-end validation beyond HTML5 "required"
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  form.addEventListener('submit', function () {
    // If bad email, let browser's native validation show
    if (!emailInput.value || !isValidEmail(emailInput.value)) return;

    // Wait briefly for Mailchimp to respond in the hidden iframe.
    // We can't read the iframe due to cross-origin, so we show a generic success prompt.
    setTimeout(function () {
      if (typeof window.showModal === 'function') {
        window.showModal('Thanks! Please check your inbox to confirm your subscription.');
      } else {
        alert('Thanks! Please check your inbox to confirm your subscription.');
      }
      emailInput.value = '';
    }, 1200);
  });
})();
