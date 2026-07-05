import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, db, auth, getDoc } from "../lib/supabase";
import { Users, UserPlus, Trash2, Mail, Shield, Clock, Settings, FileText, FileSearch, DatabaseZap, Loader2, Save, Key, Check, X } from "lucide-react";
import GeneralEvalConfig from "./GeneralEvalConfig";
import TemplateConfig from "./TemplateConfig";
import CustomVariables from "./CustomVariables";
import CRFMappingConfig from "./CRFMappingConfig";
import NameMappingConfig from "./NameMappingConfig";
import DatabaseOptimizer from "./DatabaseOptimizer";
import BackupRestore from "./BackupRestore";
import { useLoading } from "../contexts/LoadingContext";

interface AuthorizedEmail {
  email: string;
  addedBy: string;
  createdAt: number;
  role: string;
  password?: string;
  allowedTabs?: string[];
}

interface AdminPanelProps {
  currentUserRole?: string;
  currentUserAllowedTabs?: string[];
}

export default function AdminPanel({ currentUserRole = "user", currentUserAllowedTabs = [] }: AdminPanelProps) {
  const [users, setUsers] = useState<AuthorizedEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [newPassword, setNewPassword] = useState("");
  const [newAllowedTabs, setNewAllowedTabs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const allSubTabs = React.useMemo(() => [
    { id: "users", label: "Usuários", icon: Users },
    { id: "eval", label: "Construtor da Avaliação Geral", icon: FileText },
    { id: "template", label: "Modelo de Relatório", icon: FileSearch },
    { id: "fiscais", label: "Mapeamento Fiscais/CRF", icon: Settings },
    { id: "database", label: "Otimizar Banco de Dados", icon: DatabaseZap },
    { id: "backup", label: "Backup & Restauração", icon: Save },
  ], []);

  const allowedSubTabs = React.useMemo(() => {
    if (currentUserRole === "admin") {
      return allSubTabs;
    }
    if (currentUserRole === "moderator") {
      return allSubTabs.filter(t => currentUserAllowedTabs.includes(t.id));
    }
    return [];
  }, [currentUserRole, currentUserAllowedTabs, allSubTabs]);

  const [adminTab, setAdminTab] = useState<string>("");

  useEffect(() => {
    if (allowedSubTabs.length > 0 && !allowedSubTabs.some(t => t.id === adminTab)) {
      setAdminTab(allowedSubTabs[0].id);
    }
  }, [allowedSubTabs, adminTab]);

  const { showLoading, hideLoading } = useLoading();
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);
  const [editingPasswordUser, setEditingPasswordUser] = useState<string | null>(null);
  const [editingPasswordValue, setEditingPasswordValue] = useState("");
  
  const [editingRoleUser, setEditingRoleUser] = useState<string | null>(null);
  const [editingRoleValue, setEditingRoleValue] = useState<string>("user");
  const [editingAllowedTabsValue, setEditingAllowedTabsValue] = useState<string[]>([]);

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
      setError(`Falha ao carregar usuários: ${e.message || e}`);
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
      
      const allowedTabsList = newRole === "moderator" 
        ? newAllowedTabs 
        : (newRole === "admin" ? ["users", "eval", "template", "fiscais", "database", "backup"] : []);

      await setDoc(docRef, {
        email: sanitizedEmail,
        addedBy: auth.currentUser?.email || "unknown",
        createdAt: Date.now(),
        role: newRole,
        password: newPassword.trim() || undefined,
        allowedTabs: allowedTabsList
      });
      setNewEmail("");
      setNewPassword("");
      setNewAllowedTabs([]);
      await fetchUsers();
    } catch(err: any) {
       console.error(err);
       setError("Falha ao adicionar usuário. Você tem permissão?");
    } finally {
       hideLoading();
    }
  };

  const handleUpdateRole = async (email: string) => {
    setError(null);
    showLoading("Atualizando permissões...");
    try {
      const docRef = doc(db, "authorized_users", email);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const udata = snap.data();
        const allowedTabsList = editingRoleValue === "moderator"
          ? editingAllowedTabsValue
          : (editingRoleValue === "admin" ? ["users", "eval", "template", "fiscais", "database", "backup"] : []);
        
        udata.role = editingRoleValue;
        udata.allowedTabs = allowedTabsList;
        await setDoc(docRef, udata);
      } else {
        throw new Error("Usuário não encontrado.");
      }
      setEditingRoleUser(null);
      await fetchUsers();
    } catch (err: any) {
      console.error(err);
      setError(`Erro ao atualizar permissão: ${err.message || err}`);
    } finally {
      hideLoading();
    }
  };

  const handleUpdatePassword = async (email: string) => {
    if (!editingPasswordValue.trim()) {
      setError("Senha não pode ser vazia.");
      return;
    }
    setError(null);
    showLoading("Atualizando senha...");
    try {
      const docRef = doc(db, "authorized_users", email);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const udata = snap.data();
        udata.password = editingPasswordValue.trim();
        await setDoc(docRef, udata);
      } else {
        throw new Error("Usuário não encontrado.");
      }
      setEditingPasswordUser(null);
      setEditingPasswordValue("");
      await fetchUsers();
    } catch (err: any) {
      console.error(err);
      setError(`Erro ao atualizar senha: ${err.message || err}`);
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
    } catch(err: any) {
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
          {allowedSubTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setAdminTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-sm uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer ${
                  adminTab === tab.id
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Icon className="w-4 h-4" /> {tab.label}
              </button>
            );
          })}
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
                        required
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
                      <option value="user">Usuário Comum (Sem Painel de Adm)</option>
                      <option value="moderator">Moderador (Acesso Personalizado às Abas)</option>
                      <option value="admin">Administrador (Pode gerenciar acessos)</option>
                    </select>

                    {newRole === "moderator" && (
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mt-3 space-y-2.5 animate-fade-in">
                        <span className="block text-xs font-extrabold uppercase tracking-widest text-slate-500">
                          Liberar acesso às abas:
                        </span>
                        <div className="space-y-2">
                          {[
                            { id: "users", label: "Usuários" },
                            { id: "eval", label: "Construtor da Avaliação Geral" },
                            { id: "template", label: "Modelo de Relatório" },
                            { id: "fiscais", label: "Mapeamento Fiscais/CRF" },
                            { id: "database", label: "Otimizar Banco de Dados" },
                            { id: "backup", label: "Backup & Restauração" }
                          ].map(t => (
                            <label key={t.id} className="flex items-center gap-2.5 text-xs font-bold text-slate-700 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={newAllowedTabs.includes(t.id)}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setNewAllowedTabs([...newAllowedTabs, t.id]);
                                  } else {
                                    setNewAllowedTabs(newAllowedTabs.filter(x => x !== t.id));
                                  }
                                }}
                                className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 w-4 h-4 cursor-pointer"
                              />
                              {t.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}
                 </div>

                 <div>
                    <label className="block text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 ml-1 flex justify-between items-center">
                      <span>Chave de Acesso Opcional</span>
                      <span className="text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded font-black font-sans leading-none uppercase">no 1º login se vazio</span>
                    </label>
                    <div className="relative">
                      <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input 
                        type="text"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        placeholder="Defina ou deixe em branco"
                        className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-800 font-medium outline-none transition-all"
                      />
                    </div>
                 </div>

                 <button 
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-violet-600 text-white font-extrabold text-sm uppercase tracking-widest py-3 rounded-xl transition-all flex justify-center items-center gap-2 cursor-pointer"
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
                       <div key={u.email} className="flex flex-col p-4 bg-slate-50/50 border border-slate-100 rounded-2xl gap-3 hover:border-violet-200 transition-all">
                         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                           <div className="flex gap-3 items-center">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-white text-base shrink-0 ${u.role === 'admin' ? 'bg-rose-500' : u.role === 'moderator' ? 'bg-violet-600' : 'bg-slate-800'}`}>
                               {u.email.charAt(0).toUpperCase()}
                             </div>
                             <div>
                               <div className="flex items-center gap-2">
                                 <span className="text-base font-extrabold text-slate-800 break-all">{u.email}</span>
                                 {u.role === 'admin' && (
                                   <span className="bg-rose-100 text-rose-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider">Admin</span>
                                 )}
                                 {u.role === 'moderator' && (
                                   <span className="bg-violet-100 text-violet-700 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider">Moderador</span>
                                 )}
                                 {u.role === 'user' && (
                                   <span className="bg-slate-100 text-slate-600 text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wider">Usuário</span>
                                 )}
                               </div>
                               <div className="text-sm text-slate-500 font-medium mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                                 <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                                 <span className="flex items-center gap-1">Add por: {u.addedBy.split('@')[0]}</span>
                               </div>

                               {/* Render Allowed Tabs badges for Moderator */}
                               {u.role === 'moderator' && u.allowedTabs && u.allowedTabs.length > 0 && (
                                 <div className="flex flex-wrap gap-1 mt-1.5">
                                   {u.allowedTabs.map(tabId => {
                                     const labelMap: Record<string, string> = {
                                       users: "Usuários",
                                       eval: "Avaliação",
                                       template: "Modelos",
                                       fiscais: "Fiscais",
                                       database: "Otimização",
                                       backup: "Backup"
                                     };
                                     return (
                                       <span key={tabId} className="text-[9px] bg-violet-50 text-violet-600 border border-violet-100 px-1.5 py-0.5 rounded-md font-bold font-sans">
                                         {labelMap[tabId] || tabId}
                                       </span>
                                     );
                                   })}
                                 </div>
                               )}
                             </div>
                           </div>
                           
                           <div className="flex gap-2 items-center self-end sm:self-auto">
                             {editingRoleUser !== u.email && (
                               <button
                                 onClick={() => {
                                   setEditingRoleUser(u.email);
                                   setEditingRoleValue(u.role || "user");
                                   setEditingAllowedTabsValue(u.allowedTabs || []);
                                 }}
                                 className="p-2 bg-white border border-slate-200 text-violet-600 hover:bg-violet-50 hover:text-violet-800 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                                 title="Alterar Nível de Acesso"
                               >
                                 <Shield className="w-4 h-4" />
                               </button>
                             )}

                             {editingPasswordUser !== u.email && (
                               <button
                                 onClick={() => { setEditingPasswordUser(u.email); setEditingPasswordValue(u.password || ""); }}
                                 className="p-2 bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                                 title="Editar Chave de Acesso"
                               >
                                 <Key className="w-4 h-4" />
                               </button>
                             )}

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
                                 className="p-2 bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
                                 title="Revogar Acesso"
                               >
                                 <Trash2 className="w-4 h-4" />
                               </button>
                             )}
                           </div>
                         </div>

                         {/* Inline Role & Permission Editor */}
                         {editingRoleUser === u.email && (
                           <div className="border-t border-slate-100/80 pt-3 space-y-3 bg-violet-50/20 p-3 rounded-xl border border-violet-100/50">
                             <span className="text-xs text-violet-950 font-black uppercase tracking-wider font-sans block">
                               Alterar Nível de Permissão:
                             </span>
                             
                             <div className="flex flex-col sm:flex-row gap-3">
                               <div className="w-full sm:w-1/2">
                                 <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                                   Nível / Papel
                                 </label>
                                 <select
                                   value={editingRoleValue}
                                   onChange={e => setEditingRoleValue(e.target.value)}
                                   className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-2.5 py-2 text-xs text-slate-800 font-semibold outline-none cursor-pointer"
                                 >
                                   <option value="user">Usuário Comum (Sem Painel de Adm)</option>
                                   <option value="moderator">Moderador (Acesso Personalizado às Abas)</option>
                                   <option value="admin">Administrador (Pode gerenciar acessos)</option>
                                 </select>
                               </div>

                               {editingRoleValue === "moderator" && (
                                 <div className="w-full sm:w-1/2 bg-white border border-slate-200/80 rounded-xl p-3 space-y-1.5">
                                   <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">
                                     Liberar acesso às abas:
                                   </label>
                                   <div className="space-y-1">
                                     {[
                                       { id: "users", label: "Usuários" },
                                       { id: "eval", label: "Construtor da Avaliação Geral" },
                                       { id: "template", label: "Modelo de Relatório" },
                                       { id: "fiscais", label: "Mapeamento Fiscais/CRF" },
                                       { id: "database", label: "Otimizar Banco de Dados" },
                                       { id: "backup", label: "Backup & Restauração" }
                                     ].map(t => (
                                       <label key={t.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
                                         <input 
                                           type="checkbox"
                                           checked={editingAllowedTabsValue.includes(t.id)}
                                           onChange={e => {
                                             if (e.target.checked) {
                                               setEditingAllowedTabsValue([...editingAllowedTabsValue, t.id]);
                                             } else {
                                               setEditingAllowedTabsValue(editingAllowedTabsValue.filter(x => x !== t.id));
                                             }
                                           }}
                                           className="rounded text-violet-600 focus:ring-violet-500 w-3.5 h-3.5 cursor-pointer"
                                         />
                                         {t.label}
                                       </label>
                                     ))}
                                   </div>
                                 </div>
                               )}
                             </div>

                             <div className="flex justify-end gap-2 pt-2 border-t border-dashed border-violet-100">
                               <button
                                 onClick={() => setEditingRoleUser(null)}
                                 className="px-3 py-1.5 text-xs font-extrabold bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer transition-all"
                               >
                                 Cancelar
                               </button>
                               <button
                                 onClick={() => handleUpdateRole(u.email)}
                                 className="px-3 py-1.5 text-xs font-extrabold bg-violet-600 hover:bg-violet-700 text-white rounded-lg cursor-pointer flex items-center gap-1 shadow-xs transition-all"
                                >
                                 <Check className="w-3.5 h-3.5" /> Salvar Permissão
                               </button>
                             </div>
                           </div>
                         )}

                         {/* Inline Password Modifier or Status */}
                         <div className="border-t border-slate-100/80 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                           <span className="text-xs text-slate-400 font-extrabold uppercase tracking-widest font-sans">Acesso à Plataforma:</span>
                           {editingPasswordUser === u.email ? (
                             <div className="flex items-center gap-1.5 w-full sm:max-w-xs justify-end">
                               <input 
                                 type="text"
                                 value={editingPasswordValue}
                                 onChange={e => setEditingPasswordValue(e.target.value)}
                                 placeholder="Nova senha/chave"
                                 className="bg-white border border-slate-200 text-xs px-2.5 py-1.5 rounded-xl outline-none w-full font-medium"
                               />
                               <button
                                 onClick={() => handleUpdatePassword(u.email)}
                                 className="p-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg cursor-pointer"
                                 title="Confirmar Nova Senha"
                                >
                                 <Check className="w-4 h-4" />
                               </button>
                               <button
                                 onClick={() => { setEditingPasswordUser(null); setEditingPasswordValue(""); }}
                                 className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg cursor-pointer"
                                 title="Cancelar"
                                >
                                 <X className="w-4 h-4" />
                               </button>
                             </div>
                           ) : (
                             <div>
                               {u.password ? (
                                 <span className="text-xs text-slate-700 font-mono font-extrabold bg-slate-100 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                                   <Key className="w-3.5 h-3.5 text-amber-500" /> Senha: <span className="text-violet-600">{u.password}</span>
                                 </span>
                               ) : (
                                 <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100/50 px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                                   <Key className="w-3.5 h-3.5 text-slate-400" /> Senha: <i>Auto no Primeiro Login</i>
                                 </span>
                               )}
                             </div>
                           )}
                         </div>
                       </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>
      ) : adminTab === "eval" ? (
        <GeneralEvalConfig />
      ) : adminTab === "fiscais" ? (
        <div className="space-y-6">
          <CRFMappingConfig />
          <NameMappingConfig />
        </div>
      ) : adminTab === "database" ? (
        <DatabaseOptimizer />
      ) : adminTab === "backup" ? (
        <BackupRestore />
      ) : adminTab === "template" ? (
        <div className="space-y-6">
          <TemplateConfig />
          <CustomVariables />
        </div>
      ) : null}
    </div>
  );
}
