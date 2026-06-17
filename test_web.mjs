import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

async function run() {
  try {
    const snap = await getDoc(doc(db, "settings", "reportTemplate"));
    console.log("Template in ai-studio db exists:", snap.exists());
    if (snap.exists()) console.log(snap.data());
  } catch (e) {
    console.error("Error:", e.message);
  }
  process.exit(0);
}
run();
