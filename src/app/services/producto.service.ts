// services/producto.service.ts
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, query, where } from '@angular/fire/firestore';
import { Observable, forkJoin, from } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { Producto } from '../interfaces/producto.interface';
import { AngularFirestore } from '@angular/fire/compat/firestore';

@Injectable({
    providedIn: 'root',
})
export class ProductoService {
    constructor(private firestore: Firestore, private afs: AngularFirestore) { }

    // Métodos para manejar productos
    agregarProducto(producto: Producto): Observable<string> {
        const productosRef = collection(this.firestore, 'productos');
        return from(addDoc(productosRef, producto)).pipe(map(docRef => docRef.id));
    }

    obtenerProductos(): Observable<Producto[]> {
        const productosRef = collection(this.firestore, 'productos');
        return from(getDocs(productosRef)).pipe(
            map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Producto))
        );
    }

    eliminarProducto(id: string): Observable<void> {
        const productoRef = doc(this.firestore, `productos/${id}`);
        return from(deleteDoc(productoRef));
      }
      
    aplicarAumento(porcentajeAumento: number): Observable<void[]> {
        return this.obtenerProductos().pipe(
            switchMap((productos: Producto[]) =>
                forkJoin(productos.map((producto: Producto) => {
                    const nuevoPrecioVenta = producto.precioCompra * (1 + porcentajeAumento / 100);
                    return this.actualizarProducto(producto.id!, { precioVenta: nuevoPrecioVenta });
                }))
            )
        );
    }

    obtenerProductosPorNombre(nombre: string): Observable<Producto[]> {
        const productosRef = collection(this.firestore, 'productos');
        const q = query(productosRef, where('nombre', '==', nombre));
        return from(getDocs(q)).pipe(
            map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Producto))
        );
    }

    aplicarNuevoPrecio(nombre: string, nuevoPrecio: number): Observable<void[]> {
        return this.obtenerProductosPorNombre(nombre).pipe(
            switchMap((productos: Producto[]) => {
                // Filtrar solo los productos que tienen un ID definido
                const productosConId = productos.filter(producto => producto.id !== undefined);
                return forkJoin(productosConId.map((producto: Producto) => {
                    // TypeScript ya entiende que producto.id no es undefined aquí
                    return this.actualizarProducto(producto.id!, { precioVenta: nuevoPrecio });
                }));
            })
        );
    }

    actualizarProducto(id: string, camposAActualizar: Partial<Producto>): Observable<void> {
        const productoRef = doc(this.firestore, `productos/${id}`);
        return from(updateDoc(productoRef, camposAActualizar));
    }

    obtenerProductoPorId(id: string): Observable<Producto> {
        return this.afs.doc<Producto>(`productos/${id}`).valueChanges().pipe(
          take(1),
          map(producto => {
            // Asegúrate de que producto no sea undefined
            if (!producto) {
              throw new Error('Producto no encontrado');
            }
            return { id, ...producto };
          })
        );
      }
}
