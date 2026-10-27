/* ---------- coaches: the red wall, the tale of the tape, the coaches page ---------- */
function joinDays(days) {
  // [0,1,2,3,4] -> "Mon to Fri"; [1,3] -> "Tue and Thu"; [0,1] -> "Mon and Tue"
  days = days.slice().sort((a, b) => a - b);
  const run = days.every((d, i) => i === 0 || d === days[i - 1] + 1);
  if (days.length >= 3 && run) return `${DAYS3[days[0]]} to ${DAYS3[days[days.length - 1]]}`;
  if (days.length === 2) return `${DAYS3[days[0]]} and ${DAYS3[days[1]]}`;
  return days.map((d) => DAYS3[d]).join(', ');
}
/* a coach's week, grouped: [{ type, days:[..], t }] */
function coachWeek(id) {
  const groups = {};
  WEEK.filter((c) => c.coach === id).forEach((c) => { const k = c.type + '|' + c.t; (groups[k] = groups[k] || { type: CLASS_TYPES[c.type], t: c.t, days: [] }).days.push(c.day); });
  return Object.values(groups).sort((a, b) => a.t - b.t);
}
function coachWeekLine(id) { return coachWeek(id).map((g) => `${g.type.name}: ${joinDays(g.days)} ${clock(g.t).short}`); }

