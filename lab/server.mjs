// The lab on this machine, with image generation: serves lab/ and forwards "Send to generation" to
// Nano Banana, through OpenRouter (OPENROUTER_API_KEY) or Google's Gemini API (GEMINI_API_KEY),
// OpenRouter first when both are set. The key stays here, never in the page: from the environment,
// or a KEY=... line in lab/.env.local (git-ignored). Every generation is kept in
// lab/generations/<id>/ with its inputs, prompt and settings, so a good one can be found again.
// Run: node lab/server.mjs   (PORT=5190 by default)
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, 'generations');
// Saved prompts are kept, unlike generations: a prompt that works is a brand asset, one JSON file each.
const PROMPTS = path.join(here, 'prompts');
const PORT = Number(process.env.PORT ?? 5190);
function keyOf(name) {
  if (process.env[name]) return process.env[name];
  try {
    const line = fs.readFileSync(path.join(here, '.env.local'), 'utf8').split('\n').find(l => l.startsWith(name + '='));
    return line?.slice(name.length + 1).trim() || null;
  } catch { return null; }
}

// Nano Banana Pro is the default on both: gemini-3-pro-image since its GA release; the -preview id
// it had before was retired in June 2026. Each provider is asked which image models it has.
const PROVIDERS = {
  openrouter: {
    label: 'OpenRouter', key: () => keyOf('OPENROUTER_API_KEY'), defaultModel: 'google/gemini-3-pro-image',
    async models() {
      const r = await fetch('https://openrouter.ai/api/v1/models');
      if (!r.ok) throw new Error(`Listing models failed: ${r.status}`);
      return ((await r.json()).data ?? [])
        .filter(m => m.id.startsWith('google/') && (m.architecture?.output_modalities ?? []).includes('image'))
        .map(m => ({ id: m.id, label: m.name ?? m.id }));
    },
    async textModels() {
      const r = await fetch('https://openrouter.ai/api/v1/models');
      if (!r.ok) throw new Error(`Listing models failed: ${r.status}`);
      return ((await r.json()).data ?? []).map(m => m.id).filter(id => /^google\/gemini-3(\.\d+)?-pro(-preview)?$/.test(id));
    },
    async describe(key, { model, instruction, image }) {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}`, 'x-title': 'Pixl Lab' },
        body: JSON.stringify({
          model, response_format: { type: 'json_object' },
          messages: [{ role: 'user', content: [{ type: 'text', text: instruction }, ...(image ? [{ type: 'image_url', image_url: { url: `data:${image.mime};base64,${image.data}` } }] : [])] }],
        }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok || json.error) throw new Error(json.error?.message ?? `HTTP ${r.status}`);
      return json.choices?.[0]?.message?.content ?? '';
    },
    async generate(key, { model, prompt, images, aspectRatio, imageSize }) {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${key}`, 'x-title': 'Pixl Lab' },
        body: JSON.stringify({
          model, modalities: ['image', 'text'],
          messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, ...images.map(im => ({ type: 'image_url', image_url: { url: `data:image/png;base64,${im.data}` } }))] }],
          image_config: { ...(aspectRatio && { aspect_ratio: aspectRatio }), ...(imageSize && { image_size: imageSize }) },
        }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok || json.error) return { error: json.error?.message ?? `HTTP ${r.status}` };
      const msg = json.choices?.[0]?.message ?? {};
      return {
        images: (msg.images ?? []).map(im => /^data:([^;]+);base64,(.*)$/s.exec(im.image_url?.url ?? '')).filter(Boolean).map(m => ({ mimeType: m[1], data: m[2] })),
        text: typeof msg.content === 'string' ? msg.content : '',
        blocked: json.choices?.[0]?.finish_reason !== 'stop' ? json.choices?.[0]?.finish_reason : undefined,
      };
    },
  },
  gemini: {
    label: 'Gemini API', key: () => keyOf('GEMINI_API_KEY'), defaultModel: 'gemini-3-pro-image',
    async models(key) {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } });
      if (!r.ok) throw new Error(`Listing models failed: ${r.status} ${(await r.text()).slice(0, 300)}`);
      return ((await r.json()).models ?? [])
        .filter(m => /image/i.test(m.name) && /gemini/i.test(m.name) && (m.supportedGenerationMethods ?? []).includes('generateContent'))
        .map(m => ({ id: m.name.replace(/^models\//, ''), label: m.displayName ?? m.name }));
    },
    async textModels(key) {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } });
      if (!r.ok) throw new Error(`Listing models failed: ${r.status}`);
      return ((await r.json()).models ?? []).map(m => m.name.replace(/^models\//, '')).filter(id => /^gemini-3(\.\d+)?-pro(-preview)?$/.test(id));
    },
    async describe(key, { model, instruction, image }) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: instruction }, ...(image ? [{ inlineData: { mimeType: image.mime, data: image.data } }] : [])] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error?.message ?? `HTTP ${r.status}`);
      return (json.candidates?.[0]?.content?.parts ?? []).map(p => p.text ?? '').join('');
    },
    async generate(key, { model, prompt, images, aspectRatio, imageSize }) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }, ...images.map(im => ({ inlineData: { mimeType: 'image/png', data: im.data } }))] }],
          generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { ...(aspectRatio && { aspectRatio }), ...(imageSize && { imageSize }) } },
        }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) return { error: json.error?.message ?? `HTTP ${r.status}` };
      const parts = json.candidates?.[0]?.content?.parts ?? [];
      return {
        images: parts.filter(p => p.inlineData?.data).map(p => p.inlineData),
        text: parts.filter(p => p.text).map(p => p.text).join('\n'),
        blocked: json.promptFeedback?.blockReason ?? (json.candidates?.[0]?.finishReason !== 'STOP' ? json.candidates?.[0]?.finishReason : undefined),
      };
    },
  },
};
const provider = () => Object.values(PROVIDERS).find(p => p.key()) ?? null;

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.webp': 'image/webp' };
const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  // A file's bytes go out as they are; only an API answer is turned into JSON. (A .json file was
  // stringified as a Buffer until 3 Nov 2026, so a prompt staged as .json reached the page as bytes.)
  res.end(type === 'application/json' && !Buffer.isBuffer(body) ? JSON.stringify(body) : body);
};
const readBody = req => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { reject(e); } });
  req.on('error', reject);
});

