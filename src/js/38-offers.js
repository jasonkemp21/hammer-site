/* ---------- new-client offers popup: 3 classes for $30 and 2 private sessions for the price of 1 ---------- */
const OFFERS_KEY = 'hammer-offers-seen';
const OFFERS_QUIET_DAYS = 7;
let offersShownThisVisit = false;
function offersRecentlySeen() {
  if (offersShownThisVisit) return true;
  try { const t = +localStorage.getItem(OFFERS_KEY); return !!t && Date.now() - t < OFFERS_QUIET_DAYS * 864e5; } catch (e) { return false; }
}
function markOffersSeen() {
  offersShownThisVisit = true;
  try { localStorage.setItem(OFFERS_KEY, String(Date.now())); } catch (e) { /* storage blocked: the popup then shows once per page load */ }
}
function renderOffers() {
  const host = $('[data-offers]'); if (!host) return;
  const intro = PASSES.intro;
  host.innerHTML = `<header class="sheet__head sheet__head--done on-red"><div><p class="label">New to Hammer?</p><h2 class="h-m" id="offers-title">Start for less</h2></div>
      <button class="iconbtn" type="button" data-action="overlay-close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet__body">
      <div class="promo">
        <article class="promo__card">
          <p class="label">Group boxing</p>
          <p class="promo__big"><b>${intro.classes}</b><span>classes</span></p>
          <p class="promo__price">for ${money(intro.price)}</p>
          <p class="promo__text">Try the real thing. Take any three group classes on the schedule and see what the Hammer way feels like.</p>
          <button class="btn btn--primary btn--block" type="button" data-action="offer-intro" data-autofocus>Claim 3 for ${money(intro.price)} ${icon('go', 'i--go')}</button>
        </article>
        <article class="promo__card">
          <p class="label">Private boxing</p>
          <p class="promo__big"><b>2</b><span>sessions</span></p>
          <p class="promo__price">for the price of 1</p>
          <p class="promo__text">One-on-one with a Hammer coach, built around you. Send a request and we will reach out to set your first session.</p>
          <button class="btn btn--primary btn--block" type="button" data-action="offer-private">Request 2 for 1 ${icon('go', 'i--go')}</button>
        </article>
      </div>
      <p class="small muted">Both offers are for new clients.</p>
    </div>
    <footer class="sheet__foot"><span class="small muted">Questions? Call <a class="link" href="${GYM.tel}">${GYM.phone}</a></span><button class="btn btn--ghost" type="button" data-action="overlay-close">Maybe later</button></footer>`;
}
function openOffers() {
  if ($('#menu') && !$('#menu').hidden) actions['menu-close'](true);
  renderOffers(); markOffersSeen(); Overlay.open('offers');
}
/* shows once, a few seconds after arrival, and not again for a week; never on top of something the visitor already opened */
function scheduleOffers() {
  if (offersRecentlySeen()) return;
  setTimeout(() => {
    if (offersRecentlySeen() || document.hidden || Overlay.current || ($('#menu') && !$('#menu').hidden)) return;
    openOffers();
  }, 3000);
}
Object.assign(actions, {
  'offers-open': () => openOffers(),
  'offer-intro': () => openReserve('item', { item: 'intro' }),
  'offer-private': () => actions['inquire']({ dataset: { kind: 'boxing', offer: 'twofer' } }),
});
