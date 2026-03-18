/**
 * ProductoDAO — Accede y transforma los datos del catálogo.
 * Consume el JSON estático y retorna instancias de ProductoDTO.
 */
const ProductoDAO = Object.freeze({

  async getAll() {
    try {
      const res = await fetch('../data/productos.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.json();
      return raw.map(p => new ProductoDTO(p));
    } catch (err) {
      console.error('[ProductoDAO] Error cargando catálogo:', err);
      return [];
    }
  },

  getCategorias(productos) {
    const set = new Set(productos.map(p => p.categoria));
    return ['Todos', ...set];
  },

  filtrar(productos, { categoria = 'Todos', query = '' } = {}) {
    return productos.filter(p => {
      if (!p.disponible) return false;
      const matchCat   = categoria === 'Todos' || p.categoria === categoria;
      const matchQuery = p.nombre.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  }

});
