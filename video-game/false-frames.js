// ══════════════════════════════════════════════════
//  GAME STATE
// ══════════════════════════════════════════════════
const state = {
  suspicion: 0,
  clues: [],
  choices: 0,
  currentScene: null
};

function addSuspicion(n) {
  state.suspicion = Math.max(0, Math.min(100, state.suspicion + n));
  document.getElementById('suspicion-fill').style.width = state.suspicion + '%';
  if (n > 0) {
    document.getElementById('suspicion-fill').classList.add('flash');
    setTimeout(() => document.getElementById('suspicion-fill').classList.remove('flash'), 300);
  }
}

function addClue(clue) {
  if (!state.clues.includes(clue)) {
    state.clues.push(clue);
    renderClues();
  }
}

function renderClues() {
  const el = document.getElementById('clue-pills');
  el.innerHTML = state.clues.map(c => `<div class="clue-pill">📎 ${c}</div>`).join('');
}

// ══════════════════════════════════════════════════
//  SCENE RENDERER  (pixel art canvas paintings)
// Image-background scene helpers
function startRain() {
  document.getElementById('scene-container')?.classList.add('is-raining');
}

function stopRain() {
  document.getElementById('scene-container')?.classList.remove('is-raining');
}
function initTitleCanvas() {}

const SCENE_IMAGES = {
  apartment_night: 'img/bedroom.jpeg',
  apartment_morning: 'img/living-room.png',
  alley: 'img/alley-death.png',
  lighter_clue: 'img/lighter-clue.png',
  evidence_taken: 'img/evidence-taken.png',
  caught: 'img/caught.jpeg',
  police_station: 'img/police-station.jpeg',
  street_morning: 'img/police-sirens.jpeg',
  subway: 'img/subway-scene.png',
  subway_inside: 'img/subway-inside.png',
};

function renderScene(sceneKey, withRain=false) {
  state.currentScene = sceneKey;
  const scene = document.getElementById('scene-container');
  if (scene) {
    scene.dataset.scene = sceneKey || '';
    const imagePath = SCENE_IMAGES[sceneKey] || SCENE_IMAGES.alley;
    scene.style.setProperty('--scene-image', `url("${imagePath}")`);
  }
}
let typeTimer = null;
let typeQueue = [];
let typingDone = false;

function typeText(text, speed=28) {
  return new Promise(resolve => {
    const el = document.getElementById('dialog-content');
    const cursor = document.getElementById('dialog-cursor');
    el.textContent = '';
    cursor.style.display = 'inline-block';
    let i = 0;
    typingDone = false;
    if(typeTimer) clearInterval(typeTimer);
    typeTimer = setInterval(() => {
      if(i < text.length) {
        el.textContent += text[i++];
      } else {
        clearInterval(typeTimer);
        typingDone = true;
        resolve();
      }
    }, speed);
  });
}

function skipType() {
  if(!typingDone && typeTimer) {
    clearInterval(typeTimer);
    const el = document.getElementById('dialog-content');
    // Fill remaining - handled by re-reading from game node
    typingDone = true;
  }
}

