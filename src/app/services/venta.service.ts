import { Injectable } from "@angular/core";
import { AngularFirestore } from "@angular/fire/compat/firestore";
import { Observable } from "rxjs";
import { DetalleVenta, Venta } from "../interfaces/ventas.interface";
import { Producto } from "../interfaces/producto.interface";

@Injectable({
    providedIn: 'root',
  })
  export class VentaService {
    constructor(private afs: AngularFirestore) {}
  
    agregarVenta(venta: Venta): Observable<void> {
      return new Observable<void>((observer) => {
        // Agregar la venta a la base de datos
        const ventaRef = this.afs.collection('ventas').doc();
        venta.id = ventaRef.ref.id;
        ventaRef.set(venta).then(() => {
          // Aquí podrías llamar a otra función para actualizar el stock
          this.actualizarStock(venta.detalles);
          observer.next();
          observer.complete();
        }).catch((error) => observer.error(error));
      });
    }

    obtenerVentas(userId: string): Observable<Venta[]> {
      const ventasRef = this.afs.collection<Venta>(`users/${userId}/ventas`, ref => ref.orderBy('fecha', 'desc'));
      return ventasRef.valueChanges({ idField: 'id' });
    }
  
    private actualizarStock(detalles: DetalleVenta[]): void {
        detalles.forEach((detalle) => {
          // Obtener el documento del producto
          const productoRef = this.afs.doc<Producto>(`productos/${detalle.productoId}`);
          // Actualizar el stock
          this.afs.firestore.runTransaction((transaction) => {
            return transaction.get(productoRef.ref).then((productoDoc) => {
              if (!productoDoc.exists) {
                throw Error("Producto no existe!");
              }
              // Aserción de tipo con tu interfaz Producto
              const productoData = productoDoc.data() as Producto; // Usa tu interfaz Producto
              const nuevoStock = productoData.cantidad - detalle.cantidad;
              if (nuevoStock < 0) {
                throw Error("Stock insuficiente!");
              }
              transaction.update(productoRef.ref, { cantidad: nuevoStock });
            });
          }).then(() => console.log("Stock actualizado"))
            .catch((error) => console.error("Error actualizando stock:", error));
        });
      }
    }