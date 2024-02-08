import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { from, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private afAuth: AngularFireAuth) {}

  // Iniciar sesión
  login(email: string, password: string): Observable<any> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password));
  }

  // Cerrar sesión
  logout(): Observable<void> {
    return from(this.afAuth.signOut());
  }

  // Obtener el estado de autenticación del usuario
  getAuthState(): Observable<any> {
    return this.afAuth.authState;
  }
}
