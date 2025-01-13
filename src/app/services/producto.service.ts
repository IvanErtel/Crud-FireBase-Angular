import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, deleteDoc, query, where, collectionData, getDoc } from '@angular/fire/firestore';
import { Observable, forkJoin, from } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { Producto } from '../interfaces/producto.interface';
import { AuthService } from './auth.service'; // Servicio para obtener el userId actual

@Injectable({
    providedIn: 'root',
})
export class ProductoService {
    constructor(
        private firestore: Firestore,
        private authService: AuthService
    ) {}

    agregarProducto(producto: Producto): Observable<string> {
        return this.authService.getUserId().pipe(
            switchMap(userId => {
                if (!userId) {
                    throw new Error('Usuario no autenticado');
                }
                const productosRef = collection(this.firestore, 'productos');
                return from(addDoc(productosRef, { ...producto, userId })).pipe(
                    map(docRef => docRef.id)
                );
            })
        );
    }

    obtenerProductos(): Observable<Producto[]> {
        return this.authService.getUserId().pipe(
            switchMap(userId => {
                if (!userId) {
                    throw new Error('Usuario no autenticado');
                }
                const productosRef = collection(this.firestore, 'productos');
                const q = query(productosRef, where('userId', '==', userId));
                return collectionData(q, { idField: 'id' }) as Observable<Producto[]>;
            })
        );
    }

    eliminarProducto(id: string): Observable<void> {
        return this.authService.getUserId().pipe(
            switchMap(userId => {
                if (!userId) {
                    throw new Error('Usuario no autenticado');
                }
                return this.obtenerProductoPorId(id).pipe(
                    switchMap(producto => {
                        if (producto.userId !== userId) {
                            throw new Error('No autorizado para eliminar este producto');
                        }
                        const productoRef = doc(this.firestore, `productos/${id}`);
                        return from(deleteDoc(productoRef));
                    })
                );
            })
        );
    }

    actualizarProducto(id: string, camposAActualizar: Partial<Producto>): Observable<void> {
        return this.authService.getUserId().pipe(
            switchMap(userId => {
                if (!userId) {
                    throw new Error('Usuario no autenticado');
                }
                return this.obtenerProductoPorId(id).pipe(
                    switchMap(producto => {
                        if (producto.userId !== userId) {
                            throw new Error('No autorizado para actualizar este producto');
                        }
                        const productoRef = doc(this.firestore, `productos/${id}`);
                        return from(updateDoc(productoRef, camposAActualizar));
                    })
                );
            })
        );
    }

    obtenerProductoPorId(id: string): Observable<Producto> {
        const productoRef = doc(this.firestore, `productos/${id}`);
        return from(getDoc(productoRef)).pipe(
            map(snapshot => {
                const producto = snapshot.data();
                if (!producto) {
                    throw new Error('Producto no encontrado');
                }
                return { id, ...producto } as Producto;
            })
        );
    }
}
