let ttsPipelinePromise = null;
let ttsVoices = null;
let busy = false;

let pipelineFunctionPromise = null;

async function getPipelineFunction() {
  if (!pipelineFunctionPromise) {
    pipelineFunctionPromise = import('@xenova/transformers').then((mod) => mod.pipeline);
  }
  return pipelineFunctionPromise;
}
const MODEL_CANDIDATES = [
  'Xenova/vits-multilingual-mini',
  'Xenova/vits-multilingual',
  'Xenova/tts_en'
];
async function ensurePipeline() {
  if (ttsPipelinePromise) {
    return ttsPipelinePromise;
  }
  let lastError = null;
  for (const model of MODEL_CANDIDATES) {
    try {
      const pipeline = await getPipelineFunction();
      ttsPipelinePromise = pipeline('text-to-speech', model, { quantized: true });
      const instance = await ttsPipelinePromise;
      return instance;
    } catch (error) {
      lastError = error;
      ttsPipelinePromise = null;
    }
  }
  const failure = new Error(lastError?.message || 'Failed to load text-to-speech model');
  failure.cause = lastError;
  throw failure;
}

function extractVoices(config = {}) {
  const voices = [];
  if (Array.isArray(config.speakers) && config.speakers.length) {
    config.speakers.forEach((name, index) => {
      voices.push({
        id: String(index),
        label: name,
        language: Array.isArray(config.languages) ? config.languages[index] || config.language || 'multi' : config.language || 'multi'
      });
    });
  } else if (config.id2label && typeof config.id2label === 'object') {
    Object.entries(config.id2label).forEach(([key, value]) => {
      if (value) {
        if (typeof value === 'string') {
          voices.push({ id: key, label: value, language: config.language || 'en' });
        } else {
          voices.push({
            id: key,
            label: value?.name || `Voice ${key}`,
            language: value?.language || config.language || 'en'
          });
        }
      }
    });
  }
  if (!voices.length) {
    voices.push({ id: 'default', label: 'Default voice', language: config.language || 'en' });
  }
  return voices;
}

function encodeWav(samples, sampleRate) {
  const clamped = new Int16Array(samples.length);
  for (let i = 0; i < samples.length; i += 1) {
    const value = Math.max(-1, Math.min(1, samples[i]));
    const scaled = Math.round(value * 0x7fff);
    const clampedValue = Math.max(-0x8000, Math.min(0x7fff, scaled));
    clamped[i] = clampedValue;
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
  const pipe = await ensurePipeline();
  if (!ttsVoices) {
    const config = pipe?.model?.config || {};
    ttsVoices = extractVoices(config);
  }
  return ttsVoices;
}

async function synthesize(text, { voice } = {}) {
  if (busy) {
    const error = new Error('busy');
    error.code = 'BUSY';
    throw error;
  }
  const normalized = (text || '').replace(/\s+/g, ' ').trim();
  if (!normalized) {
    throw new Error('empty');
  }
  const limited = normalized.length > 1600 ? `${normalized.slice(0, 1600)}…` : normalized;
  const pipe = await ensurePipeline();
  const voices = await listVoices();
  const options = {};
  if (voice && Array.isArray(voices)) {
    const selected = voices.find((entry) => entry.id === voice);
    if (selected && selected.id !== 'default') {
      const parsed = Number(selected.id);
      if (Number.isInteger(parsed)) {
        options.speaker_id = parsed;
      } else {
        options.speaker_id = selected.id;
      }
    }
  }
  busy = true;
  try {
    const output = await pipe(limited, options);
    const wav = encodeWav(output.audio, output.sampling_rate);
    return {
      audio: wav.toString('base64'),
      sampleRate: output.sampling_rate
    };
  } finally {
    busy = false;
  }
}

module.exports = {
  listVoices,
  synthesize
};