// The provider's image models, its default first: asked rather than hard-coded, since the family
// keeps growing (2, Lite) and the ids change on release.
const modelCache = new Map();
async function models(p) {
  if (!modelCache.has(p)) {
    const list = await p.models(p.key());
    modelCache.set(p, list.sort((a, b) => (b.id === p.defaultModel) - (a.id === p.defaultModel) || a.id.localeCompare(b.id)));
  }
  return modelCache.get(p);
}

// Reverse prompt: a Gemini 3 Pro text model looks at an image and writes a transform prompt for its
// look, in the JSON form the lab's pasted prompts use. Shape is left out on purpose and the cube rules
// written in, since what the model is shown is never what the prompt will be applied to.
const REVERSE_INSTRUCTION = `You write image-transformation prompts for Nano Banana Pro (Gemini 3 Pro Image).

Look at the attached reference image. Describe only the LOOK of its main object: material, colour, surface, wear, internals if it is clear, lighting, background and rendering. The prompt will be applied to a different object, so never describe the reference's shape, subject, pose, parts or what it depicts.

The object it will be applied to is a pixel icon rendered as separate cubes, one cube per pixel. Write the prompt for that:
- "task" starts "Transform the attached image into" and names the material.
- "preserve" keeps the original shape, proportions, silhouette, and the number and layout of the cubes exactly.
- "structure" keeps separate cubes, one per pixel, with nothing added: no base, plate, frame, backing, ring or loop; "silhouette" is "the exact pixel layout of the input, cube for cube".
- "color_palette" holds named hex colours sampled from the reference.
- "negative_prompt" includes no base or plate, no reshaped or merged cubes, no text, no logos, no added objects.

Reply with one JSON object only, these keys in this order, each value specific to the reference:
task, preserve, material {type, color, color_behavior, description, physical_feel, density}, structure {form, volume, edges, silhouette}, surface {finish, texture[], behavior}, color_palette {name: hex}, optical_behavior {reflectivity, diffusion, specularity, transparency, contrast}, internal_structure {visibility, composition}, micro_detail {grain, imperfections[], patterns}, lighting {style, behavior, contrast}, rendering {camera_angle, quality, focus}, background, composition, negative_prompt[].`;

