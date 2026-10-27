/* ---------- "Ask the front desk": instant answers from the gym's own facts ---------- */
const Ask = { turns: [], busy: false };

/* "Monday to Friday 6 AM to 8 PM, Saturday 8 AM to 2 PM, closed Sunday", built from the one hours table */
function hoursLine() {
  const runs = [];
  GYM.hours.forEach((h, i) => { const k = h ? h.join('-') : 'x'; const last = runs[runs.length - 1]; if (last && last.k === k) last.to = i; else runs.push({ k, h, from: i, to: i }); });
  return runs.map((r) => { const days = r.from === r.to ? DAYS[r.from] : `${DAYS[r.from]} to ${DAYS[r.to]}`; return r.h ? `${days} ${clock(r.h[0]).short} to ${clock(r.h[1]).short}` : `closed ${days}`; }).join(', ');
}

/* ----- built-in matcher ----- */
function localAnswer(q) {
  const s = ' ' + q.toLowerCase().replace(/[^a-z0-9$+ ]/g, ' ') + ' ';
  const has = (...words) => words.some((w) => s.indexOf(w) >= 0);
  const nx = nextClass(WEEKVIEW); const st = openStatus(WEEKVIEW.now);
  const book = (c, label) => ({ label: label || 'Book this class', action: 'book', data: { class: c.key } });
  const route = (label, r, scroll) => ({ label, route: r, scroll });

  const coachId = has('johnny', 'owner') ? 'johnny' : has(' jj ') ? 'jj' : has('michael', 'lopez') ? 'lopez' : (has(' tee ', 'teijon') && !has('shirt')) ? 'tee' : null;
  if (coachId && !has('price', 'cost', 'how much')) {
    const c = COACHES[coachId]; const wk = coachWeekLine(coachId);
    return { text: `${c.name} is ${c.say}. ${c.fact} ${wk.length ? 'This week: ' + wk.join('; ') + '.' : ''}`, actions: [{ label: 'Tale of the tape', action: 'coach-open', data: { id: coachId } }, { label: `Classes with ${c.first}`, action: 'coach-classes', data: { id: coachId } }] };
  }
  if (has('muay thai', 'kickbox', 'thai')) {
    const m = nextClass(WEEKVIEW, (c) => c.type.id === 'muaythai');
    return { text: `Muay Thai runs Tuesday and Thursday at 6 PM with Michael Lopez. A single class is $30, and all group classes are included with Boxing + General Access at $200 a month. Private Muay Thai sessions are available too.${m ? ` The next one is ${classLine(m)}.` : ''}`, actions: m ? [book(m, 'Book Muay Thai')] : [] };
  }
  if (has('spar', 'get hit', 'full contact', 'hit in the', 'punched')) return { text: 'Sparring is always your call. Full-contact sparring is available to all but never forced on anyone. It runs Saturdays at 11 AM for those who want it.', actions: [route('See Saturday', 'schedule')] };
  if (has('compet', 'golden glove', 'amateur fight', 'go pro', 'tournament')) return { text: 'Yes, Hammer trains competitors. The gym has had 5 Chicago Golden Gloves finalists and 3 champions. Start in group classes or private rounds and tell Johnny you want to compete.', actions: [{ label: 'Talk to Johnny', action: 'inquire', data: { kind: 'compete' } }] };
  if (has('private', 'one on one', '1 on 1', 'personal train', ' pt ')) {
    const pt = has('personal train', ' pt ') && !has('boxing');
    return { text: pt ? 'Personal training is one-on-one with a NASM-certified trainer: $100 for a single session, 5 for $450, 10 for $800, 20 for $1,500 or 40 for $2,800. First-time clients get 25% off packages. Give 24 hours’ notice to cancel, and use a package within 90 days.'
      : 'Private boxing is one-on-one with active fighters: $125 for a single session, 5 for $500, 10 for $950, 20 for $1,800 or 40 for $3,400. First-time clients get 25% off packages. Give 24 hours’ notice to cancel, and use a package within 90 days.',
    actions: [{ label: 'Request a session', action: 'inquire', data: { kind: pt ? 'pt' : 'boxing' } }, route('See all pricing', 'pricing')] };
  }
  if (has('coaches', 'trainers', 'instructors', 'who teaches', 'who coaches', 'staff', 'who are the')) return { text: 'Four coaches: ' + COACH_ORDER.map((id) => COACHES[id].name + ', ' + COACHES[id].say).join('; ') + '.', actions: [route('Meet the coaches', 'coaches')] };
  if (has('heavy bag', 'speed bag', 'what equipment', 'equipment do', 'facilit', 'amenit', 'what is inside', 'whats inside')) return { text: 'The gym has a full boxing ring, heavy bags, speed bags and a lifting area, plus showers and lockers.', actions: [route('See inside', 'visit')] };
  if (has('towel')) return { text: 'Bring your own towel. Sweat towels are not provided, but clean towels are for sale at the gym if you forget. There are showers and lockers.', actions: [route('Read the FAQ', 'visit', 'faq')] };
  if (has('water', 'fountain', 'bottle')) return { text: 'Bring a refillable bottle. The water fountains are no-touch bottle fillers.', actions: [] };
  if (has('bring', ' wear', 'glove', 'wrap', ' gear', 'equipment', ' rent', 'shoes')) return { text: 'Wear comfortable workout clothes and supportive athletic shoes, and bring a towel and a water bottle. Bring gloves and wraps if you have them. If not, the gym rents them for $5. The shop also carries wraps for $14.88 and gloves from $40.', actions: [route('Shop gear', 'shop')] };
  if (has('shower', 'locker', 'changing')) return { text: 'Yes. There are showers and lockers, so a 7 AM or noon class fits around work. Bring your own towel, or buy a clean one at the gym.', actions: [] };
  if (has('clean', 'sanit', 'covid', 'mask', 'hygien', ' sick', 'germ')) return { text: 'Staff sanitize the equipment and the floor after classes and private sessions, and Gym Access members wipe down what they use with the supplies provided. Masks are not required, though private clients can ask their trainer to wear one. If you are feeling unwell, please stay home.', actions: [route('Read the FAQ', 'visit', 'faq')] };
  if (has('gym access', 'general access', 'open gym', 'on my own', 'by myself', 'weights', 'weight room', 'lifting')) return { text: 'Gym Access is $100 a month. Train on your own schedule during open hours, with full use of the boxing area and the lifting area. Access can be limited while trainers run one-on-one sessions.', actions: [{ label: 'Get Gym Access', action: 'buy', data: { item: 'access' } }, route('See all pricing', 'pricing')] };
  if (has(' kid', 'child', ' teen', ' son ', 'daughter', 'youth', 'haven', 'year old')) return { text: 'Kids Boxing runs Monday, Wednesday and Friday at 5 PM, and the front desk handles enrollment. Johnny also coaches children one-on-one. Hammer’s Haven, the not-for-profit at the same address, runs youth boxing and mentoring on weekday afternoons from 4 to 7 PM.', actions: [{ label: 'Ask about Kids Boxing', action: 'inquire', data: { kind: 'kids' } }, route('About Hammer’s Haven', 'haven')] };
  if (has('park')) return { text: `I do not have parking details listed. The front desk can tell you: ${GYM.phone}. By train, Sedgwick on the Brown Line is about a 4-minute walk.`, actions: [route('Getting here', 'visit')] };
  if (has('where', 'address', 'location', 'direction', 'get there', 'transit', 'cta', ' bus', 'brown line', 'red line', 'station', 'subway', ' near')) return { text: `${GYM.street}, at the corner of North and Mohawk in Old Town. Sedgwick (Brown and Purple lines) is about a 4-minute walk. North/Clybourn on the Red Line is about 8 minutes, and the #72 North Ave bus runs past.`, actions: [{ label: 'Open directions', href: GYM.maps }, route('Map and hours', 'visit')] };
  if (has('hour', 'open', 'close', 'closing')) {
    const t = GYM.hours[WEEKVIEW.now.day];
    // a named day gets its own answer first: "are you open on Sunday?"
    const asked = DAYS.findIndex((d) => s.indexOf(d.toLowerCase()) >= 0);
    if (asked >= 0 && asked !== WEEKVIEW.now.day) { const h = GYM.hours[asked]; return { text: `${h ? `${DAYS[asked]} hours are ${clock(h[0]).short} to ${clock(h[1]).short}` : `The gym is closed on ${DAYS[asked]}`}. The full week: ${hoursLine()}.`, actions: [route('Hours and map', 'visit')] }; }
    return { text: `${st.label}${st.detail ? '. ' + st.detail : ''}. ${t ? `Today's hours are ${clock(t[0]).short} to ${clock(t[1]).short}.` : 'The gym is closed today.'} ${hoursLine()}.`, actions: [route('Hours and map', 'visit')] };
  }
  if (has('cancel', 'refund', 'expire', 'expiration', 'policy', 'reschedule')) return { text: 'Private boxing and personal training sessions need 24 hours’ notice to cancel or move. Session packages expire after 90 days, and the 10-class pack expires 12 weeks after purchase.', actions: [route('Pricing details', 'pricing')] };
  if (has('beginner', 'never', 'first time', 'new to', 'experience', 'out of shape', 'intimidat', 'nervous', 'scared')) return { text: 'You will fit right in. Every group class welcomes all skill levels and is beginner friendly. Coaches teach proper form first, and sparring is never required. New clients can take 3 classes for $30.', actions: nx ? [book(nx, 'Book a first class'), { label: 'Find your corner', action: 'quiz-open' }] : [] };
  if (has('price', 'cost', 'how much', 'membership', 'unlimited', 'pack', 'drop in', 'drop-in', 'intro', 'trial', 'deal', 'discount', 'special', 'promo', 'free', '$', ' pay', ' rates ', ' fee')) return { text: 'New clients start with 3 classes for $30. After that a single class is $30, a 10-class pack is $250 and unlimited group boxing is $150 a month. Boxing plus general gym access is $200 a month. First-time clients also get 25% off packages.', actions: [route('See all pricing', 'pricing'), { label: 'Claim the intro offer', action: 'book', data: { pass: 'intro' } }] };
  if (has('lunch', 'noon', 'midday')) { const m = nextClass(WEEKVIEW, (c) => c.type.id === 'lunch'); return { text: `Lunch-Time Boxing runs Monday to Friday at 12 PM for one hour.${m ? ` The next one is ${classLine(m)} with ${stop(m.coach.name)}` : ''}`, actions: m ? [book(m)] : [] }; }
  if (has('morning', 'early', '7 am', 'before work')) { const m = nextClass(WEEKVIEW, (c) => c.t < 600 && c.day < 5); return { text: `Morning boxing is at 7 AM, Monday to Friday.${m ? ` The next one is ${classLine(m)} with ${stop(m.coach.name)}` : ''}`, actions: m ? [book(m)] : [] }; }
  if (has('evening', 'after work', 'tonight', 'night', '5 pm', '6 pm')) { const m = nextClass(WEEKVIEW, (c) => c.t >= 1020); return { text: `Evening boxing runs at 5 PM and 6 PM, Monday to Friday, plus Muay Thai at 6 PM on Tuesday and Thursday.${m ? ` The next evening class is ${classLine(m)}.` : ''}`, actions: m ? [book(m)] : [] }; }
  if (has('saturday', 'weekend', 'sunday')) { const m = nextClass(WEEKVIEW, (c) => c.day === 5); const sat = GYM.hours[5]; return { text: `Saturday has boxing at 10 AM and sparring at 11 AM. The gym is open ${clock(sat[0]).short} to ${clock(sat[1]).short} on Saturday and closed Sunday.`, actions: m ? [book(m, 'Book Saturday 10 AM')] : [] }; }
  if (has('class', 'schedule', 'next', 'today', 'tomorrow', 'when', 'time', 'book', 'sign up', 'reserve', 'join')) return { text: nx ? `The next class is ${nx.type.name} with ${nx.coach.name}, ${classLine(nx)}. Boxing runs Monday to Friday at 7 AM, 12 PM, 5 PM and 6 PM, and Saturday at 10 AM.` : 'Boxing runs Monday to Friday at 7 AM, 12 PM, 5 PM and 6 PM, and Saturday at 10 AM.', actions: nx ? [book(nx), route('Full schedule', 'schedule')] : [route('Full schedule', 'schedule')] };
  if (has('phone', 'call', 'email', 'contact', 'talk to', 'human', 'person')) return { text: `Call ${GYM.phone} or email ${GYM.email}. For training questions, write to ${GYM.emailTraining}.`, actions: [route('Contact and hours', 'visit')] };
  if (has('timer', 'round', 'shadow')) return { text: 'There is a free round timer with a combo caller on this site. Three minutes on, one off, with the bell.', actions: [route('Open the timer', 'train')] };
  if (has('shop', 'merch', 'hoodie', 'shirt', 'buy', 'cap')) return { text: 'The shop has Hammer tees, hoodies, caps and sweats, plus hand wraps, gloves and mouthpieces.', actions: [route('Visit the shop', 'shop')] };
  if (has('review', 'rating', 'good', 'legit', 'bbb')) return { text: 'Hammer holds a 4.9 average on ClassPass from more than 1,000 ratings, and an A+ rating with the Better Business Bureau. Classes are led by retired and active fighters.', actions: [route('Meet the coaches', 'coaches')] };
  return { text: `I can help with classes, prices, hours, what to bring and getting here. For anything else, the front desk is at ${GYM.phone}.`, actions: [route('See the schedule', 'schedule'), route('See pricing', 'pricing')], miss: true };
}

const ASK_STARTERS = ['When is the next class?', 'I have never boxed. Can I come?', 'What does a first class cost?', 'What should I bring?', 'Do I have to spar?', 'How do I get there?'];

function renderAsk() {
  const host = $('[data-ask]'); if (!host) return;
  const turns = Ask.turns.map((t) => {
    if (t.role === 'user') return `<div class="msg msg--me"><p>${esc(t.text)}</p></div>`;
    const acts = (t.actions || []).map((a) => a.href ? `<a class="chip" href="${esc(a.href)}" target="_blank" rel="noopener">${esc(a.label)} ${icon('out')}</a>`
      : a.route ? `<button class="chip" type="button" data-route="${a.route}" ${a.scroll ? `data-scroll="${a.scroll}"` : ''}>${esc(a.label)}</button>`
        : `<button class="chip" type="button" data-action="${a.action}" ${Object.keys(a.data || {}).map((k) => `data-${k}="${esc(a.data[k])}"`).join(' ')}>${esc(a.label)}</button>`).join('');
    return `<div class="msg msg--desk"><p class="msg__who">Front desk</p><p ${t.pending ? 'data-ask-stream' : ''}>${t.pending && !t.text ? '<span class="dots"><i></i><i></i><i></i></span>' : esc(t.text)}</p>${t.note ? `<p class="micro muted">${esc(t.note)}</p>` : ''}${acts ? `<div class="chips">${acts}</div>` : ''}</div>`;
  }).join('');
  const starters = `<div class="ask__starters"><p class="label">Try asking</p><div class="chips">${ASK_STARTERS.map((q) => `<button class="chip" type="button" data-action="ask-q" data-q="${esc(q)}">${esc(q)}</button>`).join('')}</div></div>`;
  host.innerHTML = `<header class="sheet__head"><div><p class="label">Instant answers</p><h2 class="h-m" id="ask-title">Ask the front desk</h2></div>
      <button class="iconbtn" type="button" data-action="overlay-close" aria-label="Close">${icon('x')}</button></header>
    <div class="ask__log" data-ask-log aria-live="polite">
      <div class="msg msg--desk"><p class="msg__who">Front desk</p><p>Hi. Ask me about classes, prices, hours or what to bring.</p></div>
      ${turns}${Ask.turns.length ? '' : starters}
    </div>
    <form class="ask__form" data-form="ask">
      <label class="vh" for="ask-input">Your question</label>
      <input class="input" id="ask-input" type="text" autocomplete="off" placeholder="Type a question" maxlength="240" ${Ask.busy ? 'disabled' : ''}>
      <button class="btn btn--primary" type="submit" aria-label="Send">${icon('send')}</button>
    </form>`;
  const log = $('[data-ask-log]', host); if (log) log.scrollTop = log.scrollHeight;
}

function askSend(q) {
  q = String(q || '').trim(); if (!q || Ask.busy) return;
  Ask.turns.push({ role: 'user', text: q });
  const local = localAnswer(q);
  Ask.turns.push(Object.assign({ role: 'desk' }, local)); renderAsk(); const i = $('#ask-input'); if (i) i.focus();
}

Object.assign(actions, {
  'ask-open': () => { if ($('#menu') && !$('#menu').hidden) actions['menu-close'](); renderAsk(); Overlay.open('ask'); },
  'ask-q': (el) => askSend(el.dataset.q),
});
document.addEventListener('submit', (e) => {
  const f = e.target.closest('[data-form]'); if (!f) return;
  e.preventDefault();
  if (f.dataset.form === 'ask') { const i = $('#ask-input'); const q = i.value; i.value = ''; askSend(q); }
  else if (f.dataset.form === 'inquiry') actions['inq-send']();
  else if (f.dataset.form === 'reserve') actions['rv-send']();
  else if (f.dataset.form === 'contact') actions['contact-send']();
});
