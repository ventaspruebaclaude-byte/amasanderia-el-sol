/**
 * app.js — Punto de entrada principal.
 * Orquesta catálogo, carrito (localStorage) y sidebar.
 */

const CONFIG = Object.freeze({
  WHATSAPP_NUMERO:  '56912345678',   // ← reemplazar con número real del cliente
  WHATSAPP_MENSAJE: 'Hola, quiero hacer el siguiente pedido en Amasandería El Sol:',
  DEBUG: false,
});

// ── Estado ────────────────────────────────────────────────────────────────────
let todosLosProductos = [];
let categoriaActiva   = 'Todos';
let queryBusqueda     = '';

// ── DOM ───────────────────────────────────────────────────────────────────────
const grid              = document.getElementById('productoGrid');
const sinResultados     = document.getElementById('sinResultados');
const buscadorInput     = document.getElementById('buscadorInput');
const filtrosDiv        = document.getElementById('filtrosCategoria');
const whatsappContacto  = document.getElementById('whatsappContacto');
const footerYear        = document.getElementById('footerYear');

// Carrito
const carritoPanel      = document.getElementById('carritoPanel');
const carritoOverlay    = document.getElementById('carritoOverlay');
const carritoContador   = document.getElementById('carritoContador');
const carritoItemsEl    = document.getElementById('carritoItems');
const carritoVacioEl    = document.getElementById('carritoVacio');
const carritoTotalEl    = document.getElementById('carritoTotal');
const btnAbrirCarrito   = document.getElementById('btnAbrirCarrito');
const btnCerrarCarrito  = document.getElementById('btnCerrarCarrito');
const btnVaciar         = document.getElementById('btnVaciarCarrito');
const btnWhatsapp       = document.getElementById('btnFinalizarWhatsapp');
const btnFlow           = document.getElementById('btnPagarFlow');
const clienteEmailInput = document.getElementById('clienteEmail');
const emailError        = document.getElementById('emailError');

// ── Init ──────────────────────────────────────────────────────────────────────
function init() {
  footerYear.textContent = new Date().getFullYear();
  whatsappContacto.href  = `https://wa.me/${CONFIG.WHATSAPP_NUMERO}?text=${encodeURIComponent('Hola, quiero hacer un pedido.')}`;

  todosLosProductos = ProductoDAO.getAll();

  renderFiltros();
  renderGrid();
  renderCarrito(CarritoDAO.getAll());
  bindEventos();

  if (CONFIG.DEBUG) console.log('[app] Productos cargados:', todosLosProductos.length);
}

// ── Catálogo ──────────────────────────────────────────────────────────────────
function renderFiltros() {
  const categorias = ProductoDAO.getCategorias(todosLosProductos);
  filtrosDiv.innerHTML = categorias.map(cat => `
    <button data-cat="${cat}"
      class="cc-filtro px-3 py-1 rounded-full border text-xs font-medium transition-colors
        ${cat === categoriaActiva
          ? 'bg-amber-700 text-white border-amber-700'
          : 'border-stone-300 text-stone-600 hover:border-amber-500 hover:text-amber-700'}"
    >${cat}</button>
  `).join('');
}

function renderGrid() {
  const visibles = ProductoDAO.filtrar(todosLosProductos, {
    categoria: categoriaActiva,
    query:     queryBusqueda,
  });

  if (visibles.length === 0) {
    grid.innerHTML = '';
    sinResultados.classList.remove('cc-hidden');
    return;
  }

  sinResultados.classList.add('cc-hidden');
  grid.innerHTML = visibles.map(tarjetaHTML).join('');
}

