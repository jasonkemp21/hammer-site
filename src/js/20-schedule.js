/* ---------- schedule: the bell card, today's card, the week grid, the phone dock ---------- */
const TAG_LABEL = { boxing: 'Boxing', lunch: 'Hip House', muaythai: 'Muay Thai', sparring: 'Sparring', kids: 'Kids' };
let WEEKVIEW = buildWeek();

function coachCell(c) {
  if (!c.coach) { const [a, b] = c.type.noCoach || ['Hammer coaches', '']; return `<div class="bout__coach"><span>${esc(a)}<small>${esc(b)}</small></span></div>`; }
  const pic = c.coach.ava ? `<img src="${c.coach.ava}" alt="" width="46" height="46" loading="lazy">` : `<span class="bout__initials" aria-hidden="true">${esc((c.coach.first || c.coach.name).slice(0, 1))}</span>`;
  return `<div class="bout__coach">${pic}<span>${esc(c.coach.name)}<small>${c.sub ? 'Covering for ' + esc(c.sub) : esc((c.coach.role || 'Coach').split(' · ')[0])}</small></span></div>`;
}
function boutCta(c) {
  if (c.past === true) return '<span class="bout__done">Final bell</span>';
  if (c.cancelled) return '<span class="bout__done">Cancelled</span>';
  if (c.past === 'live') return '<span class="bout__done">Under way</span>';
  if (state.bookings[c.key]) return `<span class="bout__in">${icon('check')} You're on the card</span>`;
  if (!c.type.bookable) return `<button class="btn btn--ghost btn--sm" type="button" data-action="inquire" data-kind="${c.type.ask}">${c.type.askLabel}</button>`;
  return `<button class="btn btn--primary btn--sm" type="button" data-action="book" data-class="${c.key}">Book ${icon('go', 'i--go')}</button>`;
}
function boutRow(c, nextKey) {
  const ck = clock(c.t);
  const isNext = nextKey === c.key;
  const flag = isNext ? `<span class="bout__flag">Next bell · <span data-countdown="${c.key}">${duration(c.startsIn).words}</span></span>`
    : c.past === 'live' ? '<span class="bout__flag">In the ring now</span>' : '';
  return `<article class="bout ${c.past === true ? 'is-past' : ''} ${isNext ? 'is-next' : ''}">
    ${flag}
    <div class="bout__time">${ck.h}:${pad2(ck.m)}<small>${ck.ap}</small></div>
    <div class="bout__what">
      <h3 class="bout__name">${esc(c.type.name)}</h3>
      <div class="bout__meta"><span class="tag tag--${c.type.tag}">${TAG_LABEL[c.type.tag]}</span>${c.type.bookable ? `<span>${c.mins || c.type.mins} min</span>` : ''}${c.type.level ? `<span>${esc(c.type.level)}</span>` : ''}${c.spots === 0 ? '<span class="spots spots--full">Full, waitlist on Mindbody</span>' : c.spots != null && c.spots <= 4 && !c.past ? `<span class="spots">${c.spots} ${c.spots === 1 ? 'spot' : 'spots'} left</span>` : ''}</div>
    </div>
    ${coachCell(c)}
    <div class="bout__cta">${boutCta(c)}</div>
  </article>`;
}

function dayTabs(scope, selected) {
  return WEEKVIEW.days.map((d) => `<button class="daytab ${d.n === 0 ? 'is-today' : ''} ${d.hours ? '' : 'is-closed'}" type="button" role="tab" aria-selected="${d.n === selected}" data-action="day" data-scope="${scope}" data-n="${d.n}">
      <b>${DAYS3[d.day]}</b><span>${fmtMonthDay.format(d.date)}</span></button>`).join('');
}
function matchesFilter(c) {
  const f = state.sched;
  return (f.type === 'all' || c.type.id === f.type) && (f.coach === 'all' || (c.coach && c.coach.id === f.coach));
}
function dayList(d, nextKey, filtered) {
  const list = filtered ? d.classes.filter(matchesFilter) : d.classes;
  if (!d.hours) {
    const nx = nextClass(WEEKVIEW);
    return `<div class="bouts__empty"><h3 class="h-m">Closed ${DAYS[d.day]}s</h3><p class="muted">Rest day. ${nx ? `Next bell is ${DAYS[nx.day]} at ${clock(nx.t).text}.` : ''}</p>${nx ? `<button class="btn btn--solid btn--sm" type="button" data-action="day" data-scope="${filtered ? 'sched' : 'home'}" data-n="${nx.n}">See ${DAYS[nx.day]}</button>` : ''}</div>`;
  }
  if (!list.length) return '<div class="bouts__empty"><h3 class="h-m">Nothing matches</h3><p class="muted">No classes fit those filters on this day.</p><button class="btn btn--solid btn--sm" type="button" data-action="sched-reset">Clear filters</button></div>';
  return list.map((c) => boutRow(c, nextKey)).join('');
}

