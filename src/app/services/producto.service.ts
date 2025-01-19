import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, deleteDoc, query, where, collectionData, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { Producto } from '../interfaces/producto.interface';
import { AuthService } from './auth.service';
import { CategoriaService } from './categoria.service';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private productosSubject = new BehaviorSubject<Producto[]>([]);
  productos$ = this.productosSubject.asObservable();
  private categoriasMapSubject = new BehaviorSubject<Map<string, string>>(new Map());
  categoriasMap$ = this.categoriasMapSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private authService: AuthService,
    private categoriaService: CategoriaService,
    private storage: Storage
  ) {
    this.cargarProductos();
    this.cargarCategorias();
  }

  private cargarProductos(): void {
    this.obtenerProductos().subscribe(productos => {
      this.productosSubject.next(productos);
    });
  }

  private cargarCategorias(): void {
    this.categoriaService.obtenerCategorias().subscribe(categorias => {
      const categoriasMap = new Map(categorias.map(c => [c.id, c.nombre]));
      this.categoriasMapSubject.next(categoriasMap);
    });
  }

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

  agregarProductoConImagen(producto: Producto, imagenArchivo: File): Observable<string> {
    return this.authService.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          throw new Error('Usuario no autenticado');
        }
        const imagenRef = ref(this.storage, `productos/${userId}/${imagenArchivo.name}`);
        const metadata = { customMetadata: { userId } };

        return from(uploadBytes(imagenRef, imagenArchivo, metadata)).pipe(
          switchMap(() => getDownloadURL(imagenRef)),
          switchMap(urlImagen => {
            const productoConImagen = { ...producto, userId, imagenUrl: urlImagen };
            const productosRef = collection(this.firestore, 'productos');
            return from(addDoc(productosRef, productoConImagen)).pipe(
              map(docRef => docRef.id)
            );
          })
        );
      })
    );
  }

  actualizarProductoConImagen(id: string, producto: Producto, imagenArchivo: File | null): Observable<void> {
    return this.authService.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          throw new Error('Usuario no autenticado');
        }
        if (imagenArchivo) {
          const imagenRef = ref(this.storage, `productos/${userId}/${imagenArchivo.name}`);
          const metadata = { customMetadata: { userId } };

          return from(uploadBytes(imagenRef, imagenArchivo, metadata)).pipe(
            switchMap(() => getDownloadURL(imagenRef)),
            switchMap(urlImagen => {
              const productoActualizado = { ...producto, imagenUrl: urlImagen };
              const productoRef = doc(this.firestore, `productos/${id}`) as any;
              return from(updateDoc(productoRef, productoActualizado));
            })
          );
        } else {
          const productoRef = doc(this.firestore, `productos/${id}`) as any;
          return from(updateDoc(productoRef, producto));
        }
      })
    );
  }
}
