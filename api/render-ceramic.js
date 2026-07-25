const OPENAI_IMAGES_ENDPOINT = 'https://api.openai.com/v1/images/edits';
const MAX_IMAGE_BYTES = 3.25 * 1024 * 1024;
const OPENAI_TIMEOUT_MS = 270000;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DEFAULT_IMAGE_MODELS = ['gpt-image-2', 'gpt-image-1.5', 'gpt-image-1'];

const allowedValues = {
  surface: new Set(['wall', 'floor']),
  material: new Set(['calacatta', 'travertine', 'sage', 'ocean', 'graphite', 'terracotta', 'mustard', 'custom']),
  tileSize: new Set(['5x5', '10x10', '10x20', '20x20', '30x60', '60x60', '60x120', '80x80', '120x120', 'custom']),
  pattern: new Set(['straight', 'horizontal', 'vertical', 'staggered', 'herringbone', 'diagonal']),
  finish: new Set(['matte', 'glossy']),
  groutColor: new Set(['warm-white', 'light-gray', 'medium-gray', 'anthracite', 'beige', 'custom'])
};

const materialDescriptions = {
  calacatta: 'Calacatta-style white marble-look porcelain with elegant, sparse soft gray veining',
  travertine: 'warm natural travertine-look ceramic with subtle linear beige texture',
  sage: 'muted sage green ceramic with refined tonal variation',
  ocean: 'deep ocean blue-green ceramic with subtle natural tonal variation',
  graphite: 'architectural graphite dark gray ceramic with refined mineral texture',
  terracotta: 'warm terracotta ceramic with sophisticated earthy clay character',
  mustard: 'rich mustard yellow ceramic with tasteful handcrafted tonal variation'
};

const patternDescriptions = {
  straight: 'straight aligned grid installation',
  horizontal: 'horizontal orientation with the long tile edges running left to right',
  vertical: 'vertical orientation with the long tile edges running upward',
  staggered: 'staggered running-bond installation with balanced half-tile offsets',
  herringbone: 'precise herringbone installation',
  diagonal: 'clean 45-degree diagonal installation'
};

const groutDescriptions = {
  'warm-white': 'warm off-white',
  'light-gray': 'light gray',
  'medium-gray': 'medium gray',
  anthracite: 'anthracite',
  beige: 'warm beige'
};

function jsonResponse(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, max-age=0',
      ...headers
    }
  });
}

function cleanText(value, maxLength = 80) {
  return String(value || '').trim().slice(0, maxLength);
}

function cleanEnum(formData, key, fallback) {
  const value = cleanText(formData.get(key), 40);
  return allowedValues[key]?.has(value) ? value : fallback;
}

