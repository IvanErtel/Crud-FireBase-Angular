import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, deleteDoc, query, where, collectionData, getDoc, setDoc } from '@angular/fire/firestore';
import { BehaviorSubject, Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
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

// En producto.service.ts
agregarProducto(producto: Producto): Observable<string> {
  return this.authService.getUserId().pipe(
    switchMap(userId => {
      const productosRef = collection(this.firestore, `users/${userId}/productos`);
      return from(addDoc(productosRef, producto)).pipe(map(docRef => docRef.id));
    })
  );
}

obtenerProductos(): Observable<Producto[]> {
  return this.authService.getUserId().pipe(
    switchMap(userId => {
      const productosRef = collection(this.firestore, `users/${userId}/productos`);
      return collectionData(productosRef, { idField: 'id' }) as Observable<Producto[]>;
    })
  );
}

eliminarProducto(id: string): Observable<void> {
  return this.authService.getUserId().pipe(
    switchMap(userId => {
      const productoRef = doc(this.firestore, `users/${userId}/productos/${id}`); // ✅ Ruta corregida
      return from(deleteDoc(productoRef));
    })
  );
}

actualizarProducto(id: string, camposAActualizar: Partial<Producto>): Observable<void> {
  return this.authService.getUserId().pipe(
    switchMap(userId => {
      // Validación 1: Usuario autenticado
      if (!userId) {
        return throwError(() => new Error('Usuario no autenticado'));
      }
      
      // --- NUEVO: Verificar si se está actualizando únicamente la cantidad ---
      const keysAActualizar = Object.keys(camposAActualizar);
      const esActualizacionSoloCantidad = (keysAActualizar.length === 1 && keysAActualizar.includes('cantidad'));
      
      // Si no es una actualización exclusiva de cantidad, se validan los campos requeridos
      if (!esActualizacionSoloCantidad) {
        const requiredFields: (keyof Producto)[] = ['nombre', 'marcaId', 'categoriaId'];
        const missingFields = requiredFields.filter(field => !camposAActualizar[field]);
        if (missingFields.length > 0) {
          return throwError(() => new Error(`Campos requeridos faltantes: ${missingFields.join(', ')}`));
        }
      }
      
      // Si se actualiza solo la cantidad o se envían todos los datos, continuar con la obtención del producto
      return this.obtenerProductoPorId(id).pipe(
        switchMap(producto => {
          // Validación de propiedad: el producto debe pertenecer al usuario
          if (producto.userId !== userId) {
            return throwError(() => new Error('No tienes permiso para editar este producto'));
          }
          
          // Preparar datos para Firestore
          const updateData = {
            ...camposAActualizar,
            fechaActualizacion: new Date().toISOString(),
            userId // Se mantiene la consistencia de ownership
          };
          
          // Filtrar los valores undefined
          const cleanData = Object.fromEntries(
            Object.entries(updateData).filter(([_, v]) => v !== undefined)
          );
          
          const productoRef = doc(this.firestore, `users/${userId}/productos/${id}`);
          return from(updateDoc(productoRef, cleanData)).pipe(
            catchError(firestoreError => {
              console.error('Error Firestore:', {
                id,
                campos: cleanData,
                error: firestoreError
              });
              return throwError(() => new Error('Error al actualizar en la base de datos'));
            })
          );
        }),
        catchError(error => throwError(() => error))
      );
    }),
    catchError(error => {
      console.error('Error en actualizarProducto:', error);
      return throwError(() => new Error(error.message || 'Error desconocido al actualizar el producto'));
    })
  );
}

  obtenerProductoPorId(id: string): Observable<Producto> {
    return this.authService.getUserId().pipe(
      switchMap(userId => {
        const productoRef = doc(this.firestore, `users/${userId}/productos/${id}`);
        return from(getDoc(productoRef)).pipe(
          map(snapshot => {
            const data = snapshot.data();
            if (!data) throw new Error('Producto no encontrado');
            return { id, ...data } as Producto;
          })
        );
      })
    );
  }

  agregarProductoConImagen(producto: Producto, imagenArchivo: File): Observable<string> {
    return this.authService.getUserId().pipe(
      switchMap(userId => {
        if (!userId) {
          return throwError(() => new Error("Usuario no autenticado"));
        }
        
        // Genera un nombre único para la imagen usando timestamp y el nombre original
        const timestamp = new Date().getTime();
        const filePath = `users/${userId}/productos/${timestamp}_${imagenArchivo.name}`;
        const storageRef = ref(this.storage, filePath);

        // Sube la imagen a Storage
        return from(uploadBytes(storageRef, imagenArchivo)).pipe(
          // Una vez subida la imagen, obtenemos la URL de descarga
          switchMap(() => from(getDownloadURL(storageRef))),
          switchMap((imagenUrl: string) => {
            // Construir el objeto producto incluyendo el userId y la imagenUrl
            const productoData: Producto = {
              ...producto,
              userId,      // Asigna el UID del usuario
              imagenUrl,   // Asigna la URL de descarga de la imagen
            };

            // Guarda el documento en Firestore en la ruta: users/{userId}/productos/{productoId}
            const productosRef = collection(this.firestore, `users/${userId}/productos`);
            return from(addDoc(productosRef, productoData)).pipe(
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
          return throwError(() => new Error('Usuario no autenticado'));
        }
  
        // 1. Referencia al documento del usuario actual
        const productoRef = doc(this.firestore, 'users', userId, 'productos', id);
  
        // 2. Lógica para actualización con imagen
        if (imagenArchivo) {
          // 2a. Subir nueva imagen al Storage del usuario
          const imagenRef = ref(this.storage, `users/${userId}/productos/${imagenArchivo.name}`);
          const metadata = { customMetadata: { userId } };
  
          return from(uploadBytes(imagenRef, imagenArchivo, metadata)).pipe(
            switchMap(() => getDownloadURL(imagenRef)),
            switchMap(urlImagen => {
              // 2b. Actualizar datos en Firestore
              const updateData = {
                ...producto,
                imagenUrl: urlImagen,
                fechaActualizacion: new Date().toISOString()
              };
              return from(updateDoc(productoRef, updateData));
            }),
            catchError(error => throwError(() => new Error(`Error al subir imagen: ${error.message}`)))
          );
        } 
        // 3. Actualización sin imagen
        else {
          const updateData = {
            ...producto,
            fechaActualizacion: new Date().toISOString()
          };
          return from(updateDoc(productoRef, updateData)).pipe(
            catchError(error => throwError(() => new Error(`Error al actualizar producto: ${error.message}`)))
          );
        }
      }),
      catchError(error => {
        console.error('Error general:', error);
        return throwError(() => new Error('Error al procesar la actualización'));
      })
    );
  }
}
