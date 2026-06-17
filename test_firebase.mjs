import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  const credentialsJson = process.env.FIREBASE_SERVICE_ACCOUNT_AI_STUDIO_AFA776C0_21D4_4789_B0DB_5E69C286D9E0;
  if (!credentialsJson) {
     console.error("No credentials");
     return;
  }
  const credentials = JSON.parse(credentialsJson);

  const configPath = join(__dirname, 'firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  const app = initializeApp({
    credential: cert(credentials),
    databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
  });

  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  // Read evaluation items
  try {
     const snap = await db.collection("evaluation_items").get();
     console.log("Evaluation items count:", snap.size);
  } catch (e) {
     console.error("Error fetching evaluation items:", e);
  }

  // Optimize: list collections to find unused ones
  const collections = await db.listCollections();
  console.log("Collections:", collections.map(c => c.id).join(", "));
}

main().catch(console.error);