function cleanNumber(value, min, max, fallback) {
  const parsed = Number.parseFloat(String(value || '').replace(',', '.'));
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function cleanHex(value, fallback) {
  const hex = cleanText(value, 9);
  return /^#[0-9a-f]{6}$/i.test(hex) ? hex.toUpperCase() : fallback;
}

function tileSizeDescription(options) {
  if (options.tileSize === 'custom') {
    const width = cleanNumber(options.customTileWidth, 2, 300, 40);
    const height = cleanNumber(options.customTileHeight, 2, 300, 80);
    return `${width} by ${height} centimeters`;
  }
  return `${options.tileSize.replace('x', ' by ')} centimeters`;
}

function buildPrompt(options) {
  const surfaceName = options.surface === 'floor' ? 'floor' : 'wall';
  const untouchedSurface = options.surface === 'floor' ? 'walls' : 'floor';
  const material = options.material === 'custom'
    ? `premium ceramic in the exact color ${options.customTileColor}, with subtle realistic ceramic tonal variation`
    : materialDescriptions[options.material];
  const grout = options.groutColor === 'custom'
    ? `the exact custom grout color ${options.customGroutColor}`
    : groutDescriptions[options.groutColor];
  const finish = options.finish === 'glossy'
    ? 'glossy glazed finish with physically accurate restrained reflections'
    : 'matte finish with soft physically accurate light response';

  return [
    'Create a photorealistic architectural interior renovation edit of the provided photograph.',
    `Edit ONLY the main, clearly visible ${surfaceName} surface suitable for tiling. Do not tile any other surface. Keep all ${untouchedSurface} completely unchanged.`,
    `Apply ${material}. Use realistic ${tileSizeDescription(options)} tile proportions in a ${patternDescriptions[options.pattern]}.`,
    `Use ${grout}, ${options.groutWidth} millimeters wide, and a ${finish}.`,
    'ABSOLUTE PRESERVATION RULE: keep the exact original camera viewpoint, lens perspective, room geometry, wall openings, floor boundaries, ceiling, cabinets, counters, doors, windows, sink, shower, bathtub, toilet, faucets, mirrors, appliances, furniture, fixtures, trims, accessories and people unchanged.',
    'Do not add, remove, move, resize, restyle or replace any object. Do not redesign the room. Do not alter paint or materials outside the selected target surface.',
    'Preserve original lighting direction, exposure, shadows, reflections, occlusion and object edges. Tiles must stop precisely at architectural boundaries and behind existing objects, with correct perspective and realistic scale.',
    'No text, logos, labels, watermarks, borders, collage or before-and-after layout. Return one edited photograph only.'
  ].join(' ');
}

function getModelCandidates() {
  const configured = cleanText(process.env.OPENAI_IMAGE_MODEL, 180)
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set([...configured, ...DEFAULT_IMAGE_MODELS])];
}

function errorText(data) {
  return `${data?.error?.message || data?.message || ''} ${data?.error?.type || ''} ${data?.error?.code || ''}`.trim().toLowerCase();
}

function isOrganizationVerificationError(status, data) {
  const text = errorText(data);
  return status === 403 && /(organization|organisation|org).*(verif|verified)|verify.*(organization|organisation|org)/i.test(text);
}

function isKeyPermissionError(status, data) {
  const text = errorText(data);
  return status === 403 && /(api key|key).*(permission|scope)|permission.*(images|endpoint)|not permitted.*endpoint|insufficient.*permission/i.test(text);
}

function isModelAccessError(status, data) {
  const text = errorText(data);
  return [400, 403, 404].includes(status) && /(model.*(not found|does not exist|not available|unavailable|access|permission|allowed|supported)|do not have access.*model|not authorized.*model|unsupported.*model)/i.test(text);
}

function mapOpenAIError(status, data, attemptedModels = []) {
  const text = errorText(data);

  if (isOrganizationVerificationError(status, data)) {
    return {
      status: 503,
      code: 'ORG_VERIFICATION_REQUIRED',
      message: 'OpenAI kuruluş doğrulaması tamamlanmadan görüntü modeli kullanılamıyor.'
    };
  }
  if (status === 401) {
    return { status: 503, code: 'INVALID_API_KEY', message: 'OpenAI API anahtarı geçersiz veya devre dışı.' };
  }
  if (isKeyPermissionError(status, data)) {
    return { status: 503, code: 'KEY_PERMISSION_DENIED', message: 'OpenAI API anahtarının Images uç noktasına yazma izni bulunmuyor.' };
  }
  if (status === 429 && /(quota|billing|credit|balance|spend|limit reached)/i.test(text)) {
    return { status: 402, code: 'OPENAI_BILLING', message: 'OpenAI kredi, bakiye veya harcama limiti nedeniyle işlem tamamlanamadı.' };
  }
  if (status === 429) return { status: 429, code: 'RATE_LIMIT', message: 'OpenAI istek limiti aşıldı.' };
  if (status === 400 && /(content|safety|moderation|policy)/i.test(text)) {
    return { status: 400, code: 'CONTENT_REJECTED', message: 'Fotoğraf güvenlik kontrolleri nedeniyle işlenemedi.' };
  }
  if (isModelAccessError(status, data)) {
    return {
      status: 503,
      code: 'MODEL_UNAVAILABLE',
      message: 'Bu OpenAI projesinde kullanılabilir bir GPT Image modeli bulunamadı.',
      attemptedModels
    };
  }
  if (status >= 500) return { status: 502, code: 'OPENAI_UPSTREAM_ERROR', message: 'OpenAI görüntü servisi geçici bir hata döndürdü.' };
  return { status: 400, code: 'OPENAI_ERROR', message: data?.error?.message || 'OpenAI görüntü düzenleme isteği tamamlanamadı.' };
}

