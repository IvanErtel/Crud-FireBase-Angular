export interface Producto {
  id?: string;
  categoriaId: string;
  nombre: string;
  cantidad: number;
  descripcion: string;
  precioCompra: number;
  precioVenta?: number;
  proveedorId: string;
  userId?: string;
  }