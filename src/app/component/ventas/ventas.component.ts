import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Observable, of, switchMap } from 'rxjs';
import { Cliente } from '../../interfaces/cliente.interface';
import { ProductoService } from '../../services/producto.service';
import { AuthService } from '../../services/auth.service';
import { Producto } from '../../interfaces/producto.interface';
import { FirebaseService } from '../../services/firebaseService.service';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [ReactiveFormsModule, 
  MatButtonModule, 
  MatFormFieldModule,
  MatInputModule, 
  MatSelectModule, 
  MatIcon, CommonModule],
  templateUrl: './ventas.component.html',
  styleUrl: './ventas.component.scss'
})

export class VentasComponent implements OnInit {
  ventaForm: FormGroup = this.fb.group({
    clienteId: ['', Validators.required],
    detalles: this.fb.array([], Validators.required),
  });
  clientes$: Observable<Cliente[]> = of([]);
  productos$: Observable<Producto[]> = of([]);
  role: string = '';
  userId: string | null = null;
  
  constructor(private fb: FormBuilder, private productoService: ProductoService, private authService: AuthService, private firebaseService : FirebaseService) {}

  ngOnInit(): void {
    // Inicializar el formulario aquí
    this.ventaForm = this.fb.group({
      clienteId: ['',],
      detalles: this.fb.array([], Validators.required),
    });
  
    // Obtener el userId del usuario actual
    this.authService.getCurrentUserId().pipe(
      switchMap(userId => {
        if (userId) {
          this.productos$ = this.productoService.obtenerProductos(userId);
          this.clientes$ = this.firebaseService.getClientes(userId); // Asumiendo que obtenerClientes también necesita un userId
          return of(null); // Esto es solo para satisfacer el retorno de switchMap
        } else {
          // Manejar el caso de no tener un userId, por ejemplo, no cargamos productos ni clientes
          return of(null);
        }
      })
    ).subscribe(); 
  }

  get detalles(): FormArray {
    return this.ventaForm.get('detalles') as FormArray;
  }

  agregarDetalle(): void {
    const detalleFormGroup = this.fb.group({
      productoId: ['', Validators.required],
      cantidad: [0, [Validators.required, Validators.min(1)]],
      precioVenta: [{value: 0, disabled: true}, Validators.required],
    });
    this.detalles.push(detalleFormGroup);
  }

  eliminarDetalle(index: number): void {
    this.detalles.removeAt(index);
  }

  calcularTotal(): number {
    return this.detalles.controls.reduce((acc, curr) => {
      const cantidad = curr.get('cantidad')?.value || 0;
      const precioVenta = curr.get('precioVenta')?.value || 0;
      return acc + (cantidad * precioVenta);
    }, 0);
  }
  cancelar(): void {
    this.ventaForm.reset(); 
  }
  onSubmit(): void {
    console.log(this.ventaForm.value);
  }
}
