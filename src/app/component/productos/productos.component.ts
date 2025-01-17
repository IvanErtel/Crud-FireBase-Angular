import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../interfaces/producto.interface';
import { NavbarComponent } from '../navbar/navbar.component';
import { BehaviorSubject, from, Observable, Subject, switchMap, take } from 'rxjs';
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
import { MatMenuModule } from '@angular/material/menu';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AuthService } from '../../services/auth.service';
import { addDoc, collection } from 'firebase/firestore';


@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [NavbarComponent, ReactiveFormsModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatIconModule,
    CommonModule, MatMenuModule,
     MatDialogModule, ActualizarCantidadProductoComponent],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss'],
})
export class ProductosComponent implements OnInit {
  mostrarFormulario: boolean = false;
  productos$: Observable<Producto[]> = this.productoService.obtenerProductos();
  productosFiltrados$: Observable<Producto[]> = this.productoService.productos$;
  productoForm: FormGroup;
  editingProductoId: string | null = null;
  mostrarFormularioCategoria: boolean = false;
  categorias$: Observable<Categoria[]>;
  categoriaForm: FormGroup;
  categoriasMap = new Map<string, string>();
  categoriaSeleccionada: string | null = null;
  imagenArchivo: File | null = null;
  private unsubscribe$ = new Subject<void>();
  private filtroSubject = new BehaviorSubject<string>('');
  private storage = getStorage();