const textModelCache = new Map();
async function textModel(p) {
  if (!textModelCache.has(p)) {
    const ids = await p.textModels(p.key());
    // The released model before a preview, the newest version first.
    ids.sort((a, b) => (a.endsWith('-preview') - b.endsWith('-preview')) || b.localeCompare(a, undefined, { numeric: true }));
    if (!ids.length) throw new Error(`${p.label} lists no Gemini 3 Pro text model.`);
    textModelCache.set(p, ids[0]);
  }
  return textModelCache.get(p);
}

async function reverse(req) {
  const p = provider();
  if (!p) return [400, { error: 'No key: set OPENROUTER_API_KEY or GEMINI_API_KEY, then restart the server.' }];
  const { image, name = 'reference' } = await readBody(req);
  if (!image?.data) return [400, { error: 'No image.' }];
  const model = await textModel(p);
  const raw = await p.describe(p.key(), { model, instruction: REVERSE_INSTRUCTION, image });
  // Pretty-printed when it parses; kept as it came when it does not, so nothing is lost.
  const found = /\{[\s\S]*\}/.exec(raw)?.[0] ?? raw;
  let prompt = found;
  try { prompt = JSON.stringify(JSON.parse(found), null, 2); } catch { /* not JSON: keep the text */ }
  const id = new Date().toISOString().replace(/[:.]/g, '-') + '-reverse-' + name.replace(/\.[a-z]+$/i, '').replace(/[^a-z0-9]+/gi, '-').slice(0, 40);
  const dir = path.join(OUT, id);
  fs.mkdirSync(dir, { recursive: true });
  const ext = image.mime === 'image/png' ? 'png' : 'jpg';
  fs.writeFileSync(path.join(dir, `reference.${ext}`), Buffer.from(image.data, 'base64'));
  fs.writeFileSync(path.join(dir, 'prompt.json'), prompt + '\n');
  const meta = { id, kind: 'reverse', created: new Date().toISOString(), provider: p.label, model, name, prompt, inputs: [`generations/${id}/reference.${ext}`], outputs: [], errors: [] };
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
  return [200, meta];
}

