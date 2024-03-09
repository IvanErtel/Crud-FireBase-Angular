import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FirebaseService } from '../../services/firebaseService.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatIconModule],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss'
})
export class UsuariosComponent {
  userForm: FormGroup;
  hide = true;
  usuarios: any[] = [];
  
  constructor(private fb: FormBuilder, private authService: AuthService,private firebaseService: FirebaseService) {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['user', Validators.required]
    });
  }
  
  ngOnInit() {

  }

  createUser() {
    if (this.userForm.valid) {
      const { email, password, role } = this.userForm.value;
      this.authService.createUser(email, password, role).subscribe({
        next: (uid) => console.log(`Usuario creado con UID: ${uid}`),
        error: (error) => console.error(error)
      });
    }
  }
}
