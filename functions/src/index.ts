import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
admin.initializeApp();

// Monitorear la creación de un cliente
exports.monitorCrearCliente = functions.firestore
  .document("/usuarios/{usuarioId}/clientes/{clienteId}")
  .onCreate((snap, context) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    const nuevoCliente = snap.data();
    console.log("Cliente creado:", nuevoCliente);
    // Implementa la lógica deseada aquí
  });

// Monitorear la creación de un producto
exports.monitorCrearProducto = functions.firestore
  .document("/usuarios/{usuarioId}/productos/{productoId}")
  .onCreate((snap, context) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    const nuevoProducto = snap.data();
    console.log("Producto creado:", nuevoProducto);
    // Implementa la lógica deseada aquí
  });

// Monitorear la actualización de un documento en cualquier subcolección
exports.monitorActualizarDocumento = functions.firestore
  .document("/usuarios/{usuarioId}/{subColeccion}/{docId}")
  .onUpdate((change, context) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    const datosAntes = change.before.data();
    const datosDespues = change.after.data();
    console.log("Documento antes de la actualización:", datosAntes);
    console.log("Documento después de la actualización:", datosDespues);
    // Implementa la lógica deseada aquí
  });

// Monitorear la eliminación de un documento en cualquier subcolección
exports.monitorEliminarDocumento = functions.firestore
  .document("/usuarios/{usuarioId}/{subColeccion}/{docId}")
  .onDelete((snap, context) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    const datosDocumento = snap.data();
    console.log("Documento eliminado:", datosDocumento);
    // Implementa la lógica deseada aquí
  });

exports.monitorActualizarProducto = functions.firestore
  .document("/usuarios/{usuarioId}/productos/{productoId}")
  .onUpdate(async (change, context) => {
    const datosAntes = change.before.data();
    const datosDespues = change.after.data();
    console.log("Producto antes de la actualización:", datosAntes);
    console.log("Producto después de la actualización:", datosDespues);

    // Implementa aquí la lógica para registrar la actualización
    const usuarioId = context.params.usuarioId;
    const actualizacionRef = admin.firestore().collection("registrosDeUso").doc(usuarioId);

    await admin.firestore().runTransaction(async (transaction) => {
      const docActualizacion = await transaction.get(actualizacionRef);
      const actualizaciones = docActualizacion.exists ? docActualizacion.data()?.actualizaciones || 0 : 0;
      transaction.set(actualizacionRef, {
        actualizaciones: actualizaciones + 1,
        ultimaAccion: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });
  });

exports.registrarCreacionDocumento = functions.firestore
  .document("/usuarios/{usuarioId}/{subColeccion}/{docId}")
  .onCreate(async (snap, context) => {
    const usuarioId = context.params.usuarioId;
    const registroRef = admin.firestore().collection("registrosDeUso").doc(usuarioId);

    await admin.firestore().runTransaction(async (transaction) => {
      const docRegistro = await transaction.get(registroRef);
      let creaciones = 0;
      if (docRegistro.exists) {
        const data = docRegistro.data(); // Aquí podría ser undefined
        if (data) { // Verificación extra para TypeScript
          creaciones = data.creaciones || 0;
        }
      }
      transaction.set(registroRef, {
        creaciones: creaciones + 1,
        ultimaAccion: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });
  });

exports.registrarActualizacionDocumento = functions.firestore
  .document("/usuarios/{usuarioId}/{subColeccion}/{docId}")
  .onUpdate(async (change, context) => {
    const usuarioId = context.params.usuarioId;
    const registroRef = admin.firestore().collection("registrosDeUso").doc(usuarioId);

    await admin.firestore().runTransaction(async (transaction) => {
      const docRegistro = await transaction.get(registroRef);
      if (docRegistro.exists) {
        const data = docRegistro.data();
        const actualizaciones = data ? data.actualizaciones || 0 : 0;
        transaction.set(registroRef, {
          actualizaciones: actualizaciones + 1,
          ultimaAccion: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } else {
        transaction.set(registroRef, {
          actualizaciones: 1,
          ultimaAccion: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    });
  });


exports.registrarEliminacionDocumento = functions.firestore
  .document("/usuarios/{usuarioId}/{subColeccion}/{docId}")
  .onDelete(async (snap, context) => {
    const usuarioId = context.params.usuarioId;
    const registroRef = admin.firestore().collection("registrosDeUso").doc(usuarioId);

    await admin.firestore().runTransaction(async (transaction) => {
      const docRegistro = await transaction.get(registroRef);
      if (docRegistro.exists) {
        const data = docRegistro.data();
        const eliminaciones = data ? data.eliminaciones || 0 : 0;
        transaction.set(registroRef, {
          eliminaciones: eliminaciones + 1,
          ultimaAccion: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      } else {
        transaction.set(registroRef, {
          eliminaciones: 1,
          ultimaAccion: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
      }
    });
  });
