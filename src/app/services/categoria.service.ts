// services/categoria.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Categoria } from '../interfaces/categoria.interface';

@Injectable({
  providedIn: 'root',
})
export class CategoriaService {
  constructor(private firestore: Firestore) {}

  obtenerCategorias(): Observable<Categoria[]> {
    const categoriasRef = collection(this.firestore, 'categorias');
    return from(getDocs(categoriasRef)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Categoria))
    );
  }

  agregarCategoria(categoria: Categoria): Observable<string> {
    const categoriasRef = collection(this.firestore, 'categorias');
    return from(addDoc(categoriasRef, categoria)).pipe(map(docRef => docRef.id));
  }
}
