import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { from, Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private unsubscribe$ = new Subject<void>();
  
  constructor(private afAuth: AngularFireAuth,) {}

  // Iniciar sesión
  login(email: string, password: string): Observable<any> {
    return from(this.afAuth.signInWithEmailAndPassword(email, password));
  }

  // Cerrar sesión
  logout(): Observable<void> {
    this.unsubscribe$.next();  
    this.unsubscribe$.complete(); 
    return from(this.afAuth.signOut()); 
  }

  // Obtener el estado de autenticación del usuario
  getAuthState(): Observable<any> {
    return this.afAuth.authState;
  }

  // Obtener el userId (uid) del usuario autenticado
  getUserId(): Observable<string | null> {
    return this.afAuth.authState.pipe(
      map(user => {
        if (user) {
          return user.uid;  // Retorna el UID del usuario autenticado
        } else {
          throw new Error('Usuario no autenticado');  // Si no hay usuario autenticado, lanza un error
        }
      })
    );
  }
}
