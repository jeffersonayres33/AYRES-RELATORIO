import React, { useState, useEffect } from "react";
import {
  Key,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  X,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Trash2,
  Info,
  Database
} from "lucide-react";
import {
  getEffectiveGeminiKey,
  fetchDbGeminiConfig,
  saveDbGeminiKey,
  hasEmbeddedGeminiKey,
  testGeminiKey,
  GeminiConfigMeta
} from "../utils/geminiKey";

interface GeminiApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: (newKey: string) => void;
}

export default function GeminiApiKeyModal({
  isOpen,
  onClose,
  onKeySaved
}: GeminiApiKeyModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasEmbedded, setHasEmbedded] = useState(false);
  const [currentEffective, setCurrentEffective] = useState("");
  const [dbMeta, setDbMeta] = useState<GeminiConfigMeta | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTestResult(null);
      setSaveSuccess(false);
      setErrorMessage(null);
      const effective = getEffectiveGeminiKey();
      setCurrentEffective(effective);
      setHasEmbedded(hasEmbeddedGeminiKey());

      fetchDbGeminiConfig().then((meta) => {
        setDbMeta(meta);
        if (meta?.apiKey) {
          setApiKeyInput(meta.apiKey);
        } else if (effective) {
          setApiKeyInput(effective);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    const keyToTest = apiKeyInput.trim() || currentEffective;
    if (!keyToTest) {
      setTestResult({
        success: false,
        message: "Por favor, digite ou cole uma chave de API antes de testar."
      });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testGeminiKey(keyToTest);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({
        success: false,
        message: e?.message || "Falha ao testar chave."
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    const trimmed = apiKeyInput.trim();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);
    try {
      await saveDbGeminiKey(trimmed);
      setSaveSuccess(true);
      if (onKeySaved) {
        onKeySaved(trimmed || getEffectiveGeminiKey());
      }
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao salvar chave no banco de dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    if (!window.confirm("Deseja realmente remover a chave de IA do banco de dados?")) {
      return;
    }
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await saveDbGeminiKey("");
      setApiKeyInput("");
      setTestResult(null);
      setCurrentEffective(getEffectiveGeminiKey());
      if (onKeySaved) {
        onKeySaved(getEffectiveGeminiKey());
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro ao remover chave.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-violet-900 via-indigo-900 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl">
              <Key className="w-5 h-5 text-violet-200" />
            </div>
            <div>
              <h2 className="text-base font-extrabold font-display uppercase tracking-wide">Configurar Chave Global de IA (Gemini)</h2>
              <p className="text-xs text-violet-200 font-medium">Armazenamento Centralizado no Banco de Dados</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-sm">
          {/* Status Banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            currentEffective ? "bg-emerald-50/70 border-emerald-200" : "bg-amber-50/70 border-amber-200"
          }`}>
            {currentEffective ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <span className="font-extrabold block text-slate-900 text-sm mb-0.5">
                Status da IA: {currentEffective ? "Chave Ativa e Operacional" : "Nenhuma Chave Configurada"}
              </span>
              <p className="text-slate-600 leading-relaxed font-medium">
                {currentEffective
                  ? "A chave está salva no banco central e é compartilhada com todos os usuários do sistema."
                  : "Insira uma chave do Google Gemini para habilitar a marcação automática de termos sanitários e a revisão com IA."}
              </p>
            </div>
          </div>

          {/* Form Input */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Chave de API Gemini (Google AI):</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-violet-600 hover:text-violet-800 lowercase font-bold flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Obter chave no Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                placeholder="Cole sua chave aqui (ex: AIzaSy...)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm font-mono focus:border-violet-600 focus:bg-white focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                title={showKey ? "Ocultar" : "Mostrar"}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium pt-1">
              <Database className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              <span>A chave salva será gravada no banco de dados e servirá para <strong>qualquer usuário</strong> que acesse o sistema.</span>
            </div>
          </div>

          {/* Test Feedback */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                testResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              {testResult.success ? (
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 leading-relaxed">
                <strong>{testResult.success ? "Conexão Validada:" : "Erro no Teste:"}</strong> {testResult.message}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold rounded-2xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Chave global gravada com sucesso no banco de dados!</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {apiKeyInput && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Remover do Banco</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isTesting || isSaving}
              onClick={handleTest}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 text-violet-600 animate-spin" />
                  <span>Testando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                  <span>Testar Conexão</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm transition-all cursor-pointer hover:shadow disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span>Gravando no Banco...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Chave Global</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