  constructor(private fb: FormBuilder, private productoService: ProductoService, 
    private categoriaService: CategoriaService, public dialog: MatDialog,
    private snackBar: MatSnackBar, private authService: AuthService) {
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
imagenUrl: [null],
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
  
  subirImagen(imagen: File): Observable<string> {
    return this.authService.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          throw new Error('Usuario no autenticado');
        }
  
        const filePath = `productos/${Date.now()}_${imagen.name}`;
        const storageRef = ref(this.storage, filePath);
  
        // Subir archivo con metadatos
        const metadata = {
          customMetadata: {
            userId: userId,  // Guardamos el userId en los metadatos
          }
        };
  
        return from(uploadBytes(storageRef, imagen, metadata)).pipe(
          switchMap(snapshot => getDownloadURL(snapshot.ref))
        );
      })
    );
  }  

  agregarProductoConImagen(): void {
    if (this.productoForm.valid && this.imagenArchivo) {
      const producto: Producto = this.productoForm.value; // Obtener los valores del formulario

      // Llamar al servicio para agregar el producto
      this.productoService.agregarProductoConImagen(producto, this.imagenArchivo).subscribe(
        (id) => {
          console.log('Producto agregado con ID:', id);
          this.snackBar.open('Producto agregado con éxito', 'Cerrar', { duration: 3000 });
        },
        (error) => {
          console.error('Error al agregar el producto:', error);
          this.snackBar.open('Error al agregar el producto', 'Cerrar', { duration: 3000 });
        }
      );
    } else {
      this.snackBar.open('Formulario no válido o imagen no seleccionada', 'Cerrar', { duration: 3000 });
    }
  }
  
  onFileSelected(event: any): void {
    this.imagenArchivo = event.target.files[0]; // Capturamos la imagen seleccionada
  }
  
  // Método para eliminar una categoría
  eliminarCategoria(id: string): void {
    // Abrimos el diálogo de confirmación
    const dialogRef = this.dialog.open(DialogoGenericoComponent, {
      data: {
        title: 'Confirmar Eliminación',
        message: '¿Estás seguro de que deseas eliminar esta categoría? Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar'
      }
    });
  
    // Esperamos la respuesta del diálogo
    dialogRef.afterClosed().subscribe((resultado) => {
      if (resultado === true) {
        // Si se confirma la eliminación, procedemos con la eliminación
        this.eliminarCategoriaConServicio(id);
      } else {
        console.log('Eliminación cancelada');
      }
    });
  }
  
  private eliminarCategoriaConServicio(id: string): void {
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
  
  obtenerNombreCategoria(categoriaId: string): string {
    return this.categoriasMap.get(categoriaId) || 'Sin categoría';
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
      const producto: Producto = {
        nombre: this.productoForm.value.nombre,
        precioCompra: this.productoForm.value.precioCompra,
        precioVenta: this.productoForm.value.precioVenta,
        cantidad: this.productoForm.value.cantidad,
        descripcion: this.productoForm.value.descripcion,
        categoriaId: this.productoForm.value.categoriaId,
        imagenUrl: '' // Se actualizará si se carga una imagen
      };
  
      if (this.editingProductoId) {
        // Actualización del producto
        if (this.imagenArchivo) {
          // Si se selecciona una nueva imagen, la subimos primero
          this.productoService.agregarProductoConImagen(producto, this.imagenArchivo).subscribe({
            next: (idProducto: string) => {
              console.log('Producto actualizado con nueva imagen.');
              // Mostrar mensaje de éxito
              this.snackBar.open('Producto actualizado con éxito', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-exito']
              });
              this.resetFormAndEditingState();
              this.cargarProductos();
            },
            error: (err: any) => {
              console.error('Error al actualizar producto con nueva imagen:', err);
              this.snackBar.open('Error al actualizar producto con nueva imagen', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-error']
              });
            }
          });
        } else {
          this.productoService.actualizarProducto(this.editingProductoId, producto).subscribe({
            next: () => {
              console.log('Producto actualizado');
              // Mostrar mensaje de éxito
              this.snackBar.open('Producto actualizado con éxito', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-exito']
              });
              this.resetFormAndEditingState();
              this.cargarProductos();
              this.mostrarFormulario = false;
            },
            error: (err: any) => {
              console.error('Error al actualizar producto:', err);
              this.snackBar.open('Error al actualizar producto', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-error']
              });
            }
          });
        }
      } else {
        // Creación de un nuevo producto
        if (this.imagenArchivo) {
          this.productoService.agregarProductoConImagen(producto, this.imagenArchivo).subscribe({
            next: (idProducto: string) => {
              console.log('Producto con imagen agregado con ID:', idProducto);
              // Mostrar mensaje de éxito
              this.snackBar.open('Producto creado con éxito', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-exito']
              });
              this.resetFormAndEditingState();
              this.cargarProductos();
            },
            error: (err: any) => {
              console.error('Error al agregar producto con imagen:', err);
              this.snackBar.open('Error al agregar producto con imagen', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-error']
              });
            }
          });
        } else {
          this.productoService.agregarProducto(producto).subscribe({
            next: (idProducto: string) => {
              console.log('Producto agregado sin imagen con ID:', idProducto);
              // Mostrar mensaje de éxito
              this.snackBar.open('Producto creado con éxito', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-exito']
              });
              this.resetFormAndEditingState();
              this.cargarProductos();
            },
            error: (err: any) => {
              console.error('Error al agregar producto:', err);
              this.snackBar.open('Error al agregar producto', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-error']
              });
            }
          });
        }
      }
    } else {
      // Mostrar mensaje si el formulario es inválido
      this.snackBar.open('Por favor, complete todos los campos', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
    }
  }  

  editarProducto(producto: Producto): void {
    if (producto.id) {
      this.editingProductoId = producto.id;
      
      // Aquí nos aseguramos de que los valores del producto se asignen correctamente
      this.productoForm.setValue({
        nombre: producto.nombre,
        precioCompra: producto.precioCompra,
        precioVenta: producto.precioVenta || 0,
        cantidad: producto.cantidad,
        descripcion: producto.descripcion,
        categoriaId: producto.categoriaId,
        imagenUrl: producto.imagenUrl || '', // Aseguramos que imagenUrl no sea nulo o indefinido
      });
      
    } else {
      console.log('Error: El Producto no tiene ID');
      this.snackBar.open('Error: El Producto no tiene ID', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
    }
  
    this.mostrarFormulario = true; // Asegura que el formulario esté visible
  
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

  getCategoriaNombre(categoriaId: string): Observable<string> {
    return this.productoService.categoriasMap$.pipe(
      map(categoriasMap => categoriasMap.get(categoriaId) || 'Categoría no encontrada')
    );
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

