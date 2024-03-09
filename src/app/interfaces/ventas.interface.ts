export interface Venta {
    id?: string;
    clienteId: string;
    fecha: Date;
    total: number;
    detalles: DetalleVenta[];
  }
  
  export interface DetalleVenta {
    productoId: string;
    cantidad: number;
    precioVenta: number;
  }