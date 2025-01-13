import { Injectable, NgModule } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, deleteDoc, addDoc, getDocs, DocumentSnapshot, orderBy, query, startAfter, limit } from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { from, Observable, map, of, switchMap } from 'rxjs';
import { Cliente } from '../interfaces/cliente.interface';
import { updateDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})

export class FirebaseService {
  private app = initializeApp(environment.firebaseConfig);
  private db = getFirestore(this.app);
  private clientesCache: Cliente[] | null = null;
  private lastFetch: number = 0;
  private cacheDuration = 5 * 60 * 1000;

  constructor(private authService: AuthService) {}

  // Agrega un nuevo cliente y devuelve un Observable del ID del documento creado
  addCliente(cliente: Cliente): Observable<string> {
    return this.authService.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          throw new Error('Usuario no autenticado');
        }
        const userClientesRef = collection(this.db, `users/${userId}/clientes`);
        return from(addDoc(userClientesRef, cliente)).pipe(
          map(docRef => docRef.id)
        );
      })
    );
  }

  // Obtiene todos los clientes como un Observable de un array de clientes
  getClientes(limitNumber: number = 10, lastInResponse?: DocumentSnapshot<Cliente>): Observable<Cliente[]> {
    return this.authService.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          throw new Error('Usuario no autenticado');
        }
        const userClientesRef = collection(this.db, `users/${userId}/clientes`);
        if (lastInResponse) {
          const nextQuery = query(userClientesRef, orderBy('nombre'), startAfter(lastInResponse), limit(limitNumber));
          return from(getDocs(nextQuery)).pipe(
            map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Cliente))
          );
        }
        if (this.clientesCache && (Date.now() - this.lastFetch) < this.cacheDuration) {
          return of(this.clientesCache);
        } else {
          const initialQuery = query(userClientesRef, orderBy('nombre'), limit(limitNumber));
          return from(getDocs(initialQuery)).pipe(
            map(snapshot => {
              const clientes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Cliente);
              if (!lastInResponse) {
                this.clientesCache = clientes;
                this.lastFetch = Date.now();
              }
              return clientes;
            })
          );
        }
      })
    );
  }

  // Actualiza un cliente existente y devuelve un Observable de void
  updateCliente(clienteId: string, cliente: Omit<Cliente, 'id'>): Observable<void> {
    return this.authService.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          throw new Error('Usuario no autenticado');
        }
        const docRef = doc(this.db, `users/${userId}/clientes`, clienteId);
        return from(updateDoc(docRef, cliente));
      })
    );
  }

  // Elimina un cliente y devuelve un Observable de void
  deleteCliente(clienteId: string): Observable<void> {
    return this.authService.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          throw new Error('Usuario no autenticado');
        }
        const docRef = doc(this.db, `users/${userId}/clientes`, clienteId);
        return from(deleteDoc(docRef));
      })
    );
  }
}
