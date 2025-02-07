import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProductoService } from '../../services/producto.service';
import { Producto } from '../../interfaces/producto.interface';
import { BehaviorSubject, combineLatest, from, Observable, Subject, switchMap, take } from 'rxjs';
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
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { MatMenuModule } from '@angular/material/menu';
import { getStorage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { AuthService } from '../../services/auth.service';
import { addDoc, collection } from 'firebase/firestore';
import { ProductDetailDialogComponent } from '../product-detail-dialog/product-detail-dialog.component';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MarcaService } from '../../services/marca.service';
import { Marca } from '../../interfaces/marca.interface';
import { CustomPaginatorComponent } from "../custom-paginator/custom-paginator.component";

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [ReactiveFormsModule, MatInputModule,
    MatButtonModule, MatSelectModule, MatIconModule,
    CommonModule, MatMenuModule, MatTableModule,
    MatDialogModule, ActualizarCantidadProductoComponent, CustomPaginatorComponent],
  templateUrl: './productos.component.html',
  styleUrls: ['./productos.component.scss'],
})
export class ProductosComponent implements OnInit {
  mostrarFormulario: boolean = false;
  productoForm: FormGroup;
  productos$: Observable<Producto[]> = this.productoService.obtenerProductos();
  editingProductoId: string | null = null;
  mostrarFormularioCategoria: boolean = false;
  categorias$: Observable<Categoria[]>;
  categoriaForm: FormGroup;
  categoriasMap = new Map<string, string>();
  imagenArchivo: File | null = null;
  categoriaSeleccionada = new BehaviorSubject<string | null>(null);
  dataSource = new MatTableDataSource<Producto>([]);  
  productosFiltrados$: Observable<Producto[]> = this.dataSource.connect();
  marcas$: Observable<Marca[]> = this.marcaService.obtenerMarcas();
  marcasMap = new Map<string, string>();
  isMobile: boolean = false;
  mostrarFormularioMarca = false;
  marcaForm: FormGroup;
  pagedData: Producto[] = [];
  private unsubscribe$ = new Subject<void>();
  private storage = getStorage();
  private filtroSubject = new BehaviorSubject<string>('');
  
  constructor(private fb: FormBuilder, private productoService: ProductoService, 
    private categoriaService: CategoriaService,  private marcaService: MarcaService, public dialog: MatDialog,
    private snackBar: MatSnackBar, private authService: AuthService) {

      this.marcaForm = this.fb.group({
        nombre: ['', Validators.required]
      });

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
marcaId: ['', Validators.required],
categoriaId: ['', Validators.required],
imagenUrl: [null],
});

    // Formulario de categoría
    this.categoriaForm = this.fb.group({
      nombre: ['', Validators.required],
    });

    // Obtener las categorías
    this.categorias$ = this.categoriaService.obtenerCategorias();
    this.detectarDispositivo();
 
// Filtra productos según el texto del filtro
this.productosFiltrados$ = this.filtroSubject.pipe(
  switchMap(filtro => 
    this.productoService.obtenerProductos().pipe(
      map((productos: Producto[]) => 
        productos
          .filter((producto: Producto) => 
            producto.nombre.toLowerCase().includes(filtro.toLowerCase())
          )
          .map(producto => ({ ...producto, mostrarDetalles: false })) // Agrega la propiedad a cada producto
      )
    )
  )
);
}

private detectarDispositivo(): void {
  this.isMobile = window.innerWidth < 768;
  window.addEventListener('resize', () => {
    this.isMobile = window.innerWidth < 768;
  });
}

ngOnInit(): void {
  this.detectarDispositivo();
  this.cargarCategorias();
  this.marcas$ = this.marcaService.obtenerMarcas();
  this.cargarMarcas();
  
  combineLatest([
    this.productoService.obtenerProductos(),
    this.filtroSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ),
    this.categoriaSeleccionada
  ]).pipe(
    map(([productos, filtro, categoria]) => {
      return productos.filter(producto => {
        const coincideNombre = producto.nombre.toLowerCase().includes(filtro.toLowerCase());
        const coincideCategoria = categoria ? producto.categoriaId === categoria : true;
        return coincideNombre && coincideCategoria;
      });
    })
  ).subscribe(productos => {
    this.dataSource.data = productos; // Actualizar datasource
  });
}

  toggleFormularioCategoria(): void {
    this.mostrarFormularioCategoria = !this.mostrarFormularioCategoria;
    if (this.mostrarFormularioCategoria) {
      this.mostrarFormulario = false; // Cierra el formulario de producto si se abre el de categoría
    }
  }
  
  cargarMarcas(): void {
    this.marcaService.obtenerMarcas().pipe(take(1)).subscribe(marcas => {
      this.marcasMap.clear();
      marcas.forEach(marca => {
        this.marcasMap.set(marca.id!, marca.nombre);
      });
    });
  }

  // Método para guardar Marca
