import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import { join } from 'path';

async function main() {
  const keys = Object.keys(process.env).filter(k => k.includes("FIREBASE"));
console.log("Firebase Env Keys:", keys);
const credentialsJson = process.env[keys[0]];
  if (!credentialsJson) {
     console.error("No credentials");
     return;
  }
  const credentials = JSON.parse(credentialsJson);

  const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));

  const app = initializeApp({
    credential: cert(credentials),
    projectId: firebaseConfig.projectId
  });

  const dbDefault = getFirestore(app);
  const dbAiStudio = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  const usersD = await dbDefault.collection("authorized_users").get();
  console.log("Users in default:", usersD.size);
  const itemsD = await dbDefault.collection("evaluation_items").get();
  console.log("Items in default:", itemsD.size);

  const usersA = await dbAiStudio.collection("authorized_users").get();
  console.log("Users in ai-studio:", usersA.size);
  const itemsA = await dbAiStudio.collection("evaluation_items").get();
  console.log("Items in ai-studio:", itemsA.size);
}
main().catch(console.error);
