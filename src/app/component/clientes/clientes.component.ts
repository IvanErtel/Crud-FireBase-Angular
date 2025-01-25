import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { defaultIfEmpty, map, startWith, takeUntil } from 'rxjs/operators';
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
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    RouterOutlet, RouterLink, RouterModule, NavbarComponent,
    ReactiveFormsModule, 
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatButtonModule,
    MatTableModule,
    MatProgressSpinnerModule, 
  ],
  templateUrl: './clientes.component.html',
  styleUrl: './clientes.component.scss'
})
export class ClientesComponent implements OnInit, OnDestroy {
  clientes$: BehaviorSubject<Cliente[]> = new BehaviorSubject<Cliente[]>([]);
  clientesFiltrados$!: Observable<Cliente[]>;
  filtro: BehaviorSubject<string> = new BehaviorSubject<string>('');

  clienteForm: FormGroup;
  editingClienteId: string | null = null;
  mostrarFormulario = false;
  cargandoClientes = true; 
  cargandoGuardar = false; 
  private unsubscribe$ = new Subject<void>();

  clientesDataSource: MatTableDataSource<Cliente> = new MatTableDataSource();

  constructor(
    private firebaseService: FirebaseService, 
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {
    this.clienteForm = this.fb.group({
      nombre: ['', Validators.required],
      email: ['', [Validators.email]],
      telefono: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Cargar clientes desde Firebase
    this.loadClientes();

    // Combinamos la lista de clientes con el filtro de búsqueda
    this.clientesFiltrados$ = combineLatest([
      this.clientes$.pipe(map(clientes => clientes || [])),
      this.filtro.asObservable()
    ]).pipe(
      map(([clientes, filtro]) => {
        const clientesFiltrados = clientes.filter(cliente =>
          cliente.nombre.toLowerCase().includes(filtro.toLowerCase())
        );
        return clientesFiltrados;
      }),
      startWith([]) // Emite un array vacío inicialmente
    );

    // Actualizamos el MatTableDataSource cada vez que clientesFiltrados$ emite
    this.clientesFiltrados$.subscribe(clientesFiltrados => {
      this.clientesDataSource.data = clientesFiltrados;
    });
  }

  loadClientes(): void {
    this.firebaseService.getClientes()
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe(clientes => {
        this.clientes$.next(clientes);
        this.cargandoClientes = false;
      }, error => {
        this.snackBar.open('Error al cargar los clientes', 'Cerrar', {
          duration: 3000
        });
        this.cargandoClientes = false;
      });
  }

  actualizarFiltro(event: Event): void {
    // Actualizar el valor del filtro según lo que escriba el usuario
    const input = event.target as HTMLInputElement;
    this.filtro.next(input.value);
  }

  toggleFormulario(): void {
    // Mostrar u ocultar el formulario
    this.mostrarFormulario = !this.mostrarFormulario;
    if (!this.mostrarFormulario) {
      this.resetFormAndEditingState(); // Resetear el formulario al cerrarlo
    }
  }

  onSubmit(): void {
    if (this.clienteForm.valid) {
      const clienteData: Cliente = this.clienteForm.value;
  
      if (this.editingClienteId) {
        // Si se está editando un cliente existente
        this.firebaseService.updateCliente(this.editingClienteId, clienteData).subscribe({
          next: () => {
            this.snackBar.open('Cliente actualizado con éxito', 'Cerrar', { duration: 3000 });
            this.loadClientes(); // Recargar la lista de clientes
            this.toggleFormulario(); // Cerrar formulario
          },
          error: () => {
            this.snackBar.open('Error al actualizar el cliente', 'Cerrar', { duration: 3000 });
          }
        });
      } else {
        // Si es un cliente nuevo
        this.firebaseService.addCliente(clienteData).subscribe({
          next: () => {
            this.snackBar.open('Cliente guardado con éxito', 'Cerrar', { duration: 3000 });
            this.loadClientes(); // Recargar la lista de clientes
            this.toggleFormulario(); // Cerrar formulario
          },
          error: () => {
            this.snackBar.open('Error al guardar el cliente', 'Cerrar', { duration: 3000 });
          }
        });
      }
    }
  }

  resetFormAndEditingState(): void {
    this.clienteForm.reset();
    this.editingClienteId = null;
  }

  editCliente(cliente: Cliente): void {
    // Rellenar el formulario con los datos del cliente a editar
    this.editingClienteId = cliente.id;
    this.clienteForm.setValue({
      nombre: cliente.nombre,
      email: cliente.email,
      telefono: cliente.telefono
    });
  }

  deleteCliente(clienteId: string): void {
    // Eliminar cliente y recargar la lista
    this.firebaseService.deleteCliente(clienteId).subscribe({
      next: () => {
        this.snackBar.open('Cliente eliminado correctamente', 'Cerrar', { duration: 3000 });
        this.loadClientes();
      },
      error: () => {
        this.snackBar.open('Error al eliminar el cliente', 'Cerrar', { duration: 3000 });
      }
    });
  }

  resetForm(): void {
    this.clienteForm.reset();
    this.editingClienteId = null;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

}