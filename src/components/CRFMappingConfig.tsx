import React, { useState, useEffect } from "react";
import { collection, doc, getDocs, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useLoading } from "../contexts/LoadingContext";
import { Plus, Trash2, Edit2, Check } from "lucide-react";

export interface CRFMapping {
  id: string;
  namePart: string;
  crfValue: string;
}

export default function CRFMappingConfig() {
  const { showLoading, hideLoading } = useLoading();
  const [mappings, setMappings] = useState<CRFMapping[]>([]);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [namePart, setNamePart] = useState("");
  const [crfValue, setCrfValue] = useState("");

  const fetchMappings = async () => {
    try {
      const snap = await getDocs(collection(db, "fiscal_crf_mappings"));
      const list: CRFMapping[] = [];
      snap.forEach(d => {
        list.push({ id: d.id, ...d.data() } as CRFMapping);
      });
      // Sort alphabetically
      list.sort((a, b) => a.namePart.localeCompare(b.namePart));
      setMappings(list);
    } catch(e) {
      console.error("Error fetching mappings", e);
    }
  };

  useEffect(() => {
    fetchMappings();
  }, []);

  const handleSave = async (id?: string) => {
    if (!namePart.trim() || !crfValue.trim()) {
      alert("Parte do Nome e Valor do CRF são obrigatórios.");
      return;
    }
    
    let formattedNamePart = namePart.trim().toUpperCase();
    
    showLoading("Salvando mapeamento...");
    try {
      const docId = id || formattedNamePart.replace(/[^A-Z0-9_]/g, '');
      await setDoc(doc(db, "fiscal_crf_mappings", docId), {
        namePart: formattedNamePart,
        crfValue: crfValue.trim()
      });
      await fetchMappings();
      setNamePart("");
      setCrfValue("");
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
      await deleteDoc(doc(db, "fiscal_crf_mappings", id));
      await fetchMappings();
    } catch(e) {
      alert("Erro ao remover.");
    } finally {
      hideLoading();
    }
  };

  const startEdit = (m: CRFMapping) => {
    setEditingId(m.id);
    setNamePart(m.namePart);
    setCrfValue(m.crfValue);
    setIsAdding(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-xs space-y-6 mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-extrabold text-lg uppercase tracking-widest text-slate-900 mb-1 flex items-center gap-2">
            Mapeamento Fiscais / CRF
          </h3>
          <p className="text-slate-500 text-sm">
            Associe palavras no nome do fiscal (ex: <code>JEFFERSON</code>) para definir dinamicamente a variável de seu respectivo CRF (ex: <code>[CRF_FISCAL1]</code> para <code>CRF/AM 05566</code>).
          </p>
        </div>
        {!isAdding && !editingId && (
          <button 
            onClick={() => { setIsAdding(true); setNamePart(""); setCrfValue(""); }}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Mapeamento
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Parte do Nome</label>
              <input 
                type="text" 
                value={namePart}
                onChange={e => setNamePart(e.target.value.toUpperCase())}
                placeholder="Ex: JEFFERSON"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm font-bold text-slate-800 uppercase"
              />
              {!!editingId && <p className="text-xs text-orange-500 mt-1">Ao editar, será atualizado o valor correspondente à chave ID = {editingId}.</p>}
            </div>
            <div>
              <label className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Valor do CRF</label>
              <input 
                type="text" 
                value={crfValue}
                onChange={e => setCrfValue(e.target.value)}
                placeholder="Ex: CRF/AM 05566"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all text-sm text-slate-700"
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

      {mappings.length > 0 ? (
        <div className="space-y-3">
          {mappings.map(m => (
            <div key={m.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-2xl bg-white hover:border-violet-300 hover:shadow-sm transition-all group gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-slate-800 text-sm">Se contiver:</span>
                  <code className="bg-slate-100 font-bold text-violet-700 px-2 py-0.5 rounded text-sm border border-slate-200">{m.namePart}</code>
                </div>
                <p className="text-slate-600 text-sm mt-1 border-l-2 pl-2 border-violet-400">
                  CRF Correspondente: <strong className="text-slate-800">{m.crfValue}</strong>
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0 transition-opacity">
                {deletingId === m.id ? (
                  <div className="flex items-center gap-2 mr-2">
                    <span className="text-xs font-bold text-rose-600">Excluir?</span>
                    <button onClick={() => handleDelete(m.id)} className="px-2 py-1 bg-rose-600 text-white rounded text-xs font-bold hover:bg-rose-700">Sim</button>
                    <button onClick={() => setDeletingId(null)} className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold hover:bg-slate-300">Não</button>
                  </div>
                ) : (
                  <>
                    <button onClick={() => startEdit(m)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg cursor-pointer" title="Editar">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setDeletingId(m.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer" title="Excluir">
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
            <p className="text-slate-500 font-medium text-sm">Nenhum mapeamento de CRF foi criado.</p>
          </div>
        )
      )}
    </div>
  );
}
