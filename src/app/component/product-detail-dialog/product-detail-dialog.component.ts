import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Producto } from '../../interfaces/producto.interface';
import { Observable } from 'rxjs';
import { Categoria } from '../../interfaces/categoria.interface';

@Component({
  selector: 'app-product-detail-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    CommonModule,
    CurrencyPipe 
  ],
  templateUrl: './product-detail-dialog.component.html',
  styleUrl: './product-detail-dialog.component.scss'
})
export class ProductDetailDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { 
      producto: Producto; 
      categorias: Observable<Categoria[]>
      categoriaNombreMap: Map<string, string>;
      editarProducto: (producto: Producto) => void; 
      eliminarProducto: (id: string | undefined) => void; 
    },
    private dialogRef: MatDialogRef<ProductDetailDialogComponent>
  ) {}

  // Métodos para ejecutar las acciones
  editar(): void {
    this.data.editarProducto(this.data.producto); // Llama al método recibido
    this.dialogRef.close(); // Opcional: cerrar el diálogo después de editar
  }

  eliminar(): void {
    this.data.eliminarProducto(this.data.producto.id); // Llama al método recibido
    this.dialogRef.close(); // Opcional: cerrar el diálogo después de eliminar
  }

  obtenerNombreCategoria(): string {
    return this.data.categoriaNombreMap.get(this.data.producto.categoriaId) || 'Categoría desconocida';
  }

}
