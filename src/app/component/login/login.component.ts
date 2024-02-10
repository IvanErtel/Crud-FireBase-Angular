import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service'; 
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CommonModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  email = '';
  password = '';
  hide = true;
  hideConfirm = true;
  isLoggedIn = false;

  constructor(
    private fb: FormBuilder,
     private authService: AuthService,
     private snackBar: MatSnackBar,
     private router: Router
     ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['']
    }, {Validators: this.passwordMatchValidator });
  }
  
  ngOnInit() {
    this.authService.getAuthState().subscribe(user => {
      this.isLoggedIn = !!user;
      if (this.isLoggedIn) {
        // Extrae y oculta parte del email si es necesario
        const email = user.email;
        this.email = email.replace(/(.{2}).+(@.+)/, "$1***$2");
      }
    });
  }
  
  passwordMatchValidator(fg: FormGroup) {
    const password = fg.get('password')?.value;
    const confirmPassword = fg.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  toggleVisibility() {
    this.hide = !this.hide;
  }

  toggleConfirmVisibility() {
    this.hideConfirm = !this.hideConfirm;
  }

 login(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: (result) => {
          this.isLoggedIn = true;
          this.snackBar.open('Login successful', 'Close', { duration: 2000 });
          this.router.navigate(['/clientes']); // Ajusta esta ruta según sea necesario
        },
        error: (error) => {
          console.error('Login failed', error);
          this.snackBar.open('Login failed: ' + error.message, 'Close', { duration: 2000 });
        },
      });
    }
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.isLoggedIn = false;
      console.log('Usuario deslogueado con éxito');
    });
  }
}
