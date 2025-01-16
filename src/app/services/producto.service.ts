import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, deleteDoc, query, where, collectionData, getDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, forkJoin, from } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { Producto } from '../interfaces/producto.interface';
import { AuthService } from './auth.service'; // Servicio para obtener el userId actual
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
      this.cargarProductos(); // Carga los productos iniciales
      this.cargarCategorias(); // Carga las categorías iniciales
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
        return this.authService.getUserId().pipe( // Obtener el userId
          switchMap(userId => {
            if (!userId) {
              throw new Error('Usuario no autenticado'); // Si no hay usuario autenticado, lanzar error
            }
    
            // Subir la imagen a Firebase Storage
            const imagenRef = ref(this.storage, `productos/${userId}/${imagenArchivo.name}`);
            const metadata = { customMetadata: { userId: userId } };
    
            return from(uploadBytes(imagenRef, imagenArchivo, metadata)).pipe(
              // Una vez subida la imagen, obtener la URL de la imagen subida
              switchMap(() => getDownloadURL(imagenRef)),
              switchMap(urlImagen => {
                // Crear el producto con la URL de la imagen
                const productoConImagen = { ...producto, userId, imagenUrl: urlImagen };
    
                // Referencia a la colección de productos en Firestore
                const productosRef = collection(this.firestore, 'productos');
                return from(addDoc(productosRef, productoConImagen)).pipe(
                  // Retornar el ID del producto agregado a Firestore
                  map(docRef => docRef.id)
                );
              })
            );
          })
        );
      }
}