guardarMarca(): void {
  if (this.marcaForm.valid) {
    const marca = this.marcaForm.value;
    this.marcaService.agregarMarca(marca).subscribe({
      next: (id) => {
        this.snackBar.open('Marca guardada con éxito', 'Cerrar', { 
          duration: 3000,
          panelClass: ['snackbar-exito']
        });
        this.mostrarFormularioMarca = false;
        this.marcaForm.reset();
      },
      error: (err) => {
        this.snackBar.open('Error al guardar la marca', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }
}

// Método para eliminar Marca
eliminarMarca(marcaId: string | undefined): void {
  if (marcaId) {
    this.marcaService.eliminarMarca(marcaId).subscribe({
      next: () => {
        this.snackBar.open('Marca eliminada', 'Cerrar', { 
          duration: 3000,
          panelClass: ['snackbar-exito']
        });
      },
      error: (err) => {
        this.snackBar.open('Error al eliminar la marca', 'Cerrar', {
          duration: 3000,
          panelClass: ['snackbar-error']
        });
      }
    });
  }
}

  cancelarFormularioMarca(): void {
    this.marcaForm.reset();
    this.mostrarFormularioMarca = false;
  }

 toggleFormularioMarca(): void {
  this.mostrarFormularioMarca = !this.mostrarFormularioMarca;
  if (this.mostrarFormularioMarca) {
    this.mostrarFormulario = false;
    this.mostrarFormularioCategoria = false;
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
  
  obtenerNombreCategoria(categoriaId: string): Observable<string> {
    return this.categorias$.pipe(
      map(categorias => {
        const categoria = categorias.find(c => c.id === categoriaId);
        return categoria ? categoria.nombre : 'Sin categoría';
      })
    );
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
        marcaId: this.productoForm.value.marcaId,
        precioCompra: this.productoForm.value.precioCompra,
        precioVenta: this.productoForm.value.precioVenta,
        cantidad: this.productoForm.value.cantidad,
        descripcion: this.productoForm.value.descripcion,
        categoriaId: this.productoForm.value.categoriaId,
        imagenUrl: this.productoForm.value.imagenUrl || '', // Mantener la imagen si no se cambia
      };
  
      if (this.editingProductoId) {
        // Estamos editando un producto, así que actualizamos
        if (this.imagenArchivo) {
          // Si hay una nueva imagen, actualizamos el producto con la nueva imagen
          this.productoService.actualizarProductoConImagen(this.editingProductoId, producto, this.imagenArchivo).subscribe({
            next: () => {
              console.log('Producto actualizado con nueva imagen.');
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
          // Si no hay nueva imagen, actualizamos el producto sin cambiar la imagen
          this.productoService.actualizarProducto(this.editingProductoId, producto).subscribe({
            next: () => {
              console.log('Producto actualizado sin cambiar la imagen');
              this.snackBar.open('Producto actualizado con éxito', 'Cerrar', {
                duration: 3000,
                panelClass: ['snackbar-exito']
              });
              this.resetFormAndEditingState();
              this.cargarProductos();
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
        // Crear un nuevo producto si no estamos editando
        if (this.imagenArchivo) {
          this.productoService.agregarProductoConImagen(producto, this.imagenArchivo).subscribe({
            next: (idProducto: string) => {
              console.log('Producto creado con imagen con ID:', idProducto);
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
              console.log('Producto creado sin imagen con ID:', idProducto);
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
      this.snackBar.open('Por favor, complete todos los campos', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
    }
  }  

  editarProducto(producto: Producto): void {
    if (producto.id) {
      this.editingProductoId = producto.id;
  
      // Establecer los valores del producto en el formulario
      this.productoForm.setValue({
        nombre: producto.nombre,
        marcaId: producto.marcaId || '',
        precioCompra: producto.precioCompra,
        precioVenta: producto.precioVenta || 0,
        cantidad: producto.cantidad,
        descripcion: producto.descripcion,
        categoriaId: producto.categoriaId,
        imagenUrl: producto.imagenUrl || '', // Aseguramos que la imagenUrl actual se cargue
      });
  
      // Limpiamos la imagen cargada (si existe) al editar
      this.imagenArchivo = null;
    } else {
      console.log('Error: El Producto no tiene ID');
      this.snackBar.open('Error: El Producto no tiene ID', 'Cerrar', {
        duration: 3000,
        panelClass: ['snackbar-error']
      });
    }
  
    this.mostrarFormulario = true;
  
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
    this.mostrarFormulario = false; 
    this.editingProductoId = null;
    this.imagenArchivo = null;
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
  
  filtrarPorCategoria(categoriaId: string | null): void {
    this.categoriaSeleccionada.next(categoriaId);
  }

  filtrarProductos(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.filtroSubject.next(input.value.trim());
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

  abrirDialogoDetalles(producto: Producto): void {
    // Combinar observables de categorías y marcas
    combineLatest([
      this.categorias$.pipe(take(1)),
      this.marcas$.pipe(take(1))
    ]).subscribe(([categorias, marcas]) => {
      // Crear mapas para nombres
      const categoriaNombreMap = new Map<string, string>();
      const marcaNombreMap = new Map<string, string>();
  
      // Llenar mapa de categorías
      categorias.forEach(categoria => {
        categoriaNombreMap.set(categoria.id!, categoria.nombre);
      });
  
      // Llenar mapa de marcas
      marcas.forEach(marca => {
        marcaNombreMap.set(marca.id!, marca.nombre);
      });
  
      // Abrir diálogo con toda la información
      const dialogRef = this.dialog.open(ProductDetailDialogComponent, {
        width: '500px',
        data: {
          producto,
          categorias: this.categorias$,
          marcas: this.marcas$, // Nueva data
          categoriaNombreMap,
          marcaNombreMap, // Nuevo mapa
          nombreMarca: marcaNombreMap.get(producto.marcaId) || 'Sin marca', // Nombre directo
          editarProducto: (producto: Producto) => this.editarProducto(producto),
          eliminarProducto: (id: string | undefined) => this.eliminarProducto(id)
        }
      });
    });
  }
}

