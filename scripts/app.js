/**
 * app.js — Punto de entrada principal.
 * Orquesta la UI: carga datos, renderiza catálogo, filtros y buscador.
 */

const CONFIG = Object.freeze({
  WHATSAPP_NUMERO: '56912345678',   // ← reemplazar con número real del cliente
  WHATSAPP_MENSAJE: 'Hola, quiero consultar sobre: ',
  DEBUG: false,
});

// ── Estado de la aplicación ──────────────────────────────────────────────────
let todosLosProductos = [];
let categoriaActiva   = 'Todos';
let queryBusqueda     = '';

// ── Elementos del DOM ────────────────────────────────────────────────────────
const grid           = document.getElementById('productoGrid');
const sinResultados  = document.getElementById('sinResultados');
const buscadorInput  = document.getElementById('buscadorInput');
const filtrosDiv     = document.getElementById('filtrosCategoria');
const whatsappBtn    = document.getElementById('whatsappContacto');
const footerYear     = document.getElementById('footerYear');

// ── Inicialización ───────────────────────────────────────────────────────────
async function init() {
  footerYear.textContent = new Date().getFullYear();

  todosLosProductos = await ProductoDAO.getAll();

  if (CONFIG.DEBUG) console.log('[app] Productos cargados:', todosLosProductos.length);

  renderFiltros();
  renderGrid();
  bindEventos();
}

// ── Renderizado de filtros por categoría ─────────────────────────────────────
function renderFiltros() {
  const categorias = ProductoDAO.getCategorias(todosLosProductos);
  filtrosDiv.innerHTML = categorias.map(cat => `
    <button
      data-cat="${cat}"
      class="cc-filtro px-3 py-1 rounded-full border text-xs font-medium transition-colors
             ${cat === categoriaActiva
               ? 'bg-amber-700 text-white border-amber-700'
               : 'border-stone-300 text-stone-600 hover:border-amber-500 hover:text-amber-700'}"
    >${cat}</button>
  `).join('');
}

// ── Renderizado de tarjetas de producto ──────────────────────────────────────
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
  grid.innerHTML = visibles.map(p => tarjetaHTML(p)).join('');
}

function tarjetaHTML(producto) {
  const imgSrc = producto.imagen
    ? `assets/img/${producto.imagen}`
    : `https://placehold.co/300x200/fef3c7/92400e?text=${encodeURIComponent(producto.nombre)}`;

  const waUrl = `https://wa.me/${CONFIG.WHATSAPP_NUMERO}?text=${encodeURIComponent(
    CONFIG.WHATSAPP_MENSAJE + producto.nombre + ' (' + producto.precioFormateado + ')'
  )}`;

  return `
    <article class="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden
                    hover:shadow-md transition-shadow flex flex-col">
      <img
        src="${imgSrc}"
        alt="${producto.nombre}"
        class="w-full h-36 object-cover"
        loading="lazy"
        onerror="this.src='https://placehold.co/300x200/fef3c7/92400e?text=Sin+imagen'"
      />
      <div class="p-3 flex flex-col flex-1">
        <span class="text-xs text-amber-600 font-medium mb-1">${producto.categoria}</span>
        <h3 class="text-sm font-semibold text-stone-800 leading-tight mb-1">${producto.nombre}</h3>
        ${producto.descripcion ? `<p class="text-xs text-stone-500 mb-2 flex-1">${producto.descripcion}</p>` : '<div class="flex-1"></div>'}
        <div class="flex items-center justify-between mt-2">
          <span class="text-amber-700 font-bold text-sm">${producto.precioFormateado}</span>
          <a
            href="${waUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded-lg transition-colors"
          >Pedir</a>
        </div>
      </div>
    </article>
  `;
}

// ── Eventos ──────────────────────────────────────────────────────────────────
function bindEventos() {
  // Filtros de categoría (delegación de eventos)
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

  // WhatsApp contacto general
  if (whatsappBtn) {
    whatsappBtn.href = `https://wa.me/${CONFIG.WHATSAPP_NUMERO}?text=${encodeURIComponent('Hola, quiero hacer un pedido.')}`;
  }
}

// ── Arranque ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
