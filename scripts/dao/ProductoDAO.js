/**
 * ProductoDAO — Accede y transforma los datos del catálogo.
 * Consume el JSON estático y retorna instancias de ProductoDTO.
 */
const ProductoDAO = Object.freeze({

  getAll() {
    return PRODUCTOS.map(p => new ProductoDTO(p));
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
