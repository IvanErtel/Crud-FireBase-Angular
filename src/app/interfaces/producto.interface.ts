export interface Producto {
  id?: string;
  categoriaId: string;
  nombre: string;
  cantidad: number;
  descripcion: string;
  precioCompra: number; // Precio de compra al proveedor
  precioVenta?: number; // Precio de venta al cliente
  proveedorId: string;
  }