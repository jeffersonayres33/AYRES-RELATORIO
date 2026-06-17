import React, { useState, useRef } from "react";
import { DownloadCloud, UploadCloud, AlertTriangle, Loader2, Database, Info, Copy, Check, X } from "lucide-react";
import { collection, getDocs, doc, setDoc, deleteDoc, writeBatch, db } from "../lib/supabase";

const COLLECTIONS_TO_BACKUP = [
  "templateVariables",
  "evaluation_items",
  "evaluation_variables",
  "evaluation_intro",
  "authorized_users",
  "settings", // Just be careful with chunked ones, but setting might be small aside from chunks
  "fiscal_crf_mappings",
  "fiscal_name_mappings"
];

// We might want to specially handle settings/reportTemplate/chunks.
// Or just export everything in `settings` collection.

export default function BackupRestore() {
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);

  const sqlCode = `CREATE TABLE IF NOT EXISTS "fiscal_crf_mappings" (id TEXT PRIMARY KEY, data JSONB);
CREATE TABLE IF NOT EXISTS "fiscal_name_mappings" (id TEXT PRIMARY KEY, data JSONB);
CREATE TABLE IF NOT EXISTS "authorized_users" (id TEXT PRIMARY KEY, data JSONB);
CREATE TABLE IF NOT EXISTS "evaluation_items" (id TEXT PRIMARY KEY, data JSONB);
CREATE TABLE IF NOT EXISTS "evaluation_variables" (id TEXT PRIMARY KEY, data JSONB);
CREATE TABLE IF NOT EXISTS "templateVariables" (id TEXT PRIMARY KEY, data JSONB);
CREATE TABLE IF NOT EXISTS "evaluation_intro" (id TEXT PRIMARY KEY, data JSONB);
CREATE TABLE IF NOT EXISTS "settings" (id TEXT PRIMARY KEY, data JSONB);
CREATE TABLE IF NOT EXISTS "settings_chunks" (id TEXT PRIMARY KEY, data JSONB);
ALTER TABLE "fiscal_crf_mappings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "fiscal_name_mappings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "authorized_users" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluation_items" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluation_variables" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "templateVariables" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "evaluation_intro" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "settings" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "settings_chunks" DISABLE ROW LEVEL SECURITY;`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = async () => {
    setLoading(true);
    setStatusMsg("Preparando backup...");
    try {
      const backupData: any = {};
      
      for (const colName of COLLECTIONS_TO_BACKUP) {
        setStatusMsg(`Exportando ${colName}...`);
        const snapshot = await getDocs(collection(db, colName));
        const docsData: any = {};
        snapshot.forEach((docSnap) => {
          docsData[docSnap.id] = docSnap.data();
        });
        backupData[colName] = docsData;
      }
      
      // Special logic for template chunks if needed (settings/reportTemplate/chunks)
      // but actually, we can just export it as well if we query collectionGroup or do manually
      try {
         const chunksSnap = await getDocs(collection(db, "settings", "reportTemplate", "chunks"));
         const chunksData: any = {};
         chunksSnap.forEach((docSnap) => {
           chunksData[docSnap.id] = docSnap.data();
         });
         backupData["settings_chunks"] = chunksData;
      } catch (e) {
        // Ignored, might not exist
      }

      setStatusMsg("Gerando arquivo...");
      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_ai_studio_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      setStatusMsg("Backup concluído com sucesso!");
    } catch (e: any) {
      console.error(e);
      setStatusMsg(`Erro ao exportar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    setShowConfirmModal(true);
  };

  const handleCancelRestore = () => {
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowConfirmModal(false);
  };

  const executeRestore = async (file: File) => {
    setShowConfirmModal(false);
    setLoading(true);
    setStatusMsg("Lendo arquivo de backup...");
    try {
      const text = await file.text();
      let backupData: any;
      try {
        backupData = JSON.parse(text);
      } catch (errJson) {
        throw new Error("O arquivo selecionado não é um arquivo de backup JSON válido.");
      }

      const summaryParts: string[] = [];

      // Loop through the backed up collections and restore
      for (const colName of COLLECTIONS_TO_BACKUP) {
        if (backupData[colName]) {
          const keys = Object.keys(backupData[colName]);
          if (keys.length > 0) {
            setStatusMsg(`Restaurando ${colName} (${keys.length} itens)...`);
            for (const docId of keys) {
              await setDoc(doc(db, colName, docId), backupData[colName][docId]);
            }
            summaryParts.push(`${colName}: ${keys.length} itens`);
          }
        }
      }
      
      // Restore chunks if any
      if (backupData["settings_chunks"]) {
        const keys = Object.keys(backupData["settings_chunks"]);
        if (keys.length > 0) {
          setStatusMsg(`Restaurando template chunks (${keys.length} itens)...`);
          for (const docId of keys) {
             await setDoc(doc(db, "settings", "reportTemplate", "chunks", docId), backupData["settings_chunks"][docId]);
          }
          summaryParts.push(`settings_chunks: ${keys.length} itens`);
        }
      }

      if (summaryParts.length === 0) {
        setStatusMsg("Aviso: Nenhuma coleção ou dado válido foi encontrado para restaurar.");
      } else {
        setStatusMsg("Dados carregados e restaurados com sucesso!");
      }
    } catch (e: any) {
      console.error(e);
      setStatusMsg(`Erro ao restaurar: ${e.message || e}`);
    } finally {
      setPendingFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-2xl border border-violet-100">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-lg text-slate-800 uppercase font-display tracking-tight">Backup e Restauração</h3>
            <p className="text-sm font-medium text-slate-500">Salve e recupere as configurações, usuários e mapas do sistema.</p>
          </div>
        </div>
        
        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 mb-6 flex gap-3 text-sm font-medium">
            <Info className="w-5 h-5 shrink-0 text-blue-600" />
            <div>
               O backup inclui: Usuários, Tópicos da avaliação, Variáveis customizadas, Mapeamento CRF, Introdução Padrão, Template do arquivo Docx e Configurações de exportação.
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           {/* Export Card */}
           <div className="border border-slate-200 rounded-2xl p-5 hover:border-violet-300 transition-colors flex items-start gap-4">
              <div className="p-3 bg-slate-100 rounded-xl shrink-0">
                 <DownloadCloud className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                 <h4 className="font-extrabold text-slate-800 mb-1">Exportar Dados</h4>
                 <p className="text-sm text-slate-500 mb-4 h-10">Gera um arquivo .json com todos os dados salvos atualmente no sistema.</p>
                 <button 
                  className="bg-slate-900 text-white font-extrabold uppercase tracking-wider text-xs px-5 py-2.5 rounded-lg shadow disabled:opacity-50 hover:bg-violet-600 transition-all flex items-center gap-2"
                  onClick={handleExport}
                  disabled={loading}
                 >
                   {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <DownloadCloud className="w-4 h-4" />}
                   Fazer Backup
                 </button>
              </div>
           </div>

           {/* Import Card */}
           <div className="border border-amber-200 rounded-2xl p-5 hover:border-amber-400 transition-colors bg-amber-50/30 flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-xl shrink-0">
                 <UploadCloud className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                 <h4 className="font-extrabold text-slate-800 mb-1 flex items-center gap-2">
                    Restaurar Dados
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                 </h4>
                 <p className="text-sm text-slate-600 mb-4 h-10">Sobrescreve os dados atuais pelo conteúdo salvo no arquivo .json.</p>
                 
                 <label className={`cursor-pointer inline-flex items-center gap-2 bg-amber-600 text-white font-extrabold uppercase tracking-wider text-xs px-5 py-2.5 rounded-lg shadow hover:bg-amber-700 transition-all ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    Selecionar Arquivo
                    <input 
                      type="file" 
                      accept=".json" 
                      className="hidden" 
                      onChange={handleFileChange}
                      ref={fileInputRef}
                    />
                 </label>
              </div>
           </div>
        </div>



        {/* Confirmation Modal Overlay */}
         {showConfirmModal && pendingFile && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
             <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95 duration-155">
               <div className="flex items-center gap-3.5 mb-4 text-amber-600">
                 <div className="p-2.5 bg-amber-50 rounded-2xl border border-amber-100">
                   <AlertTriangle className="w-6 h-6" />
                 </div>
                 <div>
                   <h3 className="font-extrabold text-lg text-slate-900 uppercase tracking-tight font-display">Confirmar Restauração</h3>
                   <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest leading-none mt-1">Aviso de Sobrescrita</p>
                 </div>
               </div>

               <div className="space-y-3 mb-6">
                 <p className="text-sm font-semibold text-slate-700 leading-relaxed font-sans">
                   Você está prestes a carregar o arquivo de backup <strong className="text-violet-600 font-bold">{pendingFile.name}</strong>.
                 </p>
                 <p className="text-xs text-slate-500 leading-relaxed font-semibold bg-slate-50 border border-slate-100 p-3 rounded-xl">
                   <strong>Atenção:</strong> Restaurar um backup substituirá ou atualizará as configurações, tabelas, usuários e mapeamentos atuais do banco de dados no Supabase usando os dados lidos do arquivo JSON.
                 </p>
               </div>

               <div className="flex gap-2.5 justify-end">
                 <button
                   type="button"
                   onClick={handleCancelRestore}
                   className="px-4 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-widest text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                 >
                   Cancelar
                 </button>
                 <button
                   type="button"
                   onClick={() => executeRestore(pendingFile)}
                   className="px-5 py-2.5 rounded-xl font-extrabold text-xs uppercase tracking-widest bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/10 transition-all flex items-center gap-2 cursor-pointer"
                 >
                   <Check className="w-4 h-4" />
                   Confirmar
                 </button>
               </div>
             </div>
           </div>
         )}

         {statusMsg && (
           <div className="mt-6 text-sm font-bold text-center bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 animate-pulse">
              {statusMsg}
           </div>
        )}
    </div>
  )
}
