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
  Info
} from "lucide-react";
import {
  getEffectiveGeminiKey,
  getCustomGeminiKey,
  setCustomGeminiKey,
  hasEmbeddedGeminiKey,
  testGeminiKey
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
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [hasEmbedded, setHasEmbedded] = useState(false);
  const [currentEffective, setCurrentEffective] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const custom = getCustomGeminiKey();
      const effective = getEffectiveGeminiKey();
      const embedded = hasEmbeddedGeminiKey();
      
      setApiKeyInput(custom || (embedded ? "" : ""));
      setCurrentEffective(effective);
      setHasEmbedded(embedded);
      setTestResult(null);
      setSaveSuccess(false);
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

  const handleSave = () => {
    const trimmed = apiKeyInput.trim();
    setCustomGeminiKey(trimmed);
    setSaveSuccess(true);
    if (onKeySaved) {
      onKeySaved(trimmed || getEffectiveGeminiKey());
    }
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleClear = () => {
    setCustomGeminiKey("");
    setApiKeyInput("");
    setTestResult(null);
    setCurrentEffective(getEffectiveGeminiKey());
    if (onKeySaved) {
      onKeySaved(getEffectiveGeminiKey());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-violet-900 to-indigo-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Key className="w-5 h-5 text-violet-200" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display">Chave de API do Gemini (Google AI)</h2>
              <p className="text-xs text-violet-200">Configuração para IA no GitHub Pages e ambiente externo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-sm">
          {/* Status Banner */}
          <div className="p-4 rounded-xl border flex items-start gap-3 bg-slate-50 border-slate-200">
            {currentEffective ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs">
              <span className="font-bold block text-slate-900 text-sm mb-0.5">
                Status da IA: {currentEffective ? "Chave Ativa e Pronta" : "Nenhuma Chave Configurada"}
              </span>
              {hasEmbedded && (
                <p className="text-slate-600">
                  <span className="font-semibold text-emerald-700">Chave incorporada via Build/GitHub Secrets</span> detectada na aplicação.
                </p>
              )}
              {getCustomGeminiKey() && (
                <p className="text-slate-600 mt-0.5">
                  <span className="font-semibold text-violet-700">Chave personalizada salva neste navegador</span> está em uso prioritário.
                </p>
              )}
              {!currentEffective && (
                <p className="text-amber-800 mt-0.5 leading-relaxed">
                  No GitHub Pages ou fora do servidor local, a IA necessita de uma chave do Google Gemini para realizar a análise dos termos e revisão de relatórios.
                </p>
              )}
            </div>
          </div>

          {/* Form Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
              <span>Sua Chave de API Gemini:</span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-violet-600 hover:text-violet-800 lowercase font-medium flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>Obter chave gratuita no Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                placeholder="Cole sua chave aqui (ex: AIzaSy...)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full pl-3.5 pr-20 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:border-violet-600 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
                  title={showKey ? "Ocultar" : "Mostrar"}
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              A chave personalizada fica armazenada localmente apenas no seu navegador (<code className="bg-slate-100 px-1 py-0.5 rounded">localStorage</code>), garantindo total privacidade e segurança.
            </p>
          </div>

          {/* Test Feedback */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 animate-in fade-in ${
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
                <strong>{testResult.success ? "Conexão bem-sucedida:" : "Erro no teste:"}</strong> {testResult.message}
              </div>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Chave salva com sucesso! Atualizando aplicação...</span>
            </div>
          )}

          {/* GitHub Pages Secret Guide */}
          <div className="p-3.5 bg-violet-50/70 border border-violet-200 rounded-xl space-y-1.5 text-xs text-violet-950">
            <div className="flex items-center gap-1.5 font-bold text-violet-900">
              <Info className="w-4 h-4 text-violet-600 shrink-0" />
              <span>Dica para GitHub Pages (Automático para todos os usuários):</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Para incorporar a chave direto no seu deploy do GitHub Pages sem precisar digitar no navegador:
            </p>
            <ol className="list-decimal list-inside text-slate-600 space-y-0.5 pl-1">
              <li>Acesse seu repositório no GitHub &rarr; <strong>Settings</strong> &rarr; <strong>Secrets and variables</strong> &rarr; <strong>Actions</strong>.</li>
              <li>Clique em <strong>New repository secret</strong>.</li>
              <li>Defina o Nome como <code className="bg-white px-1 py-0.5 border border-violet-200 rounded font-mono font-bold text-violet-900">GEMINI_API_KEY</code> e cole a chave no valor.</li>
              <li>Faça um novo push ou execute a action em <strong>Actions &rarr; Deploy to GitHub Pages &rarr; Run workflow</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {getCustomGeminiKey() && (
              <button
                type="button"
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Remover Chave Salva</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              disabled={isTesting}
              onClick={handleTest}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
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
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm transition-all cursor-pointer hover:shadow"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Chave</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
