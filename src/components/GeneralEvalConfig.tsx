import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";
import { ListChecks, AlertCircle, Trash2, Plus, PenSquare, X, ArrowUp, ArrowDown } from "lucide-react";
import { EvalItem } from "../types";
import { defaultEvaluationItems } from "../lib/defaultEvalItems";
import { useLoading } from "../contexts/LoadingContext";

export default function GeneralEvalConfig() {
  const [items, setItems] = useState<EvalItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingItem, setEditingItem] = useState<Partial<EvalItem> | null>(null);
  const { showLoading, hideLoading } = useLoading();

  const fetchItems = async () => {
    try {
      const qs = await getDocs(collection(db, "evaluation_items"));
      const list: EvalItem[] = [];
      qs.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as EvalItem);
      });
      
      if (list.length === 0) {
        for (const item of defaultEvaluationItems) {
          await setDoc(doc(db, "evaluation_items", item.id), item);
          list.push(item);
        }
      }

      setItems(list.sort((a, b) => (a.order || 0) - (b.order || 0)));
    } catch (e: any) {
       console.error(e);
       setError("Falha ao carregar itens de avaliação.");
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.title || !editingItem?.paragraph) {
      setError("Título e Parágrafo são obrigatórios.");
      return;
    }
    
    showLoading("Salvando tópico...");
    try {
      setError(null);
      const idToSave = editingItem.id || `eval_${Date.now()}`;
      const docRef = doc(db, "evaluation_items", idToSave);
      
      const dataToSave = {
        title: editingItem.title,
        description: editingItem.description || "",
        paragraph: editingItem.paragraph,
        order: editingItem.order || items.length + 1,
        defaultChecked: editingItem.defaultChecked || false
      };

      await setDoc(docRef, dataToSave);
      setEditingItem(null);
      await fetchItems();
    } catch (e: any) {
      setError("Falha ao salvar o item.");
    } finally {
      hideLoading();
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este item? Esta ação removerá a opção do gerador de relatórios.")) return;
    
    showLoading("Excluindo tópico...");
    try {
      await deleteDoc(doc(db, "evaluation_items", id));
      await fetchItems();
    } catch (e: any) {
      setError("Falha ao remover o item.");
    } finally {
      hideLoading();
    }
  };

  const changeOrder = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    
    showLoading("Reorganizando itens...");
    try {
      const newItems = [...items];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      // Swap order property
      const tempOrder = newItems[index].order;
      newItems[index].order = newItems[targetIndex].order;
      newItems[targetIndex].order = tempOrder;

      const batch = writeBatch(db);
      
      const ref1 = doc(db, "evaluation_items", newItems[index].id);
      batch.update(ref1, { order: newItems[index].order });
      
      const ref2 = doc(db, "evaluation_items", newItems[targetIndex].id);
      batch.update(ref2, { order: newItems[targetIndex].order });

      await batch.commit();
      await fetchItems();
    } catch (error) {
      console.error(error);
      setError("Falha ao reordenar tópicos.");
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="space-y-6">
      
      {error && (
        <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-bold mt-4 flex items-center gap-2">
           <AlertCircle className="w-4 h-4 shrink-0" />
           {error}
        </div>
      )}

      {editingItem && (
         <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
               <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                  <h3 className="font-extrabold text-slate-800 font-display flex items-center gap-2 uppercase tracking-wide text-sm">
                     <ListChecks className="w-5 h-5 text-violet-600" />
                     {editingItem.id ? "Editar Tópico" : "Novo Tópico"}
                  </h3>
                  <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors">
                     <X className="w-4 h-4" />
                  </button>
               </div>
               
               <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
                  <div>
                    <label className="block text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Título da Opção (Checkbox)</label>
                    <input 
                       value={editingItem.title || ""}
                       onChange={e => setEditingItem({ ...editingItem, title: e.target.value })}
                       className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-800 font-bold outline-none"
                       placeholder="Ex: Ausência de Receituários Especiais"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Descrição Curta (Opcional)</label>
                    <input 
                       value={editingItem.description || ""}
                       onChange={e => setEditingItem({ ...editingItem, description: e.target.value })}
                       className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium outline-none"
                       placeholder="Breve explicação exibida sob o título"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Texto Gerado no Relatório (Parágrafo)</label>
                    <textarea 
                       value={editingItem.paragraph || ""}
                       onChange={e => setEditingItem({ ...editingItem, paragraph: e.target.value })}
                       className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium outline-none min-h-[120px] resize-y"
                       placeholder="Escreva o texto completo que será inserido no arquivo .docx caso esta opção seja marcada..."
                    />
                  </div>

                  <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={editingItem.defaultChecked || false}
                      onChange={e => setEditingItem({ ...editingItem, defaultChecked: e.target.checked })}
                      className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                    />
                    <span className="text-sm font-bold text-slate-700">Deixar marcado por padrão</span>
                  </label>
                  
                  <div className="flex justify-end pt-2">
                     <button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-md">
                        Salvar Tópico
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
         <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-widest text-slate-900 flex items-center">
                 <ListChecks className="w-4 h-4 text-violet-600 mr-2" />
                 Itens da Avaliação Geral
              </h3>
              <p className="text-sm text-slate-500 mt-1">Configure os tópicos dinâmicos que os fiscais poderão selecionar para preencher o relatório.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                 onClick={() => setEditingItem({})}
                 className="bg-slate-900 hover:bg-violet-600 text-white font-extrabold text-sm uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                 <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
         </div>

         {loadingInitial ? (
             <div className="py-10 text-center text-slate-400 font-medium text-sm font-mono">Carregando dados...</div>
         ) : items.length === 0 ? (
             <div className="py-10 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <ListChecks className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm font-medium">Nenhum item configurado.</p>
                <button onClick={() => setEditingItem({})} className="mt-4 text-sm text-violet-600 font-bold uppercase hover:underline">Criar o Primeiro Item</button>
             </div>
         ) : (
            <div className="space-y-4">
              {items.map((item, index) => (
                 <div key={item.id} className="p-4 bg-slate-50/70 border border-slate-150 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                       <div className="flex items-center gap-2">
                         <h4 className="font-extrabold text-slate-900 text-sm font-display">{index + 1}. {item.title}</h4>
                         {item.defaultChecked && (
                           <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-md uppercase">Padrão</span>
                         )}
                       </div>
                       {item.description && <p className="text-sm text-slate-500 mt-0.5">{item.description}</p>}
                       <div className="mt-2.5 p-3 bg-white border border-slate-100 rounded-xl text-sm text-slate-600 leading-relaxed italic border-l-2 border-l-violet-300">
                         "{item.paragraph}"
                       </div>
                    </div>
                    <div className="flex sm:flex-col gap-2 shrink-0 border-t border-slate-200 sm:border-t-0 pt-3 sm:pt-0">
                       <div className="flex gap-1">
                         <button 
                           onClick={() => changeOrder(index, 'up')}
                           disabled={index === 0}
                           className="flex-1 flex items-center justify-center p-2 bg-white text-slate-400 border border-slate-200 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
                           title="Mover para Cima"
                         >
                           <ArrowUp className="w-4 h-4" />
                         </button>
                         <button 
                           onClick={() => changeOrder(index, 'down')}
                           disabled={index === items.length - 1}
                           className="flex-1 flex items-center justify-center p-2 bg-white text-slate-400 border border-slate-200 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
                           title="Mover para Baixo"
                         >
                           <ArrowDown className="w-4 h-4" />
                         </button>
                       </div>
                       <button 
                         onClick={() => setEditingItem(item)}
                         className="flex-1 sm:flex-none flex items-center justify-center p-2.5 bg-white text-slate-600 border border-slate-200 hover:border-violet-300 hover:text-violet-700 rounded-xl transition-all"
                         title="Editar"
                       >
                         <PenSquare className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleDelete(item.id)}
                         className="flex-1 sm:flex-none flex items-center justify-center p-2.5 bg-white text-rose-500 border border-slate-200 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all"
                         title="Excluir"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              ))}
            </div>
         )}
      </div>
    </div>
  );
}
