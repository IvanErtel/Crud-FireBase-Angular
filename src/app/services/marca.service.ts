// marca.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, onSnapshot, deleteDoc, collectionData } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, from, throwError, Subject, of } from 'rxjs';
import { catchError, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { Marca } from '../interfaces/marca.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class MarcaService {
  private marcasSubject = new BehaviorSubject<Marca[]>([]);
  private unsubscribe$ = new Subject<void>();

  constructor(private firestore: Firestore, private authService: AuthService) {
    this.listenMarcas();
  }

  /**
   * Escucha cambios en la colección de marcas del usuario autenticado
   */
  private listenMarcas(): void {
    this.authService.getAuthState().pipe(
      switchMap(user => {
        if (!user) {
          this.marcasSubject.next([]);
          return of(null);
        }
        const marcasRef = collection(this.firestore, `users/${user.uid}/marcas`);
        return new Observable<void>(observer => {
          onSnapshot(marcasRef, snapshot => {
            const marcas = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }) as Marca);
            this.marcasSubject.next(marcas);
            observer.next();
          }, error => {
            console.error('Error al escuchar las marcas:', error);
            observer.error(error);
          });
        });
      }),
      takeUntil(this.unsubscribe$)
    ).subscribe();
  }

  /**
   * Obtiene las marcas en tiempo real
   */
  obtenerMarcas(): Observable<Marca[]> {
    return this.authService.getUserId().pipe(
      switchMap(userId => {
        const marcasRef = collection(this.firestore, `users/${userId}/marcas`);
        return collectionData(marcasRef, { idField: 'id' }) as Observable<Marca[]>;
      })
    );
  }

  /**
   * Agrega una nueva marca
   */
  agregarMarca(marca: Marca): Observable<string> {
    return this.authService.getUserId().pipe(
      take(1), 
      switchMap(userId => {
        if (!userId) {
          return throwError(() => new Error('Usuario no autenticado.'));
        }
        const marcasRef = collection(this.firestore, `users/${userId}/marcas`);
        return from(addDoc(marcasRef, marca)).pipe(
          map(docRef => docRef.id),
          catchError(error => this.handleError('agregar la marca', error))
        );
      })
    );
  }

  /**
   * Elimina una marca
   */
  eliminarMarca(marcaId: string): Observable<void> {
    return this.authService.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          return throwError(() => new Error('Usuario no autenticado.'));
        }
        const marcaDoc = doc(this.firestore, `users/${userId}/marcas/${marcaId}`);
        return from(deleteDoc(marcaDoc)).pipe(
          catchError(error => this.handleError('eliminar la marca', error))
        );
      }),
      catchError(error => {
        console.error('Error en la autenticación al eliminar la marca:', error);
        return throwError(() => new Error('Error al eliminar la marca.'));
      })
    );
  }

  private handleError(action: string, error: any): Observable<never> {
    console.error(`Error al ${action}:`, error);
    return throwError(() => new Error(`Error al ${action}`));
  }
}