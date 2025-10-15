const busyState = { busy: false };

const SAMPLE_RATE = 24000;
const DEFAULT_VOICES = [
  {
    id: 'default',
    label: 'Clear Narrator',
    language: 'en',
    baseFrequency: 175,
    brightness: 0.55,
    vibrato: 0.003,
    breathiness: 0.12
  },
  {
    id: 'warm',
    label: 'Warm Storyteller',
    language: 'en',
    baseFrequency: 155,
    brightness: 0.35,
    vibrato: 0.002,
    breathiness: 0.18
  },
  {
    id: 'bright',
    label: 'Bright Guide',
    language: 'en',
    baseFrequency: 195,
    brightness: 0.75,
    vibrato: 0.004,
    breathiness: 0.08
  },
  {
    id: 'robotic',
    label: 'Retro Synth',
    language: 'en',
    baseFrequency: 165,
    brightness: 0.4,
    vibrato: 0.0,
    breathiness: 0.02,
    metallic: 0.5
  }
];

const PUNCTUATION_PAUSES = {
  ',': 180,
  ';': 180,
  ':': 220,
  '.': 360,
  '!': 420,
  '?': 420,
  '\n': 280
};

const DIPHTHONGS = [
  { pattern: 'ough', phoneme: 'OW', duration: 220 },
  { pattern: 'igh', phoneme: 'AY', duration: 200 },
  { pattern: 'eau', phoneme: 'OW', duration: 220 },
  { pattern: 'ai', phoneme: 'AY', duration: 200 },
  { pattern: 'ay', phoneme: 'AY', duration: 200 },
  { pattern: 'ei', phoneme: 'AY', duration: 200 },
  { pattern: 'ey', phoneme: 'AY', duration: 200 },
  { pattern: 'ie', phoneme: 'IY', duration: 200 },
  { pattern: 'ee', phoneme: 'IY', duration: 200 },
  { pattern: 'ea', phoneme: 'IY', duration: 200 },
  { pattern: 'oo', phoneme: 'UW', duration: 200 },
  { pattern: 'ou', phoneme: 'AW', duration: 220 },
  { pattern: 'oi', phoneme: 'OY', duration: 220 },
  { pattern: 'ow', phoneme: 'OW', duration: 220 }
];

const CONSONANT_CLUSTERS = [
  { pattern: 'ch', phoneme: 'CH', duration: 150 },
  { pattern: 'sh', phoneme: 'SH', duration: 160 },
  { pattern: 'th', phoneme: 'TH', duration: 160 },
  { pattern: 'ph', phoneme: 'F', duration: 150 },
  { pattern: 'wh', phoneme: 'W', duration: 140 },
  { pattern: 'ng', phoneme: 'NG', duration: 180 }
];

const PHONEME_PROFILES = {
  A: { type: 'vowel', base: 740, formants: [750, 1200, 2700], duration: 180 },
  E: { type: 'vowel', base: 470, formants: [500, 1700, 2600], duration: 170 },
  I: { type: 'vowel', base: 290, formants: [300, 2300, 3200], duration: 170 },
  O: { type: 'vowel', base: 400, formants: [450, 800, 2600], duration: 200 },
  U: { type: 'vowel', base: 320, formants: [350, 600, 2400], duration: 220 },
  ER: { type: 'vowel', base: 480, formants: [500, 1350, 1700], duration: 190 },
  AR: { type: 'vowel', base: 600, formants: [650, 1100, 2500], duration: 200 },
  OR: { type: 'vowel', base: 500, formants: [500, 900, 2400], duration: 200 },
  AY: { type: 'vowel', base: 520, formants: [550, 1700, 2700], duration: 210 },
  IY: { type: 'vowel', base: 320, formants: [350, 2200, 3000], duration: 210 },
  UW: { type: 'vowel', base: 300, formants: [350, 600, 2400], duration: 200 },
  OW: { type: 'vowel', base: 360, formants: [400, 800, 2600], duration: 220 },
  AW: { type: 'vowel', base: 420, formants: [450, 1100, 2600], duration: 220 },
  OY: { type: 'vowel', base: 360, formants: [400, 1900, 2700], duration: 220 },
  B: { type: 'stop', voiced: true, duration: 110 },
  P: { type: 'stop', voiced: false, duration: 110 },
  D: { type: 'stop', voiced: true, duration: 110 },
  T: { type: 'stop', voiced: false, duration: 110 },
  G: { type: 'stop', voiced: true, duration: 120 },
  K: { type: 'stop', voiced: false, duration: 120 },
  J: { type: 'affricate', voiced: true, duration: 160 },
  CH: { type: 'affricate', voiced: false, duration: 160 },
  F: { type: 'fricative', voiced: false, duration: 160 },
  V: { type: 'fricative', voiced: true, duration: 160 },
  TH: { type: 'fricative', voiced: false, duration: 160 },
  Z: { type: 'fricative', voiced: true, duration: 150 },
  S: { type: 'fricative', voiced: false, duration: 150 },
  SH: { type: 'fricative', voiced: false, duration: 180, darkness: 0.35 },
  H: { type: 'breath', duration: 140 },
  L: { type: 'liquid', duration: 160 },
  R: { type: 'liquid', duration: 160 },
  W: { type: 'liquid', duration: 140 },
  Y: { type: 'liquid', duration: 140 },
  M: { type: 'nasal', duration: 160 },
  N: { type: 'nasal', duration: 160 },
  NG: { type: 'nasal', duration: 200 },
  HN: { type: 'nasal', duration: 150 },
  Q: { type: 'stop', voiced: false, duration: 120 }
};

