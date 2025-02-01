import { Injectable } from '@angular/core';
import { Firestore, collection, doc, addDoc, onSnapshot, deleteDoc } from '@angular/fire/firestore';
import { Observable, BehaviorSubject, from, throwError, Subject, of } from 'rxjs';
import { catchError, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { Categoria } from '../interfaces/categoria.interface';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  private categoriasSubject = new BehaviorSubject<Categoria[]>([]);
  private unsubscribe$ = new Subject<void>();
  constructor(private firestore: Firestore, private authService: AuthService) {
    this.listenCategorias();
  }

  /**
   * Escucha cambios en la colección de categorías del usuario autenticado
   */
  private listenCategorias(): void {
    this.authService.getAuthState().pipe(
      switchMap(user => {
        if (!user) {
          this.categoriasSubject.next([]); // Limpia las categorías al cerrar sesión
          return of(null); // Termina aquí si no hay usuario
        }
        const categoriasRef = collection(this.firestore, `users/${user.uid}/categorias`);
        return new Observable<void>(observer => {
          onSnapshot(categoriasRef, snapshot => {
            const categorias = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }) as Categoria);
            this.categoriasSubject.next(categorias);
            observer.next();
          }, error => {
            console.error('Error al escuchar las categorías:', error);
            observer.error(error);
          });
        });
      }),
      takeUntil(this.unsubscribe$)
    ).subscribe();
  }

  /**
   * Obtiene las categorías en tiempo real
   */
  obtenerCategorias(): Observable<Categoria[]> {
    return this.categoriasSubject.asObservable();
  }

  /**
   * Agrega una nueva categoría
   */
  agregarCategoria(categoria: Categoria): Observable<string> {
    return this.authService.getUserId().pipe(
      take(1), 
      switchMap(userId => {
        if (!userId) {
          return throwError(() => new Error('Usuario no autenticado.'));
        }
        const categoriasRef = collection(this.firestore, `users/${userId}/categorias`);
        return from(addDoc(categoriasRef, categoria)).pipe(
          map(docRef => docRef.id),
          catchError(error => this.handleError('agregar la categoría', error))
        );
      })
    );
  }  

  /**
   * Elimina una categoría
   */
  eliminarCategoria(categoriaId: string): Observable<void> {
    return this.authService.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          // Si no hay usuario, lanzar un error más explícito
          return throwError(() => new Error('Usuario no autenticado.'));
        }
  
        const categoriaDoc = doc(this.firestore, `users/${userId}/categorias/${categoriaId}`);
        return from(deleteDoc(categoriaDoc)).pipe(
          catchError(error => this.handleError('eliminar la categoría', error))
        );
      }),
      catchError(error => {
        console.error('Error en la autenticación al eliminar la categoría:', error);
        return throwError(() => new Error('Error al eliminar la categoría.'));
      })
    );
  }

  private handleError(action: string, error: any): Observable<never> {
    console.error(`Error al ${action}:`, error);
    return throwError(() => new Error(`Error al ${action}`));
  }
}
