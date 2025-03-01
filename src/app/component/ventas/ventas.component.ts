import { Component, NgZone, OnInit } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable, Subject, forkJoin, of, throwError } from 'rxjs';
import { switchMap, map, catchError, tap } from 'rxjs/operators';
import { Cliente } from '../../interfaces/cliente.interface';
import { Producto } from '../../interfaces/producto.interface';
import { Venta, DetalleVenta } from '../../interfaces/ventas.interface';
import { ProductoService } from '../../services/producto.service';
import { AuthService } from '../../services/auth.service';
import { FirebaseService } from '../../services/firebaseService.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule, CommonModule],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.scss']
})
export class VentasComponent implements OnInit {
  ventaForm: FormGroup;
  nuevoClienteForm: FormGroup;
  clientes$: Observable<Cliente[]> = of([]);
  productos$: Observable<Producto[]> = of([]);
  userId: string | null = null;
  
  mostrarFormularioCliente: boolean = false;

  private unsubscribe$ = new Subject<void>();
  constructor(
    private fb: FormBuilder,
    private productoService: ProductoService,
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private snackBar: MatSnackBar,
    private zone: NgZone
  ) {
    // Inicializamos el formulario de venta
    this.ventaForm = this.fb.group({
      clienteId: ['', Validators.required],
      detalles: this.fb.array([], Validators.required)
    });
    this.nuevoClienteForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.email, Validators.required]],
      telefono: ['', Validators.required],
      // Puedes agregar otros campos si los necesitas (ej. dirección)
    });
  }
  
  ngOnInit(): void {
    // Obtener el userId y cargar productos y clientes
    this.authService.getUserId().subscribe(userId => {
      this.userId = userId;
      if (userId) {
        this.productos$ = this.productoService.obtenerProductos();
        // Supongamos que FirebaseService.getClientes(userId) retorna Observable<Cliente[]>
        this.clientes$ = this.firebaseService.getClientes();
      }
    });
    this.agregarDetalle();
  }
  
  // Getter para la matriz de detalles (líneas de venta)
  get detalles(): FormArray {
    return this.ventaForm.get('detalles') as FormArray;
  }
  
  // Agrega un detalle (línea de venta) al formulario
  agregarDetalle(): void {
    const detalleFormGroup = this.fb.group({
      productoId: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precioVenta: [{ value: 0, disabled: true }, Validators.required]
    });
    this.detalles.push(detalleFormGroup);
  }
  
  // Elimina un detalle por índice
  eliminarDetalle(index: number): void {
    this.detalles.removeAt(index);
  }
  
  // Cuando se seleccione un producto en un detalle, carga su precioVenta
  onProductoChange(detalle: AbstractControl): void {
    const detalleGroup = detalle as FormGroup;
    const productoId = detalleGroup.get('productoId')?.value;
    if (productoId && this.userId) {
      this.productoService.obtenerProductoPorId(productoId).subscribe(producto => {
        detalleGroup.get('precioVenta')?.setValue(producto.precioVenta);
      });
    }
  }
  
  // Calcula el total de la venta basado en los detalles
  calcularTotal(): number {
    return this.detalles.controls.reduce((total, detalleGroup) => {
      const cantidad = detalleGroup.get('cantidad')?.value || 0;
      const precioVenta = detalleGroup.get('precioVenta')?.value || 0;
      return total + cantidad * precioVenta;
    }, 0);
  }
  
  // Envía la venta: actualiza stock y luego registra la venta en Firestore
  onSubmit(): void {
    if (this.ventaForm.valid && this.userId) {
      const venta: Venta = {
        clienteId: this.ventaForm.value.clienteId,
        fecha: new Date(),
        total: this.calcularTotal(),
        detalles: this.ventaForm.value.detalles
      };
      
      // Actualizar el stock para cada detalle y luego registrar la venta
      const stockUpdates = venta.detalles.map((detalle: DetalleVenta) =>
        this.productoService.obtenerProductoPorId(detalle.productoId).pipe(
          switchMap(producto => {
            const nuevaCantidad = producto.cantidad - detalle.cantidad;
            if (nuevaCantidad < 0) {
              return throwError(() => new Error(`Stock insuficiente para ${producto.nombre}`));
            }
            return this.productoService.actualizarProducto(detalle.productoId, { cantidad: nuevaCantidad });
          })
        )
      );
      
      forkJoin(stockUpdates).pipe(
        switchMap(() => this.firebaseService.agregarVenta(venta))
      ).subscribe({
        next: () => {
          // Ejecutar dentro de Angular zone para que se actualice la UI
          this.zone.run(() => {
            this.snackBar.open('Venta registrada con éxito', 'Cerrar', { duration: 3000 });
            this.ventaForm.reset();
            this.detalles.clear();
            this.agregarDetalle();
          });
        },
        error: (err: any) => {
          this.snackBar.open('Error al registrar la venta: ' + err.message, 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

  toggleFormularioCliente(): void {
    this.mostrarFormularioCliente = !this.mostrarFormularioCliente;
  }

  onSubmitCliente(): void {
    if (this.nuevoClienteForm.valid) {
      const clienteData = this.nuevoClienteForm.value;
      this.firebaseService.addCliente(clienteData).subscribe({
        next: () => {
          this.snackBar.open('Cliente agregado con éxito', 'Cerrar', { duration: 3000 });
          // Invalida la caché
          this.firebaseService['clientesCache'] = null;
          this.firebaseService['lastFetch'] = 0;
          // Recargar la lista de clientes inmediatamente
          this.clientes$ = this.firebaseService.getClientes();
          this.nuevoClienteForm.reset();
          this.mostrarFormularioCliente = false;
        },
        error: (err: any) => {
          this.snackBar.open('Error al agregar el cliente: ' + err.message, 'Cerrar', { duration: 3000 });
        }
      });
    }
  }

    // Método para cancelar la venta (resetear el formulario)
    cancelar(): void {
      this.ventaForm.reset();
    }  

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}
