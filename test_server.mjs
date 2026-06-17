import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

async function main() {
  const accountEnvKey = Object.keys(process.env).find(k => k.startsWith('FIREBASE_SERVICE_ACCOUNT_AI_STUDIO'));
  if (!accountEnvKey) {
     console.error("No credentials");
     return;
  }
  const credentials = JSON.parse(process.env[accountEnvKey]);

  const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

  const app = initializeApp({
    credential: cert(credentials),
    projectId: firebaseConfig.projectId
  });

  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  const collections = await db.listCollections();
  console.log("Collections in ai-studio db:", collections.map(c => c.id).join(", "));
  
  for (const c of collections) {
     const snap = await c.get();
     console.log(`- ${c.id}: ${snap.size} docs`);
  }
}
main().catch(console.error);
