import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA96Z0a9wuaFpVmeu13Gfn5QZKO7Dmdb2U",
  authDomain: "relatorioayres.firebaseapp.com",
  projectId: "relatorioayres",
  storageBucket: "relatorioayres.firebasestorage.app",
  messagingSenderId: "854435411122",
  appId: "1:854435411122:web:6a914e843538cdb61985ab",
  measurementId: "G-6YR1GWQNJJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