const LETTER_TO_PHONEME = {
  a: 'A',
  b: 'B',
  c: 'K',
  d: 'D',
  e: 'E',
  f: 'F',
  g: 'G',
  h: 'H',
  i: 'I',
  j: 'J',
  k: 'K',
  l: 'L',
  m: 'M',
  n: 'N',
  o: 'O',
  p: 'P',
  q: 'K',
  r: 'R',
  s: 'S',
  t: 'T',
  u: 'U',
  v: 'V',
  w: 'W',
  x: 'KS',
  y: 'IY',
  z: 'Z'
};

function tokenize(text) {
  const tokens = [];
  const lower = text.toLowerCase();
  let i = 0;
  while (i < lower.length) {
    const char = lower[i];
    if (/\s/.test(char)) {
      tokens.push({ type: 'pause', duration: 90 });
      i += 1;
      continue;
    }
    if (PUNCTUATION_PAUSES[char]) {
      tokens.push({ type: 'pause', duration: PUNCTUATION_PAUSES[char] });
      i += 1;
      continue;
    }
    const newline = lower.slice(i, i + 1) === '\n';
    if (newline) {
      tokens.push({ type: 'pause', duration: PUNCTUATION_PAUSES['\n'] });
      i += 1;
      continue;
    }

    let matched = false;
    for (const entry of DIPHTHONGS) {
      if (lower.startsWith(entry.pattern, i)) {
        tokens.push({ type: 'phoneme', phoneme: entry.phoneme, duration: entry.duration });
        i += entry.pattern.length;
        matched = true;
        break;
      }
    }
    if (matched) {
      continue;
    }
    for (const entry of CONSONANT_CLUSTERS) {
      if (lower.startsWith(entry.pattern, i)) {
        tokens.push({ type: 'phoneme', phoneme: entry.phoneme, duration: entry.duration });
        i += entry.pattern.length;
        matched = true;
        break;
      }
    }
    if (matched) {
      continue;
    }

    const next = lower[i + 1] || '';
    if (char === 'c') {
      if ('eiy'.includes(next)) {
        tokens.push({ type: 'phoneme', phoneme: 'S' });
      } else {
        tokens.push({ type: 'phoneme', phoneme: 'K' });
      }
      i += 1;
      continue;
    }
    if (char === 'g') {
      if ('eiy'.includes(next)) {
        tokens.push({ type: 'phoneme', phoneme: 'J' });
      } else {
        tokens.push({ type: 'phoneme', phoneme: 'G' });
      }
      i += 1;
      continue;
    }
    if (char === 'r' && next === 'r') {
      tokens.push({ type: 'phoneme', phoneme: 'R' });
      i += 2;
      continue;
    }
    if (char === 'x') {
      tokens.push({ type: 'phoneme', phoneme: 'K' });
      tokens.push({ type: 'phoneme', phoneme: 'S', duration: 120 });
      i += 1;
      continue;
    }
    if (char === 'h') {
      tokens.push({ type: 'phoneme', phoneme: 'H' });
      i += 1;
      continue;
    }

    const mapping = LETTER_TO_PHONEME[char];
    if (mapping) {
      if (mapping.length === 2 && PHONEME_PROFILES[mapping]) {
        tokens.push({ type: 'phoneme', phoneme: mapping });
      } else if (mapping.length > 1) {
        for (const letter of mapping) {
          const phoneme = LETTER_TO_PHONEME[letter.toLowerCase()] || letter.toUpperCase();
          if (PHONEME_PROFILES[phoneme]) {
            tokens.push({ type: 'phoneme', phoneme });
          }
        }
      } else {
        const phoneme = mapping.toUpperCase();
        if (PHONEME_PROFILES[phoneme]) {
          tokens.push({ type: 'phoneme', phoneme });
        }
      }
    }
    i += 1;
  }
  return tokens;
}

