// scripts/fix-visibility.ts
import admin from 'firebase-admin';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const SERVICE_ACCOUNT_PATH = resolve(__dirname, '../service-account.json');

async function fixVisibility() {
  try {
    // Inicializar Firebase Admin
    if (!admin.apps.length) {
      try {
        const serviceAccount = require(SERVICE_ACCOUNT_PATH);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } catch (error) {
        console.error('❌ Error: No se encontró service-account.json en la raíz.');
        process.exit(1);
      }
    }

    const db = admin.firestore();
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();

    if (snapshot.empty) {
      console.log('No hay productos para actualizar.');
      return;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Si no tiene el campo isVisible, lo agregamos como true
      if (typeof data.isVisible === 'undefined') {
        batch.update(doc.ref, { isVisible: true });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
      console.log(`✅ Se actualizaron ${count} productos antiguos para ser visibles.`);
    } else {
      console.log('👍 Todos los productos ya tienen el campo isVisible.');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

fixVisibility();