function buildOpenAIForm(image, prompt, model, options = {}) {
  const upstreamForm = new FormData();
  upstreamForm.append('model', model);
  upstreamForm.append('image[]', image, image.name || 'mekan.jpg');
  upstreamForm.append('prompt', prompt);
  upstreamForm.append('quality', 'medium');
  upstreamForm.append('size', 'auto');
  upstreamForm.append('output_format', 'jpeg');
  upstreamForm.append('background', 'opaque');

  // gpt-image-2 always uses high input fidelity and rejects this parameter.
  if (model !== 'gpt-image-2' && !options.omitInputFidelity) {
    upstreamForm.append('input_fidelity', 'high');
  }
  if (!options.omitCompression) {
    upstreamForm.append('output_compression', '82');
  }
  return upstreamForm;
}

async function callOpenAI(image, prompt, apiKey, model, signal, options = {}) {
  return fetch(OPENAI_IMAGES_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json'
    },
    body: buildOpenAIForm(image, prompt, model, options),
    signal
  });
}

function unsupportedParameterName(data) {
  const message = String(data?.error?.message || '');
  const match = message.match(/(?:unknown|unsupported|unrecognized)\s+(?:parameter|field)[:\s]+["']?([a-z_]+)/i);
  return match?.[1]?.toLowerCase() || '';
}

async function callModelWithCompatibilityRetry(image, prompt, apiKey, model, signal) {
  let options = {};
  let upstream = await callOpenAI(image, prompt, apiKey, model, signal, options);
  let data = await upstream.json().catch(() => ({}));

  if (!upstream.ok && upstream.status === 400) {
    const unsupported = unsupportedParameterName(data);
    if (unsupported === 'output_compression') options = { ...options, omitCompression: true };
    if (unsupported === 'input_fidelity') options = { ...options, omitInputFidelity: true };

    if (unsupported === 'output_compression' || unsupported === 'input_fidelity') {
      upstream = await callOpenAI(image, prompt, apiKey, model, signal, options);
      data = await upstream.json().catch(() => ({}));
    }
  }

  return { upstream, data };
}

async function handleRequest(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { Allow: 'POST, OPTIONS' } });
  }
  if (request.method !== 'POST') {
    return jsonResponse({ code: 'METHOD_NOT_ALLOWED', message: 'Yalnızca POST isteği desteklenir.' }, 405, { Allow: 'POST' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return jsonResponse({ code: 'MISSING_API_KEY', message: 'OPENAI_API_KEY ortam değişkeni bulunamadı.' }, 503);

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > 4.35 * 1024 * 1024) {
    return jsonResponse({ code: 'PAYLOAD_TOO_LARGE', message: 'İstek Vercel yükleme sınırını aşıyor.' }, 413);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (_) {
    return jsonResponse({ code: 'INVALID_FORM', message: 'Fotoğraf yükleme verisi okunamadı.' }, 400);
  }

  const image = formData.get('image');
  if (!(image instanceof File) || image.size === 0) {
    return jsonResponse({ code: 'IMAGE_REQUIRED', message: 'Bir mekân fotoğrafı yüklenmelidir.' }, 400);
  }
  if (!ALLOWED_IMAGE_TYPES.has(image.type)) {
    return jsonResponse({ code: 'UNSUPPORTED_FILE', message: 'Yalnızca JPG, PNG ve WebP fotoğraflar desteklenir.' }, 415);
  }
  if (image.size > MAX_IMAGE_BYTES) {
    return jsonResponse({ code: 'PAYLOAD_TOO_LARGE', message: 'Fotoğraf güvenli işleme boyutunu aşıyor.' }, 413);
  }

  const options = {
    surface: cleanEnum(formData, 'surface', 'wall'),
    material: cleanEnum(formData, 'material', 'calacatta'),
    tileSize: cleanEnum(formData, 'tileSize', '60x60'),
    pattern: cleanEnum(formData, 'pattern', 'straight'),
    finish: cleanEnum(formData, 'finish', 'matte'),
    groutColor: cleanEnum(formData, 'groutColor', 'warm-white'),
    customTileColor: cleanHex(formData.get('customTileColor'), '#4D8D82'),
    customGroutColor: cleanHex(formData.get('customGroutColor'), '#D5D1C6'),
    customTileWidth: cleanNumber(formData.get('customTileWidth'), 2, 300, 40),
    customTileHeight: cleanNumber(formData.get('customTileHeight'), 2, 300, 80),
    groutWidth: cleanNumber(formData.get('groutWidth'), 1, 12, 3)
  };

  const prompt = buildPrompt(options);
  const modelCandidates = getModelCandidates();
  const attemptedModels = [];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    let lastFailure = null;

    for (const model of modelCandidates) {
      attemptedModels.push(model);
      const { upstream, data } = await callModelWithCompatibilityRetry(image, prompt, apiKey, model, controller.signal);
      const requestId = upstream.headers.get('x-request-id') || '';

      if (!upstream.ok) {
        lastFailure = { upstream, data, requestId };
        if (isOrganizationVerificationError(upstream.status, data) || isKeyPermissionError(upstream.status, data) || upstream.status === 401) break;
        if (isModelAccessError(upstream.status, data)) continue;

        const mapped = mapOpenAIError(upstream.status, data, attemptedModels);
        console.error('OpenAI image edit failed:', { status: upstream.status, code: mapped.code, requestId, model });
        return jsonResponse({ code: mapped.code, message: mapped.message }, mapped.status, {
          'X-OpenAI-Request-Id': requestId
        });
      }

      const imageBase64 = data?.data?.[0]?.b64_json;
      if (!imageBase64) {
        console.error('OpenAI image edit returned no image:', { requestId, model });
        return jsonResponse({ code: 'EMPTY_IMAGE_RESPONSE', message: 'OpenAI geçerli bir görüntü döndürmedi.' }, 502);
      }
      if (imageBase64.length > 4.1 * 1024 * 1024) {
        return jsonResponse({ code: 'OUTPUT_TOO_LARGE', message: 'Oluşturulan görüntü Vercel yanıt sınırını aşıyor.' }, 502);
      }

      return jsonResponse({
        imageBase64,
        mimeType: 'image/jpeg',
        model,
        requestId: requestId || undefined
      }, 200, {
        'X-OpenAI-Request-Id': requestId
      });
    }

    const mapped = mapOpenAIError(lastFailure?.upstream?.status || 503, lastFailure?.data || {}, attemptedModels);
    console.error('No usable OpenAI image model:', {
      code: mapped.code,
      requestId: lastFailure?.requestId || '',
      attemptedModels
    });
    return jsonResponse({ code: mapped.code, message: mapped.message, attemptedModels }, mapped.status, {
      'X-OpenAI-Request-Id': lastFailure?.requestId || ''
    });
  } catch (error) {
    if (error?.name === 'AbortError') return jsonResponse({ code: 'TIMEOUT', message: 'OpenAI görüntü işlemi zaman aşımına uğradı.' }, 504);
    console.error('render-ceramic function error:', error);
    return jsonResponse({ code: 'UPSTREAM_UNAVAILABLE', message: 'Görüntü servisine şu anda ulaşılamıyor.' }, 502);
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  fetch: handleRequest
};
