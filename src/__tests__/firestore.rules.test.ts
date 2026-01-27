import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

let testEnv: RulesTestEnvironment;

describe('Firestore Rules', () => {
  beforeAll(async () => {
    // CORRECCIÓN: Le decimos explícitamente dónde buscar el emulador (localhost:8080)
    testEnv = await initializeTestEnvironment({
      projectId: 'mi-tienda-pro-test',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
        host: '127.0.0.1', 
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    // Si testEnv no se inició, no intentamos limpiarlo
    if (testEnv) await testEnv.cleanup();
  });

  beforeEach(async () => {
    if (testEnv) await testEnv.clearFirestore();
  });

  // ---------------------------------------------------------
  // TEST: PRODUCTOS
  // ---------------------------------------------------------
  it('Cualquiera (incluso sin loguear) puede leer productos', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await assertSucceeds(db.collection('products').doc('quesillo-trancas').get());
  });

  it('Usuario normal NO puede crear ni modificar productos', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    await assertFails(db.collection('products').add({ name: 'Producto Hackeado', price: 0 }));
    await assertFails(db.collection('products').doc('abc').delete());
  });

  it('Admin puede crear productos', async () => {
    const db = testEnv.authenticatedContext('adminUser', { role: 'admin' }).firestore();
    await assertSucceeds(db.collection('products').add({ name: 'Yerba Mate', price: 5000 }));
  });

  // ---------------------------------------------------------
  // TEST: USUARIOS
  // ---------------------------------------------------------
  it('Usuario solo puede leer y escribir SU propio perfil', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(aliceDb.collection('users').doc('alice').set({ name: 'Alice' }));
    await assertSucceeds(aliceDb.collection('users').doc('alice').get());
  });

  it('Usuario NO puede leer ni escribir perfil de OTRO', async () => {
    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    const bobDb = testEnv.authenticatedContext('bob').firestore();
    await assertSucceeds(bobDb.collection('users').doc('bob').set({ name: 'Bob' }));
    await assertFails(aliceDb.collection('users').doc('bob').get());
    await assertFails(aliceDb.collection('users').doc('bob').update({ name: 'Hacked' }));
  });

  // ---------------------------------------------------------
  // TEST: ÓRDENES
  // ---------------------------------------------------------
  it('Usuario solo ve SUS propias órdenes', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('orders').doc('order_de_alice').set({ userId: 'alice', total: 1000 });
      await db.collection('orders').doc('order_de_bob').set({ userId: 'bob', total: 2000 });
    });

    const aliceDb = testEnv.authenticatedContext('alice').firestore();
    await assertSucceeds(aliceDb.collection('orders').doc('order_de_alice').get());
    await assertFails(aliceDb.collection('orders').doc('order_de_bob').get());
  });
});