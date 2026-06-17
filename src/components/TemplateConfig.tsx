import React, { useState, useEffect, useRef } from "react";
import { doc, getDoc, setDoc, deleteDoc, db } from "../lib/supabase";
import { useLoading } from "../contexts/LoadingContext";
import { FileUp, FileCheck, Trash2, XCircle } from "lucide-react";

const CHUNK_SIZE = 800000; // ~800KB limit per chunk to be safe within Firestore's 1MB doc limit

export default function TemplateConfig() {
  const { showLoading, hideLoading } = useLoading();
  const [templateExists, setTemplateExists] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const cancelRef = useRef(false);

  const fetchTemplateStatus = async () => {
    try {
      const docRef = doc(db, "settings", "reportTemplate");
      const snap = await getDoc(docRef);
      if (snap.exists() && snap.data().totalChunks !== undefined) {
        setTemplateExists(true);
        setLastUpdated(snap.data().updatedAt);
      } else {
        setTemplateExists(false);
        setLastUpdated(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTemplateStatus();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      console.error("Por favor, selecione um arquivo no formato .docx");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    cancelRef.current = false;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result;
      if (typeof base64 !== "string") {
        setIsUploading(false);
        return;
      }

      // Extract base64
      const base64Data = base64.includes(",") ? base64.split(",")[1] : base64;
      const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
      
      try {
        // Save the metadata first
        const docRef = doc(db, "settings", "reportTemplate");
        await setDoc(docRef, {
          updatedAt: Date.now(),
          filename: file.name,
          totalChunks
        });
        
        let completed = 0;
        // Save the chunks
        for (let i = 0; i < totalChunks; i++) {
          if (cancelRef.current) {
            // Cancelled
            console.log("Upload cancelled");
            break;
          }
          const chunk = base64Data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
          const chunkRef = doc(db, `settings/reportTemplate/chunks/chunk_${i}`);
          await setDoc(chunkRef, { data: chunk, index: i });
          
          completed++;
          setUploadProgress((completed / totalChunks) * 100);
        }
        
        if (!cancelRef.current) {
          await fetchTemplateStatus();
        }
      } catch (err: any) {
        console.error(err);
        console.error("Erro ao salvar o template. Verifique seu acesso ou tamanho do arquivo.");
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    };
    
    reader.readAsDataURL(file);
  };

  const cancelUpload = () => {
    cancelRef.current = true;
    setIsUploading(false);
    setUploadProgress(0);
  };

  const handleRemoveTemplate = async () => {
    setShowConfirmDelete(false);
    showLoading("Removendo template...");
    try {
      const docRef = doc(db, "settings", "reportTemplate");
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const totalChunks = snap.data().totalChunks || 0;
        for(let i=0; i<totalChunks; i++) {
          const chunkRef = doc(db, `settings/reportTemplate/chunks/chunk_${i}`);
          await deleteDoc(chunkRef);
        }
      }
      await deleteDoc(docRef);
      await fetchTemplateStatus();
    } catch (err: any) {
      console.error(err);
      console.error("Erro ao remover o template.");
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-xs space-y-6">
      <div>
        <h3 className="font-extrabold text-lg uppercase tracking-widest text-slate-900 mb-1 flex items-center gap-2">
          Modelo de Relatório Completo (.docx)
        </h3>
        <p className="text-slate-500 text-sm">
          Faça upload de um arquivo .docx para ser usado como base na exportação do relatório completo.
          O sistema automaticamente substituirá as variáveis dentro do documento. As variáveis disponíveis são:
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <ul className="text-sm font-medium text-slate-700 space-y-2 list-disc list-inside">
          <li><code className="bg-slate-200 text-violet-700 px-1.5 py-0.5 rounded font-mono">[NOME_FISCAL]</code> ou <code className="bg-slate-200 text-violet-700 px-1.5 py-0.5 rounded font-mono">[NOME_FISCAL1]</code>, <code className="bg-slate-200 text-violet-700 px-1.5 py-0.5 rounded font-mono">[NOME_FISCAL2]</code> - Nome de cada fiscal.</li>
          <li><code className="bg-slate-200 text-violet-700 px-1.5 py-0.5 rounded font-mono">[CRF_FISCAL]</code> ou <code className="bg-slate-200 text-violet-700 px-1.5 py-0.5 rounded font-mono">[CRF_FISCAL1]</code>, <code className="bg-slate-200 text-violet-700 px-1.5 py-0.5 rounded font-mono">[CRF_FISCAL2]</code> - Número do CRF de cada fiscal (mapeado dinamicamente).</li>
          <li><code className="bg-slate-200 text-violet-700 px-1.5 py-0.5 rounded font-mono">[SEXO_FISCAL]</code> ou <code className="bg-slate-200 text-violet-700 px-1.5 py-0.5 rounded font-mono">[SEXO_FISCAL1]</code>, <code className="bg-slate-200 text-violet-700 px-1.5 py-0.5 rounded font-mono">[SEXO_FISCAL2]</code> - "Fiscal Farmacêutico" ou "Fiscal Farmacêutica".</li>
          <li><code className="bg-slate-200 text-violet-700 px-1.5 py-0.5 rounded font-mono">[LOCAL_DATA_POR_EXTENSO]</code> - Ex: Manaus, 12 de março de 2024</li>
          <li><code className="bg-slate-200 text-violet-700 px-1.5 py-0.5 rounded font-mono">[DATA]</code> ou <code className="bg-slate-200 text-violet-700 px-1.5 py-0.5 rounded font-mono">[DADOS]</code> - Apenas a data (ex: 12 de março de 2024)</li>
          <li><code className="bg-slate-200 text-rose-600 px-1.5 py-0.5 rounded font-mono">[@RELATORIO_SIMPLES]</code> - Substituído pelo conteúdo do relatório simples com formatação (Textos justificados e tópicos em negrito). É obrigatório o símbolo <b>@</b> antes do nome. (Recomenda-se deixar esse texto em um parágrafo isolado).</li>
        </ul>
      </div>

      {isUploading ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-700">Enviando Documento...</span>
            <span className="text-sm font-bold text-violet-600">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4">
            <div 
              className="bg-violet-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={cancelUpload}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
            >
              <XCircle className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      ) : templateExists ? (
        <div className="flex items-center justify-between p-5 border border-emerald-200 bg-emerald-50 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
              <FileCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-extrabold text-slate-800">Template Customizado Ativo</p>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Atualizado em: {lastUpdated ? new Date(lastUpdated).toLocaleString('pt-BR') : 'Data desconhecida'}
              </p>
            </div>
          </div>
          {showConfirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-600 mr-2">Tem certeza?</span>
              <button 
                onClick={handleRemoveTemplate}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors"
              >
                Sim, remover
              </button>
              <button 
                onClick={() => setShowConfirmDelete(false)}
                className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowConfirmDelete(true)}
              className="p-2 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-xl transition-all flex items-center justify-center cursor-pointer"
              title="Remover template"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <FileUp className="w-8 h-8 text-slate-400 mb-3" />
            <p className="mb-2 text-sm font-semibold text-slate-600">
              <span className="font-bold text-violet-600">Clique para selecionar</span> ou arraste o arquivo .docx aqui
            </p>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-extrabold">Apenas DOCX</p>
          </div>
          <input type="file" className="hidden" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileUpload} />
        </label>
      )}
    </div>
  );
}