// ══════════════════════════════════════════════════
//  SCENE RENDERING DRIVER
const NODES = {

  start: {
    scene: 'apartment_night', rain: false,
    location: 'NEW YORK APT', time: '2:47 AM',
    speaker: 'NARRATOR',
    text: "It's nearly 3 AM. You've been unable to sleep for hours when a loud argument erupts outside your window. Voices. Angry ones. You pause, heart thudding in the dark.",
    choices: [
      { label: 'Look outside the window', next: 'look_outside', suspicion: 0 },
      { label: 'Ignore it. None of your business.', next: 'ignore', suspicion: 10 }
    ]
  },

  look_outside: {
    scene: 'alley', rain: true,
    location: '42ND STREET — BELOW', time: '2:49 AM',
    speaker: 'NARRATOR',
    text: "You peer through the rain-streaked glass. In the alley below, two figures struggle. A flash of metal. A scream cut short. The smaller figure crumples. The larger one sprints away into the dark, hood up, face hidden. You've just witnessed a murder.",
    choices: [
      { label: 'Go outside to investigate', next: 'go_outside', suspicion: 0 },
      { label: 'Call 911 from inside', next: 'call_police_inside', suspicion: 0 }
    ]
  },

  ignore: {
    scene: 'apartment_morning', rain: false,
    location: 'NEW YORK APT', time: 'NEXT MORNING',
    speaker: 'NARRATOR',
    text: "You pull the pillow over your head and drift off. By morning, the street is taped off. A detective knocks on your door. They know you live right above the alley. They have questions.",
    choices: [
      { label: 'Be honest — tell them everything you heard', next: 'honest_next_morning', suspicion: 5 },
      { label: 'Lie — say you heard nothing at all', next: 'lie_next_morning', suspicion: 40 }
    ]
  },

  honest_next_morning: {
    scene: 'police_station', rain: false,
    location: '42ND STREET', time: '9:12 AM',
    speaker: 'DET. MORGAN',
    text: "You come clean. You heard the argument around 2:47 AM, two voices — one male, low and gravelly. You describe the sound of something metallic. The detective nods slowly. Your timeline matches the coroner's window. They appreciate your honesty.",
    choices: [
      { label: 'Continue cooperating fully', next: 'ending_innocent_path', suspicion: -10 }
    ]
  },

  lie_next_morning: {
    scene: 'police_station', rain: false,
    location: '42ND STREET', time: '9:12 AM',
    speaker: 'DET. MORGAN',
    text: "\"Heard nothing? Really?\" The detective's eyes narrow. A neighbor already reported hearing a scream and seeing your light turn on at 2:50 AM. Your story doesn't hold. Every lie you tell pulls the net tighter.",
    choices: [
      { label: 'Come clean now', next: 'ending_innocent_path', suspicion: 25 },
      { label: 'Dig deeper into the lie', next: 'ending_guilty_path', suspicion: 50 }
    ]
  },

  go_outside: {
    scene: 'lighter_clue', rain: true,
    location: '42ND STREET ALLEY', time: '2:51 AM',
    speaker: 'NARRATOR',
    text: "You grab your jacket and slip downstairs. The rain is cold. The alley reeks of damp brick and copper. Near the body you spot something glinting under the lamplight — a monogrammed lighter, initials stamped deep into the metal. Not the victim's.",
    choices: [
      { label: 'Pick up the lighter — it\'s evidence', next: 'take_clue', suspicion: 0 },
      { label: 'Leave it — don\'t touch anything', next: 'leave_clue', suspicion: 15 }
    ]
  },

  take_clue: {
    scene: 'evidence_taken', rain: true,
    location: '42ND STREET ALLEY', time: '2:53 AM',
    speaker: 'NARRATOR',
    text: "You pocket the lighter. Initials: R.V. Engraved on a Zippo, expensive. Then — sirens. Blue and red wash the alley mouth. Police are close. You have seconds.",
    clue: 'MONOGRAMMED LIGHTER (R.V.)',
    choices: [
      { label: 'Run — get to the subway', next: 'run_to_subway', suspicion: 20 },
      { label: 'Stay and face the officers', next: 'stay_at_scene', suspicion: 0 }
    ]
  },

  leave_clue: {
    scene: 'lighter_clue', rain: true,
    location: '42ND STREET ALLEY', time: '3:05 AM',
    speaker: 'NARRATOR',
    text: "You step back and wait by the alley entrance. Police arrive, cordon the scene. By dawn, forensics has processed everything. The lighter — the one piece of physical evidence linking the killer — has been logged by officers who don't know what it means yet. Without your testimony, it's just an item in a bag.",
    choices: [
      { label: 'Return later to look for more', next: 'return_later', suspicion: 30 },
      { label: 'Avoid the area entirely', next: 'ending_guilty_path', suspicion: 45 }
    ]
  },

  return_later: {
    scene: 'street_morning', rain: false,
    location: '42ND STREET — MORNING', time: '8:30 AM',
    speaker: 'NARRATOR',
    text: "You return in daylight. The tape is up, the scene scrubbed. Police photography teams have swept everything. There's nothing left for you. Worse — a patrol officer recognized you from last night. You've been circling a crime scene. That looks very bad.",
    choices: [
      { label: 'Explain yourself at the precinct', next: 'ending_guilty_path', suspicion: 50 }
    ]
  },

  call_police_inside: {
    scene: 'apartment_night', rain: false,
    location: 'NEW YORK APT', time: '2:49 AM',
    speaker: 'DISPATCH',
    text: "\"911, what's your emergency?\" You describe what you witnessed — the argument, the flash of metal, the figure fleeing north on 42ND STREET. The dispatcher keeps you talking. Your voice is steady. Every detail counts.",
    choices: [
      { label: 'Stay on the line — give every detail', next: 'stay_on_phone', suspicion: -15 },
      { label: 'Hang up — you panic', next: 'hang_up', suspicion: 35 }
    ]
  },

  stay_on_phone: {
    scene: 'police_station', rain: false,
    location: '42ND STREET', time: '4:15 AM',
    speaker: 'DET. MORGAN',
    text: "The recording of your call is clean, calm, detailed. You described the suspect's hoodie color, their gait, the direction they fled. Officers find footage on a corner cam matching your description exactly. You are not a suspect — you're a witness.",
    choices: [
      { label: 'Give your full statement', next: 'ending_innocent_path', suspicion: -20 }
    ]
  },

  hang_up: {
    scene: 'apartment_night', rain: false,
    location: 'NEW YORK APT', time: '2:52 AM',
    speaker: 'NARRATOR',
    text: "You hang up midway. In thirty seconds you regret it. The dispatcher flagged the disconnected call. Officers pull your number. Why did you hang up? What were you hiding? The question echoes through every interview that follows.",
    choices: [
      { label: 'Turn yourself in voluntarily', next: 'ending_innocent_path', suspicion: 30 },
      { label: 'Don\'t answer when detectives call', next: 'ending_guilty_path', suspicion: 55 }
    ]
  },

  run_to_subway: {
    scene: 'subway', rain: false,
    location: '42ND STREET STATION', time: '3:01 AM',
    speaker: 'NARRATOR',
    text: "You slip down to the subway. The platform is near empty. A woman sits on a bench, hands shaking. She keeps glancing toward the exit. She was there. You saw her in the alley — a witness who ran like you did.",
    suspicion_action: 20,
    choices: [
      { label: 'Approach her — she might know something', next: 'talk_to_witness', suspicion: -15 },
      { label: 'Ignore her — it\'s not your problem', next: 'ignore_witness', suspicion: 15 }
    ]
  },

  talk_to_witness: {
    scene: 'subway', rain: false,
    location: '42ND STREET STATION', time: '3:08 AM',
    speaker: 'WOMAN (WITNESS)',
    text: "\"I saw him too.\" She's trembling. \"Tall guy, scar under his left eye. Green jacket with a white stripe on the sleeve. He said something before— something about 'Richie knows what he did'. I've seen him at the bodega on 42ND STREET. His name is Vasquez.\" R.V. The lighter.",
    clue: 'WITNESS: VASQUEZ, SCAR, GREEN JACKET',
    choices: [
      { label: 'Convince her to come to the police with you', next: 'ending_innocent_path', suspicion: -25 }
    ]
  },

  ignore_witness: {
    scene: 'subway_inside', rain: false,
    location: '42ND STREET STATION', time: '3:08 AM',
    speaker: 'NARRATOR',
    text: "You ride in silence. She gets off at the next stop and vanishes into the city. Whatever she knew leaves with her. When police find you days later — fidgety, avoiding calls, clue in your pocket — you have no story, no corroboration. Just suspicion.",
    choices: [
      { label: 'Face the inevitable', next: 'ending_guilty_path', suspicion: 45 }
    ]
  },

  stay_at_scene: {
    scene: 'caught', rain: false,
    location: '42ND STREET ALLEY', time: '2:55 AM',
    speaker: 'OFFICER HAYES',
    text: "Two officers round the corner, hands on belts. \"Freeze. Don't move.\" You raise your hands slowly. You're standing over a body with a lighter in your pocket and rain washing away whatever prints might have saved you. This is the moment everything depends on what you say next.",
    choices: [
      { label: 'Tell the full truth immediately', next: 'cooperate_with_police', suspicion: 0 },
      { label: 'Panic and give inconsistent answers', next: 'panic_at_scene', suspicion: 45 }
    ]
  },

  cooperate_with_police: {
    scene: 'police_station', rain: false,
    location: '42ND STREET', time: '4:30 AM',
    speaker: 'DET. MORGAN',
    text: "You hand over the lighter. You describe exactly what you saw — the hoodie, the direction the suspect fled, the monogram R.V. The detective runs it. Rafael Vasquez. He's got priors. Security cam on 42ND STREET caught him twenty minutes later. The lighter seals it.",
    choices: [
      { label: 'Complete your statement', next: 'ending_innocent_path', suspicion: -30 }
    ]
  },

  panic_at_scene: {
    scene: 'police_station', rain: false,
    location: '42ND STREET', time: '4:30 AM',
    speaker: 'DET. MORGAN',
    text: "Your story shifts three times. First you were asleep, then you heard a noise, then you came out to \"check\" — with a lighter in your jacket that has someone else's initials. The detective sets down his pen and looks at you.",
    choices: [
      { label: 'Demand a lawyer and say nothing more', next: 'ending_guilty_path', suspicion: 50 },
      { label: 'Come completely clean — all of it', next: 'ending_innocent_path', suspicion: 25 }
    ]
  },

  ending_innocent_path: {
    scene: null, rain: false,
    location: '', time: '',
    speaker: 'NARRATOR',
    text: "Every thread comes together. The clue, the witness, your calm account. Rafael Vasquez is arrested forty-eight hours later at a motel in Jersey. The lighter places him at the scene. The woman from the subway testifies. You walk out of the precinct into a gray morning — shaken, exhausted, but free.",
    choices: [
      { label: '— SEE YOUR ENDING —', next: '__ending_innocent__', suspicion: 0 }
    ]
  },

  ending_guilty_path: {
    scene: null, rain: false,
    location: '', time: '',
    speaker: 'NARRATOR',
    text: "The DA's case is circumstantial but just solid enough. You were there. You ran. Your story never held together. Without the clue, without the witness, without trust — the jury deliberates for six hours. The foreman stands. \"Guilty.\" The word lands like something physical.",
    choices: [
      { label: '— SEE YOUR ENDING —', next: '__ending_guilty__', suspicion: 0 }
    ]
  }
};

