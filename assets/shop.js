// shop.js: 2024 Grenache checkout on 2024-grenache.html.
// Flow (unchanged from the old one-page site): Pickup -> 21+ check -> Stripe;
// Delivery -> zip check -> 21+ check -> Stripe. Buttons on the page carry
// data-buy="<product>" and data-mode="pickup|delivery".
//
// MONEY PATH: STRIPE_LINKS below are the live Stripe Payment Links. Change them
// only when Marty or Adam explicitly asks. Moved verbatim from index.html
// on 2026-11-04.
(function () {
    // --- Stripe Payment Links ---
    // Replace each placeholder URL below with the corresponding Stripe Payment Link.
    // Create these in your Stripe Dashboard > Payment Links.
    // For delivery links, enable "Collect shipping address" in Stripe.
    const STRIPE_LINKS = {
      single_pickup:      'https://buy.stripe.com/14AaEP8vH4lFftV4KtdMI05',  // Single Bottle Pickup — $30.00
      threepack_delivery: 'https://buy.stripe.com/dRmdR1bHTg4n5TlgtbdMI04',  // 3-Pack Delivery — $85.00
      threepack_pickup:   'https://buy.stripe.com/cNi00bcLXf0j6Xp1yhdMI00',  // 3-Pack Pickup — $75.00
      sixpack_delivery:   'https://buy.stripe.com/4gMaEPh2daK3gxZ5OxdMI03',  // 6-Pack Delivery — $160.00
      sixpack_pickup:     'https://buy.stripe.com/00w9ALh2dg4nchJ90JdMI01',  // 6-Pack Pickup — $150.00
      case_delivery:      'https://buy.stripe.com/3cIbITeU54lF5TlccVdMI09',  // Case of 12 Delivery — $300.00
      case_pickup:        'https://buy.stripe.com/7sY9ALbHT5pJbdFdgZdMI08',  // Case of 12 Pickup — $300.00
    };

    // --- Valid Delivery Zip Codes (~10mi radius from 97214, Portland area) ---
    // Verify/adjust this list using a zip code radius tool for your delivery area.
    const VALID_ZIPS = new Set([
      // Core Portland
      '97201', '97202', '97203', '97204', '97205', '97206', '97207', '97208',
      '97209', '97210', '97211', '97212', '97213', '97214', '97215', '97216',
      '97217', '97218', '97219', '97220', '97221', '97227', '97230', '97232',
      '97233', '97236', '97239', '97266', '97267',
      // Lake Oswego
      '97034', '97035',
      // Beaverton / Tigard area
      '97223', '97225', '97005', '97006', '97007', '97008', '97003',
      '97075', '97076', '97077', '97078'
    ]);

  const NOT_AVAILABLE = 'Online ordering is not yet available. Please check back soon or contact us at seaportcellarsllc@gmail.com to place an order.';

  let pendingCheckoutUrl = null;
  let pendingProductKey = null;

  function makeDialog(html) {
    const d = document.createElement('dialog');
    d.className = 'modal';
    d.innerHTML = '<div class="modal-body">' + html + '</div>';
    d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
    d.querySelectorAll('[data-act="cancel"]').forEach(function (b) {
      b.addEventListener('click', function () { d.close(); });
    });
    document.body.appendChild(d);
    return d;
  }

  const zipDialog = makeDialog(
    '<h3>Check Delivery Availability</h3>' +
    '<p>Enter your zip code to confirm we deliver to your area.</p>' +
    '<label class="sr-only" for="zip-input">Zip code</label>' +
    '<input type="text" id="zip-input" class="zip-input" inputmode="numeric" pattern="[0-9]*" maxlength="5" placeholder="Enter zip code" autocomplete="postal-code">' +
    '<p id="zip-error" class="form-error" hidden></p>' +
    '<div class="modal-actions">' +
    '<button type="button" class="btn" data-act="zip-check">Check Availability</button>' +
    '<button type="button" class="btn btn-outline" data-act="cancel">Cancel</button>' +
    '</div>'
  );

  const ageDialog = makeDialog(
    '<h3>Age Verification Required</h3>' +
    '<p>You must be 21 years or older to purchase wine. By clicking "I am 21+" you confirm that you are of legal drinking age.</p>' +
    '<div class="modal-actions">' +
    '<button type="button" class="btn" data-act="age-ok">I am 21 or older - Continue to Checkout</button>' +
    '<button type="button" class="btn btn-outline" data-act="cancel">Cancel</button>' +
    '</div>' +
    '<p class="fine">ID verification required at delivery.</p>'
  );

  const zipInput = zipDialog.querySelector('#zip-input');
  const zipError = zipDialog.querySelector('#zip-error');

  function showZipError(msg) {
    zipError.textContent = msg;
    zipError.hidden = false;
  }

  // --- Pickup Flow: straight to age verification ---
  function startPickupFlow(productKey) {
    const url = STRIPE_LINKS[productKey + '_pickup'];
    if (!url) { window.showModal(NOT_AVAILABLE); return; }
    pendingCheckoutUrl = url;
    ageDialog.showModal();
  }

  // --- Delivery Flow: zip code validation first ---
  function startDeliveryFlow(productKey) {
    pendingProductKey = productKey;
    zipInput.value = '';
    zipError.hidden = true;
    zipDialog.showModal();
    zipInput.focus();
  }

  function validateAndProceed() {
    const zip = zipInput.value.trim();
    if (!/^\d{5}$/.test(zip)) {
      showZipError('Please enter a valid 5-digit zip code.');
      return;
    }
    if (!VALID_ZIPS.has(zip)) {
      showZipError('Sorry, we don\'t deliver to that zip code yet. You can choose Local Pickup instead, or contact us at seaportcellarsllc@gmail.com.');
      return;
    }
    const url = STRIPE_LINKS[pendingProductKey + '_delivery'];
    zipDialog.close();
    if (!url) { window.showModal(NOT_AVAILABLE); return; }
    pendingCheckoutUrl = url;
    ageDialog.showModal();
  }

  zipDialog.querySelector('[data-act="zip-check"]').addEventListener('click', validateAndProceed);
  zipInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); validateAndProceed(); }
  });
  zipDialog.addEventListener('close', function () {
    zipInput.value = '';
    zipError.hidden = true;
  });

  ageDialog.querySelector('[data-act="age-ok"]').addEventListener('click', function () {
    // The dialog's 'close' event (which clears the pending link) fires a task
    // later, so also require the dialog to be open right now.
    if (ageDialog.open && pendingCheckoutUrl) window.location.href = pendingCheckoutUrl;
  });
  // Cancel, Esc or a backdrop click drops the pending order. "Continue"
  // navigates away to Stripe without closing the dialog.
  ageDialog.addEventListener('close', function () { pendingCheckoutUrl = null; });

  document.querySelectorAll('[data-buy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const key = btn.getAttribute('data-buy');
      if (btn.getAttribute('data-mode') === 'delivery') startDeliveryFlow(key);
      else startPickupFlow(key);
    });
  });
})();
