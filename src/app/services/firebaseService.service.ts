import { Injectable, NgModule } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, deleteDoc, addDoc, getDocs, DocumentSnapshot, orderBy, query, startAfter, limit } from 'firebase/firestore';
import { environment } from '../../environments/environment';
import { from, Observable, map, of, switchMap, tap } from 'rxjs';
import { Cliente } from '../interfaces/cliente.interface';
import { updateDoc } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Venta } from '../interfaces/ventas.interface';

@Injectable({
  providedIn: 'root',
})

export class FirebaseService {
  private app = initializeApp(environment.firebaseConfig);
  private db = getFirestore(this.app);
  private clientesCache: Cliente[] | null = null;
  private lastFetch: number = 0;
  private cacheDuration = 5 * 60 * 1000;

  constructor(private authService: AuthService) {
    this.authService.getAuthState().subscribe(user => {
      if (!user) {
        this.clientesCache = null; 
        this.lastFetch = 0;
      }
    });
  }

  // Agrega un nuevo cliente y devuelve un Observable del ID del documento creado
  addCliente(cliente: Omit<Cliente, 'id'>): Observable<void> {
    return this.authService.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          throw new Error('Usuario no autenticado');
        }
        const collectionRef = collection(this.db, `users/${userId}/clientes`);
        return from(addDoc(collectionRef, cliente)).pipe(
          map(() => void 0) // Convertir DocumentReference a void
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

  agregarVenta(venta: Venta): Observable<string> {
    return this.authService.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          throw new Error('Usuario no autenticado');
        }
        const ventasRef = collection(this.db, `users/${userId}/ventas`);
        return from(addDoc(ventasRef, venta)).pipe(
          map(docRef => docRef.id)
        );
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
