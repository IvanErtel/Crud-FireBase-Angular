// productos.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../interfaces/producto.interface';
import { NavbarComponent } from '../navbar/navbar.component';
import { Observable, Subject, switchMap, take } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { CategoriaService } from '../../services/categoria.service'; 
import { Categoria } from '../../interfaces/categoria.interface';
import { CommonModule } from '@angular/common';
import { ActualizarCantidadProductoComponent } from '../../modal/actualizar-cantidad-producto/actualizar-cantidad-producto.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { AngularFireStorage } from '@angular/fire/compat/storage';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatIconModule,
    CommonModule, MatDialogModule, ActualizarCantidadProductoComponent],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss'],
})
export class ProductosComponent implements OnInit {
  mostrarFormulario: boolean = false;
  productos$: Observable<Producto[]> = this.productoService.obtenerProductos();
  productoForm: FormGroup;
  editingProductoId: string | null = null;
  categorias$: Observable<Categoria[]>;
  categoriaForm: FormGroup;
  categoriasMap = new Map<string, string>();
  imagenUrl: string = '';
  private unsubscribe$ = new Subject<void>();
  
  constructor(private fb: FormBuilder, private productoService: ProductoService, private categoriaService: CategoriaService, public dialog: MatDialog, private storage: AngularFireStorage)
  {
    this.categoriaForm = this.fb.group({
      nombre: ['', Validators.required],
    });
    this.categorias$ = this.categoriaService.obtenerCategorias();
    this.productoForm = this.fb.group({
      nombre: ['', Validators.required],
      precioCompra: ['', [Validators.required, Validators.min(0)]],
      precioVenta: ['', [Validators.required, Validators.min(0)]],
      cantidad: ['', [Validators.required, Validators.min(1)]],
      descripcion: ['', Validators.required],
      categoriaId: ['',],
    });
  }

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
  }

  cargarCategorias(): void {
    this.categoriaService.obtenerCategorias().pipe(take(1)).subscribe(categorias => {
      categorias.forEach(categoria => {
        this.categoriasMap.set(categoria.id!, categoria.nombre);
      });
    });
  }

  cargarProductos(): void {
    this.productos$ = this.productoService.obtenerProductos();
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    console.log('Mostrar formulario:', this.mostrarFormulario); // Verifica el valor
  }
  
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const filePath = `productos/${file.name}`;
      const fileRef = this.storage.ref(filePath);
      const task = this.storage.upload(filePath, file);

      task.snapshotChanges().pipe(
        finalize(() => {
          fileRef.getDownloadURL().subscribe((url: string) => {
            this.imagenUrl = url; // Aquí guardamos la URL de la imagen
          });
        })
      ).subscribe();
    }
  }

  onSubmit(): void {
    if (this.productoForm.valid) {
      const producto = {
      ...this.productoForm.value,
      imagenUrl: this.imagenUrl
    };
      if (this.editingProductoId) {
        this.productoService.actualizarProducto(this.editingProductoId, producto).subscribe(() => {
          console.log('Producto actualizado');
          this.resetFormAndEditingState();
          this.cargarProductos(); // Recargar productos
        });
      } else {
        this.productoService.agregarProducto(producto).subscribe(id => {
          console.log(`Producto agregado con ID: ${id}`);
          this.resetFormAndEditingState();
          this.cargarProductos(); // Recargar productos
        });
      }
    }
  }

  editarProducto(producto: Producto): void {
    if (producto.id) {
      this.editingProductoId = producto.id;
    } else {
      console.log('Error: El Producto no tiene ID');
    }
    this.productoForm.setValue({
      nombre: producto.nombre,
      precioCompra: producto.precioCompra,
      precioVenta: producto.precioVenta || 0, // Asumiendo que precioVenta puede no estar definido
      cantidad: producto.cantidad,
      descripcion: producto.descripcion,
      categoriaId: producto.categoriaId,
    });
  }

  eliminarProducto(id: string | undefined): void {
    // Verifica si el ID está presente antes de intentar eliminar el producto
    if (!id) {
      console.error('Intento de eliminar un producto sin ID');
      return; // Sale de la función si no hay ID, evitando la llamada al servicio
    }
  
    // Si el ID está presente, procede a eliminar el producto
    this.productoService.eliminarProducto(id).subscribe(() => {
      console.log('Producto eliminado');
      this.cargarProductos(); // Recargar la lista de productos después de eliminar
    });
  }

  resetFormAndEditingState(): void {
    this.productoForm.reset();
    this.editingProductoId = null;
    this.cargarProductos();
  }

  agregarCategoria(): void {
    if (this.categoriaForm.valid) {
      this.categoriaService.agregarCategoria(this.categoriaForm.value).subscribe({
        next: id => {
          console.log(`Categoría agregada con ID: ${id}`);
          this.cargarCategorias(); // Recargar las categorías para actualizar la lista/dropdown
          this.categoriaForm.reset();
        },
        error: error => console.error(error),
      });
    }
  }

  getCategoriaNombre(categoriaId: string): string {
    return this.categoriasMap.get(categoriaId) || 'Categoría no encontrada';
  }

  actualizarCantidadProducto(id: string, cantidadAdicional: number): void {
    this.productoService.obtenerProductoPorId(id).pipe(
      take(1),
      switchMap(producto => {
        const nuevaCantidad = producto.cantidad + cantidadAdicional;
        return this.productoService.actualizarProducto(id, { cantidad: nuevaCantidad });
      })
    ).subscribe({
      next: () => {
        console.log('Cantidad actualizada');
        this.cargarProductos(); // Esto recargará la lista de productos.
      },
      error: error => {
        console.error('Error al actualizar la cantidad del producto', error);
      }
    });
  }

  
  abrirDialogoActualizarCantidad(producto: Producto): void {
    const nombreCategoria = this.getCategoriaNombre(producto.categoriaId);
    const dialogRef = this.dialog.open(ActualizarCantidadProductoComponent, {
      width: '350px',
      data: { producto, stockActual: producto.cantidad, nombreProducto: producto.nombre, nombreCategoria: nombreCategoria }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.cantidadAdicional && producto.id) {
        const cantidadAdicional: number = result.cantidadAdicional;
        this.actualizarCantidadProducto(producto.id, cantidadAdicional);
      } else {
        console.error('Error: ID del producto indefinido');
      }
    });
  }

}