// Copy for the Type tab, written on request. The facts are the site's and the product's own, so the
// model words them and does not invent features; the voice rules are BRAND.md's, section 12.
const COPY = path.join(here, 'copy.json');
const readCopy = () => { try { return JSON.parse(fs.readFileSync(COPY, 'utf8')); } catch { return []; } };
// New pieces go first, so the newest is at the top of the list.
const addCopy = item => { fs.writeFileSync(COPY, JSON.stringify([item, ...readCopy().filter(c => c.id !== item.id)], null, 2) + '\n'); return item; };
const WRITE_INSTRUCTION = `You write short display copy for Indx, a search engine, to be set as typography on posters and posts.

What Indx does (use only these facts, never invent a feature, number or customer):
search as you type; pattern recognition that matches on character patterns (trigrams), so typos, split words (water proof finds waterproof) and partial words still find; relevance ranking (BM25F); facets; filters; nested JSON; every language, with no per-language stemming; synonyms; boost rules, scheduled for campaigns, and personal boosting per user; real-time inserts, updates and deletes; reindexing with no downtime; vector and hybrid search; Ask, which answers questions from your own content; an MCP server for AI agents; search statistics: what people search for, what they choose, what finds nothing; Observe (Observr), which watches that, proposes a synonym or a boost, and asks the owner yes or no before anything changes; self-hosted, GDPR friendly; a native C# engine as a NuGet package or a server over HTTP; team-scoped API keys; a terminal monitor; a web console.

Voice: short sentences, plain words, a technical product that does not take itself too seriously. No em dashes, en dashes or spaced hyphens. Nothing that sounds written by AI: no "not X, but Y", no rhetorical questions, no exclamation marks, no buzzwords like seamless, powerful, unlock, elevate, revolutionize. Fragments are fine ("Facets. Filters. Synonyms."). Vary sentence length.

Reply with one JSON object: {"headline": a line of at most 60 characters, "query": one to three words from the text that the piece should light up (a typo in one of them is welcome now and then), "text": 70 to 130 words of copy, sentences only, no line breaks, no lists}.`;
async function write(req) {
  const p = provider();
  if (!p) return [400, { error: 'No key: set OPENROUTER_API_KEY or GEMINI_API_KEY, then restart the server.' }];
  const { brief = '' } = await readBody(req);
  const model = await textModel(p);
  const raw = await p.describe(p.key(), { model, instruction: WRITE_INSTRUCTION + (brief.trim() ? `\n\nThe brief for this piece: ${brief.trim()}` : '\n\nPick an angle of your own.') });
  let piece;
  try { piece = JSON.parse(/\{[\s\S]*\}/.exec(raw)?.[0] ?? raw); } catch { return [502, { error: 'The model did not answer in JSON.', raw }]; }
  // The voice rule the model breaks most: dashes as punctuation, mended rather than refused.
  const mend = t => String(t ?? '').replace(/\s*[–—]\s*/g, '. ').replace(/\s+-\s+/g, '. ').replace(/\s+/g, ' ').trim();
  const id = new Date().toISOString().replace(/[:.]/g, '-');
  const headline = mend(piece.headline);
  return [200, addCopy({ id, label: headline, source: 'written', created: new Date().toISOString(), model, brief, headline, query: mend(piece.query), text: mend(piece.text) })];
}
// Your own piece, from the Type tab's fields: saved as new, or over an existing piece of your own.
async function saveCopy(req) {
  const { id, headline = '', query = '', text = '' } = await readBody(req);
  if (!text.trim()) return [400, { error: 'No text.' }];
  const old = id && readCopy().find(c => c.id === id && c.source === 'own');
  const item = { id: old ? id : new Date().toISOString().replace(/[:.]/g, '-'), label: headline.trim() || text.trim().slice(0, 40), source: 'own', created: old?.created ?? new Date().toISOString(), headline: headline.trim(), query: query.trim(), text: text.trim() };
  return [200, addCopy(item)];
}
function deleteCopy(id) {
  const list = readCopy(), next = list.filter(c => c.id !== id);
  if (next.length === list.length) return [404, { error: 'No such piece.' }];
  fs.writeFileSync(COPY, JSON.stringify(next, null, 2) + '\n');
  return [200, { ok: true }];
}

