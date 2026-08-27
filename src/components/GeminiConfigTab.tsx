import React, { useState, useEffect } from "react";
import {
  Key,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Trash2,
  Info,
  Database,
  RefreshCw,
  Clock,
  UserCheck
} from "lucide-react";
import {
  getEffectiveGeminiKey,
  fetchDbGeminiConfig,
  saveDbGeminiKey,
  hasEmbeddedGeminiKey,
  testGeminiKey,
  GeminiConfigMeta
} from "../utils/geminiKey";
import { useLoading } from "../contexts/LoadingContext";

export default function GeminiConfigTab() {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dbMeta, setDbMeta] = useState<GeminiConfigMeta | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasEmbedded, setHasEmbedded] = useState(false);

  const { showLoading, hideLoading } = useLoading();

  const loadData = async () => {
    setHasEmbedded(hasEmbeddedGeminiKey());
    const meta = await fetchDbGeminiConfig();
    setDbMeta(meta);
    if (meta?.apiKey) {
      setApiKeyInput(meta.apiKey);
    } else {
      const eff = getEffectiveGeminiKey();
      if (eff) setApiKeyInput(eff);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTest = async () => {
    const keyToTest = apiKeyInput.trim() || dbMeta?.apiKey || getEffectiveGeminiKey();
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccessMessage(null);
    showLoading("Salvando chave no banco de dados central...");
    try {
      await saveDbGeminiKey(apiKeyInput.trim());
      setSaveSuccessMessage("Chave global salva com sucesso no banco de dados! Todos os usuários do sistema agora têm acesso imediato aos recursos de IA.");
      await loadData();
    } catch (err: any) {
      setSaveError(err.message || "Erro ao salvar no banco de dados.");
    } finally {
      hideLoading();
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Deseja realmente remover a chave global de IA do banco de dados? Os usuários não poderão utilizar os recursos de IA até que uma nova chave seja configurada.")) {
      return;
    }
    setSaveError(null);
    setSaveSuccessMessage(null);
    showLoading("Removendo chave global...");
    try {
      await saveDbGeminiKey("");
      setApiKeyInput("");
      setSaveSuccessMessage("Chave global removida do banco de dados.");
      await loadData();
    } catch (err: any) {
      setSaveError(err.message || "Erro ao remover chave.");
    } finally {
      hideLoading();
    }
  };

  const effectiveKey = getEffectiveGeminiKey();

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-xs">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-violet-100 text-violet-700 rounded-2xl">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight font-display text-slate-900 uppercase">
                Chave Global de IA (Google Gemini)
              </h2>
              <p className="text-slate-500 text-sm font-semibold mt-0.5">
                Armazenamento centralizado no banco de dados — Uma única chave configurada aqui atende a todos os usuários do sistema.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Recarregar do Banco</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Config Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
            <h3 className="font-extrabold text-sm uppercase tracking-widest text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-600" />
              Configuração no Banco Central
            </h3>

            {saveSuccessMessage && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-2xl flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{saveSuccessMessage}</span>
              </div>
            )}

            {saveError && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold rounded-2xl flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{saveError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center justify-between mb-2">
                  <span>Chave de API Gemini (Google AI):</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-violet-600 hover:text-violet-800 lowercase font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <span>Criar chave gratuita no Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </label>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    placeholder="AIzaSy..."
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 focus:border-violet-600 focus:bg-white focus:ring-2 focus:ring-violet-500/20 rounded-2xl text-sm font-mono text-slate-800 outline-none transition-all"
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
                <p className="text-[11px] text-slate-500 mt-2 font-medium">
                  A chave é gravada na tabela de configurações globais (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">app_settings/gemini_config</code>) e distribuída em tempo real para todos os fiscais e usuários.
                </p>
              </div>

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
                    <strong>{testResult.success ? "Conexão Verificada:" : "Falha no Teste:"}</strong> {testResult.message}
                  </div>
                </div>
              )}

              <div className="pt-3 flex flex-wrap items-center justify-between gap-3">
                {apiKeyInput && (
                  <button
                    type="button"
                    onClick={handleRemove}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-rose-700 hover:text-rose-900 hover:bg-rose-50 border border-rose-200 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-rose-600" />
                    <span>Remover Chave Global</span>
                  </button>
                )}

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="button"
                    disabled={isTesting}
                    onClick={handleTest}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-250 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 text-violet-600 animate-spin" />
                        <span>Validando na Google...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                        <span>Testar Conexão</span>
                      </>
                    )}
                  </button>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-black uppercase tracking-wider text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm transition-all cursor-pointer hover:shadow"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar no Banco de Dados</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Info & Status */}
        <div className="space-y-6">
          {/* Status Box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h4 className="font-extrabold text-xs uppercase tracking-widest text-slate-500">
              Status da IA no Sistema
            </h4>

            <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
              effectiveKey 
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950" 
                : "bg-amber-50/70 border-amber-200 text-amber-950"
            }`}>
              {effectiveKey ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <span className="font-bold block text-sm">
                  {effectiveKey ? "IA Operacional e Conectada" : "Chave de IA Ausente"}
                </span>
                <p className="text-slate-600 leading-relaxed font-medium">
                  {effectiveKey
                    ? "Os recursos automáticos de marcação de termos, justificativas de infraestrutura e correção ortográfica estão operando para todos os usuários."
                    : "Os usuários verão um aviso informando que a IA está temporariamente aguardando configuração pelo administrador."}
                </p>
              </div>
            </div>

            {dbMeta && (
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                  <UserCheck className="w-4 h-4 text-violet-600" />
                  <span>Última Atualização:</span>
                </div>
                {dbMeta.updatedBy && (
                  <p className="pl-5 text-slate-600">
                    Por: <strong className="text-slate-900">{dbMeta.updatedBy}</strong>
                  </p>
                )}
                {dbMeta.updatedAt && (
                  <p className="pl-5 flex items-center gap-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(dbMeta.updatedAt).toLocaleString("pt-BR")}
                  </p>
                )}
              </div>
            )}

            {hasEmbedded && (
              <div className="p-3 bg-violet-50 border border-violet-150 rounded-2xl text-xs text-violet-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Existe também uma chave embutida via variáveis de ambiente/build (GitHub Secrets). A chave do banco de dados tem prioridade dinâmica.
                </span>
              </div>
            )}
          </div>

          {/* Features Supported */}
          <div className="bg-violet-950 text-white rounded-3xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-violet-300 font-extrabold text-xs uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-violet-400" />
              <span>Recursos Ativados</span>
            </div>
            <ul className="text-xs text-violet-150 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-violet-400 font-bold">•</span>
                <span><strong>Marcação Automática:</strong> Análise de termos sanitários com justificativas contextuais de vistorias técnicas.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 font-bold">•</span>
                <span><strong>Revisão de Texto:</strong> Correção ortográfica e sintática com concordância do relatório final.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
