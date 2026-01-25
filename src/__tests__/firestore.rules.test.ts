import { describe, it, beforeAll, afterAll } from 'vitest';
import { initializeTestEnvironment, RulesTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

let testEnv: RulesTestEnvironment;

describe('Firestore Rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'mi-tienda-pro-test',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should allow anyone to read products', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    await db.collection('products').doc('abc').get(); 
    // Should not throw
  });

  it('should deny write to products for non-admins', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    // `assertFails` es la forma recomendada de verificar que una regla de seguridad falla.
    await assertFails(db.collection('products').add({ name: 'Hacked' }));
  });
});
