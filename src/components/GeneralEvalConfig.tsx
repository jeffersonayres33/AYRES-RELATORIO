import React, { useState, useEffect } from "react";
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, db } from "../lib/supabase";
import { ListChecks, AlertCircle, Trash2, Plus, PenSquare, X, ArrowUp, ArrowDown, Braces, Code, Settings } from "lucide-react";
import { EvalItem, EvalVariable, EvalVariableField } from "../types";
import { defaultEvaluationItems } from "../lib/defaultEvalItems";
import { defaultEvalVariables } from "../lib/defaultEvalVariables";
import { useLoading } from "../contexts/LoadingContext";

export default function GeneralEvalConfig() {
  const [items, setItems] = useState<EvalItem[]>([]);
  const [variables, setVariables] = useState<EvalVariable[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"intro" | "farmacias" | "laboratorios" | "farmacia_hospitalar" | "remume" | "outras_irregularidades" | "conclusao_especifica" | "variables">("intro");
  const [introText, setIntroText] = useState("");

  const [editingItem, setEditingItem] = useState<Partial<EvalItem> | null>(null);
  const [editingVariable, setEditingVariable] = useState<Partial<EvalVariable> | null>(null);
  const [isNewVariable, setIsNewVariable] = useState(false);
  const [variableFields, setVariableFields] = useState<EvalVariableField[]>([]);
  const [confirmDeleteVariable, setConfirmDeleteVariable] = useState<string | null>(null);

  const { showLoading, hideLoading } = useLoading();

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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
       console.error("fetchItems error", e);
       setError("Falha ao carregar itens no banco: " + e.message);
       setItems(defaultEvaluationItems.sort((a, b) => (a.order || 0) - (b.order || 0)));
    }
  };

  const fetchVariables = async () => {
    try {
      const qs = await getDocs(collection(db, "evaluation_variables"));
      const list: EvalVariable[] = [];
      qs.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as EvalVariable);
      });
      
      if (list.length === 0) {
        for (const variable of defaultEvalVariables) {
          try {
             await setDoc(doc(db, "evaluation_variables", variable.id), variable);
          } catch(err) {}
          list.push(variable);
        }
      }

      setVariables(list);
    } catch (e: any) {
       console.error("fetchVariables error", e);
       setError("Falha ao carregar variáveis de avaliação (modo offline/fallback ativado).");
       setVariables(defaultEvalVariables);
    }
  };

  const fetchIntro = async () => {
    try {
      const { getDoc, setDoc } = await import("../lib/supabase");
      const d = await getDoc(doc(db, "evaluation_intro", "default"));
      if (d.exists() && d.data().text) {
        setIntroText(d.data().text);
      } else {
        const defaultText = `Como é sabido, é de competência do Conselho Regional de Farmácia a fiscalização do exercício da profissão farmacêutica no Estado do Amazonas, visando resguardar o cumprimento da legislação vigente e, indiretamente, atuar na promoção da saúde em todo Estado.\n\nNo Município de [MUNICIPIO] foram realizadas [QUANTIDADE_INSPEÇÕES_NO_MUNICIPIO_SELECIONADO] inspeções técnicas em estabelecimentos farmacêuticos privados e assistência pública do SUS, de modo a mensurar a conformidade sanitária nas ações locais.\n\nPor fim, é de fundamental importância que as autoridades sanitárias intensifiquem a fiscalização nos estabelecimentos citados, a fim de coibir as irregularidades sanitárias que podem comprometer a saúde da população e garantir que as normas e regulamentações sejam cumpridas, assegurando a qualidade dos serviços prestados e a segurança dos pacientes.`;
        await setDoc(doc(db, "evaluation_intro", "default"), { text: defaultText });
        setIntroText(defaultText);
      }
    } catch(e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    setLoadingInitial(true);
    setError(null);
    await Promise.all([fetchItems(), fetchVariables(), fetchIntro()]);
    setLoadingInitial(false);
  };

  useEffect(() => {
    fetchData();
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
        defaultChecked: editingItem.defaultChecked || false,
        isHidden: editingItem.isHidden || false,
        category: editingItem.category || (["farmacias", "laboratorios", "farmacia_hospitalar", "remume", "outras_irregularidades", "conclusao_especifica"].includes(activeTab) ? activeTab : "farmacias")
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

  const handleSaveVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!editingVariable?.id || !editingVariable?.name) {
      setError("ID de Placeholder e Nome são obrigatórios.");
      return;
    }

    const processedId = editingVariable.id.trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
    if (!processedId) {
      setError("O ID da variável é inválido. Use letras, números e sublinhados (_) somente.");
      return;
    }

    if (editingVariable?.type !== "condition") {
      if (variableFields.length === 0) {
        setError("Adicione pelo menos um campo para esta variável.");
        return;
      }
      const invalidFields = variableFields.some(f => !f.key.trim() || !f.label.trim());
      if (invalidFields) {
        setError("Preencha a Chave e o Rótulo de todos os campos.");
        return;
      }
      const invalidRadioOptions = variableFields.some(f => f.inputType === 'radio' && (!f.options || f.options.length === 0 || f.options.some(o => !o.trim())));
      if (invalidRadioOptions) {
        setError("Preencha as opções corretamente para todos os campos do tipo Rádio.");
        return;
      }
    }

    showLoading("Salvando variável...");
    try {
      const docRef = doc(db, "evaluation_variables", processedId);
      const dataToSave: EvalVariable = {
        id: processedId,
        name: editingVariable.name.trim(),
        type: editingVariable.type || "table",
        formatPattern: (editingVariable.formatPattern || "").trim() || variableFields.map(f => `{${f.key.trim()}}`).join(" - "),
        conditionRefVar: editingVariable.conditionRefVar || "",
        conditionOperator: editingVariable.conditionOperator || "equals",
        conditionTargetValue: editingVariable.conditionTargetValue || "",
        conditionTrueText: editingVariable.conditionTrueText || "",
        conditionFalseText: editingVariable.conditionFalseText || "",
        fields: variableFields.map(f => ({
          key: f.key.trim().toLowerCase(),
          label: f.label.trim(),
          placeholder: (f.placeholder || "").trim(),
          inputType: f.inputType || "text",
          options: f.options ? f.options.map(o => o.trim()).filter(Boolean) : []
        }))
      };

      await setDoc(docRef, dataToSave);
      setEditingVariable(null);
      await fetchVariables();
    } catch (e: any) {
      console.error(e);
      setError("Falha ao salvar a variável.");
    } finally {
      hideLoading();
    }
  };

  const handleDelete = async (id: string) => {
    showLoading("Excluindo tópico...");
    try {
      await deleteDoc(doc(db, "evaluation_items", id));
      await fetchItems();
    } catch (e: any) {
      setError("Falha ao remover o item.");
    } finally {
      hideLoading();
      setConfirmDelete(null);
    }
  };

  const handleDeleteVariable = async (id: string) => {
    showLoading("Excluindo variável...");
    try {
      await deleteDoc(doc(db, "evaluation_variables", id));
      await fetchVariables();
    } catch (e: any) {
      setError("Falha ao remover a variável.");
    } finally {
      hideLoading();
      setConfirmDeleteVariable(null);
    }
  };

  const changeOrder = async (categoryId: string | undefined, indexInCategory: number, direction: 'up' | 'down') => {
    const categoryItems = items.filter(i => (i.category === categoryId) || (!i.category && categoryId === "farmacias")).sort((a,b) => (a.order || 0) - (b.order || 0));
    
    if (direction === 'up' && indexInCategory === 0) return;
    if (direction === 'down' && indexInCategory === categoryItems.length - 1) return;
    
    showLoading("Reorganizando itens...");
    try {
      const targetIndex = direction === 'up' ? indexInCategory - 1 : indexInCategory + 1;
      const currentItem = categoryItems[indexInCategory];
      const targetItem = categoryItems[targetIndex];
      
      const tempOrder = currentItem.order;
      const newCurrentOrder = targetItem.order;
      const newTargetOrder = tempOrder;

      const batch = writeBatch(db);
      
      const ref1 = doc(db, "evaluation_items", currentItem.id);
      batch.update(ref1, { order: newCurrentOrder });
      
      const ref2 = doc(db, "evaluation_items", targetItem.id);
      batch.update(ref2, { order: newTargetOrder });

      await batch.commit();
      await fetchItems();
    } catch (error) {
      console.error(error);
      setError("Falha ao reordenar tópicos.");
    } finally {
      hideLoading();
    }
  };

  const handleSaveIntro = async () => {
    showLoading("Salvando introdução...");
    try {
      await setDoc(doc(db, "evaluation_intro", "default"), { text: introText });
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError("Falha ao salvar texto introdutório.");
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex flex-wrap bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1 w-full">
        <button
          type="button"
          onClick={() => setActiveTab("intro")}
          className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
            activeTab === "intro"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          📝 3. Intro Padrão
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("farmacias")}
          className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
            activeTab === "farmacias"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          💊 3.1 Farmácias
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("laboratorios")}
          className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
            activeTab === "laboratorios"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          🔬 3.2 Laboratórios
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("farmacia_hospitalar")}
          className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
            activeTab === "farmacia_hospitalar"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          🏥 3.3. Farm. Hospitalar
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("remume")}
          className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
            activeTab === "remume"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          📋 3.4. Remume/CFT
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("outras_irregularidades")}
          className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
            activeTab === "outras_irregularidades"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          ⚠️ 3.5. Outras Irreg.
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("conclusao_especifica")}
          className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
            activeTab === "conclusao_especifica"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          🎓 4. Conclusão
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("variables")}
          className={`px-4 py-2 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
            activeTab === "variables"
              ? "bg-white text-violet-700 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          ⚙️ Variáveis
        </button>
      </div>

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
                  {error && (
                     <div className="p-3 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                     </div>
                  )}
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
                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 px-4">
                      <strong>Dica de Variáveis:</strong> Você pode usar qualquer variável que criar como <code>[LABS_INFRA]</code>, <code>[LABS_LAMINAS]</code> ou outras variáveis customizadas no formato <code>[NOME_VARIAVEL]</code>. Elas serão exibidas dinamicamente para preenchimento.
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingItem.defaultChecked || false}
                        onChange={e => setEditingItem({ ...editingItem, defaultChecked: e.target.checked })}
                        className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                      />
                      <span className="text-sm font-bold text-slate-700">Deixar marcado por padrão</span>
                    </label>

                    <label className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingItem.isHidden || false}
                        onChange={e => setEditingItem({ ...editingItem, isHidden: e.target.checked })}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">Ocultar Tópico</span>
                        <span className="text-[10px] text-slate-500">Se marcado, o tópico não aparecerá na tela do Relatório Geral. Caso também seja padrão, continuará sendo impresso pelo sistema.</span>
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex justify-end pt-2">
                     <button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-md">
                        Salvar Tópico
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Editing Custom Variable Modal */}
      {editingVariable && (
         <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-xl border border-slate-100 flex flex-col max-h-[90vh]">
               <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                  <h3 className="font-extrabold text-slate-800 font-display flex items-center gap-2 uppercase tracking-wide text-sm">
                     <Braces className="w-5 h-5 text-violet-600" />
                     {editingVariable.id ? "Editar Variável" : "Nova Variável Customizada"}
                  </h3>
                  <button onClick={() => setEditingVariable(null)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors cursor-pointer">
                     <X className="w-4 h-4" />
                  </button>
               </div>
               
               <form onSubmit={handleSaveVariable} className="p-6 overflow-y-auto space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Identificador / Placeholder</label>
                        <input 
                           value={editingVariable.id || ""}
                           onChange={e => setEditingVariable({ ...editingVariable, id: e.target.value.toUpperCase() })}
                           disabled={!isNewVariable}
                           className="w-full bg-indigo-50 border border-indigo-200 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-indigo-900 font-black outline-none uppercase disabled:opacity-60 shadow-inner"
                           placeholder="Ex: EQUIPAMENTOS"
                        />
                        <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                           <span className="font-bold text-slate-700">Como usar:</span> Coloque <code>[{editingVariable.id || "NOME"}]</code> dentro dos parágrafos dos itens da avaliação. Ele será substituído dinamicamente.
                        </div>
                     </div>

                     <div>
                        <label className="block text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Nome Amigável / Descrição</label>
                        <input 
                           value={editingVariable.name || ""}
                           onChange={e => setEditingVariable({ ...editingVariable, name: e.target.value })}
                           className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-800 font-bold outline-none"
                           placeholder="Ex: Equipamentos Tecnológicos"
                        />
                     </div>
                  </div>

                  <div>
                     <label className="block text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Tipo de Variável</label>
                     <select
                        value={editingVariable.type || "table"}
                        onChange={e => setEditingVariable({ ...editingVariable, type: e.target.value as "text" | "table" })}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-800 font-bold outline-none cursor-pointer"
                     >
                        <option value="text">Variável de Texto Simples</option>
                        <option value="table">Tabela / Lista de Registros</option>
                        <option value="condition">Condição Lógica (SE)</option>
                     </select>
                     <p className="text-[10.5px] text-slate-400 mt-1.5 leading-relaxed ml-1">
                       Textos simples são substituídos diretamente no relatório. Tabelas criam uma lista de registros nos formulários com sub-campos. Condições lógicas avaliam outras variáveis.
                     </p>
                  </div>

                  {editingVariable.type === "condition" && (
                    <div className="bg-amber-50/50 p-4 border border-amber-200/50 rounded-2xl space-y-4">
                       <p className="text-[11px] text-amber-700 font-medium">Configure a condição lógica. O relatório exibirá o "Texto Verdadeiro" se a condição for atendida, ou o "Texto Falso" caso contrário.</p>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                             <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 ml-1">Variável de Referência</label>
                             <input 
                                value={editingVariable.conditionRefVar || ""}
                                onChange={e => setEditingVariable({ ...editingVariable, conditionRefVar: e.target.value })}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none"
                                placeholder="[MUNICIPIO] ou LABS_INFRA"
                             />
                          </div>
                          <div>
                             <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 ml-1">Operador</label>
                             <select 
                                value={editingVariable.conditionOperator || "equals"}
                                onChange={e => setEditingVariable({ ...editingVariable, conditionOperator: e.target.value as any })}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none cursor-pointer"
                             >
                                <option value="equals">Igual a (=)</option>
                                <option value="not_equals">Diferente de (≠)</option>
                                <option value="greater_than">Maior que (&gt;)</option>
                                <option value="greater_equals">Maior ou igual a (≥)</option>
                                <option value="less_than">Menor que (&lt;)</option>
                                <option value="less_equals">Menor ou igual a (≤)</option>
                             </select>
                          </div>
                          <div className="sm:col-span-2">
                             <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 ml-1">Valor Alvo</label>
                             <input 
                                value={editingVariable.conditionTargetValue || ""}
                                onChange={e => setEditingVariable({ ...editingVariable, conditionTargetValue: e.target.value })}
                                className="w-full bg-white border border-slate-200 focus:border-violet-500 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none"
                                placeholder="MANAUS ou 0"
                             />
                          </div>
                          <div className="sm:col-span-2">
                             <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 ml-1">Texto se Verdadeiro</label>
                             <textarea 
                                value={editingVariable.conditionTrueText || ""}
                                onChange={e => setEditingVariable({ ...editingVariable, conditionTrueText: e.target.value })}
                                className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none min-h-[80px]"
                                placeholder="Insira o texto que aparecerá se a condição for verdadeira..."
                             />
                          </div>
                          <div className="sm:col-span-2">
                             <label className="block text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-1 ml-1">Texto se Falso</label>
                             <textarea 
                                value={editingVariable.conditionFalseText || ""}
                                onChange={e => setEditingVariable({ ...editingVariable, conditionFalseText: e.target.value })}
                                className="w-full bg-white border border-slate-200 focus:border-rose-500 rounded-xl px-3 py-2 text-sm text-slate-800 outline-none min-h-[80px]"
                                placeholder="Insira o texto que aparecerá se a condição for falsa..."
                             />
                          </div>
                       </div>
                    </div>
                  )}

                  {(!editingVariable.type || editingVariable.type === "table") && (
                    <div className="space-y-4">
                      <div>
                         <label className="block text-sm font-extrabold uppercase tracking-widest text-slate-500 mb-1.5 ml-1">Modelo de Formatação (Format Pattern)</label>
                             <input 
                                value={editingVariable.formatPattern || ""}
                                onChange={e => setEditingVariable({ ...editingVariable, formatPattern: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium outline-none"
                                placeholder="Ex: Equipamento {nome} (Marca {marca}) na cor {cor}"
                             />
                             <p className="text-[10.5px] text-slate-400 mt-1.5 leading-relaxed ml-1">
                               Define o formato de cada registro preenchido no relatório final. Utilize as chaves <code>{"{nome_do_campo}"} </code> correspondentes ao campos cadastrados abaixo.
                             </p>
                          </div>

                          {/* Fields list in modal */}
                          <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3">
                         <div className="flex items-center justify-between">
                           <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 block">Campos da Variável</span>
                           <button
                             type="button"
                             onClick={() => setVariableFields([...variableFields, { key: "", label: "", placeholder: "" }])}
                             className="text-xs text-violet-600 font-bold uppercase hover:underline flex items-center gap-1 cursor-pointer"
                           >
                             <Plus className="w-3.5 h-3.5" /> Adicionar Campo
                           </button>
                         </div>


                     <div className="space-y-2.5">
                       {variableFields.map((field, idx) => (
                         <div key={idx} className="flex gap-2 items-start bg-white p-3 rounded-xl border border-slate-150 relative">
                           <div className="flex-1 space-y-2">
                             <div className="grid grid-cols-2 gap-2">
                               <div>
                                 <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5 ml-0.5">Chave (Minúsculo, sem espaços)</label>
                                 <input
                                   type="text"
                                   placeholder="nome, cnpj, marca"
                                   value={field.key}
                                   onChange={e => {
                                     const n = [...variableFields];
                                     n[idx].key = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                                     setVariableFields(n);
                                   }}
                                   className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500"
                                 />
                               </div>
                               <div>
                                 <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5 ml-0.5">Rótulo / Nome amigável</label>
                                 <input
                                   type="text"
                                   placeholder="Nome do Lab, Marca"
                                   value={field.label}
                                   onChange={e => {
                                     const n = [...variableFields];
                                     n[idx].label = e.target.value;
                                     setVariableFields(n);
                                   }}
                                   className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500"
                                 />
                               </div>
                             </div>
                             <div>
                               <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5 ml-0.5">Placeholder (Instrução)</label>
                               <input
                                 type="text"
                                 placeholder="Digite a informação..."
                                 value={field.placeholder || ""}
                                 onChange={e => {
                                   const n = [...variableFields];
                                   n[idx].placeholder = e.target.value;
                                   setVariableFields(n);
                                 }}
                                 className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500"
                                />
                              </div>
                             
                             <div className="mt-3 bg-slate-50 border border-slate-200 p-3 rounded-lg w-full">
                               <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block mb-1.5 ml-0.5">Tipo do Campo</label>
                               <select
                                  value={field.inputType || "text"}
                                  onChange={e => {
                                     const n = [...variableFields];
                                     n[idx].inputType = e.target.value as "text" | "radio";
                                     if(e.target.value === "radio" && (!n[idx].options || n[idx].options.length === 0)) {
                                        n[idx].options = [""];
                                     }
                                     setVariableFields(n);
                                  }}
                                  className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg outline-none focus:border-violet-500 bg-white"
                               >
                                  <option value="text">Texto</option>
                                  <option value="radio">Radio</option>
                               </select>

                               {field.inputType === "radio" && (
                                  <div className="mt-3 space-y-2 border-t border-slate-200 pt-3">
                                     <div className="flex justify-between items-center mb-2">
                                        <label className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500">Opções do Rádio</label>
                                        <button
                                           type="button"
                                           onClick={() => {
                                              const n = [...variableFields];
                                              n[idx].options = [...(n[idx].options || []), ""];
                                              setVariableFields(n);
                                           }}
                                           className="text-[10px] text-violet-600 hover:text-violet-700 font-bold flex items-center justify-center border border-violet-200 px-2 rounded-md hover:bg-violet-50 transition-colors"
                                        >
                                           + Opção
                                        </button>
                                     </div>
                                     {(field.options || []).map((o, oIdx) => (
                                        <div key={oIdx} className="flex gap-1.5 items-center">
                                           <input
                                              type="text"
                                              value={o}
                                              onChange={e => {
                                                 const n = [...variableFields];
                                                 const opts = [...(n[idx].options || [])];
                                                 opts[oIdx] = e.target.value;
                                                 n[idx].options = opts;
                                                 setVariableFields(n);
                                              }}
                                              placeholder="Ex: Conforme"
                                              className="flex-1 text-xs px-2 py-1 border border-slate-200 rounded outline-none focus:border-violet-500"
                                           />
                                           <button
                                              type="button"
                                              onClick={() => {
                                                 const n = [...variableFields];
                                                 const opts = [...(n[idx].options || [])];
                                                 opts.splice(oIdx, 1);
                                                 n[idx].options = opts;
                                                 setVariableFields(n);
                                              }}
                                              className="text-rose-500 hover:bg-rose-100 p-1 rounded-md"
                                           >
                                              <Trash2 className="w-3.5 h-3.5" />
                                           </button>
                                        </div>
                                     ))}
                                  </div>
                               )}
                            </div>
                            
                            </div>
                            <button
                              type="button"
                              onClick={() => setVariableFields(variableFields.filter((_, i) => i !== idx))}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer self-center mt-4 shrink-0 transition-colors"
                              title="Remover Campo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                       {variableFields.length === 0 && (
                         <p className="text-xs text-slate-400 italic">Nenhum campo registrado. Adicione pelo menos um campo.</p>
                       )}
                     </div>
                    </div>
                  </div>
                  )}

                  <div className="flex justify-end pt-2 items-center gap-4">
                     {error && (
                        <div className="flex-1 text-right text-rose-600 text-xs font-bold animate-in fade-in flex items-center justify-end gap-1.5">
                           <AlertCircle className="w-4 h-4" />
                           {error}
                        </div>
                     )}
                     <button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer shrink-0">
                        Salvar Variável
                     </button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* RENDER INTRO TAB VIEW */}
      {activeTab === "intro" && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
          <div className="mb-6 pb-4 border-b border-slate-100">
             <h3 className="font-extrabold text-sm uppercase tracking-widest text-slate-900 flex items-center">
                <PenSquare className="w-4 h-4 text-violet-600 mr-2" />
                Texto de Introdução Padrão
             </h3>
             <p className="text-sm text-slate-500 mt-1">Este texto será usado como introdução para a Avaliação Geral de todos os relatórios.</p>
          </div>
          <div className="space-y-4">
             <textarea 
                value={introText}
                onChange={e => setIntroText(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-slate-800 font-medium outline-none min-h-[300px] resize-y"
                placeholder="Insira o texto de introdução..."
             />
             <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 px-4">
               <strong>Dica:</strong> Utilize <code>[MUNICIPIO]</code>, <code>[QUANTIDADE_INSPEÇÕES_NO_MUNICIPIO_SELECIONADO]</code> e <code>[QTD_FARMACEUTICO]</code> para inserir valores dinamicamente.
             </div>
             <div className="flex justify-end pt-2">
                <button 
                  onClick={handleSaveIntro}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-md cursor-pointer"
                >
                   Salvar Introdução
                </button>
             </div>
          </div>
        </div>
      )}

      {/* RENDER TOPICS TAB VIEW */}
      {(["farmacias", "laboratorios", "farmacia_hospitalar", "remume", "outras_irregularidades", "conclusao_especifica"].includes(activeTab)) && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
           <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-widest text-slate-900 flex items-center">
                   <ListChecks className="w-4 h-4 text-violet-600 mr-2" />
                   {activeTab === "farmacias" && "3.1 FARMÁCIAS E DROGARIAS"}
                   {activeTab === "laboratorios" && "3.2 LABORATÓRIOS"}
                   {activeTab === "farmacia_hospitalar" && "3.3 FARMÁCIA HOSPITALAR"}
                   {activeTab === "remume" && "3.4 REMUME, CFT E GOVERNANÇA"}
                   {activeTab === "outras_irregularidades" && "3.5 OUTRAS IRREGULARIDADES"}
                   {activeTab === "conclusao_especifica" && "4. DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">Configure os tópicos dinâmicos que os fiscais poderão selecionar para preencher esta seção do relatório.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                   onClick={() => setEditingItem({ category: activeTab })}
                   className="bg-slate-900 hover:bg-violet-600 text-white font-extrabold text-sm uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                   <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>
           </div>

           {loadingInitial ? (
               <div className="py-10 text-center text-slate-400 font-medium text-sm font-mono">Carregando dados...</div>
           ) : items.filter(item => (item.category === activeTab) || (!item.category && activeTab === "farmacias")).length === 0 ? (
               <div className="py-10 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <ListChecks className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Nenhum item configurado.</p>
                  <button onClick={() => setEditingItem({ category: activeTab })} className="mt-4 text-sm text-violet-600 font-bold uppercase hover:underline cursor-pointer">Criar o Primeiro Item</button>
               </div>
           ) : (
              <div className="space-y-4">
                {items
                  .filter(item => (item.category === activeTab) || (!item.category && activeTab === "farmacias"))
                  .sort((a,b) => (a.order || 0) - (b.order || 0))
                  .map((item, index) => (
                   <div key={item.id} className="p-4 bg-slate-50/70 border border-slate-150 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                         <div className="flex items-center gap-2">
                           <h4 className="font-extrabold text-slate-900 text-sm font-display">{index + 1}. {item.title}</h4>
                           {item.defaultChecked && (
                             <span className="text-[10px] bg-violet-100 text-violet-700 font-bold px-2 py-0.5 rounded-md uppercase">Padrão</span>
                           )}
                           {item.isHidden && (
                             <span className="text-[10px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded-md uppercase flex items-center gap-1 cursor-default" title="Não aparecerá no Modal do Relatório para o usuário marcar, mas se também for Padrão, sairá no documento">
                               Oculto
                             </span>
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
                             onClick={() => changeOrder(activeTab, index, 'up')}
                             disabled={index === 0}
                             className="flex-1 flex items-center justify-center p-2 bg-white text-slate-400 border border-slate-200 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
                             title="Mover para Cima"
                           >
                             <ArrowUp className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={() => changeOrder(activeTab, index, 'down')}
                             disabled={index === items.filter(i => (i.category === activeTab) || (!i.category && activeTab === "farmacias")).length - 1}
                             className="flex-1 flex items-center justify-center p-2 bg-white text-slate-400 border border-slate-200 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
                             title="Mover para Baixo"
                           >
                             <ArrowDown className="w-4 h-4" />
                           </button>
                         </div>
                         <button 
                           onClick={() => setEditingItem(item)}
                           className="flex-1 sm:flex-none flex items-center justify-center p-2.5 bg-white text-slate-600 border border-slate-200 hover:border-violet-300 hover:text-violet-700 rounded-xl transition-all cursor-pointer"
                           title="Editar"
                         >
                           <PenSquare className="w-4 h-4" />
                         </button>
                         {confirmDelete === item.id ? (
                           <div className="flex gap-2 isolate">
                             <button onClick={() => setConfirmDelete(null)} className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 text-slate-500 rounded-lg cursor-pointer">Cancelar</button>
                             <button onClick={() => handleDelete(item.id)} className="px-2.5 py-1.5 text-xs font-bold bg-rose-500 text-white rounded-lg shadow-sm cursor-pointer">Confirmar</button>
                           </div>
                         ) : (
                           <button 
                             onClick={() => setConfirmDelete(item.id)}
                             className="flex-1 sm:flex-none flex items-center justify-center p-2.5 bg-white text-rose-500 border border-slate-200 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                             title="Excluir"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         )}
                      </div>
                   </div>
                ))}
              </div>
           )}
        </div>
      )}

      {/* RENDER VARIABLES TAB VIEW */}
      {activeTab === "variables" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-widest text-slate-900 flex items-center">
                   <Braces className="w-4 h-4 text-violet-600 mr-2" />
                   Variáveis de Relatório Customizadas
                </h3>
                <p className="text-sm text-slate-500 mt-1">Gerencie variáveis que podem ser preenchidas no Construtor do Relatório.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                   onClick={() => {
                     setEditingVariable({ id: "", name: "", formatPattern: "" });
                     setIsNewVariable(true);
                     setVariableFields([{ key: "nome", label: "Nome do Item", placeholder: "Ex: Digite o nome do equipamento..." }]);
                   }}
                   className="bg-slate-900 hover:bg-violet-600 text-white font-extrabold text-sm uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                   <Plus className="w-3.5 h-3.5" /> Criar Variável
                </button>
              </div>
           </div>

           {loadingInitial ? (
               <div className="py-10 text-center text-slate-400 font-medium text-sm font-mono">Carregando dados...</div>
           ) : variables.length === 0 ? (
               <div className="py-10 flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Braces className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-sm font-medium">Nenhuma variável configurada.</p>
                  <button onClick={() => { setEditingVariable({}); setIsNewVariable(true); setVariableFields([{ key: "nome", label: "Nome", placeholder: "" }]); }} className="mt-4 text-sm text-violet-600 font-bold uppercase hover:underline cursor-pointer">Criar Primeira Variável</button>
               </div>
           ) : (
              <div className="space-y-4">
                {variables.map((variable) => (
                   <div key={variable.id} className="p-5 bg-slate-50/70 border border-slate-150 rounded-2xl flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                         <div>
                           <div className="flex items-center gap-2.5">
                             <h4 className="font-extrabold text-slate-900 text-sm font-display">{variable.name}</h4>
                             <code className="bg-violet-100 text-violet-850 font-mono text-xs font-black px-2.5 py-0.5 rounded-lg uppercase">
                               [{variable.id}]
                             </code>
                           </div>
                           <p className="text-xs text-slate-500 font-semibold mt-1 font-mono">Formato final no DOCX: <span className="bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-indigo-700">"{variable.formatPattern}"</span></p>
                         </div>
                         
                         <div className="flex flex-wrap gap-2 pt-1">
                           {variable.fields.map((f, i) => (
                             <span key={i} className="text-[10px] uppercase font-black text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                               ⚙️ {f.label} (<code className="text-violet-600 lowercase">{f.key}</code>)
                             </span>
                           ))}
                         </div>
                      </div>
                      <div className="flex gap-2 self-end md:self-start">
                         <button 
                           onClick={() => {
                             setEditingVariable(variable);
                             setIsNewVariable(false);
                             setVariableFields(variable.fields || []);
                           }}
                           className="p-2.5 bg-white text-slate-600 border border-slate-200 hover:border-violet-300 hover:text-violet-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                           title="Editar Variável"
                         >
                           <PenSquare className="w-4 h-4" />
                         </button>
                         {confirmDeleteVariable === variable.id ? (
                           <div className="flex gap-1.5 isolate">
                             <button onClick={() => setConfirmDeleteVariable(null)} className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 text-slate-500 rounded-lg cursor-pointer">Cancelar</button>
                             <button onClick={() => handleDeleteVariable(variable.id)} className="px-1.5 py-1.5 text-xs font-bold bg-rose-500 text-white rounded-lg shadow-sm cursor-pointer text-center">Confirmar</button>
                           </div>
                         ) : (
                           <button 
                             onClick={() => setConfirmDeleteVariable(variable.id)}
                             className="p-2.5 bg-white text-rose-500 border border-slate-200 hover:border-rose-300 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer shadow-2xs"
                             title="Excluir Variável"
                           >
                             <Trash2 className="w-4 h-4" />
                           </button>
                         )}
                      </div>
                   </div>
                ))}
              </div>
           )}
        </div>
        </div>
      )}
    </div>
  );
}
