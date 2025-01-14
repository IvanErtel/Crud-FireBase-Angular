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

  onConfirm(): void {
    this.dialogRef.close(true); // Cierra el diálogo y pasa el valor 'true' para indicar que se confirmó
  }

  onCancel(): void {
    this.dialogRef.close(false); // Cierra el diálogo y pasa el valor 'false' para indicar que se canceló
  }
  
}
