/* Everything the site knows about the gym lives here, in one place.
   Change a price, an hour or a class here and every page, the calculator and the front desk answers follow. */

const GYM = {
  name: 'Hammer Boxing & Fitness',
  legal: 'Hammer Fitness and Boxing',
  tagline: 'Built in Chicago. Focused on you.',
  street: '525 W. North Ave.',
  cross: 'Corner of North and Mohawk',
  city: 'Chicago, IL 60610',
  hood: 'Old Town',
  phone: '(312) 573-1950',
  tel: 'tel:+13125731950',
  email: 'info@hammerfitnessandboxing.com',
  emailTraining: 'johnny@hammerfitnessandboxing.com',
  tz: 'America/Chicago',
  maps: 'https://www.google.com/maps/dir/?api=1&destination=525+W+North+Ave%2C+Chicago%2C+IL+60610',
  // Mindbody, where booking, accounts and payments happen (studio 744102)
  mindbody: 'https://clients.mindbodyonline.com/classic/mainclass?studioid=744102&stype=-7&view=week&loc=1',
  store: 'https://clients.mindbodyonline.com/classic/ws?studioid=744102&stype=40',
  site: 'https://www.hammerfitnessandboxing.com',
  instagram: 'https://instagram.com/hammerfitnessandboxing',
  facebook: 'https://www.facebook.com/hammerfitnessandboxing/',
  classpass: 'https://classpass.com/studios/hammer-fitness-and-boxing-chicago',
  haven: 'https://hammershaven.org/',
  // open hours by day, Monday first, in minutes from midnight. null = closed
  hours: [[360, 1200], [360, 1200], [360, 1200], [360, 1200], [360, 1200], [480, 840], null],
};

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAYS3 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COACHES = {
  johnny: {
    say: 'the owner and head boxing coach',
    id: 'johnny', name: 'Johnny Higgins Jr.', first: 'Johnny', last: 'Higgins', role: 'Owner · Head boxing coach',
    img: 'img/coach-johnny.webp', ava: 'img/ava-johnny.webp',
    fact: 'Former pro boxer. 1997 Chicago Golden Gloves runner-up.',
    tape: [
      ['Corner', 'Owner, head boxing coach'],
      ['In the ring', 'Former professional boxer'],
      ['Amateur', '1997 Chicago Golden Gloves runner-up'],
      ['Started boxing', 'Age 15'],
      ['Coaching here since', '2011'],
      ['Certified', 'NASM personal trainer'],
      ['Teaches', 'Group boxing, Lunch-Time Boxing, private boxing'],
    ],
    bio: [
      'Johnny started boxing at 15, when his godbrother took him to a gym. He loved the smell of the leather and the sound of his punches on the bag. His trainer, the first person he ever sparred with, praised his right hand, then had to stop sparring with him after three sessions because he hit too hard.',
      'He was runner-up at the 1997 Chicago Golden Gloves and turned pro a few years later. In 2011 he came to this gym as boxing coach and manager, then took it over and turned it into Hammer.',
      'He coaches men, women and children. One client liked it so much that he brought his two sons, and the whole family has now boxed with Johnny for more than two years. The goal is to teach you to hit like a hammer through body mechanics and proper punching technique.',
    ],
    quote: 'I believed coaching would be my greatest achievement. I aim to create my boxing legacy through training other fighters.',
    privates: ['boxing', 'pt'],
  },
  jj: {
    say: 'a boxing coach and personal trainer',
    id: 'jj', name: 'JJ Higgins', first: 'JJ', last: 'Higgins', role: 'Boxing coach · Personal trainer',
    img: 'img/coach-jj.webp', ava: 'img/ava-jj.webp',
    fact: 'Grew up in a boxing gym. Former starting college football player.',
    tape: [
      ['Corner', 'Boxing coach, personal trainer'],
      ['Full name', 'Johnny Higgins III'],
      ['Background', 'Starting college football player at Dubuque'],
      ['Degree', 'Business and Criminal Justice, double major'],
      ['Learned from', 'His father, Johnny Higgins Jr.'],
      ['Certified', 'NASM personal trainer'],
      ['Teaches', 'Group boxing, Lunch-Time Boxing, personal training'],
    ],
    bio: [
      'JJ grew up in a boxing gym, watching his father train for fights and picking up the sport as he went. He chose football and became a starting college player at Dubuque, then graduated with a double major in Business and Criminal Justice.',
      'Boxing never left. He is a NASM-certified personal trainer and boxing instructor who passes on the techniques and principles he learned from his father, in a supportive and motivating environment.',
    ],
    privates: ['boxing', 'pt'],
  },
  lopez: {
    say: 'the Muay Thai instructor and a kickboxing and boxing coach',
    id: 'lopez', name: 'Michael Lopez', first: 'Michael', last: 'Lopez', role: 'Muay Thai · Kickboxing · Boxing',
    img: 'img/coach-lopez.webp', ava: 'img/ava-lopez.webp',
    fact: '20+ years in fitness. Kickboxing competitor.',
    tape: [
      ['Corner', 'Muay Thai instructor, boxing and kickboxing coach'],
      ['Experience', '20+ years in fitness'],
      ['Competed', 'Kickboxing'],
      ['Also played', 'College rugby'],
      ['Certified', 'NASM personal trainer'],
      ['Teaches', 'Muay Thai, boxing, kickboxing, personal training'],
      ['Off the clock', 'On a bike somewhere in Chicago'],
    ],
    bio: [
      'Michael brings more than 20 years in fitness to every session. He focuses on personal training, boxing and kickboxing, blending combat sports with functional fitness so clients grow in strength, confidence and endurance.',
      'His background includes college rugby, kickboxing competitions and extensive boxing and martial arts training. Whether you want to improve your skills, build a solid foundation or challenge yourself, he is there to support and motivate you.',
    ],
    privates: ['muaythai', 'boxing', 'pt'],
  },
  tee: {
    say: 'a boxing instructor',
    id: 'tee', name: 'Teijon “Tee” Price', first: 'Tee', last: 'Price', role: 'Boxing instructor',
    img: 'img/coach-tee.webp', ava: 'img/ava-tee.webp',
    fact: 'Southpaw amateur at 154 lbs. Trained at Hammer.',
    tape: [
      ['Corner', 'Boxing instructor'],
      ['Stance', 'Southpaw'],
      ['Weight', '154 lbs'],
      ['Status', 'Active amateur'],
      ['Years boxing', '4'],
      ['Trains under', 'Johnny Higgins Jr., exclusively at Hammer'],
      ['Before boxing', 'College basketball'],
    ],
    bio: [
      'Tee is an up-and-coming amateur known for power, skill and a disciplined southpaw style. He has four years of boxing behind him and trains exclusively at Hammer under Johnny Higgins Jr.',
      'He played basketball through college until an ACL injury turned his focus to boxing. He competes at 154 pounds and is chasing a professional world title. Train with Tee and you learn the Hammer style: explosive power, sharp technique and the defense to go with it.',
    ],
    privates: ['boxing'],
  },
};
const COACH_ORDER = ['johnny', 'jj', 'lopez', 'tee'];