// ══════════════════════════════════════════════════
//  GAME ENGINE
// ══════════════════════════════════════════════════
let currentNodeKey = null;
let choicesMade = 0;

async function goTo(key) {
  if(key === '__ending_innocent__') { showEnding('innocent'); return; }
  if(key === '__ending_guilty__') { showEnding('guilty'); return; }

  await fadeOut();

  const node = NODES[key];
  if(!node) { console.warn('Missing node:', key); return; }
  currentNodeKey = key;
  state.choices++;

  // Update scene
  if(node.scene) renderScene(node.scene, node.rain||false);
  else { renderScene('street_morning', false); }
  if(node.rain) startRain(); else stopRain();

  // Add clue
  if(node.clue) addClue(node.clue);

  // Suspicion
  if(node.suspicion_action) addSuspicion(node.suspicion_action);

  // Update HUD
  document.getElementById('hud-location').textContent = `${node.location||''} — ${node.time||''}`;
  document.getElementById('location-tag').textContent = node.location || '';
  document.getElementById('time-tag').textContent = node.time || '';

  // Speaker
  document.getElementById('speaker-name').textContent = node.speaker || 'NARRATOR';

  // Clear choices while typing
  const choicesEl = document.getElementById('choices-box');
  choicesEl.innerHTML = '';

  await fadeIn();

  // Typewriter
  const el = document.getElementById('dialog-content');
  el.textContent = '';
  await typeText(node.text, 22);

  // Render choices
  renderChoices(node.choices);
}

