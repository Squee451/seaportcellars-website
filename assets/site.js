// site.js: shared message dialog used by the checkout (shop.js) and the
// mailing-list signup (mailchimp-inline.js calls window.showModal).
(function () {
  var dlg = null;

  function ensureDialog() {
    if (dlg) return dlg;
    dlg = document.createElement('dialog');
    dlg.className = 'modal';
    dlg.innerHTML =
      '<div class="modal-body">' +
      '<p class="modal-msg"></p>' +
      '<div class="modal-actions"><button type="button" class="btn">Close</button></div>' +
      '</div>';
    dlg.querySelector('button').addEventListener('click', function () { dlg.close(); });
    // A click on the dimmed backdrop lands on the <dialog> itself, not its body.
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    document.body.appendChild(dlg);
    return dlg;
  }

  window.showModal = function (message) {
    var d = ensureDialog();
    d.querySelector('.modal-msg').textContent = message;
    if (typeof d.showModal === 'function') d.showModal();
    else alert(message);
  };

  window.closeModal = function () {
    if (dlg && dlg.open) dlg.close();
  };
})();