function listPrompts() {
  if (!fs.existsSync(PROMPTS)) return [];
  return fs.readdirSync(PROMPTS).filter(f => f.endsWith('.json'))
    .map(f => JSON.parse(fs.readFileSync(path.join(PROMPTS, f), 'utf8')))
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function savePrompt(req) {
  const { name, prompt, settings = {}, note = '', from } = await readBody(req);
  if (!name?.trim() || !prompt?.trim()) return [400, { error: 'A saved prompt needs a name and a prompt.' }];
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  fs.mkdirSync(PROMPTS, { recursive: true });
  const entry = { name: name.trim(), slug, saved: new Date().toISOString(), note, settings, from, prompt };
  fs.writeFileSync(path.join(PROMPTS, `${slug}.json`), JSON.stringify(entry, null, 2) + '\n');
  return [200, entry];
}

function listGenerations() {
  if (!fs.existsSync(OUT)) return [];
  return fs.readdirSync(OUT).filter(d => fs.existsSync(path.join(OUT, d, 'meta.json')))
    .map(d => JSON.parse(fs.readFileSync(path.join(OUT, d, 'meta.json'), 'utf8')))
    .sort((a, b) => b.created.localeCompare(a.created));
}

async function generate(req) {
  const p = provider();
  if (!p) return [400, { error: 'No key: set OPENROUTER_API_KEY or GEMINI_API_KEY, or put one as KEY=... in lab/.env.local, then restart the server.' }];
  const { prompt, images = [], model = p.defaultModel, aspectRatio, imageSize, count = 1, settings = {} } = await readBody(req);
  if (!prompt) return [400, { error: 'No prompt.' }];
  const id = new Date().toISOString().replace(/[:.]/g, '-') + '-' + (settings.icon ?? 'voxl').replace(/[^a-z0-9]+/gi, '-');
  const dir = path.join(OUT, id);
  fs.mkdirSync(dir, { recursive: true });
  const inputs = images.map((im, i) => {
    const file = `input-${i + 1}-${im.name}.png`;
    fs.writeFileSync(path.join(dir, file), Buffer.from(im.data, 'base64'));
    return file;
  });
  // One request per image wanted, side by side: each call returns one image.
  const runs = await Promise.all(Array.from({ length: Math.min(4, Math.max(1, count)) }, () =>
    p.generate(p.key(), { model, prompt, images, aspectRatio, imageSize }).catch(e => ({ error: e.message }))));
  const outputs = [];
  for (const run of runs) for (const im of run.images ?? []) {
    const ext = im.mimeType === 'image/jpeg' ? 'jpg' : im.mimeType === 'image/webp' ? 'webp' : 'png';
    const file = `output-${outputs.length + 1}.${ext}`;
    fs.writeFileSync(path.join(dir, file), Buffer.from(im.data, 'base64'));
    outputs.push(file);
  }
  const errors = runs.map(r => r.error ?? (r.images?.length ? null : r.blocked ? `No image: ${r.blocked}` : 'No image returned')).filter(Boolean);
  const meta = {
    id, created: new Date().toISOString(), provider: p.label, model, aspectRatio, imageSize, prompt, settings,
    inputs: inputs.map(f => `generations/${id}/${f}`), outputs: outputs.map(f => `generations/${id}/${f}`),
    text: runs.map(r => r.text).filter(Boolean).join('\n'), errors,
  };
  fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2));
  fs.writeFileSync(path.join(dir, 'prompt.txt'), prompt + '\n');
  return [outputs.length ? 200 : 502, meta];
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    if (url.pathname === '/api/health') {
      const p = provider();
      let list = [], error;
      if (p) { try { list = await models(p); } catch (e) { error = e.message; } }
      return send(res, 200, { ok: true, hasKey: !!p, provider: p?.label, models: list, defaultModel: p?.defaultModel, error });
    }
    if (url.pathname === '/api/generations' && req.method === 'GET') return send(res, 200, listGenerations());
    if (url.pathname === '/api/prompts' && req.method === 'GET') return send(res, 200, listPrompts());
    if (url.pathname === '/api/prompts' && req.method === 'POST') { const [status, body] = await savePrompt(req); return send(res, status, body); }
    if (url.pathname === '/api/generate' && req.method === 'POST') { const [status, body] = await generate(req); return send(res, status, body); }
    if (url.pathname === '/api/copy' && req.method === 'GET') return send(res, 200, readCopy());
    if (url.pathname === '/api/copy' && req.method === 'POST') { const [status, body] = await saveCopy(req); return send(res, status, body); }
    if (url.pathname === '/api/copy' && req.method === 'DELETE') { const [status, body] = deleteCopy(url.searchParams.get('id')); return send(res, status, body); }
    if (url.pathname === '/api/write' && req.method === 'POST') { const [status, body] = await write(req); return send(res, status, body); }
    if (url.pathname === '/api/reverse' && req.method === 'POST') { const [status, body] = await reverse(req); return send(res, status, body); }
    // Static files from lab/, never above it.
    const file = path.normalize(path.join(here, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)));
    if (!file.startsWith(here + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, 'Not found', 'text/plain');
    return send(res, 200, fs.readFileSync(file), TYPES[path.extname(file)] ?? 'application/octet-stream');
  } catch (e) {
    console.error(e);
    return send(res, 500, { error: e.message });
  }
}).listen(PORT, '127.0.0.1', () => {
  const p = provider();
  console.log(`Pixl Lab on http://127.0.0.1:${PORT}/  ${p ? `(generating through ${p.label})` : '(no key: generation is off)'}`);
});
