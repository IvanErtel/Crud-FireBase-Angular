import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Producto } from '../../interfaces/producto.interface';
import { Observable } from 'rxjs';
import { Categoria } from '../../interfaces/categoria.interface';
import { Marca } from '../../interfaces/marca.interface';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-product-detail-dialog',
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    CommonModule,
    CurrencyPipe,
    MatIconModule 
  ],
  templateUrl: './product-detail-dialog.component.html',
  styleUrl: './product-detail-dialog.component.scss'
})
export class ProductDetailDialogComponent {
  
  marcas$: Observable<Marca[]>;
  marcaNombreMap: Map<string, string>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { 
      producto: Producto; 
      categorias: Observable<Categoria[]>
      marcas: Observable<Marca[]>; 
      categoriaNombreMap: Map<string, string>;
      marcaNombreMap: Map<string, string>; 
      editarProducto: (producto: Producto) => void; 
      eliminarProducto: (id: string | undefined) => void; 
    },
    private dialogRef: MatDialogRef<ProductDetailDialogComponent>
  ) {
    this.marcas$ = data.marcas;
    this.marcaNombreMap = data.marcaNombreMap;
  }

  // Métodos para ejecutar las acciones
  editar() {
    this.data.editarProducto(this.data.producto);
    this.dialogRef.close();
  }

  eliminar() {
    this.data.eliminarProducto(this.data.producto.id);
    this.dialogRef.close();
  }

  obtenerNombreCategoria(): string {
    return this.data.categoriaNombreMap.get(this.data.producto.categoriaId) || 'Sin categoría';
  }

  obtenerNombreMarca(): string {
    return this.marcaNombreMap.get(this.data.producto.marcaId) || 'Sin marca';
  }

}