function renderChoices(choices) {
  const box = document.getElementById('choices-box');
  box.innerHTML = '';
  choices.forEach(c => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = c.label;
    btn.addEventListener('click', () => {
      addSuspicion(c.suspicion || 0);
      goTo(c.next);
    });
    box.appendChild(btn);
  });
}

function fadeOut() {
  return new Promise(res => {
    const f = document.getElementById('fade');
    f.classList.add('visible');
    setTimeout(res, 380);
  });
}
function fadeIn() {
  return new Promise(res => {
    const f = document.getElementById('fade');
    f.classList.remove('visible');
    setTimeout(res, 380);
  });
}

// ══════════════════════════════════════════════════
//  ENDING SCREEN
// Ending screen
function showEnding(type) {
  stopRain();
  fadeOut().then(() => {
    document.getElementById('game-screen').classList.remove('active');
    const screen = document.getElementById('ending-screen');
    screen.classList.add('active');
    screen.dataset.ending = type;

    const title = document.getElementById('ending-title');
    const text = document.getElementById('ending-text');
    const stats = document.getElementById('ending-stats');

    if(type === 'innocent') {
      title.className = 'ending-title innocent';
      title.textContent = '✦ ENDING 1: INNOCENT ✦';
      text.textContent = 'The truth prevailed. Your choices led investigators to Rafael Vasquez. The real murderer is behind bars. You stood in the rain that night — shaking, uncertain — and you chose honesty. That choice set you free.';
    } else {
      title.className = 'ending-title guilty';
      title.textContent = '✦ ENDING 2: WRONGLY ACCUSED ✦';
      text.textContent = 'The system failed you — but so did your choices. Without evidence, without a witness, without a coherent story, the truth had nothing to hold onto. The cell door closes. Somewhere, the real killer walks free.';
    }

    stats.innerHTML = `
      <div class="stat-box">CHOICES MADE<span>${state.choices}</span></div>
      <div class="stat-box">SUSPICION<span>${state.suspicion}%</span></div>
      <div class="stat-box">CLUES FOUND<span>${state.clues.length}</span></div>
    `;

    fadeIn();
  });
}
function startGame() {
  state.suspicion = 0;
  state.clues = [];
  state.choices = 0;
  renderClues();
  document.getElementById('suspicion-fill').style.width = '0%';

  document.getElementById('title-screen').classList.remove('active');
  document.getElementById('ending-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');

  goTo('start');
}

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('replay-btn').addEventListener('click', () => {
  document.getElementById('ending-screen').classList.remove('active');
  document.getElementById('title-screen').classList.add('active');
});

// Skip typewriter on dialog click
document.getElementById('dialog-text').addEventListener('click', () => {
  if(!typingDone) {
    clearInterval(typeTimer);
    typingDone = true;
    const node = NODES[currentNodeKey];
    if(node) {
      document.getElementById('dialog-content').textContent = node.text;
      renderChoices(node.choices);
    }
  }
});

// Init title art
initTitleCanvas();
