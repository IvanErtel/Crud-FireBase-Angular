import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../interfaces/producto.interface';
import { NavbarComponent } from '../navbar/navbar.component';
import { BehaviorSubject, Observable, Subject, switchMap, take } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { CategoriaService } from '../../services/categoria.service'; 
import { Categoria } from '../../interfaces/categoria.interface';
import { CommonModule } from '@angular/common';
import { ActualizarCantidadProductoComponent } from '../../modal/actualizar-cantidad-producto/actualizar-cantidad-producto.component';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DialogoGenericoComponent } from '../dialog/dialogo-generico.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map } from 'rxjs/operators';


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
  productosFiltrados$: Observable<Producto[]>;
  productoForm: FormGroup;
  editingProductoId: string | null = null;
  mostrarFormularioCategoria: boolean = false;
  categorias$: Observable<Categoria[]>;
  categoriaForm: FormGroup;
  categoriasMap = new Map<string, string>();
  categoriaSeleccionada: string | null = null;
  private unsubscribe$ = new Subject<void>();
  private filtroSubject = new BehaviorSubject<string>('');

  constructor(private fb: FormBuilder, private productoService: ProductoService, 
    private categoriaService: CategoriaService, public dialog: MatDialog,
    private snackBar: MatSnackBar) {
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

    // Formulario de categoría
    this.categoriaForm = this.fb.group({
      nombre: ['', Validators.required],
    });

    // Obtener las categorías
    this.categorias$ = this.categoriaService.obtenerCategorias();
    

// Filtra productos según el texto del filtro
this.productosFiltrados$ = this.filtroSubject.pipe(
  switchMap(filtro => 
    this.productoService.obtenerProductos().pipe(
      map((productos: Producto[]) => 
        productos.filter((producto: Producto) => 
          producto.nombre.toLowerCase().includes(filtro.toLowerCase())
  )
)
)
)
);
}

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarProductos();
  }

  toggleFormularioCategoria(): void {
    this.mostrarFormularioCategoria = !this.mostrarFormularioCategoria;
    if (this.mostrarFormularioCategoria) {
      this.mostrarFormulario = false; // Cierra el formulario de producto si se abre el de categoría
    }
  }
  
  toggleFormulario(): void {
    this.mostrarFormulario = !this.mostrarFormulario;
    if (this.mostrarFormulario) {
      this.mostrarFormularioCategoria = false; // Cierra el formulario de categoría si se abre el de producto
    }
  }

  // Método para guardar la categoría
  guardarCategoria(): void {
    if (this.categoriaForm.valid) {
      const categoria = this.categoriaForm.value;
      this.categoriaService.agregarCategoria(categoria).subscribe({
        next: (id) => {
          console.log('Categoría guardada con ID:', id);
          this.mostrarFormularioCategoria = false;
          this.categoriaForm.reset();
          this.cargarCategorias();
        },
        error: (err) => {
          console.error('Error al guardar la categoría:', err);
          this.snackBar.open('Hubo un error al guardar la categoría. Inténtalo nuevamente.', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      });
    }
  }

  // Método para eliminar una categoría
eliminarCategoria(id: string): void {
  const dialogRef = this.dialog.open(DialogoGenericoComponent, {
    data: {
      title: 'Confirmar Eliminación',
      message: '¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar'
    }
  });

  dialogRef.afterClosed().subscribe((resultado) => {
    if (resultado === true) {
      // Llamamos al servicio para eliminar la categoría
      this.categoriaService.eliminarCategoria(id).subscribe({
        next: () => {
          console.log('Categoría eliminada');
          this.cargarCategorias(); // Recargamos las categorías después de eliminar
        },
        error: (err) => {
          console.error('Error al eliminar la categoría:', err);
          this.snackBar.open('Hubo un error al eliminar la categoría. Inténtalo nuevamente.', 'Cerrar', {
            duration: 3000,
            panelClass: ['snackbar-error']
          });
        }
      });
    } else {
      console.log('Eliminación cancelada');
    }
  });
}

  // Método para cancelar la creación de una categoría
  cancelarFormularioCategoria(): void {
    this.categoriaForm.reset();
    this.mostrarFormularioCategoria = false;
  }
  
  cargarCategorias(): void {
    this.categoriaService.obtenerCategorias().pipe(take(1)).subscribe(categorias => {
      this.categoriasMap.clear(); // Limpiamos el mapa antes de recargar las categorías
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

  onSubmit(): void {
    if (this.productoForm.valid) {
      const producto = this.productoForm.value;
  
      if (this.editingProductoId) {
        this.productoService.actualizarProducto(this.editingProductoId, producto).subscribe(() => {
          console.log('Producto actualizado');
          this.resetFormAndEditingState();
          this.cargarProductos();
        });
      } else {
        this.productoService.agregarProducto(producto).subscribe(id => {
          console.log(`Producto agregado con ID: ${id}`);
          this.resetFormAndEditingState();
          this.cargarProductos();
        });
      }
    }
  }

  editarProducto(producto: Producto): void {
    if (producto.id) {
      this.editingProductoId = producto.id;
    } else {
      console.log('Error: El Producto no tiene ID');
      this.snackBar.open('Error: El Producto no tiene ID', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error'] 
      });
    }
  
    this.mostrarFormulario = true; // Asegura que el formulario esté visible
    this.productoForm.setValue({
      nombre: producto.nombre,
      precioCompra: producto.precioCompra,
      precioVenta: producto.precioVenta || 0,
      cantidad: producto.cantidad,
      descripcion: producto.descripcion,
      categoriaId: producto.categoriaId,
    });
  
    // Desplaza hacia el formulario
    setTimeout(() => {
      const formularioElemento = document.querySelector('.producto-form');
      formularioElemento?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
  }
  
  cancelarFormulario(): void {
    this.productoForm.reset();  // Limpia el formulario
    this.editingProductoId = null;  // Reinicia el modo de edición
    this.mostrarFormulario = false;  // Cierra el formulario
  }

  eliminarProducto(id: string | undefined): void {
    if (!id) {
      console.error('Intento de eliminar un producto sin ID');
      return;
    }
  
    const dialogRef = this.dialog.open(DialogoGenericoComponent, {
      data: {
        title: 'Confirmar Eliminación',
        message: '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });
  
    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado === true) {
        // Solo se elimina si el usuario confirmó
        this.productoService.eliminarProducto(id).subscribe(() => {
          console.log('Producto eliminado');
          this.cargarProductos();
        });
      } else {
        console.log('Eliminación cancelada');
      }
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
          this.cargarCategorias();
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
  
        if (nuevaCantidad < 0) {
          throw new Error(`La cantidad no puede ser negativa. Cantidad actual: ${producto.cantidad}, Intento de restar: ${Math.abs(cantidadAdicional)}`);
        }
  
        return this.productoService.actualizarProducto(id, { cantidad: nuevaCantidad });
      })
    ).subscribe({
      next: () => {
        console.log('Cantidad actualizada');
        this.cargarProductos();
      },
      error: error => {
        console.error('Error al actualizar la cantidad del producto', error);
        this.snackBar.open('No es posible actualizar la cantidad a un valor negativo.', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']});
      }
    });
  }

  obtenerProductosFiltrados(): Observable<Producto[]> {
    return new Observable<Producto[]>(observer => {
      this.productos$.pipe(take(1)).subscribe(productos => {
        let productosFiltrados = productos;
  
        if (this.filtroSubject.getValue()) {
          productosFiltrados = productosFiltrados.filter(producto =>
            producto.nombre.toLowerCase().includes(this.filtroSubject.getValue().toLowerCase())
          );
        }
  
        if (this.categoriaSeleccionada) {
          productosFiltrados = productosFiltrados.filter(producto =>
            producto.categoriaId === this.categoriaSeleccionada
          );
        }
  
        observer.next(productosFiltrados);
        observer.complete();
      });
    });
  }
  
  filtrarProductos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const filtro = input.value.trim(); // Aseguramos que no haya espacios extra
    this.filtroSubject.next(filtro); // Actualiza el filtro
  }

    // Filtrar por categoría
    filtrarProductosPorCategoria(event: any): void {
      this.categoriaSeleccionada = event.value;
      this.productosFiltrados$ = this.obtenerProductosFiltrados();
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

