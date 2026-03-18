/**
 * ProductoDTO — Define la forma del dato producto.
 * Cualquier cambio en el JSON de datos se adapta aquí.
 */
class ProductoDTO {
  constructor({ id, nombre, precio, categoria, imagen = '', disponible = true, descripcion = '' }) {
    this.id         = id;
    this.nombre     = nombre;
    this.precio     = Number(precio);
    this.categoria  = categoria;
    this.imagen     = imagen;
    this.disponible = Boolean(disponible);
    this.descripcion = descripcion;
  }

  get precioFormateado() {
    return `$${this.precio.toLocaleString('es-CL')}`;
  }
}