/* ----- home: today's card ----- */
function renderHomeCard() {
  const d = WEEKVIEW.days[state.homeDay] || WEEKVIEW.days[0];
  const nx = nextClass(WEEKVIEW);
  const title = d.n === 0 ? "Today's card" : d.n === 1 ? "Tomorrow's card" : `${DAYS[d.day]}'s card`;
  $('[data-card-title]').textContent = title;
  $('[data-card-date]').textContent = fmtLong.format(d.date);
  const bookable = d.classes.filter((c) => c.type.bookable);
  $('[data-card-sub]').textContent = bookable.length
    ? `First bell ${clock(bookable[0].t).text}. Last bell ${clock(bookable[bookable.length - 1].t).text}.`
    : 'No classes. The gym is closed.';
  $('[data-daytabs="home"]').innerHTML = dayTabs('home', d.n);
  $('[data-bouts="home"]').innerHTML = dayList(d, nx && nx.key, false);
}

/* ----- hero: next bell ----- */
function renderBellCard() {
  const el = $('[data-bellcard]'); if (!el) return;
  const nx = nextClass(WEEKVIEW); const st = openStatus(WEEKVIEW.now);
  if (!nx) return;
  const ck = clock(nx.t);
  const when = nx.n === 0 ? 'Today' : nx.n === 1 ? 'Tomorrow' : DAYS[nx.day];
  el.innerHTML = `<div class="bellcard__top"><span class="label">Next bell</span>
      <span class="pill ${st.open ? 'pill--open' : 'pill--closed'}"><span class="pill__dot"></span>${st.label}</span></div>
    <p class="bellcard__time">${ck.h}:${pad2(ck.m)}<small>${ck.ap} · ${when}</small></p>
    <p class="bellcard__name">${esc(nx.type.name)}<span>${nx.coach ? 'with ' + esc(nx.coach.name) + ' · ' : ''}${nx.type.mins} min · ${esc(nx.type.level)}</span></p>
    <p class="bellcard__count"><span>Starts in</span><b data-countdown-hms="${nx.key}">${duration(nx.startsIn).hms}</b></p>
    <button class="btn btn--primary btn--block" type="button" data-action="book" data-class="${nx.key}">Book this class ${icon('go', 'i--go')}</button>`;
}

/* ----- open / closed pills and the phone dock ----- */
function renderStatus() {
  const st = openStatus(WEEKVIEW.now);
  $$('[data-open-status]').forEach((el) => {
    el.className = 'pill ' + (st.open ? 'pill--open' : 'pill--closed');
    el.innerHTML = `<span class="pill__dot"></span>${st.label}${st.detail ? ' · ' + st.detail : ''}`;
  });
  const nx = nextClass(WEEKVIEW); const dock = $('[data-dock-next]');
  if (dock && nx) {
    dock.textContent = `${nx.n === 0 ? '' : DAYS3[nx.day] + ' '}${clock(nx.t).short} · ${nx.type.name}`;
    $('[data-dock-book]').dataset.class = nx.key;
  }
  // hours tables mark today
  $$('[data-hours]').forEach((el) => {
    el.innerHTML = GYM.hours.map((h, i) => `<div class="${i === WEEKVIEW.now.day ? 'is-today' : ''}"><b>${DAYS[i]}</b><span>${h ? clock(h[0]).short + ' to ' + clock(h[1]).short : 'Closed'}</span></div>`).join('');
  });
}