function tarjetaHTML(producto) {
  const imgSrc = producto.imagen
    ? `assets/img/${producto.imagen}`
    : `https://placehold.co/300x200/fef3c7/92400e?text=${encodeURIComponent(producto.nombre)}`;

  return `
    <article class="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden
                    hover:shadow-md transition-shadow flex flex-col">
      <img src="${imgSrc}" alt="${producto.nombre}"
           class="w-full h-36 object-cover" loading="lazy"
           onerror="this.src='https://placehold.co/300x200/fef3c7/92400e?text=Sin+imagen'" />
      <div class="p-3 flex flex-col flex-1">
        <span class="text-xs text-amber-600 font-medium mb-1">${producto.categoria}</span>
        <h3 class="text-sm font-semibold text-stone-800 leading-tight mb-1">${producto.nombre}</h3>
        ${producto.descripcion
          ? `<p class="text-xs text-stone-500 mb-2 flex-1">${producto.descripcion}</p>`
          : '<div class="flex-1"></div>'}
        <div class="flex items-center justify-between mt-2">
          <span class="text-amber-700 font-bold text-sm">${producto.precioFormateado}</span>
          <button
            data-id="${producto.id}"
            class="cc-agregar bg-amber-700 hover:bg-amber-800 text-white text-xs px-3 py-1.5 rounded-lg transition-colors font-medium"
          >+ Agregar</button>
        </div>
      </div>
    </article>
  `;
}

