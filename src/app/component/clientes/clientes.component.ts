import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of, takeUntil } from 'rxjs';
import { FirebaseService } from '../../services/firebaseService.service';
import { Cliente } from '../../interfaces/cliente.interface';
import { RouterLink, RouterModule, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../navbar/navbar.component';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    RouterOutlet,RouterLink,RouterModule,NavbarComponent,
    ReactiveFormsModule, 
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatButtonModule,
    MatTableModule 
  ],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit{
  clientes$: BehaviorSubject<Cliente[]> = new BehaviorSubject<Cliente[]>([]);
  clienteForm: FormGroup;
  editingClienteId: string | null = null;
  private unsubscribe$ = new Subject<void>();

  constructor(private firebaseService: FirebaseService, 
    private fb: FormBuilder,
    private snackBar: MatSnackBar){
    this.clienteForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [ Validators.email]],
      telefono: ['', Validators.required],
    })
  }

  ngOnInit(): void {
    this.loadClientes();
  }

  loadClientes(): void {
    this.firebaseService.getClientes().pipe(takeUntil(this.unsubscribe$)).subscribe(clientes => {
      this.clientes$.next(clientes); // Asigna los datos directamente al BehaviorSubject.
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(); // Señala que se va a desuscribir
    this.unsubscribe$.complete(); // Completa el Subject para prevenir fugas de memoria
  }

  onSubmit(): void {
    if (this.clienteForm.valid) {
      const clienteData: Cliente = this.clienteForm.value;
      if (this.editingClienteId) {
        this.firebaseService.updateCliente(this.editingClienteId, clienteData).subscribe({
          next: () => {
            this.snackBar.open('Cliente actualizado con éxito', 'Cerrar', { duration: 3000 });
            this.loadClientes();  // Esto garantiza la recarga.
            this.resetFormAndEditingState();
          },
          error: (error) => console.error(error),
        });
      } else {
        this.firebaseService.addCliente(clienteData).subscribe({
          next: () => {
            this.snackBar.open('Nuevo cliente cargado con éxito', 'Cerrar', { duration: 3000 });
            this.loadClientes();  // Recarga la lista después de agregar.
            this.resetFormAndEditingState();
          },
          error: (error) => console.error(error),
        });
      }
    }
  }  
  
  resetFormAndEditingState(): void {
    this.clienteForm.reset();
    this.editingClienteId = null; // Restablece el ID de edición
  }

  editCliente(cliente: Cliente): void {
    this.editingClienteId = cliente.id;
    this.clienteForm.setValue({
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono,
    });
  }
  
  deleteCliente(clienteId: string): void {
    this.firebaseService.deleteCliente(clienteId).subscribe({
      next: () => {
        this.snackBar.open('Cliente eliminado correctamente', 'Cerrar', { duration: 3000 });
        this.loadClientes();
      },
      error: (error) => console.error(error),
    });
  }

  resetForm(): void {
    this.clienteForm.reset();
    this.editingClienteId = null; // Restablece el estado de edición
  }
}
