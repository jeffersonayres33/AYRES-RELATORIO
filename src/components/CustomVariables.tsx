import React, { useState, useEffect } from "react";
import { collection, doc, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useLoading } from "../contexts/LoadingContext";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";

export interface CustomVariable {
  id: string;
  name: string;
  value: string;
}

export default function CustomVariables() {
  const { showLoading, hideLoading } = useLoading();
  const [variables, setVariables] = useState<CustomVariable[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newName, setNewName] = useState("");
  const [newValue, setNewValue] = useState("");

  const fetchVariables = async () => {
    try {
      const snap = await getDocs(collection(db, "templateVariables"));
      const vars: CustomVariable[] = [];
      snap.forEach(d => {
        vars.push({ id: d.id, ...d.data() } as CustomVariable);
      });
      setVariables(vars);
    } catch(e) {
      console.error("Error fetching variables", e);
    }
  };

  useEffect(() => {
    fetchVariables();
  }, []);

  const handleSave = async (id?: string) => {
    if (!newName.trim() || !newValue.trim()) {
      alert("Nome e valor são obrigatórios.");
      return;
    }
    
    // Ensure name format
    let formattedName = newName.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    
    showLoading("Salvando variável...");
    try {
      const docId = id || formattedName;
      await setDoc(doc(db, "templateVariables", docId), {
        name: formattedName,
        value: newValue
      });
      await fetchVariables();
      setNewName("");
      setNewValue("");
      setIsAdding(false);
      setEditingId(null);
    } catch(e) {
      alert("Erro ao salvar.");
    } finally {
      hideLoading();
    }
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(null);
    showLoading("Removendo...");
    try {
      await deleteDoc(doc(db, "templateVariables", id));
      await fetchVariables();
    } catch(e) {
      alert("Erro ao remover.");
    } finally {
      hideLoading();
    }
  };

  const startEdit = (v: CustomVariable) => {
    setEditingId(v.id);
    setNewName(v.name);
    setNewValue(v.value);
    setIsAdding(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-xs space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-lg uppercase tracking-widest text-slate-900 mb-1 flex items-center gap-2">
            Variáveis Customizadas do Template
          </h3>
          <p className="text-slate-500 text-sm">
            Crie variáveis (ex: <code className="bg-slate-100 px-1 rounded">[NOME_GESTOR]</code>) e defina qual texto elas devem carregar no DOCX.
          </p>
          <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <strong className="block mb-1 text-slate-700">Tags Dinâmicas (no texto e no próprio DOCX):</strong>
            <ul className="list-disc ml-5 mt-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <li><code>&lt;cidade&gt;</code> ou <code>[CIDADE]</code>: Nome da Cidade</li>
              <li><code>[NOME_FISCAL1]</code>, <code>[NOME_FISCAL2]</code>... : Nome de cada fiscalizado</li>
              <li><code>[PERIODO_DE_FISCALIZAÇÃO]</code>: Período Operacional</li>
              <li><code>&lt;data&gt;</code>, <code>[DATA]</code> ou <code>[DADOS]</code>: Data por extenso (ex: 12 de maio de 2026)</li>
            </ul>
          </div>
        </div>
        {!isAdding && !editingId && (
          <button 
            onClick={() => { setIsAdding(true); setNewName(""); setNewValue(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Variável
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nome da Variável</label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">[</span>
                <input 
                  type="text" 
                  value={newName}
                  onChange={e => setNewName(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                  placeholder="EX_VARIAVEL"
                  className="w-full pl-6 pr-6 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm font-bold text-slate-800 uppercase"
                  disabled={!!editingId}
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold">]</span>
              </div>
              {!!editingId && <p className="text-xs text-orange-500 mt-1">O nome não pode ser alterado na edição.</p>}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Texto para Substituir</label>
              <textarea 
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                placeholder="Insira o texto que entrará no lugar da variável..."
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm text-slate-700 min-h-[100px] resize-y"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button 
              onClick={() => { setIsAdding(false); setEditingId(null); }}
              className="px-4 py-2 text-slate-500 hover:bg-slate-200 bg-slate-100 rounded-xl font-bold uppercase text-xs tracking-wider transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              onClick={() => handleSave(editingId || undefined)}
              className="flex items-center gap-2 px-4 py-2 text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl font-bold uppercase text-xs tracking-wider transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" /> Salvar
            </button>
          </div>
        </div>
      )}

      {variables.length > 0 ? (
        <div className="space-y-3">
          {variables.map(v => (
            <div key={v.id} className="flex items-start md:items-center justify-between p-4 border border-slate-200 rounded-2xl bg-white hover:border-violet-300 hover:shadow-sm transition-all group gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <code className="bg-slate-100 font-bold text-violet-700 px-2 py-0.5 rounded text-sm shrink-0 border border-slate-200">[{v.name}]</code>
                </div>
                <p className="text-slate-600 text-sm truncate" title={v.value}>{v.value}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0 transition-opacity">
                {deletingId === v.id ? (
                  <div className="flex items-center gap-2 mr-2">
                    <span className="text-xs font-bold text-rose-600">Excluir?</span>
                    <button onClick={() => handleDelete(v.id)} className="px-2 py-1 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700">Sim</button>
                    <button onClick={() => setDeletingId(null)} className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold hover:bg-slate-300">Não</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => startEdit(v)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg cursor-pointer" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingId(v.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer" title="Excluir">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        !isAdding && (
          <div className="text-center py-8 bg-slate-50 border border-slate-200 border-dashed rounded-2xl">
            <p className="text-slate-500 font-medium text-sm">Nenhuma variável customizada foi criada.</p>
          </div>
        )
      )}
    </div>
  );
}
