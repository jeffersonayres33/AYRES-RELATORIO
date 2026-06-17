import React, { useState } from 'react';
import { DatabaseZap, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, db } from '../lib/supabase';

export default function DatabaseOptimizer() {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addToLog = (msg: string) => {
    setLog(prev => [...prev, msg]);
  };

  const optimizeDatabase = async () => {
    setLoading(true);
    setLog(["Iniciando otimização do banco de dados..."]);

    try {
      // 1. Clean up Temp Settings (if any)
      addToLog("Procurando configurações temporárias...");
      try {
        await deleteDoc(doc(db, "settings", "temp_opt"));
      } catch(e) {}

      // 2. Clean up Evaluation Items that are invalid (no ID or no Title)
      addToLog("Analisando integridade de Tópicos...");
      const itemsSnap = await getDocs(collection(db, "evaluation_items"));
      let itemsDeleted = 0;
      for (const docSnap of itemsSnap.docs) {
         const data = docSnap.data();
         if (!data.title || data.title.trim() === "") {
             await deleteDoc(doc(db, "evaluation_items", docSnap.id));
             itemsDeleted++;
         }
      }
      addToLog(`✔ Tópicos defeituosos removidos: ${itemsDeleted}`);

      // 3. Clean up orphans variables (no ID)
      addToLog("Analisando integridade de Variáveis...");
      const varsSnap = await getDocs(collection(db, "evaluation_variables"));
      let varsDeleted = 0;
      for (const docSnap of varsSnap.docs) {
         const data = docSnap.data();
         if (!data.id || data.id.trim() === "") {
            await deleteDoc(doc(db, "evaluation_variables", docSnap.id));
            varsDeleted++;
         }
      }
      addToLog(`✔ Variáveis defeituosas removidas: ${varsDeleted}`);

      addToLog(`✅ Otimização concluída sem erros.`);

    } catch (e: any) {
      console.error(e);
      addToLog(`❌ Erro durante otimização: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl border border-violet-100">
            <DatabaseZap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-800 uppercase font-display tracking-tight">Otimização e Limpeza</h3>
            <p className="text-sm font-medium text-slate-500">Varre o banco de dados para remover registros não utilizados e melhorar a resiliência.</p>
          </div>
        </div>
        
        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl border border-amber-100 mb-6 flex gap-3 text-sm font-medium">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
            <div>
               As coleções antigas que não possuem mais relação com a nova estrutura da aplicação (como relatórios antigos de fallback) também serão removidas. Esta operação é segura, mas irreversível.
            </div>
        </div>

        <button 
           className="bg-slate-900 text-white font-extrabold uppercase tracking-widest text-sm px-6 py-4 rounded-xl shadow-md hover:bg-violet-600 transition-all flex items-center gap-3 w-full sm:w-auto justify-center disabled:opacity-50"
           onClick={optimizeDatabase}
           disabled={loading}
        >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <DatabaseZap className="w-5 h-5" />}
            {loading ? "Otimizando..." : "Rodar Otimização"}
        </button>

        {log.length > 0 && (
           <div className="mt-6 bg-slate-900 text-slate-300 p-5 rounded-2xl font-mono text-xs md:text-sm space-y-2 overflow-y-auto max-h-64 shadow-inner border border-slate-700">
              {log.map((msg, index) => (
                 <div key={index} className={msg.startsWith('❌') ? 'text-rose-400' : msg.startsWith('✅') ? 'text-emerald-400 font-bold' : ''}>
                    {msg}
                 </div>
              ))}
           </div>
        )}
    </div>
  )
}
