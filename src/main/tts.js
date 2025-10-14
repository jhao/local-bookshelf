const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');

let ttsPipelinePromise = null;
let ttsVoices = null;
let busy = false;

let pipelineFunctionPromise = null;
let proxyConfigured = false;
let authConfigured = false;
let mirrorsConfigured = false;

const TOKEN_ENV_KEYS = [
  'HF_TOKEN',
  'HF_HUB_TOKEN',
  'HF_API_TOKEN',
  'HUGGING_FACE_TOKEN',
  'HUGGINGFACE_TOKEN',
  'HUGGINGFACE_API_TOKEN',
  'HUGGING_FACE_HUB_TOKEN',
  'HUGGINGFACEHUB_TOKEN',
  'HUGGINGFACEHUB_API_TOKEN'
];

let huggingFaceToken = null;
let huggingFaceTokenInitialized = false;
let originalFetch = null;

function isHuggingFaceUnauthorized(error) {
  if (!error) {
    return false;
  }
  if (error.status === 401 || error.code === 'HUGGINGFACE_AUTH') {
    return true;
  }
  const message = String(error.message || error || '').toLowerCase();
  if (!message) {
    return false;
  }
  return message.includes('unauthorized access to file') || message.includes('401');
}

function getTokenFromEnv() {
  for (const key of TOKEN_ENV_KEYS) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }
  return null;
}

function applyTokenToEnv(token) {
  TOKEN_ENV_KEYS.forEach((key) => {
    if (token) {
      process.env[key] = token;
    } else {
      delete process.env[key];
    }
  });
}

function resolveHuggingFaceToken() {
  if (!huggingFaceTokenInitialized) {
    huggingFaceToken = getTokenFromEnv();
    huggingFaceTokenInitialized = true;
  }
  return huggingFaceToken;
}

function configureAuth() {
  if (authConfigured) {
    return;
  }
  const fetchReference = globalThis.fetch;
  if (typeof fetchReference !== 'function') {
    return;
  }
  const RequestConstructor = typeof globalThis.Request === 'function' ? globalThis.Request : null;
  const HeadersConstructor = typeof globalThis.Headers === 'function' ? globalThis.Headers : null;
  if (!RequestConstructor || !HeadersConstructor) {
    return;
  }
  originalFetch = fetchReference;
  authConfigured = true;
  globalThis.fetch = async (input, init = {}) => {
    try {
      let url = null;
      if (typeof input === 'string') {
        url = input;
      } else if (input instanceof URL) {
        url = input.toString();
      } else if (input && typeof input.url === 'string') {
        url = input.url;
      }
      if (url && url.startsWith('https://huggingface.co/')) {
        const headers = new HeadersConstructor(
          init.headers || (typeof input === 'object' && input ? input.headers : undefined)
        );
        const token = resolveHuggingFaceToken();
        if (token && !headers.has('authorization') && !headers.has('Authorization')) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        if (typeof input === 'string') {
          return originalFetch(input, { ...init, headers });
        }
        if (input instanceof RequestConstructor) {
          const request = new RequestConstructor(input, { ...init, headers });
          return originalFetch(request);
        }
        return originalFetch(url, { ...init, headers });
      }
    } catch (error) {
      console.warn('Failed to apply Hugging Face authorization header', error);
    }
    return originalFetch(input, init);
  };
}

function configureProxy() {
  if (proxyConfigured) {
    return;
  }
  proxyConfigured = true;
  const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy;
  if (!proxyUrl) {
    return;
  }
  try {
    // Node's global fetch is powered by undici. Configure it to honour proxy settings
    // if the host environment provides them.
    const { ProxyAgent, setGlobalDispatcher } = require('undici');
    const agent = new ProxyAgent(proxyUrl);
    setGlobalDispatcher(agent);
  } catch (error) {
    console.warn('Failed to configure proxy for text-to-speech downloads', error);
  }
}

