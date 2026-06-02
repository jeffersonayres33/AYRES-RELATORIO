import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { Users, UserPlus, Trash2, Mail, Shield, Clock, Settings, FileText, FileSearch } from "lucide-react";
import GeneralEvalConfig from "./GeneralEvalConfig";
import TemplateConfig from "./TemplateConfig";
import { useLoading } from "../contexts/LoadingContext";

interface AuthorizedEmail {
  email: string;
  addedBy: string;
  createdAt: number;
  role: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<AuthorizedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [error, setError] = useState<string | null>(null);
  const [adminTab, setAdminTab] = useState<"users" | "eval" | "template">("users");

  const { showLoading, hideLoading } = useLoading();
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const qs = await getDocs(collection(db, "authorized_users"));
      const list: AuthorizedEmail[] = [];
      qs.forEach((d) => {
        list.push(d.data() as AuthorizedEmail);
      });
      setUsers(list.sort((a, b) => b.createdAt - a.createdAt));
    } catch (e: any) {
      console.error(e);
      setError("Falha ao carregar usuários. Verifique as permissões de acesso.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || newEmail.length < 5 || !newEmail.includes("@")) {
       setError("Digite um e-mail válido.");
       return;
    }
    setError(null);
    showLoading("Cadastrando usuário...");
    try {
      const sanitizedEmail = newEmail.trim().toLowerCase();
      const docRef = doc(db, "authorized_users", sanitizedEmail);
      await setDoc(docRef, {
        email: sanitizedEmail,
        addedBy: auth.currentUser?.email || "unknown",
        createdAt: Date.now(),
        role: newRole
      });
      setNewEmail("");
      await fetchUsers();
    } catch(e: any) {
       console.error(e);
       setError("Falha ao adicionar usuário. Você tem permissão?");
    } finally {
       hideLoading();
    }
  };

  const handleRemoveUser = async (email: string) => {
    if (email === auth.currentUser?.email) {
       setError("Você não pode remover a si mesmo.");
       return;
    }
    if (email === "jeffersonayresjefferson@gmail.com") {
       setError("O administrador raiz não pode ser removido.");
       return;
    }
    
    showLoading("Removendo usuário...");
    try {
      await deleteDoc(doc(db, "authorized_users", email));
      await fetchUsers();
    } catch(e: any) {
      setError("Falha ao remover usuário.");
    } finally {
      hideLoading();
      setConfirmDeleteUser(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-xs">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight font-display text-slate-900 uppercase">
              Painel do Administrador
            </h2>
          </div>
        </div>
        <p className="text-slate-500 text-sm md:text-base mt-1 max-w-2xl leading-relaxed font-semibold">
          Gerencie acessos ao sistema e configure opções dinâmicas para a geração de relatórios.
        </p>

        <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
           <button
             onClick={() => setAdminTab("users")}
             className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-sm uppercase tracking-widest transition-all whitespace-nowrap ${adminTab === "users" ? "bg-violet-600 text-white shadow-md shadow-violet-600/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
           >
             <Users className="w-4 h-4" /> Usuários
           </button>
           <button
             onClick={() => setAdminTab("eval")}
             className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-sm uppercase tracking-widest transition-all whitespace-nowrap ${adminTab === "eval" ? "bg-violet-600 text-white shadow-md shadow-violet-600/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
           >
             <FileText className="w-4 h-4" /> Construtor da Avaliação Geral
           </button>
           <button
             onClick={() => setAdminTab("template")}
             className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-sm uppercase tracking-widest transition-all whitespace-nowrap ${adminTab === "template" ? "bg-violet-600 text-white shadow-md shadow-violet-600/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
           >
             <FileSearch className="w-4 h-4" /> Modelo de Relatório
           </button>
        </div>
      </div>

      {adminTab === "users" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Registration Form */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs top-24 sticky">
               <h3 className="font-extrabold text-sm uppercase tracking-widest text-slate-900 mb-4 flex items-center gap-2">
                 <UserPlus className="w-4 h-4 text-violet-600" />
                 Novo Acesso
               </h3>

               {error && (
                 <div className="bg-rose-50 text-rose-700 p-3 rounded-xl mb-4 text-sm font-bold">
                   {error}
                 </div>
               )}

               <form onSubmit={handleAddUser} className="space-y-4">
                 <div>
                    <label className="block text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">
                      Endereço de E-mail
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="email"
                        value={newEmail}
                        onChange={e => setNewEmail(e.target.value)}
                        placeholder="fiscal@crf.org.br"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 font-medium outline-none transition-all"
                      />
                    </div>
                 </div>

                 <div>
                    <label className="block text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">
                      Nível de Permissão
                    </label>
                    <select 
                      value={newRole}
                      onChange={e => setNewRole(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 rounded-xl px-3 py-2.5 text-sm text-slate-800 font-medium outline-none transition-all cursor-pointer"
                    >
                      <option value="user">Usuário Comum (Acesso Total ao App)</option>
                      <option value="admin">Administrador (Pode gerenciar acessos)</option>
                    </select>
                 </div>

                 <button 
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-violet-600 text-white font-extrabold text-sm uppercase tracking-widest py-3 rounded-xl transition-all flex justify-center items-center gap-2"
                 >
                   <UserPlus className="w-3.5 h-3.5" />
                   Cadastrar Permissão
                 </button>
               </form>
            </div>
          </div>

          {/* List of Users */}
          <div className="lg:col-span-2">
             <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
                <h3 className="font-extrabold text-sm uppercase tracking-widest text-slate-900 mb-4 flex items-center justify-between">
                  <div>
                     <Shield className="w-4 h-4 text-emerald-500 inline mr-2" />
                     Usuários Autorizados
                  </div>
                  <span className="text-sm bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono">{users.length} Registros</span>
                </h3>

                {loading ? (
                  <div className="py-10 text-center text-slate-400 font-medium text-sm font-mono">Carregando lista...</div>
                ) : users.length === 0 ? (
                  <div className="py-10 text-center text-slate-400 font-medium text-sm font-mono">Nenhum acesso definido.</div>
                ) : (
                  <div className="space-y-3">
                    {users.map(u => (
                       <div key={u.email} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl gap-4 hover:border-violet-200 transition-all">
                         <div className="flex gap-3 items-center">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white text-base shrink-0 ${u.role === 'admin' ? 'bg-rose-500' : 'bg-slate-800'}`}>
                             {u.email.charAt(0).toUpperCase()}
                           </div>
                           <div>
                             <div className="flex items-center gap-2">
                               <span className="text-base font-extrabold text-slate-800 break-all">{u.email}</span>
                               {u.role === 'admin' && (
                                 <span className="bg-rose-100 text-rose-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider">Admin</span>
                               )}
                             </div>
                             <div className="text-sm text-slate-500 font-medium mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                               <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                               <span className="flex items-center gap-1">Add por: {u.addedBy.split('@')[0]}</span>
                             </div>
                           </div>
                         </div>
                         
                         {confirmDeleteUser === u.email ? (
                           <div className="flex gap-2 items-center">
                             <button
                               onClick={() => setConfirmDeleteUser(null)}
                               className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-all"
                             >
                               Cancelar
                             </button>
                             <button
                               onClick={() => handleRemoveUser(u.email)}
                               className="px-3 py-1.5 text-xs font-bold bg-rose-500 text-white rounded-lg hover:bg-rose-600 shadow-sm transition-all"
                             >
                               Confirmar
                             </button>
                           </div>
                         ) : (
                           <button
                             onClick={() => setConfirmDeleteUser(u.email)}
                             className="p-2 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 rounded-xl transition-all self-end sm:self-auto cursor-pointer flex items-center justify-center shrink-0"
                             title="Revogar Acesso"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         )}
                       </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>
      ) : adminTab === "eval" ? (
        <GeneralEvalConfig />
      ) : (
        <TemplateConfig />
      )}
    </div>
  );
}