const CLASS_TYPES = {
  boxing: {
    id: 'boxing', name: 'Boxing', tag: 'boxing', mins: 55, level: 'All levels', bookable: true,
    blurb: 'Proper punching technique, plus the defensive movement to evade and block what comes back. Bodyweight exercises are paired with boxing drills throughout.',
  },
  lunch: {
    id: 'lunch', name: 'Lunch-Time Boxing', tag: 'lunch', mins: 60, level: 'All levels', bookable: true,
    blurb: 'A one-hour noon class for flexible schedules. Boxing fundamentals and self-defense, plus a real workout.',
  },
  muaythai: {
    id: 'muaythai', name: 'Muay Thai', tag: 'muaythai', mins: 60, level: 'All levels', bookable: true,
    blurb: 'Punches, kicks, knees and elbows with Michael Lopez.',
  },
  // the gym lists only "Sparring: Saturday 11AM"; mins is used for the timeline and never shown
  sparring: {
    id: 'sparring', name: 'Sparring', tag: 'sparring', mins: 60, level: 'By choice', bookable: false,
    blurb: 'Full-contact sparring. Available to all, never forced on anyone.',
    ask: 'compete', askLabel: 'Ask a coach', noCoach: ['In the ring', 'Available to all, never required'],
  },
  // added at the gym's request: Mon, Wed, Fri 5 PM. Coach, ages and price are not set yet, so it is enrolled through the desk
  kids: {
    id: 'kids', name: 'Kids Boxing', tag: 'kids', mins: 60, level: '', bookable: false,
    blurb: 'Boxing for kids, Monday, Wednesday and Friday at 5 PM.',
    ask: 'kids', askLabel: 'Ask the desk', noCoach: ['Hammer coaches', 'Enroll through the front desk'],
  },
};

