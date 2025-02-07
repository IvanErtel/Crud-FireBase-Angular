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
import { map, Observable } from 'rxjs';

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
  isLoggedIn$: Observable<boolean> = new Observable();
  selectedAvatar = './assets/default-avatar.png';

  availableAvatars = [
    './assets/default-avatar.png',
    './assets/default-avatar2.png',
    './assets/default-avatar3.png',
    './assets/default-avatar4.png',
    './assets/default-avatar5.png'
  ];
  userName: string | null = null;
  userPhoto: string | null = null;

  constructor(
    private fb: FormBuilder,
     private authService: AuthService,
     private snackBar: MatSnackBar,
     private router: Router
     ) {
      this.loginForm = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', Validators.required]
      }, { validators: this.passwordMatchValidator });
  }
  
  ngOnInit() {
    this.isLoggedIn$ = this.authService.getAuthState().pipe(
      map(user => !!user) // Devuelve true si hay usuario logueado
    );
  
    this.authService.getAuthState().subscribe(user => {
      if (user) {
        this.authService.getUserProfile().subscribe(profile => {
          this.userName = user.displayName ? user.displayName : (user.email ? user.email.substring(0, 8) : 'Usuario');
          this.userPhoto = profile.photoURL || './assets/default-avatar.png';
        });
      }
    });
  }
  
  
  passwordMatchValidator(fg: FormGroup) {
    const password = fg.get('password')?.value;
    const confirmPasswordControl = fg.get('confirmPassword');
  
    if (!confirmPasswordControl) return null; // No validar si no hay confirmación
  
    const confirmPassword = confirmPasswordControl.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  toggleVisibility() {
    this.hide = !this.hide;
  }

  changeAvatar(avatar: string) {
    this.userPhoto = avatar;
    this.authService.updateAvatar(avatar);
    localStorage.setItem('selectedAvatar', avatar);
  }
  
  toggleConfirmVisibility() {
    this.hideConfirm = !this.hideConfirm;
  }

  login(): void {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: () => {
          this.snackBar.open('Login exitoso', 'Cerrar', { duration: 2000 });
          this.router.navigate(['/clientes']);
        },
        error: (error) => {
          this.snackBar.open('Error al iniciar sesión: ' + error.message, 'Cerrar', { duration: 2000 });
        },
      });
    }
  }
  
  logout() {
    this.authService.logout().subscribe(() => {
      this.userPhoto = './assets/default-avatar.png';
      this.router.navigate(['/login']);
    });
  }
  
}
