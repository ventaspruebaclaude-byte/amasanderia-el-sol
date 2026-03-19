/**
 * CarritoItemDTO — Forma de un ítem dentro del carrito.
 */
class CarritoItemDTO {
  constructor({ id, nombre, precio, cantidad = 1 }) {
    this.id       = id;
    this.nombre   = nombre;
    this.precio   = Number(precio);
    this.cantidad = Number(cantidad);
  }

  get subtotal() {
    return this.precio * this.cantidad;
  }

  get subtotalFormateado() {
    return `$${this.subtotal.toLocaleString('es-CL')}`;
  }

  get precioFormateado() {
    return `$${this.precio.toLocaleString('es-CL')}`;
  }
}
