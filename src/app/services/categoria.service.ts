import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Categoria } from '../interfaces/categoria.interface';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  constructor(private firestore: Firestore) {}

  obtenerCategorias(): Observable<Categoria[]> {
    const categoriasRef = collection(this.firestore, 'categorias');
    return from(getDocs(categoriasRef)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Categoria)),
      catchError(error => {
        console.error('Error al obtener las categorías:', error);
        return [];
      })
    );
  }

  agregarCategoria(categoria: Categoria): Observable<string> {
    const categoriasRef = collection(this.firestore, 'categorias');
    
    // Verificar que la categoría tenga los datos necesarios antes de agregarla
    if (!categoria.nombre) {
      throw new Error('El nombre de la categoría es obligatorio');
    }

    return from(addDoc(categoriasRef, categoria)).pipe(
      map(docRef => docRef.id),
      catchError(error => {
        console.error('Error al agregar la categoría:', error);
        throw error;
      })
    );
  }
}
