import { Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormField } from '@angular/material/form-field';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-actualizar-cantidad-producto',
  standalone: true,
  imports:[MatDialogModule, ReactiveFormsModule, MatFormField, MatInputModule ],
  templateUrl: './actualizar-cantidad-producto.component.html',
  styleUrl: './actualizar-cantidad-producto.component.scss'
})
export class ActualizarCantidadProductoComponent implements OnInit{
  cantidadForm: FormGroup;
  stockActual: number;
  nombreProducto: string;
  nombreCategoria: string;

  constructor(private fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: any) {

    this.nombreProducto  = data.nombreProducto;
    this.nombreCategoria  = data.nombreCategoria;
    this.stockActual = data.stockActual;
    this.cantidadForm = this.fb.group({
      cantidadAdicional: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
  }
}