/* ----- schedule page ----- */
function scheduleNote() {
  const el = $('[data-sched-note]'); if (!el) return;
  if (SCHED) { const when = new Intl.DateTimeFormat('en-US', { timeZone: GYM.tz, weekday: 'long', hour: 'numeric', minute: '2-digit' }).format(SCHED.fetched); el.innerHTML = `This week's times and coaches come from the gym's Mindbody calendar and refresh every morning (last checked ${esc(when)}). Days further out show the usual schedule. Muay Thai, Kids Boxing and sparring are as the gym posts them. <a class="link" href="${GYM.mindbody}" target="_blank" rel="noopener">Open the Mindbody schedule</a>`; }
  else el.textContent = 'Times and coaches as posted by the gym. Kids Boxing and Saturday sparring are reserved through the front desk.';
}
function renderSchedule() {
  const host = $('[data-schedule]'); if (!host) return; scheduleNote();
  const f = state.sched; const nx = nextClass(WEEKVIEW);
  const typeChips = [['all', 'All classes'], ['boxing', 'Boxing'], ['lunch', 'Hip House'], ['muaythai', 'Muay Thai'], ['kids', 'Kids'], ['sparring', 'Sparring']]
    .map(([id, label]) => `<button class="chip" type="button" aria-pressed="${f.type === id}" data-action="sched-type" data-id="${id}">${id === 'all' ? '' : `<span class="tag tag--${id}"></span>`}${label}</button>`).join('');
  const coachChips = [['all', 'Any coach']].concat(COACH_ORDER.map((id) => [id, COACHES[id].first]))
    .map(([id, label]) => `<button class="chip" type="button" aria-pressed="${f.coach === id}" data-action="sched-coach" data-id="${id}">${label}</button>`).join('');
  const slots = Array.from(new Set(WEEKVIEW.days.flatMap((d) => d.classes.map((c) => c.t)))).sort((a, b) => a - b);
  const total = WEEKVIEW.days.flatMap((d) => d.classes).filter(matchesFilter).length;

  const head = `<div class="week__corner"></div>` + WEEKVIEW.days.map((d) => `<div class="week__day ${d.n === 0 ? 'is-today' : ''} ${d.hours ? '' : 'is-closed'}"><b>${DAYS3[d.day]}</b><span>${fmtMonthDay.format(d.date)}${d.n === 0 ? ' · today' : ''}</span></div>`).join('');
  const rows = slots.map((t) => {
    const cells = WEEKVIEW.days.map((d) => {
      const here = d.classes.filter((c) => c.t === t && matchesFilter(c));
      if (!d.hours) return '<div class="week__cell is-closed"></div>';
      return `<div class="week__cell ${d.n === 0 ? 'is-today' : ''}">${here.map((c) => slotCard(c, nx && nx.key)).join('')}</div>`;
    }).join('');
    return `<div class="week__time">${clock(t).short}</div>${cells}`;
  }).join('');
  const sel = WEEKVIEW.days[f.day] || WEEKVIEW.days[0];

  host.innerHTML = `<div class="filters">
      <div class="filters__group"><p class="label">Class</p><div class="chips">${typeChips}</div></div>
      <div class="filters__group"><p class="label">Coach</p><div class="chips">${coachChips}</div></div>
      <p class="small muted filters__count"><b class="data">${total}</b> ${total === 1 ? 'class' : 'classes'} in the next 7 days</p>
    </div>
    <div class="week" role="table" aria-label="Classes for the next 7 days">${head}${rows}</div>
    <div class="weeklist">
      <div class="daytabs" role="tablist" aria-label="Pick a day">${dayTabs('sched', sel.n)}</div>
      <div class="bouts">${dayList(sel, nx && nx.key, true)}</div>
    </div>`;
}
function slotCard(c, nextKey) {
  const booked = state.bookings[c.key];
  const cls = `slot slot--${c.type.tag} ${c.past ? 'is-past' : ''} ${booked ? 'is-booked' : ''} ${nextKey === c.key ? 'is-next' : ''}`;
  const inner = `<span class="tag tag--${c.type.tag}">${TAG_LABEL[c.type.tag]}</span>
    <b class="slot__name">${esc(c.type.name)}</b>${c.spots != null && c.spots > 0 && c.spots <= 4 && !c.past ? `<span class="slot__spots">${c.spots} left</span>` : ''}
    <span class="slot__coach">${c.coach ? esc(c.coach.name) : esc((c.type.noCoach || ['Hammer coaches'])[0])}</span>
    <span class="slot__cta">${c.cancelled ? 'Cancelled' : c.spots === 0 && !c.past ? 'Full' : c.past === true ? 'Final bell' : c.past === 'live' ? 'Under way' : booked ? icon('check') + ' Booked' : c.type.bookable ? 'Book ' + icon('go', 'i--go') : c.type.askLabel}</span>`;
  if (c.past || c.cancelled) return `<div class="${cls} ${c.cancelled ? 'is-past' : ''}">${inner}</div>`;
  if (!c.type.bookable) return `<button class="${cls}" type="button" data-action="inquire" data-kind="${c.type.ask}">${inner}</button>`;
  return `<button class="${cls}" type="button" data-action="book" data-class="${c.key}">${inner}</button>`;
}

function renderAllSchedule() {
  WEEKVIEW = buildWeek();
  // if today has nothing left, open the card on the next day that does
  if (!state.homeDayTouched) {
    const nx = nextClass(WEEKVIEW);
    state.homeDay = nx ? nx.n : 0;
    if (!state.schedDayTouched) state.sched.day = state.homeDay;
  }
  renderBellCard(); renderHomeCard(); renderStatus(); renderSchedule();
  emit('week');
}

/* tick: countdown text every second; rebuild only when the next class, the open state or the date changes */
let lastSig = '';
function tick() {
  const fresh = buildWeek(); const nx = nextClass(fresh); const st = openStatus(fresh.now);
  const sig = `${nx ? nx.key : ''}|${st.open}|${st.detail}|${fresh.now.d}`;
  if (sig !== lastSig) { lastSig = sig; renderAllSchedule(); return; }
  if (!nx) return;
  const d = duration(nx.startsIn);
  $$('[data-countdown-hms]').forEach((el) => { el.textContent = d.hms; });
  $$('[data-countdown]').forEach((el) => { if (el.textContent !== d.words) el.textContent = d.words; });
}

Object.assign(actions, {
  'day': (el) => {
    const n = +el.dataset.n;
    if (el.dataset.scope === 'home') { state.homeDay = n; state.homeDayTouched = true; renderHomeCard(); }
    else { state.sched.day = n; state.schedDayTouched = true; renderSchedule(); }
  },
  'sched-type': (el) => { state.sched.type = el.dataset.id; renderSchedule(); },
  'sched-coach': (el) => { state.sched.coach = el.dataset.id; renderSchedule(); },
  'sched-reset': () => { state.sched.type = 'all'; state.sched.coach = 'all'; renderSchedule(); },
  'book-next': (el) => { actions.book(el); },
});