/* The weekly card. day: 0 = Monday. t: minutes from midnight. Coaches as listed on Mindbody, week of Oct 12, 2026.
   Kids Boxing (Mon, Wed, Fri 5 PM) added at the gym's request. */
const WEEK = [
  { day: 0, t: 420, type: 'boxing', coach: 'tee' }, { day: 0, t: 720, type: 'lunch', coach: 'johnny' }, { day: 0, t: 1020, type: 'boxing', coach: 'jj' }, { day: 0, t: 1080, type: 'boxing', coach: 'jj' }, { day: 0, t: 1020, type: 'kids', coach: null },
  { day: 1, t: 420, type: 'boxing', coach: 'tee' }, { day: 1, t: 720, type: 'lunch', coach: 'johnny' }, { day: 1, t: 1020, type: 'boxing', coach: 'jj' }, { day: 1, t: 1080, type: 'boxing', coach: 'jj' }, { day: 1, t: 1080, type: 'muaythai', coach: 'lopez' },
  { day: 2, t: 420, type: 'boxing', coach: 'tee' }, { day: 2, t: 720, type: 'lunch', coach: 'jj' }, { day: 2, t: 1020, type: 'boxing', coach: 'jj' }, { day: 2, t: 1080, type: 'boxing', coach: 'jj' }, { day: 2, t: 1020, type: 'kids', coach: null },
  { day: 3, t: 420, type: 'boxing', coach: 'tee' }, { day: 3, t: 720, type: 'lunch', coach: 'jj' }, { day: 3, t: 1020, type: 'boxing', coach: 'jj' }, { day: 3, t: 1080, type: 'boxing', coach: 'jj' }, { day: 3, t: 1080, type: 'muaythai', coach: 'lopez' },
  { day: 4, t: 420, type: 'boxing', coach: 'tee' }, { day: 4, t: 720, type: 'lunch', coach: 'jj' }, { day: 4, t: 1020, type: 'boxing', coach: 'jj' }, { day: 4, t: 1080, type: 'boxing', coach: 'jj' }, { day: 4, t: 1020, type: 'kids', coach: null },
  { day: 5, t: 600, type: 'boxing', coach: 'johnny' }, { day: 5, t: 660, type: 'sparring', coach: null },
];

const PASSES = {
  intro: { id: 'intro', name: 'New client intro', short: 'Intro: 3 classes', price: 30, classes: 3, note: 'Three group classes for the price of one. For new clients.' },
  single: { id: 'single', name: 'Single class', short: 'Single class', price: 30, classes: 1, note: 'One group class. No commitment.' },
  pack10: { id: 'pack10', name: '10-class pack', short: '10-class pack', price: 250, classes: 10, note: 'Ten boxing classes. Expires 12 weeks after purchase.', firstTime: true },
  unlimited: { id: 'unlimited', name: 'Group Boxing Unlimited', short: 'Unlimited boxing', price: 150, per: 'month', note: 'Every group boxing class on the schedule.' },
  plus: { id: 'plus', name: 'Boxing + General Access', short: 'Boxing + Access', price: 200, per: 'month', note: 'All group classes, plus the gym floor on your own time.' },
  hammer: { id: 'hammer', name: 'Unlimited Hammer', short: 'Unlimited Hammer', price: 275, per: 'month', note: 'Unlimited classes, general access and one specialty skill session a month.' },
  hammerplus: { id: 'hammerplus', name: 'Unlimited Hammer Plus', short: 'Hammer Plus', price: 500, per: 'month', note: 'Unlimited classes, general access and one specialty skill session a week.' },
  access: { id: 'access', name: 'Gym Access', short: 'Gym Access', price: 100, per: 'month', note: 'Train on your own schedule during open hours, with full use of the boxing area and the lifting area.' },
};