function wallMarkup(ghost) {
  return `${ghost ? '<div class="wall__ghost" aria-hidden="true">HAMMER</div>' : ''}<div class="wall__row">${COACH_ORDER.map((id) => { const c = COACHES[id];
    return `<button class="fighter" type="button" data-action="coach-open" data-id="${id}" aria-label="${esc(c.name)}, ${esc(c.role)}. Open tale of the tape.">
        <img class="fighter__img" src="${c.img}" width="820" height="951" loading="lazy" alt="">
        <span class="fighter__plate"><span class="fighter__name">${esc(c.name)}</span><span class="fighter__role">${esc(c.role)}</span>
          <span class="fighter__fact">${esc(c.fact)}</span><span class="fighter__more">Tale of the tape ${icon('go', 'i--go')}</span></span>
      </button>`; }).join('')}</div>`;
}
function tapeRows(c) {
  const week = coachWeekLine(c.id);
  const rows = c.tape.concat([['On this week’s card', week.length ? week.join(' · ') : 'By appointment']]);
  return `<dl class="tape">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
}
function coachCtas(c) {
  const kind = c.privates[0];
  return `<div class="btn-row">
      <button class="btn btn--primary" type="button" data-action="coach-classes" data-id="${c.id}">Classes with ${esc(c.first)}</button>
      <button class="btn btn--ghost" type="button" data-action="inquire" data-kind="${kind}" data-coach="${c.id}">Request a private</button>
    </div>`;
}
function renderCoachModal(id) {
  const c = COACHES[id]; const host = $('[data-coachcard]'); if (!c || !host) return;
  host.innerHTML = `<div class="tapecard">
      <div class="tapecard__photo on-red"><img src="${c.img}" width="820" height="951" alt="${esc(c.name)}"><span class="tapecard__ghost" aria-hidden="true">${esc(c.last)}</span></div>
      <div class="tapecard__body">
        <header class="sheet__head sheet__head--flat"><div><p class="label">Tale of the tape</p><h2 class="h-l" id="coach-title">${esc(c.name)}</h2></div>
          <button class="iconbtn" type="button" data-action="overlay-close" aria-label="Close">${icon('x')}</button></header>
        ${tapeRows(c)}
        ${c.quote ? `<blockquote class="tapecard__quote">“${esc(c.quote)}”</blockquote>` : ''}
        ${coachCtas(c)}
      </div>
    </div>`;
}
function renderCoachesPage() {
  const host = $('[data-coaches]'); if (!host) return;
  host.innerHTML = COACH_ORDER.map((id, i) => { const c = COACHES[id];
    return `<article class="coach ${i % 2 ? 'coach--flip' : ''}" id="coach-${id}">
        <div class="coach__photo on-red"><span class="coach__ghost" aria-hidden="true">${esc(c.last)}</span><img src="${c.img}" width="820" height="951" loading="lazy" alt="${esc(c.name)}, ${esc(c.role)}"></div>
        <div class="coach__body">
          <p class="label">${esc(c.role)}</p>
          <h2 class="h-l">${esc(c.name)}</h2>
          <div class="prose">${c.bio.map((p) => `<p>${esc(p)}</p>`).join('')}</div>
          ${c.quote ? `<blockquote class="tapecard__quote">“${esc(c.quote)}”</blockquote>` : ''}
          <h3 class="label label--fg coach__tapehead">${star()} Tale of the tape</h3>
          ${tapeRows(c)}
          ${coachCtas(c)}
        </div>
      </article>`; }).join('');
}
Object.assign(actions, {
  'coach-open': (el) => { renderCoachModal(el.dataset.id); Overlay.open('coach'); },
  'coach-classes': (el) => { state.sched.coach = el.dataset.id; state.sched.type = 'all'; Overlay.close(true); go('schedule'); },
});

/* ---------- "Find your corner": four questions, one recommendation ---------- */
const QUIZ = [
  { id: 'goal', q: 'What brings you in?', a: [['shape', 'Get in shape'], ['skill', 'Learn to box properly'], ['defense', 'Self-defense'], ['compete', 'Compete someday']] },
  { id: 'time', q: 'When can you train?', a: [['am', 'Early mornings'], ['noon', 'Lunch hour'], ['pm', 'After work'], ['sat', 'Saturdays'], ['any', 'It changes week to week']] },
  { id: 'style', q: 'How do you like to train?', a: [['group', 'In a group'], ['solo', 'One-on-one with a coach'], ['own', 'On my own']] },
  { id: 'freq', q: 'How often, realistically?', a: [['1', 'Once a week'], ['2', 'Twice a week'], ['3', 'Three times'], ['4', 'Four or more']] },
];
const Quiz = { step: 0, answers: {} };

function quizResult() {
  const a = Quiz.answers; const freq = +a.freq || 2;
  let prog, why, filter = null, typeId = null;
  if (a.style === 'solo') {
    prog = PROGRAMS.find((p) => p.id === (a.goal === 'shape' ? 'pt' : 'private'));
    why = a.goal === 'shape' ? 'You want results and a coach who holds you to them. A certified trainer builds the plan around your goals.' : 'You want a coach on the mitts and feedback on every punch. Private rounds are the fastest way to learn it right.';
  } else if (a.style === 'own') {
    prog = PROGRAMS.find((p) => p.id === 'access');
    why = 'You like to work on your own clock. Gym Access gives you the boxing area and the lifting area. Take a class or two first so the form is right.';
  } else if (a.time === 'noon') {
    prog = PROGRAMS.find((p) => p.id === 'lunch'); typeId = 'lunch'; filter = (c) => c.type.id === 'lunch';
    why = 'Your day has room in the middle. The noon class runs an hour, with showers and lockers for the trip back.';
  } else {
    prog = PROGRAMS.find((p) => p.id === 'group'); typeId = 'boxing';
    filter = a.time === 'am' ? (c) => c.type.id === 'boxing' && c.t < 600 && c.day < 5
      : a.time === 'pm' ? (c) => c.type.id === 'boxing' && c.t >= 1020
        : a.time === 'sat' ? (c) => c.type.id === 'boxing' && c.day === 5
          : (c) => c.type.id === 'boxing';
    why = a.goal === 'defense' ? 'Group boxing teaches real technique and the defense to go with it, which is what self-defense comes down to.'
      : a.goal === 'compete' ? 'Start in group boxing so the coaches can see you work. When you are ready, sparring runs Saturdays at 11 AM.'
        : 'Group boxing is 55 minutes of technique and conditioning. All skill levels are welcome, and it is beginner friendly.';
  }
  const nx = filter ? nextClass(WEEKVIEW, filter) : null;
  let pass, passWhy;
  if (a.style === 'solo') {
    const kind = prog.id === 'pt' ? 'pt' : 'boxing'; const n = freq >= 2 ? 10 : 5; const m = packMath(kind, n);
    pass = { label: `${n}-session pack`, price: money(m.list), action: 'inquire', kind };
    passWhy = `${money(Math.round(m.list / n))} a session instead of ${money(m.single)}. First-time clients take 25% off.`;
  } else if (a.style === 'own') {
    pass = { label: 'Gym Access', price: '$100 a month', action: 'buy', item: 'access' }; passWhy = 'Come in during open hours and train at your own pace.';
  } else if (a.goal === 'compete' && freq >= 3) {
    pass = { label: 'Unlimited Hammer', price: '$275 a month', action: 'buy', item: 'hammer' }; passWhy = 'Unlimited classes, general access and a specialty skill session every month.';
  } else if (freq >= 2) {
    const per = 150 / (freq * MONTH);
    pass = { label: 'Group Boxing Unlimited', price: '$150 a month', action: 'buy', item: 'unlimited' }; passWhy = `At ${freq === 4 ? 'four or more' : freq === 3 ? 'three' : 'two'} classes a week that is about ${money(Math.round(per * 100) / 100)} a class.`;
  } else {
    pass = { label: '10-class pack', price: '$250', action: 'buy', item: 'pack10' }; passWhy = 'At once a week that is $25 a class, and one pack lasts about ten weeks.';
  }
  return { prog, why, nx, pass, passWhy, typeId, compete: a.goal === 'compete' };
}

function renderQuiz() {
  const host = $('[data-quiz]'); if (!host) return; const z = Quiz;
  if (z.step < QUIZ.length) {
    const q = QUIZ[z.step];
    host.innerHTML = sheetHead(`Question ${z.step + 1} of ${QUIZ.length}`, q.q, 'quiz-title') + stepDots(z.step + 1, QUIZ.length) + `<div class="sheet__body">
        <div class="answers">${q.a.map(([id, label]) => `<button class="answer ${z.answers[q.id] === id ? 'is-on' : ''}" type="button" data-action="quiz-answer" data-id="${id}">${label}${icon('go', 'i--go')}</button>`).join('')}</div>
      </div>
      <footer class="sheet__foot">${z.step ? `<button class="btn btn--ghost" type="button" data-action="quiz-back">${icon('back')} Back</button>` : '<span class="small muted">Four quick questions.</span>'}<span class="small muted">No sign-up needed.</span></footer>`;
    return;
  }
  const r = quizResult();
  const nextLine = r.nx ? `<div class="recap"><span class="tag tag--${r.nx.type.tag}">${TAG_LABEL[r.nx.type.tag]}</span><b>Next one that fits</b><span>${esc(classLine(r.nx))}${r.nx.coach ? ' with ' + esc(r.nx.coach.name) : ''}</span></div>` : '';
  host.innerHTML = `<header class="sheet__head sheet__head--done on-red"><div><p class="label">Your corner</p><h2 class="h-l" id="quiz-title">${esc(r.prog.name)}</h2></div>
      <button class="iconbtn" type="button" data-action="overlay-close" aria-label="Close">${icon('x')}</button></header>
    <div class="sheet__body">
      <p class="lede">${esc(r.why)}</p>
      ${nextLine}
      <dl class="summary">
        <div><dt>Where to start</dt><dd>${r.prog.id === 'group' || r.prog.id === 'lunch' ? 'Intro offer: 3 classes for $30' : esc(r.prog.price)}</dd></div>
        <div><dt>Then</dt><dd>${esc(r.pass.label)}, ${esc(r.pass.price)}</dd></div>
      </dl>
      <p class="small muted">${esc(r.passWhy)}${r.compete ? ' Tell Johnny you want to compete. The gym has had 5 Chicago Golden Gloves finalists and 3 champions.' : ''}</p>
    </div>
    <footer class="sheet__foot"><button class="btn btn--ghost" type="button" data-action="quiz-restart">Start over</button>
      ${r.nx ? `<button class="btn btn--primary" type="button" data-action="book" data-class="${r.nx.key}">Book this class ${icon('go', 'i--go')}</button>`
        : r.pass.action === 'inquire' ? `<button class="btn btn--primary" type="button" data-action="inquire" data-kind="${r.pass.kind}">Request a session</button>`
          : `<button class="btn btn--primary" type="button" data-action="buy" data-item="${r.pass.item}">Get ${esc(r.pass.label)}</button>`}</footer>`;
}
Object.assign(actions, {
  'quiz-open': () => { Quiz.step = 0; Quiz.answers = {}; if ($('#menu') && !$('#menu').hidden) actions['menu-close'](); renderQuiz(); Overlay.open('quiz'); },
  'quiz-answer': (el) => { Quiz.answers[QUIZ[Quiz.step].id] = el.dataset.id; Quiz.step += 1; renderQuiz(); const h = $('[data-ov="quiz"] h2'); if (h) { h.setAttribute('tabindex', '-1'); h.focus(); } },
  'quiz-back': () => { Quiz.step = Math.max(0, Quiz.step - 1); renderQuiz(); },
  'quiz-restart': () => { Quiz.step = 0; Quiz.answers = {}; renderQuiz(); },
});
