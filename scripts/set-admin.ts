import admin from 'firebase-admin';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// ------------------------------------------------------------------
// CONFIGURACIÓN DE SEGURIDAD
// 1. Descarga tu Service Account Key desde Firebase Console:
//    Configuración del proyecto -> Cuentas de servicio -> Generar nueva clave privada
// 2. Guarda el archivo como 'service-account.json' en la raíz del proyecto.
// 3. IMPORTANTE: Agrega 'service-account.json' a tu .gitignore para no subirlo.
// ------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

const SERVICE_ACCOUNT_PATH = resolve(__dirname, '../service-account.json');

async function setAdminClaim() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Error: Por favor proporciona el email del usuario.');
    console.log('👉 Uso: npx ts-node scripts/set-admin.ts usuario@ejemplo.com');
    process.exit(1);
  }

  try {
    // Inicializar Firebase Admin SDK con privilegios elevados
    if (!admin.apps.length) {
      try {
        const serviceAccount = require(SERVICE_ACCOUNT_PATH);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } catch {
        console.error('❌ Error crítico: No se encontró el archivo service-account.json en la raíz.');
        console.error('   Descárgalo desde Firebase Console -> Configuración -> Cuentas de servicio.');
        process.exit(1);
      }
    }

    // 1. Buscar usuario por email (Operación Admin)
    console.log(`🔍 Buscando usuario: ${email}...`);
    const user = await admin.auth().getUserByEmail(email);
    console.log(`✅ Usuario encontrado: ${user.uid}`);

    // 2. Asignar Custom Claim { role: 'admin' }
    // Preservamos otros claims si existieran
    const currentClaims = user.customClaims || {};
    const newClaims = { ...currentClaims, role: 'admin' };

    console.log('🛡️  Firmando token con privilegios de ADMIN...');
    await admin.auth().setCustomUserClaims(user.uid, newClaims);

    // 3. Actualizar Firestore para que la UI lo refleje inmediatamente
    console.log('📝 Sincronizando perfil en Firestore...');
    await admin.firestore().collection('users').doc(user.uid).set({
        role: 'admin'
    }, { merge: true });

    // 4. Confirmación
    console.log('-------------------------------------------------------');
    console.log(`🎉 ¡ÉXITO! El usuario ${email} ahora es ADMIN.`);
    console.log('-------------------------------------------------------');
    console.log('⚠️  IMPORTANTE PARA EL USUARIO:');
    console.log('   Debe CERRAR SESIÓN y volver a ingresar para que');
    console.log('   Firebase refresque el token con los nuevos permisos.');
    console.log('-------------------------------------------------------');

  } catch (error: unknown) {
    const firebaseError = error as { code?: string };
    if (firebaseError.code === 'auth/user-not-found') {
      console.error(`❌ Error: No existe ningún usuario registrado con el email ${email}.`);
      console.error('   El usuario debe registrarse primero en la app.');
    } else {
      console.error('❌ Error inesperado:', error);
    }
    process.exit(1);
  }
}

setAdminClaim();
