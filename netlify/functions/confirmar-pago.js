/**
 * confirmar-pago.js — Netlify Function (webhook de Flow)
 * Flow llama a este endpoint para notificar el resultado del pago.
 * En producción: registrar en base de datos o enviar email de confirmación.
 *
 * POST /.netlify/functions/confirmar-pago
 * Body (urlencoded): { token: string }
 */

const crypto = require('crypto');

const HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

function firmarParams(params, secretKey) {
  const sortedKeys = Object.keys(params).sort();
  const cadena     = sortedKeys.map(k => `${k}${params[k]}`).join('');
  return crypto.createHmac('sha256', secretKey).update(cadena).digest('hex');
}

exports.handler = async (event) => {

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: HEADERS, body: JSON.stringify({ error: 'Método no permitido' }) };
  }

  try {
    const API_KEY    = process.env.FLOW_API_KEY;
    const SECRET_KEY = process.env.FLOW_SECRET_KEY;
    const BASE_URL   = process.env.FLOW_BASE_URL || 'https://sandbox.flow.cl/api';

    // Flow envía el token como form-urlencoded
    const body  = new URLSearchParams(event.body);
    const token = body.get('token');

    if (!token) throw new Error('Token no recibido.');

    // Consultar el estado del pago a Flow
    const params = { apiKey: API_KEY, token };
    params.s = firmarParams(params, SECRET_KEY);

    const respFlow = await fetch(
      `${BASE_URL}/payment/getStatus?${new URLSearchParams(params).toString()}`
    );
    const pago = await respFlow.json();

    // pago.status: 1=pendiente, 2=pagado, 3=rechazado, 4=anulado
    if (pago.status === 2) {
      // TODO producción: guardar en DB, enviar email de confirmación al cliente
      console.log(`[Flow] Pago confirmado — Orden: ${pago.commerceOrder}, Monto: $${pago.amount}`);
    } else {
      console.warn(`[Flow] Pago NO completado — Status: ${pago.status}, Orden: ${pago.commerceOrder}`);
    }

    // Flow requiere un 200 para no reintentar el webhook
    return {
      statusCode: 200,
      headers:    HEADERS,
      body:       JSON.stringify({ received: true, status: pago.status }),
    };

  } catch (err) {
    console.error('[confirmar-pago] Error:', err.message);
    return {
      statusCode: 500,
      headers:    HEADERS,
      body:       JSON.stringify({ error: err.message }),
    };
  }
};
