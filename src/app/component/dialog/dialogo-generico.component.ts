import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button'; // Para los botones
import { MatFormFieldModule } from '@angular/material/form-field'; // Si utilizas formularios

interface DialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Component({
  selector: 'app-dialogo-generico',
  templateUrl: './dialogo-generico.component.html',
  standalone: true,
    imports: [MatButtonModule, MatFormFieldModule, MatDialogModule],
})
export class DialogoGenericoComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogoGenericoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}
}
