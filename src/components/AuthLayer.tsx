import React, { useState, useEffect } from 'react';
import { auth, db, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User, doc, getDoc, setDoc } from '../lib/supabase';
import { Loader2, ShieldAlert, AlertTriangle, Mail, Lock, Eye, EyeOff, ShieldCheck, Settings, Key } from 'lucide-react';

export default function AuthLayer({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Form states
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
           console.warn("Aviso: Cadastro automático de administrador no banco pulado ou indisponível (RLS ativo):", e);
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

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMsg("Por favor, digite o seu endereço de e-mail.");
      return;
    }
    if (!passwordInput) {
      setErrorMsg("Por favor, digite a sua chave de acesso.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (typeof (auth as any).signInWithEmailAndPassword === 'function') {
        await (auth as any).signInWithEmailAndPassword(emailInput, passwordInput);
      } else {
        throw new Error("Sistema de chave de acesso não inicializado ou indisponível.");
      }
    } catch(err: any) {
      console.error("Custom authentication failed:", err);
      setErrorMsg(err.message || "E-mail ou chave de acesso incorretos.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorMsg(null);
      setIsSubmitting(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch(e: any) {
      if (e.code !== 'auth/popup-closed-by-user') {
         const errMsg = e.message || "";
         if (errMsg.includes("provider is not enabled") || errMsg.includes("Unsupported provider")) {
            setErrorMsg("Erro de Configuração no Supabase: O Provedor Google não está ativo. Por favor, acesse o painel do seu Supabase, ative o provedor Google e salve.");
         } else {
            setErrorMsg(`Erro ao fazer login com Google (Requer provedor ativo): ${errMsg || "Erro desconhecido"}.`);
         }
      }
    } finally {
      setIsSubmitting(false);
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
      <div className="flex min-h-screen w-screen items-center justify-center bg-[#f0f2f5] p-6 text-slate-800">
         <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 flex flex-col items-center my-8">
            <div className="w-16 h-16 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mb-6">
               <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold font-display uppercase tracking-tight text-slate-900 mb-2">Acesso Restrito</h1>
            <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">
              O sistema <strong className="text-slate-700">AYRES-RELATÓRIO</strong> é seguro. Digite suas credenciais autorizadas abaixo para acessar.
            </p>

            {errorMsg && (
              <div className="w-full bg-rose-50 text-rose-700 p-4 rounded-2xl flex flex-col gap-2 text-sm font-bold text-left px-4 mb-6 shadow-sm border border-rose-100">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span className="break-all">{errorMsg}</span>
                </div>
              </div>
            )}

            {/* Email + Password Access Form */}
            <form onSubmit={handleEmailPasswordLogin} className="w-full text-left space-y-4 mb-6">
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1">
                  E-mail Autorizado
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    placeholder="exemplo@gmail.com"
                    disabled={isSubmitting}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-2xl pl-10 pr-4 py-3 text-sm text-slate-800 font-medium outline-none transition-all disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-1.5 ml-1 flex justify-between items-center">
                  <span>Chave de Acesso / Senha</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Sua senha ou código de acesso"
                    disabled={isSubmitting}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-2xl pl-10 pr-10 py-3 text-sm text-slate-800 font-medium outline-none transition-all disabled:opacity-50"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="bg-sky-50/50 border border-sky-100 rounded-2xl p-3.5 text-[11.5px] text-sky-700 leading-relaxed font-semibold">
                💡 <strong>Primeiro acesso do e-mail?</strong> A senha digitada acima será salva automaticamente como sua nova chave de acesso!
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-slate-900 hover:bg-violet-600 text-white font-black py-3.5 rounded-2xl transition-all font-sans uppercase tracking-widest text-sm shadow-md cursor-pointer flex justify-center items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Entrando...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Entrar no Sistema</span>
                  </>
                )}
              </button>
            </form>

            <div className="w-full border-t border-slate-100 my-4 flex items-center justify-center relative">
              <span className="bg-white px-3 text-xs text-slate-400 font-bold uppercase tracking-widest absolute">ou</span>
            </div>

            <button
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-extrabold py-3 rounded-2xl transition-all font-sans text-xs uppercase tracking-wider flex justify-center items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Fazer Login com Google (OAuth)</span>
            </button>

            <div className="w-full bg-amber-50/50 border border-amber-100 rounded-2xl p-4 mt-5 text-[11px] leading-relaxed text-amber-800 font-semibold text-left">
              <div className="flex gap-2.5 items-start">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-black text-amber-900 uppercase tracking-tight mb-1">
                    💡 Dica de Configuração: Provedor Google
                  </strong>
                  Se você encontrar o erro <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-950 font-bold">Unsupported provider: provider is not enabled</code>, ative-o no painel do seu Supabase:
                  <ol className="list-decimal pl-3.5 mt-1.5 space-y-1">
                    <li>Acesse <a href="https://supabase.com" target="_blank" rel="noreferrer" className="underline font-black text-violet-700 hover:text-violet-900">supabase.com</a> e abra o seu projeto.</li>
                    <li>No menu esquerdo, vá em <strong>Authentication</strong> e clique em <strong>Providers</strong>.</li>
                    <li>Clique na aba <strong>Google</strong>, mude para <strong>Enabled</strong> (Ativado) e preencha o Client ID e Secret ou use o fluxo Simplificado do Google Cloud, e clique em <strong>Save</strong>.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
       </div>
    );
  }

  return <>{children}</>;
}