/* One-on-one packages: [sessions, total price]. 24-hour cancellation, 90-day expiration. */
const ONE_ON_ONE = {
  boxing: { id: 'boxing', name: 'Private boxing', tiers: [[1, 125], [5, 500], [10, 950], [20, 1800], [40, 3400]] },
  pt: { id: 'pt', name: 'Personal training', tiers: [[1, 100], [5, 450], [10, 800], [20, 1500], [40, 2800]] },
};
const FIRST_TIME_OFF = 0.25; // "25% off packages for first time clients", per the banner on the gym's home page

const PROGRAMS = [
  {
    id: 'private', name: 'Private Boxing', img: 'img/p-private.webp', alt: 'A coach works the mitts with a client inside the ring.',
    line: 'One-on-one rounds with active fighters, whether you want to go pro or just get in shape.',
    when: 'By appointment', price: 'From $125, as low as $85 a session',
    body: [
      'One-on-one training with active fighters, whether you are looking to go pro or just get in shape. Your coach holds the mitts, fixes your form as you throw and builds each session around where you are.',
      'Boxing is a total-body workout. It burns calories fast, takes the stress out of your day, builds real cardiovascular endurance and tones and shapes your body.',
    ],
    quote: { text: 'You will be pushed, inspired and empowered all while learning a practical self-defense skill and surpassing your fitness goals.', by: 'Johnny Higgins Jr.' },
    points: ['24-hour notice to cancel or move a session', 'Packages expire after 90 days', 'First-time clients: 25% off packages'],
    cta: { label: 'Request a session', action: 'inquire', kind: 'boxing' },
  },
  {
    id: 'group', name: 'Group Boxing', img: 'img/p-group.webp', alt: 'Members drill in pairs during a group boxing class.',
    line: '55 minutes of real technique. Shadow boxing, bag work and target mitts, with conditioning built in.',
    when: 'Mon to Fri 7 AM, 5 PM, 6 PM · Sat 10 AM', price: 'From $30 a class',
    body: [
      'Every class is 55 minutes of instruction led by active and retired fighters. You learn proper punching technique and the defensive movement to evade and block what comes back, then put it to work on the bags and the mitts.',
      'Bodyweight exercises are paired with boxing drills the whole way through, so the conditioning comes with the skill. All levels train together. You will be challenged, and you will want to come back.',
    ],
    points: ['Shadow boxing, bag work and target mitts', 'Self-defense you can use', 'Gloves and wraps to rent for $5', 'Six days a week'],
    cta: { label: 'Book a class', action: 'book', type: 'boxing' }, classType: 'boxing',
  },
  {
    id: 'lunch', name: 'Lunch-Time Boxing', img: 'img/p-lunch.webp', alt: 'A midday class shadow boxes beside the ring.',
    line: 'The noon class for work-from-home days and flexible schedules. In, trained and back by one.',
    when: 'Mon to Fri 12 PM', price: 'Same passes as group boxing',
    body: [
      'A one-hour class at noon, Monday through Friday. It was built for people who work from home, stay-at-home parents and anyone whose day has room in the middle.',
      'You learn boxing fundamentals and self-defense and get a real workout in a clean, comfortable gym, with showers and lockers for the trip back to your desk.',
    ],
    points: ['One hour, start to finish', 'Fundamentals and self-defense', 'Showers and lockers on site'],
    cta: { label: 'Book a noon class', action: 'book', type: 'lunch' }, classType: 'lunch',
  },
  {
    id: 'muaythai', name: 'Muay Thai', img: 'img/p-muaythai.webp', alt: 'A member throws a punch at full speed.',
    line: 'Punches, kicks, knees and elbows, two evenings a week with Michael Lopez.',
    when: 'Tue and Thu 6 PM', price: 'From $30 a class',
    body: [
      'Muay Thai adds kicks, knees and elbows to your hands. Classes run Tuesday and Thursday evenings with Michael Lopez, a kickboxing competitor and NASM-certified trainer with more than 20 years in fitness.',
      'Private Muay Thai sessions are available too, and first-time clients get 25% off packages.',
    ],
    points: ['Tuesday and Thursday at 6 PM', 'Taught by a kickboxing competitor', 'Private sessions available'],
    cta: { label: 'Book Muay Thai', action: 'book', type: 'muaythai' }, classType: 'muaythai',
  },
  {
    id: 'pt', name: 'Personal Training', img: 'img/p-pt.webp', alt: 'A trainer coaches a client through floor work.',
    line: 'One-on-one strength and conditioning with a NASM-certified trainer who holds you to it.',
    when: 'By appointment', price: 'From $100, as low as $70 a session',
    body: [
      'One-on-one with a certified personal trainer. Your trainer motivates you, holds you accountable and builds the workouts around your goals and your needs.',
      'You train safely and properly, and you get where you are going faster than you would alone.',
    ],
    points: ['NASM-certified trainers', '24-hour notice to cancel or move a session', 'Packages expire after 90 days'],
    cta: { label: 'Request a session', action: 'inquire', kind: 'pt' },
  },
  {
    id: 'compete', name: 'Sparring and Competition', img: 'img/p-sparring.webp', alt: 'The ring at Hammer, red canvas with red, white and blue ropes.',
    line: 'Sparring on Saturdays, and a path to the Golden Gloves for those who want it.',
    when: 'Sparring Sat 11 AM', price: 'Ask a coach',
    body: [
      'Hammer teaches the technical side of boxing in every class and session. Most members want a great workout and never plan to step into the ring, and that is perfectly fine with us. Full-contact sparring is available to all but never forced on anyone.',
      'Every now and then a true fighter walks in. We are able and willing to fuel that fire. Hammer boxers have competed in the Chicago Golden Gloves over the years, and so far the gym has had 5 finalists and 3 champions.',
    ],
    points: ['Sparring Saturdays at 11 AM', '5 Chicago Golden Gloves finalists', '3 champions'],
    cta: { label: 'Talk to Johnny', action: 'inquire', kind: 'compete' },
  },
  {
    id: 'access', name: 'Gym Access', img: 'img/bags-1.webp', alt: 'Two members work a heavy bag on the gym floor.',
    line: 'The boxing area and the lifting area on your own schedule, at your own pace.',
    when: 'During open hours', price: '$100 a month',
    body: [
      'A general access membership is $100 a month. Come in during open hours and work out on your own, at your own pace, with full use of the boxing area and the lifting area.',
      'Access can be limited when trainers and clients are using the floor for one-on-one sessions.',
    ],
    points: ['Boxing area and lifting area', 'Showers and lockers', 'Cleaning supplies provided for the equipment you use'],
    cta: { label: 'Join on Mindbody', action: 'buy', id: 'access' },
  },
];

