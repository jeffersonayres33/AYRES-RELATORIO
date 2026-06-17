import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf8'));
const app = initializeApp(config);
const db = getFirestore(app);

async function run() {
  try {
    const snap = await getDocs(collection(db, "evaluation_items"));
    console.log("Success! Items in default db:", snap.size);
    snap.docs.forEach(d => console.log(d.id, d.data().title));
  } catch (e) {
    console.error("Error connecting to main db:", e.message);
  }
  process.exit(0);
}
run();
