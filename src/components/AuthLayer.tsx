import React, { useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function AuthLayer({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setErrorMsg(null);
      if (u) {
        setUser(u);
        await checkAuthorization(u);
      } else {
        setUser(null);
        setIsAuthorized(false);
        setIsChecking(false);
      }
    });
    return unsub;
  }, []);

  const checkAuthorization = async (u: User) => {
    try {
      if (!u.email) {
        setIsAuthorized(false);
        setIsChecking(false);
        return;
      }

      // Root Admin Check
      if (u.email === 'jeffersonayresjefferson@gmail.com') {
        try {
           const docRef = doc(db, 'authorized_users', u.email);
           const snap = await getDoc(docRef);
           if (!snap.exists()) {
             await setDoc(docRef, {
               email: u.email,
               addedBy: u.email,
               createdAt: Date.now(),
               role: 'admin'
             });
           }
        } catch(e) {
          console.error("Root admin creation skipped or failed:", e);
        }
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Standard User Check
      const docRef = doc(db, 'authorized_users', u.email);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        setErrorMsg("Você não tem acesso a este sistema. Solicite permissão a um administrador.");
        await signOut(auth);
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Erro ao verificar acesso.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleLogin = async () => {
    try {
      setErrorMsg(null);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch(e: any) {
      if (e.code !== 'auth/popup-closed-by-user') {
         setErrorMsg("Erro ao fazer login. Tente novamente.");
      }
    }
  };

  if (isChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
          <span className="text-sm font-mono tracking-widest text-slate-400 font-extrabold uppercase">Verificando Permissões...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#f0f2f5] p-4 text-slate-800">
         <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold font-display uppercase tracking-tight text-slate-900 mb-2">Acesso Fechado</h1>
            <p className="text-base text-slate-500 font-medium mb-8">
              O sistema <strong className="text-slate-700">AYRES-RELATÓRIO</strong> tem o uso restrito e necessita de chave de acesso vinculada ao seu e-mail.
            </p>

            {errorMsg && (
              <div className="w-full bg-rose-50 text-rose-700 p-3 rounded-lg flex items-center gap-3 text-sm font-bold text-left px-4 mb-6 shadow-sm border border-rose-100">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                {errorMsg}
              </div>
            )}

            <button 
               onClick={handleLogin}
               className="w-full bg-slate-900 hover:bg-violet-600 text-white font-black py-4 rounded-xl transition-all font-sans uppercase tracking-widest text-sm shadow-md"
            >
              Fazer Login com Google
            </button>
         </div>
      </div>
    );
  }

  return <>{children}</>;
}
