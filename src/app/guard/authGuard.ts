import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { map, Observable, from } from 'rxjs';
import { AuthService } from '../services/auth.service'; 
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router, private afAuth: AngularFireAuth) {}

  getAuthState(): Observable<any> {
    return this.afAuth.authState;
  }
    // Método para cerrar sesión
    logout(): Observable<void> {
      return from(this.afAuth.signOut());
    }

  canActivate(): Observable<boolean> {
    return this.authService.getAuthState().pipe(
      map((user) => {
        if (user) {
          return true;
        } else {
          this.router.navigate(['/login']);
          return false;
        }
      })
    );
  }
}
