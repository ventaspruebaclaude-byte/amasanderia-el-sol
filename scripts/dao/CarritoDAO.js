/**
 * CarritoDAO — Persistencia del carrito en localStorage.
 * Todas las mutaciones retornan el array actualizado.
 */
const CarritoDAO = Object.freeze({

  KEY: 'cc_carrito_amasanderia',

  getAll() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw).map(i => new CarritoItemDTO(i)) : [];
    } catch {
      return [];
    }
  },

  _guardar(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
  },

  agregar(producto) {
    const items = this.getAll();
    const idx   = items.findIndex(i => i.id === producto.id);
    if (idx > -1) {
      items[idx].cantidad++;
    } else {
      items.push(new CarritoItemDTO({
        id:     producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
      }));
    }
    this._guardar(items);
    return items;
  },

  incrementar(id) {
    const items = this.getAll();
    const item  = items.find(i => i.id === id);
    if (item) item.cantidad++;
    this._guardar(items);
    return items;
  },

  decrementar(id) {
    let items = this.getAll();
    const item = items.find(i => i.id === id);
    if (item) {
      item.cantidad--;
      if (item.cantidad <= 0) items = items.filter(i => i.id !== id);
    }
    this._guardar(items);
    return items;
  },

  vaciar() {
    localStorage.removeItem(this.KEY);
    return [];
  },

  totalPesos(items) {
    return items.reduce((acc, i) => acc + i.subtotal, 0);
  },

  totalUnidades(items) {
    return items.reduce((acc, i) => acc + i.cantidad, 0);
  },

  // ── Helpers para Flow.cl ────────────────────────────────────────────────────
  // Retorna el payload listo para enviar a la API de Flow.cl
  // Documentación: https://www.flow.cl/app/web/restfulapi.php
  toFlowPayload(items, { ordenId, email, urlRetorno, urlConfirmacion }) {
    return {
      apiKey:      'TU_API_KEY_FLOW',          // reemplazar con key real
      commerceOrder: String(ordenId),
      subject:     'Pedido Amasandería El Sol',
      currency:    'CLP',
      amount:      this.totalPesos(items),
      email,
      urlConfirmation: urlConfirmacion,
      urlReturn:       urlRetorno,
      paymentMethod:   9,                      // 9 = todos los medios disponibles
    };
  },

});
