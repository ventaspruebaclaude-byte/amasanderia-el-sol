/**
 * crear-pago.js — Netlify Function
 * Firma el payload con HMAC-SHA256 y crea la orden en Flow.cl.
 * Las llaves NUNCA salen de las variables de entorno de Netlify.
 *
 * POST /.netlify/functions/crear-pago
 * Body: { items: CarritoItem[], email: string, ordenId: string }
 */

const crypto = require('crypto');

// ── CORS helper ───────────────────────────────────────────────────────────────
const HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

// ── Firma HMAC-SHA256 según especificación Flow.cl ────────────────────────────
function firmarParams(params, secretKey) {
  const sortedKeys = Object.keys(params).sort();
  const cadena     = sortedKeys.map(k => `${k}${params[k]}`).join('');
  return crypto.createHmac('sha256', secretKey).update(cadena).digest('hex');
}

// ── Handler principal ─────────────────────────────────────────────────────────
exports.handler = async (event) => {

  // Preflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: HEADERS, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const { items, email, ordenId } = JSON.parse(event.body);

    // ── Validaciones básicas ──────────────────────────────────────────────────
    if (!items?.length)  throw new Error('El carrito está vacío.');
    if (!email?.includes('@')) throw new Error('Email requerido para el pago.');
    if (!ordenId)        throw new Error('ID de orden inválido.');

    // ── Variables de entorno (configuradas en Netlify UI, nunca en el código) ─
    const API_KEY    = process.env.FLOW_API_KEY;
    const SECRET_KEY = process.env.FLOW_SECRET_KEY;
    const BASE_URL   = process.env.FLOW_BASE_URL   || 'https://sandbox.flow.cl/api';
    const SITE_URL   = process.env.SITE_URL         || 'https://amasanderia-el-sol.netlify.app';

    if (!API_KEY || !SECRET_KEY) {
      throw new Error('Llaves de Flow no configuradas en el servidor.');
    }

    // ── Calcular total desde los ítems ────────────────────────────────────────
    const total = items.reduce((acc, i) => acc + (Number(i.precio) * Number(i.cantidad)), 0);

    // ── Construir payload para Flow ───────────────────────────────────────────
    const params = {
      apiKey:          API_KEY,
      commerceOrder:   String(ordenId),
      subject:         'Pedido Amasandería El Sol',
      currency:        'CLP',
      amount:          String(Math.round(total)),
      email:           email.trim().toLowerCase(),
      urlConfirmation: `${SITE_URL}/.netlify/functions/confirmar-pago`,
      urlReturn:       `${SITE_URL}/gracias.html`,
      paymentMethod:   '9',   // 9 = todos los medios (Webpay, débito, etc.)
    };

    // ── Firmar ────────────────────────────────────────────────────────────────
    params.s = firmarParams(params, SECRET_KEY);

    // ── Llamar a Flow API ─────────────────────────────────────────────────────
    const respFlow = await fetch(`${BASE_URL}/payment/create`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    new URLSearchParams(params).toString(),
    });

    const data = await respFlow.json();

    // Flow retorna { token, url } si todo OK; { code, message } si hay error
    if (!data.url || !data.token) {
      throw new Error(data.message || 'Flow no retornó URL de pago.');
    }

    return {
      statusCode: 200,
      headers:    HEADERS,
      body:       JSON.stringify({
        redirectUrl: `${data.url}?token=${data.token}`,
        token:       data.token,
      }),
    };

  } catch (err) {
    return {
      statusCode: 400,
      headers:    HEADERS,
      body:       JSON.stringify({ error: err.message }),
    };
  }
};
