import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
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
  clientes$?: Observable<Cliente[]>;
  clienteForm: FormGroup;
  editingClienteId: string | null = null;

  constructor(private firebaseService: FirebaseService, private fb: FormBuilder){
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
    this.clientes$ = this.firebaseService.getClientes();
  }

  onSubmit(): void {
    if (this.clienteForm.valid) {
      const clienteData: Cliente = this.clienteForm.value;
      if (this.editingClienteId) {
        // Actualizar el cliente existente
        this.firebaseService.updateCliente(this.editingClienteId, clienteData).subscribe({
          next: () => {
            this.loadClientes();
            this.resetFormAndEditingState(); // Limpia el formulario y restablece el estado de edición
          },
          error: (error) => console.error(error),
        });
      } else {
        // Agregar un nuevo cliente
        this.firebaseService.addCliente(clienteData).subscribe({
          next: () => {
            this.loadClientes();
            this.resetFormAndEditingState(); // Limpia el formulario y restablece el estado de edición
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
  
  deleteCliente(clienteId: string): void{
    this.firebaseService.deleteCliente(clienteId).subscribe(() => {
      alert('Cliente eliminado Correctamente');
      this.loadClientes();
    })
  }
  resetForm(): void {
    this.clienteForm.reset();
    this.editingClienteId = null; // Restablece el estado de edición
  }
}