function applyEnvelope(buffer, sampleRate, attack = 0.02, release = 0.08) {
  const attackSamples = Math.max(1, Math.round(sampleRate * attack));
  const releaseSamples = Math.max(1, Math.round(sampleRate * release));
  for (let i = 0; i < attackSamples && i < buffer.length; i += 1) {
    const gain = i / attackSamples;
    buffer[i] *= gain;
  }
  for (let i = 0; i < releaseSamples && i < buffer.length; i += 1) {
    const idx = buffer.length - 1 - i;
    const gain = i / releaseSamples;
    buffer[idx] *= gain;
  }
}

function renderVoiced(duration, frequency, voice, options = {}) {
  const length = Math.max(1, Math.round((duration / 1000) * SAMPLE_RATE));
  const result = new Float32Array(length);
  const harmonics = options.harmonics || [1, 0.45, 0.25, 0.1];
  const vibratoDepth = typeof voice.vibrato === 'number' ? voice.vibrato : 0.0025;
  const vibratoRate = 5.5;
  const metallic = voice.metallic || 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / SAMPLE_RATE;
    const vibrato = vibratoDepth ? Math.sin(2 * Math.PI * vibratoRate * t) * frequency * vibratoDepth : 0;
    let sample = 0;
    harmonics.forEach((weight, index) => {
      const ratio = index + 1 + metallic * 0.5 * index;
      sample += weight * Math.sin(2 * Math.PI * (frequency + vibrato) * ratio * t);
    });
    result[i] = sample;
  }
  applyEnvelope(result, SAMPLE_RATE, options.attack ?? 0.03, options.release ?? 0.12);
  return result;
}

function renderNoise(duration, color = 0.0) {
  const length = Math.max(1, Math.round((duration / 1000) * SAMPLE_RATE));
  const data = new Float32Array(length);
  let prev = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    prev = (1 - color) * white + color * prev;
    data[i] = prev;
  }
  applyEnvelope(data, SAMPLE_RATE, 0.01, 0.05);
  return data;
}

function scaleBuffer(buffer, gain) {
  for (let i = 0; i < buffer.length; i += 1) {
    buffer[i] *= gain;
  }
}

function renderPhoneme(token, voice) {
  const profile = PHONEME_PROFILES[token.phoneme];
  if (!profile) {
    return renderSilence(token.duration || 80);
  }
  const duration = token.duration || profile.duration || 140;
  const brightness = typeof voice.brightness === 'number' ? voice.brightness : 0.5;
  switch (profile.type) {
    case 'vowel': {
      const base = voice.baseFrequency || 170;
      const vowelBase = profile.base || base;
      const harmonics = [1, 0.42 + 0.2 * brightness, 0.22 + 0.15 * brightness, 0.1 + 0.1 * brightness];
      const voiced = renderVoiced(duration, base * (vowelBase / 500), voice, { harmonics, attack: 0.02, release: 0.08 });
      return voiced;
    }
    case 'nasal': {
      const freq = (voice.baseFrequency || 170) * 0.75;
      const segment = renderVoiced(duration, freq, voice, { harmonics: [1, 0.3, 0.15], attack: 0.02, release: 0.1 });
      scaleBuffer(segment, 0.6);
      return segment;
    }
    case 'liquid': {
      const freq = (voice.baseFrequency || 170) * 0.9;
      const segment = renderVoiced(duration, freq, voice, { harmonics: [1, 0.4, 0.2], attack: 0.015, release: 0.09 });
      scaleBuffer(segment, 0.55 + brightness * 0.2);
      return segment;
    }
    case 'affricate': {
      const consonant = renderNoise(duration * 0.4, 0.2);
      scaleBuffer(consonant, profile.voiced ? 0.5 : 0.6);
      const voicedPart = renderVoiced(duration * 0.6, voice.baseFrequency || 170, voice, { harmonics: [1, 0.4, 0.2], attack: 0.01, release: 0.06 });
      scaleBuffer(voicedPart, profile.voiced ? 0.5 : 0.3);
      return concatSegments(consonant, voicedPart);
    }
    case 'stop': {
      const burst = renderNoise(duration * 0.35, 0.1);
      scaleBuffer(burst, profile.voiced ? 0.4 : 0.5);
      if (profile.voiced) {
        const voicedTail = renderVoiced(duration * 0.65, voice.baseFrequency || 170, voice, { attack: 0.005, release: 0.05 });
        scaleBuffer(voicedTail, 0.45);
        return concatSegments(burst, voicedTail);
      }
      return burst;
    }
    case 'fricative': {
      const color = profile.darkness ?? (profile.voiced ? 0.25 : 0.1);
      const noise = renderNoise(duration, color);
      scaleBuffer(noise, profile.voiced ? 0.4 : 0.55 + brightness * 0.1);
      if (profile.voiced) {
        const voicedBed = renderVoiced(duration, voice.baseFrequency || 170, voice, { harmonics: [0.7, 0.3, 0.15], attack: 0.01, release: 0.05 });
        scaleBuffer(voicedBed, 0.35);
        return mixBuffers(noise, voicedBed);
      }
      return noise;
    }
    case 'breath': {
      const breath = renderNoise(duration, 0.4);
      scaleBuffer(breath, (voice.breathiness || 0.1) + 0.1);
      return breath;
    }
    default:
      return renderSilence(duration);
  }
}

