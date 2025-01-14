import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, doc, deleteDoc, onSnapshot } from '@angular/fire/firestore';
import { Observable, from, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Categoria } from '../interfaces/categoria.interface';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  private categoriasRef = collection(this.firestore, 'categorias'); // Referencia a la colección de categorías
  private categoriasSubject = new BehaviorSubject<Categoria[]>([]); // Sujeto para emitir las categorías

  constructor(private firestore: Firestore) {
    // Escucha en tiempo real los cambios en la colección
    this.listenCategorias();
  }

  /**
   * Escucha los cambios en la colección de categorías en tiempo real
   */
  private listenCategorias(): void {
    onSnapshot(this.categoriasRef, snapshot => {
      const categorias = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }) as Categoria);
      this.categoriasSubject.next(categorias); // Actualiza el valor del BehaviorSubject
    }, error => {
      console.error('Error al escuchar las categorías:', error);
    });
  }

  /**
   * Obtiene las categorías en tiempo real como un Observable
   * @returns Observable con la lista de categorías
   */
  obtenerCategorias(): Observable<Categoria[]> {
    return this.categoriasSubject.asObservable(); // Emite las categorías actuales
  }

  /**
   * Agrega una nueva categoría a Firestore
   * @param categoria La categoría a agregar
   * @returns Observable con el ID del documento agregado
   */
  agregarCategoria(categoria: Categoria): Observable<string> {
    if (!categoria.nombre) {
      return throwError(() => new Error('El nombre de la categoría es obligatorio'));
    }

    return from(addDoc(this.categoriasRef, categoria)).pipe(
      map(docRef => docRef.id),
      catchError(error => this.handleError('agregar la categoría', error))
    );
  }

  /**
   * Elimina una categoría de Firestore
   * @param categoriaId El ID de la categoría a eliminar
   * @returns Observable vacío cuando se elimina la categoría
   */
  eliminarCategoria(categoriaId: string): Observable<void> {
    const categoriaDoc = doc(this.firestore, `categorias/${categoriaId}`);
    return from(deleteDoc(categoriaDoc)).pipe(
      catchError(error => this.handleError('eliminar la categoría', error))
    );
  }

  /**
   * Maneja los errores y los muestra en consola
   * @param action La acción que generó el error
   * @param error El error capturado
   * @returns Un observable que emite el error
   */
  private handleError(action: string, error: any): Observable<never> {
    console.error(`Error al ${action}:`, error);
    return throwError(() => new Error(`Error al ${action}`));
  }
}