/* Shop, with the prices, sizes and colors listed on the gym's current store pages.
   Sold at the front desk. */
const PRODUCTS = [
  { id: 'tee', name: 'Hammer T-Shirt', price: 24.99, was: 29.99, img: 'img/shop-tshirt.webp', cat: 'apparel', sizes: true, colors: ['Black', 'White'], note: '100% cotton' },
  { id: 'hoodie', name: 'Hammer Hoodie', price: 44.99, img: 'img/shop-hoodie.webp', cat: 'apparel', sizes: true, colors: ['Black'], note: '100% cotton' },
  { id: 'crew', name: 'Hammer Sweatshirt', price: 39.99, img: 'img/shop-sweatshirt.webp', cat: 'apparel', sizes: true, colors: ['Black'] },
  { id: 'joggers', name: 'Jogger Pant Set', price: 90, img: 'img/shop-joggerset.webp', cat: 'apparel', sizes: true, note: 'Sweatpants and hoodie, unisex' },
  { id: 'sweats', name: 'Hammer Sweatpants', price: 45, img: 'img/shop-joggerset.webp', cat: 'apparel', sizes: true },
  { id: 'cap', name: 'Baseball Cap', price: 24.99, img: 'img/shop-cap.webp', cat: 'apparel' },
  { id: 'skullcap', name: 'Skullcap', price: 29.99, img: 'img/shop-skullcap.webp', cat: 'apparel' },
  { id: 'haventee', name: 'Hammer’s Haven T-Shirt', price: 19.99, img: 'img/shop-haventee.webp', cat: 'apparel', sizes: true, colors: ['White'] },
  { id: 'wraps', name: 'Title Hand Wraps', price: 14.88, img: 'img/shop-wraps.webp', cat: 'gear', first: true, note: '2 in. x 180 in.' },
  { id: 'everlast', name: 'Everlast Pro Style Elite Training Gloves, 8 oz', price: 40, img: 'img/shop-everlast.webp', cat: 'gear', first: true },
  { id: 'rdx', name: 'RDX F15 Boxing Gloves, black', price: 60, img: 'img/shop-rdsgloves.webp', cat: 'gear' },
  { id: 'mouthpiece', name: 'Mouthpiece', price: 4.99, img: 'img/shop-mouthpiece.webp', cat: 'gear' },
];
const SIZES = ['S', 'M', 'L', 'XL'];