function renderSilence(duration) {
  const length = Math.max(1, Math.round((duration / 1000) * SAMPLE_RATE));
  return new Float32Array(length);
}

function concatSegments(...segments) {
  let total = 0;
  segments.forEach((segment) => {
    total += segment.length;
  });
  const combined = new Float32Array(total);
  let offset = 0;
  segments.forEach((segment) => {
    combined.set(segment, offset);
    offset += segment.length;
  });
  return combined;
}

function mixBuffers(a, b) {
  const length = Math.max(a.length, b.length);
  const result = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    const av = i < a.length ? a[i] : 0;
    const bv = i < b.length ? b[i] : 0;
    result[i] = av + bv;
  }
  return result;
}

function normalize(buffer) {
  let max = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const value = Math.abs(buffer[i]);
    if (value > max) {
      max = value;
    }
  }
  if (max === 0) {
    return buffer;
  }
  const scale = 0.92 / max;
  const output = new Float32Array(buffer.length);
  for (let i = 0; i < buffer.length; i += 1) {
    output[i] = buffer[i] * scale;
  }
  return output;
}

function encodeWav(samples, sampleRate) {
  const clamped = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    clamped[i] = Math.round(value * 0x7fff);
  }
  const buffer = Buffer.alloc(44 + clamped.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + clamped.length * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(clamped.length * 2, 40);
  let offset = 44;
  for (let i = 0; i < clamped.length; i += 1) {
    buffer.writeInt16LE(clamped[i], offset);
    offset += 2;
  }
  return buffer;
}

async function listVoices() {
  return DEFAULT_VOICES.map((voice) => ({ id: voice.id, label: voice.label, language: voice.language }));
}

async function synthesize(text, { voice } = {}) {
  if (busyState.busy) {
    const error = new Error('busy');
    error.code = 'BUSY';
    throw error;
  }
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    throw new Error('empty');
  }
  const limited = normalized.length > 1600 ? `${normalized.slice(0, 1600)}…` : normalized;
  const voiceConfig = DEFAULT_VOICES.find((entry) => entry.id === voice) || DEFAULT_VOICES[0];
  const tokens = tokenize(limited);
  if (!tokens.length) {
    throw new Error('empty');
  }
  busyState.busy = true;
  try {
    const segments = [];
    tokens.forEach((token, index) => {
      if (token.type === 'pause') {
        segments.push(renderSilence(token.duration || 100));
      } else if (token.type === 'phoneme') {
        segments.push(renderPhoneme(token, voiceConfig));
        const next = tokens[index + 1];
        if (!next || next.type === 'pause') {
          segments.push(renderSilence(40));
        } else {
          segments.push(renderSilence(25));
        }
      }
    });
    const combined = concatSegments(...segments);
    const normalizedSamples = normalize(combined);
    const wav = encodeWav(normalizedSamples, SAMPLE_RATE);
    return {
      audio: wav.toString('base64'),
      sampleRate: SAMPLE_RATE
    };
  } finally {
    busyState.busy = false;
  }
}

function setHuggingFaceToken() {
  // Legacy API retained for compatibility. No-op for the local synthesizer.
}

module.exports = {
  listVoices,
  synthesize,
  setHuggingFaceToken
};
