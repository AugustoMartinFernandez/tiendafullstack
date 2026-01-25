import "server-only";
import { initializeApp, getApps, getApp, cert, App } from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";

let app: App | null = null;
let auth: Auth | null = null;

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!raw) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not defined");
  }

  return JSON.parse(raw);
}

export function getAdminApp(): App {
  if (app) return app;

  if (getApps().length > 0) {
    app = getApp();
    return app;
  }

  const serviceAccount = getServiceAccount();

  app = initializeApp({
    credential: cert(serviceAccount),
  });

  return app;
}

export function getAdminAuth(): Auth {
  if (auth) return auth;

  auth = getAuth(getAdminApp());
  return auth;
}