// ── Carrito UI ────────────────────────────────────────────────────────────────
function renderCarrito(items) {
  const total    = CarritoDAO.totalPesos(items);
  const unidades = CarritoDAO.totalUnidades(items);

  // Badge contador
  if (unidades > 0) {
    carritoContador.textContent = unidades > 99 ? '99+' : unidades;
    carritoContador.classList.remove('cc-hidden');
  } else {
    carritoContador.classList.add('cc-hidden');
  }

  // Total
  carritoTotalEl.textContent = `$${total.toLocaleString('es-CL')}`;

  // Lista de ítems vs estado vacío
  if (items.length === 0) {
    carritoItemsEl.classList.add('cc-hidden');
    carritoVacioEl.classList.remove('cc-hidden');
    btnWhatsapp.disabled = true;
    btnWhatsapp.classList.add('opacity-50', 'cursor-not-allowed');
  } else {
    carritoItemsEl.classList.remove('cc-hidden');
    carritoVacioEl.classList.add('cc-hidden');
    btnWhatsapp.disabled = false;
    btnWhatsapp.classList.remove('opacity-50', 'cursor-not-allowed');

    carritoItemsEl.innerHTML = items.map(item => `
      <div class="flex items-center gap-3 bg-stone-50 rounded-xl p-3 border border-stone-100">
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-stone-800 truncate">${item.nombre}</p>
          <p class="text-xs text-stone-400">${item.precioFormateado} c/u</p>
        </div>
        <div class="flex items-center gap-2">
          <button data-accion="dec" data-id="${item.id}"
            class="cc-carrito-btn w-7 h-7 rounded-full border border-stone-300 text-stone-600
                   hover:border-red-400 hover:text-red-500 transition-colors text-sm font-bold
                   flex items-center justify-center">−</button>
          <span class="w-5 text-center text-sm font-semibold">${item.cantidad}</span>
          <button data-accion="inc" data-id="${item.id}"
            class="cc-carrito-btn w-7 h-7 rounded-full border border-stone-300 text-stone-600
                   hover:border-amber-500 hover:text-amber-700 transition-colors text-sm font-bold
                   flex items-center justify-center">+</button>
        </div>
        <span class="text-sm font-bold text-amber-700 w-16 text-right">${item.subtotalFormateado}</span>
      </div>
    `).join('');
  }
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function abrirSidebar() {
  carritoPanel.classList.add('cc-sidebar-open');
  carritoOverlay.classList.add('cc-overlay-open');
  document.body.style.overflow = 'hidden';
}

function cerrarSidebar() {
  carritoPanel.classList.remove('cc-sidebar-open');
  carritoOverlay.classList.remove('cc-overlay-open');
  document.body.style.overflow = '';
}

// ── WhatsApp: mensaje detallado ───────────────────────────────────────────────
function generarMensajeWhatsApp(items) {
  const lineas = items.map(i =>
    `• ${i.nombre} x${i.cantidad} → ${i.subtotalFormateado}`
  );
  const total = CarritoDAO.totalPesos(items);
  const linea = '─'.repeat(28);

  return [
    `🛒 *PEDIDO — Amasandería El Sol*`,
    linea,
    ...lineas,
    linea,
    `*TOTAL: $${total.toLocaleString('es-CL')}*`,
    ``,
    `Por favor confirmar disponibilidad y forma de entrega. ¡Gracias! 🍞`,
  ].join('\n');
}

// ── Flow.cl — llama a la Netlify Function que firma y crea la orden ───────────
async function iniciarPagoFlow(items) {
  const email = clienteEmailInput.value.trim();

  // Validar email
  if (!email || !email.includes('@')) {
    emailError.classList.remove('cc-hidden');
    clienteEmailInput.focus();
    return;
  }
  emailError.classList.add('cc-hidden');

  // UI: deshabilitar botón mientras procesa
  btnFlow.disabled    = true;
  btnFlow.textContent = 'Procesando…';

  try {
    const ordenId  = `ASL-${Date.now()}`;   // ID único por pedido
    const payload  = { items, email, ordenId };

    const resp = await fetch('/.netlify/functions/crear-pago', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const data = await resp.json();

    if (!resp.ok || data.error) {
      throw new Error(data.error || 'Error al conectar con el sistema de pago.');
    }

    // Redirigir al checkout de Flow (Webpay / tarjeta / etc.)
    window.location.href = data.redirectUrl;

  } catch (err) {
    alert(`No se pudo iniciar el pago:\n${err.message}\n\nUsa WhatsApp como alternativa.`);
    btnFlow.disabled    = false;
    btnFlow.textContent = 'Pagar con Webpay / Flow.cl';
  }
}

// ── Eventos ───────────────────────────────────────────────────────────────────
function bindEventos() {
  // Filtros categoría
  filtrosDiv.addEventListener('click', e => {
    const btn = e.target.closest('.cc-filtro');
    if (!btn) return;
    categoriaActiva = btn.dataset.cat;
    renderFiltros();
    renderGrid();
  });

  // Buscador
  buscadorInput.addEventListener('input', e => {
    queryBusqueda = e.target.value.trim();
    renderGrid();
  });

  // Agregar al carrito desde tarjeta producto
  grid.addEventListener('click', e => {
    const btn = e.target.closest('.cc-agregar');
    if (!btn) return;
    const producto = todosLosProductos.find(p => p.id === Number(btn.dataset.id));
    if (!producto) return;
    const items = CarritoDAO.agregar(producto);
    renderCarrito(items);
    abrirSidebar();
  });

  // Controles +/- dentro del sidebar
  carritoItemsEl.addEventListener('click', e => {
    const btn = e.target.closest('.cc-carrito-btn');
    if (!btn) return;
    const id     = Number(btn.dataset.id);
    const accion = btn.dataset.accion;
    const items  = accion === 'inc' ? CarritoDAO.incrementar(id) : CarritoDAO.decrementar(id);
    renderCarrito(items);
  });

  // Abrir / cerrar sidebar
  btnAbrirCarrito.addEventListener('click', abrirSidebar);
  btnCerrarCarrito.addEventListener('click', cerrarSidebar);
  carritoOverlay.addEventListener('click', cerrarSidebar);

  // Tecla Escape cierra sidebar
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') cerrarSidebar();
  });

  // Vaciar carrito
  btnVaciar.addEventListener('click', () => {
    const items = CarritoDAO.vaciar();
    renderCarrito(items);
  });

  // Finalizar por WhatsApp
  btnWhatsapp.addEventListener('click', () => {
    const items = CarritoDAO.getAll();
    if (items.length === 0) return;
    const mensaje = generarMensajeWhatsApp(items);
    window.open(
      `https://wa.me/${CONFIG.WHATSAPP_NUMERO}?text=${encodeURIComponent(mensaje)}`,
      '_blank',
      'noopener,noreferrer'
    );
  });

  // Pagar con Flow
  btnFlow.addEventListener('click', () => {
    const items = CarritoDAO.getAll();
    if (items.length === 0) return;
    iniciarPagoFlow(items);
  });
}

// ── Arranque ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
