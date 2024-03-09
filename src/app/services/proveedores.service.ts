import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query } from 'firebase/firestore';
import { from, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Proveedor } from '../interfaces/proveedor.interface';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProveedorService {
  private db = getFirestore(initializeApp(environment.firebaseConfig));

  constructor() {}

  // Método para obtener todos los proveedores
  getProveedores(userId: string): Observable<Proveedor[]> {
    const proveedoresRef = query(collection(this.db, `usuarios/${userId}/proveedores`));
    return from(getDocs(proveedoresRef)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Proveedor })))
    );
  }

  // Método para agregar un nuevo proveedor
  addProveedor(proveedor: Proveedor, userId: string): Observable<string> {
    return from(addDoc(collection(this.db, `usuarios/${userId}/proveedores`), proveedor)).pipe(
      map(docRef => docRef.id)
    );
  }

  // Método para actualizar un proveedor existente
  updateProveedor(proveedorId: string, proveedor: Partial<Proveedor>, userId: string): Observable<void> {
    const docRef = doc(this.db, `usuarios/${userId}/proveedores`, proveedorId);
    return from(updateDoc(docRef, proveedor));
  }

  // Método para eliminar un proveedor
  deleteProveedor(proveedorId: string, userId: string): Observable<void> {
    const docRef = doc(this.db, `usuarios/${userId}/proveedores`, proveedorId);
    return from(deleteDoc(docRef));
  }
}
