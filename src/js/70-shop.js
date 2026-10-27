/* ---------- shop: what the front desk sells, shown as a catalog ---------- */
function renderShop() {
  const host = $('[data-shop]'); if (!host) return; const f = state.shopCat || 'all';
  const chips = [['all', 'Everything'], ['apparel', 'Apparel'], ['gear', 'Gear']].map(([id, n]) => `<button class="chip" type="button" aria-pressed="${f === id}" data-action="shop-cat" data-id="${id}">${n}</button>`).join('');
  const cards = PRODUCTS.filter((p) => f === 'all' || p.cat === f).map((p) => {
    const colors = p.colors || [];
    const note = [p.note, colors.length ? colors.join(' or ') : ''].filter(Boolean).join(' · ');
    return `<article class="product">
      <div class="product__img ${p.id === 'rdx' ? 'product__img--grey' : ''}"><img src="${p.img}" width="640" height="640" loading="lazy" alt="${esc(p.name)}">${p.was ? '<span class="pill pill--red product__flag">Sale</span>' : ''}</div>
      <h3 class="product__name">${esc(p.name)}</h3>
      <div class="product__row"><p class="product__price data">${money(p.price)}${p.was ? ` <s>${money(p.was)}</s>` : ''}</p></div>
      ${note ? `<p class="product__note">${esc(note)}</p>` : ''}
      <p class="product__where">${icon('pin')}<span>${p.sizes ? 'Ask the desk for sizes' : 'At the front desk'}</span></p>
    </article>`; }).join('');
  host.innerHTML = `<div class="shopbar"><div class="chips">${chips}</div>
      <p class="small muted">Buying your own gear? Wraps and Everlast gloves come to ${money(14.88 + 40)}. Or rent gloves and wraps at the gym for $5.</p></div>
    <div class="products">${cards}</div>
    <p class="small muted shop__foot">Everything here is sold at the front desk, ${esc(GYM.street)}. Call <a class="link" href="${GYM.tel}">${GYM.phone}</a> to check a size or color before you come in.</p>`;
}

Object.assign(actions, {
  'shop-cat': (el) => { state.shopCat = el.dataset.id; renderShop(); },
});