async function getPipelineFunction() {
  if (!pipelineFunctionPromise) {
    pipelineFunctionPromise = import('@xenova/transformers').then((mod) => mod.pipeline);
  }
  return pipelineFunctionPromise;
}
function parseListEnv(value) {
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(/[;,]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeLocalPath(candidate) {
  if (candidate.startsWith('file://')) {
    try {
      return fileURLToPath(candidate);
    } catch (error) {
      console.warn('Invalid file URL for TTS model', candidate, error);
      return null;
    }
  }
  if (candidate.startsWith('.') || candidate.startsWith('/') || candidate.startsWith('\\')) {
    return path.resolve(candidate);
  }
  return null;
}

function getModelCandidates() {
  const preferredModels = parseListEnv(process.env.TTS_MODEL_PREFERENCES);
  const localDir = (process.env.TTS_MODEL_DIR || '').trim();
  if (localDir) {
    preferredModels.unshift(localDir);
  }
  const defaultModels = [
    'Xenova/xtts_v1.1',
    'Xenova/xtts',
    'Xenova/vits-multilingual-mini',
    'Xenova/vits-multilingual'
  ];
  const combined = [...preferredModels, ...defaultModels];
  const seen = new Set();
  return combined.filter((entry) => {
    if (!entry) {
      return false;
    }
    const key = entry.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getMirrorCandidates() {
  const mirrors = parseListEnv(process.env.TTS_MODEL_MIRRORS);
  const disableDefault = String(process.env.TTS_DISABLE_HF || '').toLowerCase() === 'true';
  if (!disableDefault) {
    mirrors.push('https://hf-mirror.com');
    mirrors.push('default');
  }
  const seen = new Set();
  const filtered = mirrors
    .map((entry) => entry.trim())
    .filter((entry) => {
      if (!entry) {
        return false;
      }
      const key = entry.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  return { list: filtered, disableDefault };
}

function configureMirrors() {
  if (mirrorsConfigured) {
    return;
  }
  mirrorsConfigured = true;
  const raw = parseListEnv(process.env.TTS_MODEL_MIRRORS);
  if (raw.length && !process.env.HF_ENDPOINT) {
    // use the first mirror as the default huggingface endpoint when loading models
    process.env.HF_ENDPOINT = raw[0];
  }
}
async function ensurePipeline() {
  if (ttsPipelinePromise) {
    return ttsPipelinePromise;
  }
  configureProxy();
  configureAuth();
  configureMirrors();
  let lastError = null;
  const pipeline = await getPipelineFunction();
  const models = getModelCandidates();
  const { list: mirrors, disableDefault } = getMirrorCandidates();
  const mirrorSequence = mirrors.length
    ? mirrors
    : disableDefault
      ? [null]
      : ['default'];
  for (const mirror of mirrorSequence) {
    const restoreEndpoint = process.env.HF_ENDPOINT;
    if (mirror === 'default') {
      delete process.env.HF_ENDPOINT;
    } else if (typeof mirror === 'string' && mirror) {
      process.env.HF_ENDPOINT = mirror;
    } else {
      delete process.env.HF_ENDPOINT;
    }
    for (const candidate of models) {
      const localPath = normalizeLocalPath(candidate);
      if (localPath) {
        try {
          fs.accessSync(localPath, fs.constants.R_OK);
        } catch (error) {
          console.warn('Skipping inaccessible local TTS model path', localPath, error?.message || error);
          continue;
        }
      }
      if (!localPath && mirror === null && disableDefault) {
        console.warn('Skipping remote TTS model', candidate, 'because TTS_DISABLE_HF is enabled.');
        continue;
      }
      try {
        const resolvedModel = localPath || candidate;
        const options = { quantized: true };
        if (localPath) {
          options.localFilesOnly = true;
        }
        ttsPipelinePromise = pipeline('text-to-speech', resolvedModel, options);
        const instance = await ttsPipelinePromise;
        if (typeof mirror === 'string' && mirror && mirror !== 'default') {
          process.env.HF_ENDPOINT = restoreEndpoint;
        }
        return instance;
      } catch (error) {
        lastError = error;
        ttsPipelinePromise = null;
        if (isHuggingFaceUnauthorized(error)) {
          const authError = new Error('huggingface-auth');
          authError.code = 'HUGGINGFACE_AUTH';
          authError.cause = error;
          throw authError;
        }
      }
    }
    if (typeof mirror === 'string' && mirror && mirror !== 'default') {
      if (restoreEndpoint) {
        process.env.HF_ENDPOINT = restoreEndpoint;
      } else {
        delete process.env.HF_ENDPOINT;
      }
    } else if (restoreEndpoint) {
      process.env.HF_ENDPOINT = restoreEndpoint;
    }
  }
  const failure = new Error(lastError?.message || 'Failed to load text-to-speech model');
  failure.cause = lastError;
  if (isHuggingFaceUnauthorized(lastError)) {
    failure.code = 'HUGGINGFACE_AUTH';
  }
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
  let pipe;
  try {
    pipe = await ensurePipeline();
  } catch (error) {
    if (isHuggingFaceUnauthorized(error)) {
      const authError = new Error('huggingface-auth');
      authError.code = 'HUGGINGFACE_AUTH';
      authError.cause = error;
      throw authError;
    }
    throw error;
  }
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

function setHuggingFaceToken(token) {
  const normalized = typeof token === 'string' ? token.trim() : '';
  huggingFaceToken = normalized ? normalized : null;
  huggingFaceTokenInitialized = true;
  applyTokenToEnv(huggingFaceToken);
  configureAuth();
}

module.exports = {
  listVoices,
  synthesize,
  setHuggingFaceToken
};
