import { Injectable, NgModule } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, deleteDoc, addDoc, getDocs } from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { from, Observable, map } from 'rxjs';
import { Cliente } from '../interfaces/cliente.interface';
import {  updateDoc } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root',
})

export class FirebaseService {
  private app = initializeApp(environment.firebaseConfig);
  private db = getFirestore(this.app);

  constructor() {}

  // Agrega un nuevo cliente y devuelve un Observable del ID del documento creado
  addCliente(cliente: Cliente): Observable<string> {
    return from(addDoc(collection(this.db, 'clientes'), cliente)).pipe(
      map(docRef => docRef.id)
      );
  }

  // Obtiene todos los clientes como un Observable de un array de clientes
  getClientes(): Observable<Cliente[]> {
    return from(getDocs(collection(this.db, 'clientes'))).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Cliente))
    );
  }

  // Actualiza un cliente existente y devuelve un Observable >de void
  updateCliente(clienteId: string, cliente: Omit<Cliente, 'id'>): Observable<void> {
    const docRef = doc(this.db, 'clientes', clienteId);
    return from(updateDoc(docRef, cliente));
  }

  // Elimina un cliente y devuelve un Observable de void
  deleteCliente(clienteId: string): Observable<void> {
    const docRef = doc(this.db, 'clientes', clienteId);
    return from(deleteDoc(docRef));
  }
}