const FAQ = [
  { id: 'never', q: 'I have never boxed. Can I take a class?', a: 'Yes. Every group class welcomes all skill levels and is beginner friendly. Coaches teach proper form and technique before anything else.' },
  { id: 'bring', q: 'What should I bring?', a: 'Comfortable workout clothes, supportive athletic shoes, a towel and a refillable water bottle. Bring gloves and wraps if you have them. If not, the gym rents them for $5.' },
  { id: 'spar', q: 'Do I have to spar?', a: 'No. Full-contact sparring is available to all but never forced on anyone. Sparring runs Saturdays at 11 AM for those who want it.' },
  { id: 'long', q: 'How long is a class?', a: 'Boxing classes are 55 minutes of instruction in a one-hour slot. Lunch-Time Boxing and Muay Thai run one hour.' },
  { id: 'try', q: 'What does it cost to try it?', a: 'New clients can take 3 classes for $30. After that a single class is $30, a 10-class pack is $250 and unlimited group boxing is $150 a month.' },
  { id: 'expire', q: 'Do packs and packages expire?', a: 'The 10-class pack expires 12 weeks after purchase. Private boxing and personal training packages expire after 90 days.' },
  { id: 'cancel', q: 'What is the cancellation policy for private sessions?', a: 'Give 24 hours’ notice to cancel or move a private boxing or personal training session.' },
  { id: 'showers', q: 'Are there showers, lockers and towels?', a: 'There are showers and lockers. Sweat towels are not provided, so bring your own. Clean towels are for sale at the gym if you forget, and the no-touch water fountains fill a bottle.' },
  { id: 'clean', q: 'How is the gym kept clean?', a: 'Staff sanitize the equipment and the floor after classes and private sessions. Gym Access members wipe down what they use with the cleaning supplies provided. If you are feeling unwell, please stay home.' },
  { id: 'kids', q: 'Do you train kids and teens?', a: 'Yes. Kids Boxing runs Monday, Wednesday and Friday at 5 PM, and the front desk handles enrollment. Johnny also coaches children one-on-one. Hammer’s Haven, the not-for-profit at the same address, runs youth boxing and mentoring on weekday afternoons.' },
  { id: 'where', q: 'How do I get there?', a: 'The gym is at 525 W. North Ave., at the corner of North and Mohawk in Old Town. Sedgwick on the Brown Line is about a 4-minute walk. North/Clybourn on the Red Line is about 8 minutes.' },
];

/* Standard punch numbers, orthodox stance. */
const PUNCHES = { 1: 'Jab', 2: 'Cross', 3: 'Lead hook', 4: 'Rear hook', 5: 'Lead uppercut', 6: 'Rear uppercut' };
const COMBOS = {
  basics: [['1'], ['1', '1'], ['1', '2'], ['1', '1', '2'], ['1', '2', '1'], ['2'], ['1', '2', '1', '2'], ['1', '2', '2']],
  combos: [['1', '2', '3'], ['1', '2', '3', '2'], ['2', '3', '2'], ['1', '3', '2'], ['1', '2', '5'], ['1', '6', '3', '2'], ['3', '2', '3'], ['1', '2', '3', '6'], ['1', '1', '2', '3'], ['5', '2', '3']],
  defense: [['1', '2', 'Slip', '2'], ['1', '2', 'Roll', '3', '2'], ['Slip', '2', '3', '2'], ['1', '2', '3', 'Roll', '3'], ['1', '2', 'Step back', '2'], ['Slip', 'Slip', '2', '3'], ['1', 'Roll', '2', '3', '2']],
};
