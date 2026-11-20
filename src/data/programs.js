/**
 * ASTRA — Program Data Registry
 * =============================
 * Single source of truth for all festival programs.
 * Controlled by the IS_PLACEHOLDER flag for one-place removal when dates & details are finalized.
 */

export const IS_PLACEHOLDER = true
export const PLACEHOLDER_DISCLAIMER = 'Sample content, details to be confirmed.'
export const PLACEHOLDER_LABEL = IS_PLACEHOLDER ? 'TBA' : ''

/**
 * Target date for the festival countdown.
 * Set to a valid ISO string (e.g. '2026-03-20T09:00:00') when official dates are finalized.
 * When null or undefined, the UI displays "Dates to be announced".
 */
export const FEST_TARGET_DATE = null

export const CATEGORIES = ['All', 'Arts', 'Tech', 'Gaming', 'Business', 'Fun']

export const programs = [
  {
    slug: 'photography',
    name: 'Photography',
    category: 'Arts',
    world: 'ink',
    shortDescription: 'Capture the essence of the fest through your lens on a surprise on-the-spot theme.',
    description:
      'Bring your eye for detail and your finest lens. Participants receive a creative theme on the spot and have a fixed window to compose and submit their best capture. Evaluated on composition, framing, light handling, and conceptual storytelling.',
    rules: [
      'Theme will be announced on-campus at 09:30 AM.',
      'DSLR, mirrorless, and smartphone submissions permitted.',
      'Basic adjustments (exposure, contrast, crop) permitted; no AI manipulation or composite filters.',
      'High-resolution submission required before deadline.',
    ],
    teamSize: '1 (Individual)',
    fee: '₹100',
    date: 'Day 1',
    time: '10:00 AM – 1:00 PM',
    venue: 'Campus Grounds',
    coordinators: [
      { name: 'Adithya R.', phone: '9847000001' },
      { name: 'Neha V.', phone: '9847000002' },
    ],
  },
  {
    slug: 'face-painting',
    name: 'Face Painting',
    category: 'Arts',
    world: 'ink',
    shortDescription: 'Transform living canvases into striking visual narratives with brush and pigment.',
    description:
      'Two-person teams collaborate to turn a human face into an arresting artistic statement reflecting the festival theme. Judged on creative depth, technique, blend mastery, and stage presence.',
    rules: [
      'Team of 2: one painter and one canvas model.',
      'Time duration: 45 minutes strictly timed.',
      'Skin-safe cosmetic paints provided on-site; personal brushes allowed.',
      'Theme revealed at the start bell.',
    ],
    teamSize: '2 (Painter + Model)',
    fee: '₹80 per team',
    date: 'Day 1',
    time: '2:00 PM – 3:30 PM',
    venue: 'Main Courtyard',
    coordinators: [
      { name: 'Diya Krishnan', phone: '9847000003' },
    ],
  },
  {
    slug: 'theme-dance',
    name: 'Theme Dance',
    category: 'Arts',
    world: 'ink',
    shortDescription: 'Synchronized choreography telling a powerful story through movement and rhythm.',
    description:
      'Crews take the main stage for an energetic choreographed showcase. Blending classical, contemporary, and hip-hop vocabularies, routines are scored on synchronization, expression, musicality, and crowd engagement.',
    rules: [
      'Crew size: 4 to 10 performers.',
      'Stage time: 5 minutes (+1 min stage setup/exit).',
      'Track submission required in MP3 format 2 hours prior.',
      'Props allowed upon prior safety clearance.',
    ],
    teamSize: '4–10',
    fee: '₹200 per team',
    date: 'Day 2',
    time: '3:00 PM – 5:00 PM',
    venue: 'Open Air Amphitheatre',
    coordinators: [
      { name: 'Rahul M.', phone: '9847000004' },
      { name: 'Sneha Paul', phone: '9847000005' },
    ],
  },
  {
    slug: 'fashion-show-group',
    name: 'Fashion Show (Group)',
    category: 'Arts',
    world: 'ink',
    shortDescription: 'Runway couture and themed aesthetics brought to life in a coordinated team walk.',
    description:
      'Collegiate teams present runway lines conceptualized around cultural, futuristic, or sustainable fashion motifs. Evaluated on concept originality, garment styling, music selection, and runway choreography.',
    rules: [
      'Team strength: 5 to 8 models.',
      'Ramp walk limit: 6–8 minutes total.',
      'Theme narrative must be submitted to the judging panel.',
      'No hazardous pyrotechnics or open flames.',
    ],
    teamSize: '5–8',
    fee: '₹300 per team',
    date: 'Day 2',
    time: '6:00 PM – 8:00 PM',
    venue: 'College Auditorium',
    coordinators: [
      { name: 'Fathima S.', phone: '9847000006' },
    ],
  },
  {
    slug: 'fashion-show-single',
    name: 'Fashion Show (Single)',
    category: 'Arts',
    world: 'ink',
    shortDescription: 'Solo runway exhibition showcasing individuality, confidence, and bespoke styling.',
    description:
      'Individual stylists walk the spotlight ramp to make a distinct personal statement. Showcasing attitude, poise, and costume originality in a high-energy solo sequence.',
    rules: [
      'Individual entry only.',
      'Ramp walk time: 2 to 3 minutes.',
      'Self-styled outfits required.',
      'Background music track submitted during registration.',
    ],
    teamSize: '1 (Individual)',
    fee: '₹100',
    date: 'Day 2',
    time: '5:00 PM – 6:00 PM',
    venue: 'College Auditorium',
    coordinators: [
      { name: 'Gokul Das', phone: '9847000007' },
    ],
  },
  {
    slug: 'reel-making',
    name: 'Reel Making',
    category: 'Arts',
    world: 'ink',
    shortDescription: 'Fast-paced visual storytelling in 60 vertical seconds of cinematic creativity.',
    description:
      'Capture festival atmosphere, humorous skits, or punchy mini-documentaries. Participants shoot, cut, and grade vertical video content under tight turnarounds.',
    rules: [
      'Individual or duo participation.',
      'Duration strictly between 30 and 60 seconds.',
      'Must be captured on campus during the festival hours.',
      'Submissions via unlisted link / designated upload folder.',
    ],
    teamSize: '1–2',
    fee: '₹80',
    date: 'Day 1',
    time: '11:00 AM – 2:00 PM',
    venue: 'Entire Campus',
    coordinators: [
      { name: 'Harikrishnan P.', phone: '9847000008' },
    ],
  },
  {
    slug: 'rj-hunt',
    name: 'RJ Hunt',
    category: 'Arts',
    world: 'ink',
    shortDescription: 'Voice modulation, wit, and magnetic banter to discover the next live radio star.',
    description:
      'Candidates take the microphone through spontaneous RJ rounds: mock radio links, caller handling, rapid-fire commentary, and crowd engagement under surprise broadcast conditions.',
    rules: [
      'Round 1: 90-second radio link on an assigned topic.',
      'Round 2: Handling live caller simulation and situational humor.',
      'Languages: English, Malayalam, or Hindi.',
    ],
    teamSize: '1 (Individual)',
    fee: '₹60',
    date: 'Day 1',
    time: '1:00 PM – 3:00 PM',
    venue: 'Seminar Hall 1',
    coordinators: [
      { name: 'Isha Nair', phone: '9847000009' },
    ],
  },
  {
    slug: 'logo-design',
    name: 'Logo Design',
    category: 'Tech',
    world: 'code',
    shortDescription: 'Transform a corporate design brief into an iconic visual identity within 90 minutes.',
    description:
      'Designers receive a challenging prompt for a next-gen technology brand. Deliver a scalable vector emblem, color rationale, and application mockup evaluated on visual hierarchy and memorability.',
    rules: [
      'Bring your own design workstation / laptop.',
      'Allowed tools: Figma, Illustrator, Affinity Designer, Inkscape.',
      'Final submission must include vector SVG and export PNG.',
      'Pre-made templates and AI prompt generators prohibited.',
    ],
    teamSize: '1 (Individual)',
    fee: '₹80',
    date: 'Day 1',
    time: '10:00 AM – 12:00 PM',
    venue: 'Computer Lab 1',
    coordinators: [
      { name: 'Jithesh K.', phone: '9847000010' },
    ],
  },
  {
    slug: 'coding-competition',
    name: 'Coding Competition',
    category: 'Tech',
    world: 'code',
    shortDescription: 'Algorithmic speed-run testing data structures, optimization, and bug-hunting.',
    description:
      'A multi-tiered competitive coding clash. Programmers tackle algorithmic puzzles spanning dynamic programming, graphs, and greedy techniques with automated test case evaluation.',
    rules: [
      'Solo or pairs (max 2 members).',
      'Time duration: 120 minutes.',
      'Languages supported: C++, Java, Python 3, Rust.',
      'Automated leaderboard evaluation with penalty for failed test runs.',
    ],
    teamSize: '1–2',
    fee: '₹100',
    date: 'Day 2',
    time: '10:00 AM – 12:00 PM',
    venue: 'Computer Lab 2',
    coordinators: [
      { name: 'Kiran Mohan', phone: '9847000011' },
      { name: 'Lakshmi P.', phone: '9847000012' },
    ],
  },
  {
    slug: 'esports',
    name: 'E-Sports Arena',
    category: 'Gaming',
    world: 'code',
    shortDescription: 'High-stakes battle royale in BGMI and intense 1v1 football showdowns in E-Football.',
    description:
      'The premier campus gaming arena featuring two competitive titles: BGMI battle-royale squad tournaments and E-Football knockout duels on dedicated displays.',
    subGames: [
      {
        name: 'BGMI Squad Clash',
        description: '4-man squad battle royale across custom lobby matches on Erangel and Miramar.',
        rules: [
          'Squad of 4 players.',
          'Mobile devices only (no emulators or triggers).',
          'Anti-cheat and spectator verification required.',
        ],
        teamSize: '4 (Squad)',
        fee: '₹200 per squad',
      },
      {
        name: 'E-Football 1v1',
        description: 'Single-elimination console knockout cup featuring standard match conditions.',
        rules: [
          '1v1 knockout bracket.',
          '6-minute halves with standard tactical rules.',
          'Default tournament controllers provided.',
        ],
        teamSize: '1 (Individual)',
        fee: '₹80',
      },
    ],
    rules: [
      'Players must register under their official gaming handle.',
      'Cheating, exploits, or ungentlemanly conduct results in immediate team disqualification.',
    ],
    teamSize: 'Varies by title',
    fee: 'Varies by title',
    date: 'Day 1 & Day 2',
    time: '10:00 AM – 4:00 PM',
    venue: 'Gaming Arena (Room 201)',
    coordinators: [
      { name: 'Midhun Joseph', phone: '9847000013' },
      { name: 'Nikhil Raj', phone: '9847000014' },
    ],
  },
  {
    slug: 'mini-militia',
    name: 'Mini Militia',
    category: 'Gaming',
    world: 'code',
    shortDescription: 'Chaotic, nostalgic local LAN deathmatches in Doodle Army 2.',
    description:
      'Fast-paced multiplayer deathmatch action over a dedicated local network. Blast through rocket-fueled rounds across Outpost and Catacombs.',
    rules: [
      'Bring your own mobile device with official stock version installed.',
      'Dedicated LAN Wi-Fi network provided.',
      'No modded APKs or aim-assist tools.',
      'Top scorers in group lobbies advance to grand finals.',
    ],
    teamSize: '1 (Individual)',
    fee: '₹60',
    date: 'Day 1',
    time: '2:00 PM – 5:00 PM',
    venue: 'Gaming Arena (Room 201)',
    coordinators: [
      { name: 'Omar Farooq', phone: '9847000015' },
    ],
  },
  {
    slug: 'best-manager',
    name: 'Best Manager',
    category: 'Business',
    world: 'ink',
    shortDescription: 'Comprehensive corporate gauntlet testing crisis leadership, strategy, and negotiation.',
    description:
      'Future executives navigate stress interviews, fiscal simulations, public relations crises, and cross-examination by veteran corporate mentors to claim the coveted crown.',
    rules: [
      'Solo competition spanning 4 progressive elimination rounds.',
      'Round 1: Psychometric & Aptitude assessment.',
      'Round 2: Rapid case study & crisis management.',
      'Round 3 & 4: Stress interview and board presentation.',
    ],
    teamSize: '1 (Individual)',
    fee: '₹100',
    date: 'Day 2',
    time: '10:00 AM – 4:00 PM',
    venue: 'Executive Conference Hall',
    coordinators: [
      { name: 'Praveen V.', phone: '9847000016' },
    ],
  },
  {
    slug: 'business-quiz',
    name: 'Business Quiz',
    category: 'Business',
    world: 'ink',
    shortDescription: 'Intellectual duel on markets, acquisitions, brand trivia, and financial titans.',
    description:
      'Put your market acumen to the test across written prelims and high-octane stage rounds featuring audio-visual clues, infinite rebounds, and buzzer risk rounds.',
    rules: [
      'Teams of 2 participants.',
      'Written preliminary round of 25 questions.',
      'Top 6 teams qualify for the stage finals.',
      'Electronic gadgets strictly prohibited during quiz rounds.',
    ],
    teamSize: '2',
    fee: '₹80 per team',
    date: 'Day 1',
    time: '11:00 AM – 1:00 PM',
    venue: 'Seminar Hall 2',
    coordinators: [
      { name: 'Quincy Thomas', phone: '9847000017' },
    ],
  },
  {
    slug: 'corporate-walk',
    name: 'Corporate Walk',
    category: 'Fun',
    world: 'ink',
    shortDescription: 'Boardroom poise meets runway swagger in a bespoke formal dress contest.',
    description:
      'Where executive presence meets runway flair. Participants showcase sharp tailoring, business elegance, and quick-witted introductory pitches under the spotlights.',
    rules: [
      'Individual participants.',
      'Attire: formal or premium business-casual.',
      'Includes a 60-second self-introduction and elevator pitch.',
      'Scored on poise, attire coordination, and articulate delivery.',
    ],
    teamSize: '1 (Individual)',
    fee: '₹60',
    date: 'Day 2',
    time: '2:00 PM – 3:30 PM',
    venue: 'Auditorium Stage',
    coordinators: [
      { name: 'Rhea George', phone: '9847000018' },
    ],
  },
  {
    slug: 'scavenger-hunt',
    name: 'Scavenger Hunt',
    category: 'Fun',
    world: 'code',
    shortDescription: 'Decode encrypted riddles and race across campus to unlock the master cipher.',
    description:
      'Teams sprint through hidden coordinates and physical clue checkpoints scattered across the college. Part puzzle solving, part endurance, fully thrilling.',
    rules: [
      'Teams of 3 to 5 members.',
      'Checkpoints unlock via QR verification and riddle submission.',
      'Campus safety boundaries must be respected.',
      'Fastest team with complete verification logs takes first prize.',
    ],
    teamSize: '3–5',
    fee: '₹150 per team',
    date: 'Day 2',
    time: '10:00 AM – 12:30 PM',
    venue: 'Starting Line: Central Plaza',
    coordinators: [
      { name: 'Sidharth S.', phone: '9847000019' },
      { name: 'Tony Mathew', phone: '9847000020' },
    ],
  },
]

export function getFeaturedPrograms() {
  return programs.slice(0, 6)
}

export function getProgramBySlug(slug) {
  return programs.find((p) => p.slug === slug) || null
}

export function getAdjacentPrograms(slug) {
  const idx = programs.findIndex((p) => p.slug === slug)
  return {
    prev: idx > 0 ? programs[idx - 1] : null,
    next: idx < programs.length - 1 ? programs[idx + 1] : null,
  }
}

export function filterPrograms(category, searchQuery = '') {
  let filtered = programs
  if (category && category !== 'All') {
    filtered = filtered.filter((p) => p.category === category)
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    )
  }
  return filtered
}
