import React, { useState } from "react";
import {
  FileText,
  Upload,
  ClipboardCheck,
  MapPin,
  Printer,
  ShieldAlert,
  Building,
  RefreshCw,
  Trash2,
  CheckCircle,
  Menu,
  X,
  FileCheck2,
  Users,
  Settings,
  Database
} from "lucide-react";
import { Estabelecimento, TechnicalResponsible, TermoSanitario } from "./types";
import { motion, AnimatePresence } from "motion/react";

// Components
import Dashboard from "./components/Dashboard";
import Importer from "./components/Importer";
import TripOverview from "./components/TripOverview";
import AdminPanel from "./components/AdminPanel";
import { auth, signOut } from "./lib/supabase";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("importacao");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const [showRlsWarning, setShowRlsWarning] = useState<boolean>(() => {
    return localStorage.getItem('supabase_rls_policy_active_warning') === 'true';
  });
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const sqlToCopy = `-- Executar no SQL Editor do Supabase:\nALTER TABLE "fiscal_crf_mappings" DISABLE ROW LEVEL SECURITY;\nALTER TABLE "fiscal_name_mappings" DISABLE ROW LEVEL SECURITY;\nALTER TABLE "authorized_users" DISABLE ROW LEVEL SECURITY;\nALTER TABLE "evaluation_items" DISABLE ROW LEVEL SECURITY;\nALTER TABLE "evaluation_variables" DISABLE ROW LEVEL SECURITY;\nALTER TABLE "templateVariables" DISABLE ROW LEVEL SECURITY;\nALTER TABLE "evaluation_intro" DISABLE ROW LEVEL SECURITY;\nALTER TABLE "settings" DISABLE ROW LEVEL SECURITY;\nALTER TABLE "settings_chunks" DISABLE ROW LEVEL SECURITY;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlToCopy);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  // Global state for uploaded data
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [rts, setRts] = useState<TechnicalResponsible[]>([]);
  const [termos, setTermos] = useState<TermoSanitario[]>([]);

  // Simulated Loading state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [loadingMessage, setLoadingMessage] = useState<string>("Processando dados...");

  const simulateLoading = (message: string, callback: () => void) => {
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingMessage(message);
    let current = 0;
    const interval = setInterval(() => {
      // increase in dynamic natural increments
      current += Math.floor(Math.random() * 8) + 6;
      if (current >= 100) {
        current = 100;
        setLoadingProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          setIsLoading(false);
          callback();
        }, 220);
      } else {
        setLoadingProgress(current);
      }
    }, 35);
  };

  // Selected establishment from City Trip tab for rapid report generation
  const [targetedInscricao, setTargetedInscricao] = useState<string>("");

  const handleDataImported = (data: {
    estabelecimentos: Estabelecimento[];
    rts: TechnicalResponsible[];
    termos: TermoSanitario[];
  }) => {
    simulateLoading("Importando e Cruzando Dados XML...", () => {
      if (data.estabelecimentos.length > 0) {
        setEstabelecimentos(prev => {
          const map = new Map(prev.map(item => [item.inscricao, item]));
          data.estabelecimentos.forEach(e => {
            if (!map.has(e.inscricao)) {
              map.set(e.inscricao, e);
            }
          });
          return Array.from(map.values());
        });
      }

      if (data.rts.length > 0) {
        setRts(prev => {
          const map = new Map(prev.map(item => [`${item.estabelecimentoId}_${item.crf}`, item]));
          data.rts.forEach(r => {
            if (!map.has(`${r.estabelecimentoId}_${r.crf}`)) {
              map.set(`${r.estabelecimentoId}_${r.crf}`, r);
            }
          });
          return Array.from(map.values());
        });
      }

      if (data.termos.length > 0) {
        setTermos(prev => {
          const map = new Map(prev.map(item => [`${item.estabelecimentoId}_${item.dtInicio}`, item]));
          data.termos.forEach(t => {
            if (!map.has(`${t.estabelecimentoId}_${t.dtInicio}`)) {
              map.set(`${t.estabelecimentoId}_${t.dtInicio}`, t);
            }
          });
          return Array.from(map.values());
        });
      }
    });
  };

  const handleClearAll = () => {
    setEstabelecimentos([]);
    setRts([]);
    setTermos([]);
    setTargetedInscricao("");
    setActiveTab("importacao");
  };

  const hasData = estabelecimentos.length > 0;

  const filteredEstabelecimentos = React.useMemo(() => {
    if (termos.length === 0) {
      return estabelecimentos;
    }
    const activeIds = new Set(termos.map(t => t.estabelecimentoId));
    return estabelecimentos.filter(e => {
      if (e.origem === "SISCON") {
        return activeIds.has(e.inscricao);
      }
      return true; // Keep "FEM_NOVO" (xxxx_20) establishments
    });
  }, [estabelecimentos, termos]);

  const tabs = [
    { id: "importacao", label: "Importação XML", icon: Upload, badge: !hasData ? "Pendente" : "Carregado" },
    { id: "dashboard", label: "Painel Geral", icon: FileText, badge: hasData ? "Ativo" : null },
    { id: "cidades", label: "Relatórios", icon: MapPin, badge: null },
    { id: "admin", label: "Painel do Administrador", icon: Users, badge: null }
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex font-sans select-none print:bg-white text-slate-800 relative">
      
      {/* SLIDE-IN DRAWER - For Mobile & Desktop (triggered by menu button) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 shadow-2xl flex flex-col border-r border-slate-250 select-none"
              id="mobile-drawer"
            >
              {/* Drawer header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-violet-600 flex items-center justify-center text-white shadow-md shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-widest text-slate-900 font-sans uppercase break-words max-w-[170px]">
                      AYRES-RELATÓRIO
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer active:scale-95 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer items list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {!hasData && (
                  <div className="bg-amber-50 border border-amber-150 rounded-2xl p-4 mb-4">
                    <div className="flex gap-2.5 items-start">
                      <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-black text-amber-900 uppercase">
                          Importação Obrigatória
                        </h4>
                        <p className="text-sm text-amber-800 leading-normal mt-1 font-medium font-sans">
                          Por segurança, todos os recursos da aplicação permanecem bloqueados até que ao menos um arquivo XML da fiscalização seja importado pelo sistema.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isLocked = !hasData && tab.id !== "importacao" && tab.id !== "admin";
                  
                  return (
                    <button
                      key={tab.id}
                      disabled={isLocked}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all ${
                        isActive
                          ? "bg-violet-600 text-white font-extrabold shadow-md shadow-violet-600/10"
                          : isLocked
                          ? "opacity-35 bg-slate-50 text-slate-400 cursor-not-allowed border border-dashed border-slate-200"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100/90 cursor-pointer hover:text-slate-900 font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-3 text-sm font-black">
                        <Icon className={`w-4.5 h-4.5 ${isActive ? "text-white" : isLocked ? "text-slate-350" : "text-slate-550"}`} />
                        {tab.label}
                      </div>
                      
                      {isLocked ? (
                        <span className="text-sm font-extrabold px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md border border-slate-200 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-slate-400" />
                          Inacessível
                        </span>
                      ) : tab.badge ? (
                        <span className={`text-sm font-extrabold px-2 py-0.5 rounded-md ${
                          isActive ? "bg-white/20 text-white" : "bg-violet-50 text-violet-700 border border-violet-100"
                        }`}>
                          {tab.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Drawer footer operations */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/70 space-y-2">
                {hasData && (
                  <button
                    onClick={() => {
                      handleClearAll();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-150 rounded-xl text-sm font-black transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <Trash2 className="w-4 h-4" />
                    Limpar Banco de Dados
                  </button>
                )}
                
                <button
                  onClick={() => {
                    signOut(auth);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900 border border-slate-300 rounded-xl text-sm font-black transition-all shadow-xs cursor-pointer active:scale-98"
                >
                  Sair do Sistema
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 3. MAIN CONTAINER AREA */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Unified top-bar */}
        <header className="bg-white border-b border-slate-200/85 sticky top-0 z-40 shadow-xs px-4 h-16 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2.5 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex w-9 h-9 rounded-xl bg-violet-600 items-center justify-center text-white shadow-sm shrink-0">
                <Database className="w-4.5 h-4.5" />
              </div>
              <div className="flex flex-col justify-center">
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900 font-display uppercase leading-none">
                  AYRES-RELATÓRIO
                </h1>
                <span className="text-sm text-slate-400 mt-1 font-sans font-bold uppercase tracking-wider hidden sm:block">
                  GERENCIADOR DE RELATÓRIOS
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-violet-600 uppercase font-display tracking-tight hidden sm:flex items-center gap-2 px-3 py-1 bg-violet-50 rounded-lg">
              <span>{tabs.find(t => t.id === activeTab)?.label}</span>
            </h2>
          </div>
        </header>


        <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="print:p-0 print:m-0"
            >
              {activeTab === "dashboard" && (
                <Dashboard
                  estabelecimentos={filteredEstabelecimentos}
                  termos={termos}
                  onNavigateToTab={(tab) => {
                    if (!hasData && tab !== "importacao") return; // guard navigation
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              )}

              {activeTab === "importacao" && (
                <Importer
                  onDataImported={handleDataImported}
                />
              )}

              {activeTab === "cidades" && (
                <TripOverview
                  estabelecimentos={filteredEstabelecimentos}
                  termos={termos}
                  rts={rts}
                />
              )}

              {activeTab === "admin" && <AdminPanel />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Footer information */}
        <footer className="bg-white border-t border-slate-200 py-6 mt-12 print:hidden transition-all">
          <div className="w-full px-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm font-mono text-slate-400 font-bold tracking-wider uppercase text-center">
            <span>
              © 2018-2026 JEFFERSON DE OLIVEIRA AYRES
            </span>
          </div>
        </footer>
      </div>

      {/* Darkened Simulated Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/85 backdrop-blur-sm z-[9999] flex flex-col justify-center items-center text-white"
          >
            <div className="text-center space-y-6 max-w-sm w-full px-6">
              <div className="relative flex justify-center">
                {/* Rotating gear icon */}
                <div className="p-5 bg-violet-600/10 border border-violet-500/20 rounded-full animate-[spin_5s_linear_infinite]">
                  <Settings className="w-14 h-14 text-violet-500" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-2xl font-black font-display tracking-tight text-white">Aguarde...</h3>
                <p className="text-sm text-neutral-400 font-mono tracking-wider uppercase">{loadingMessage}</p>
              </div>

              <div className="space-y-2">
                <div className="w-full h-2.5 bg-neutral-900 border border-neutral-800 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    className="h-full bg-violet-500 rounded-full transition-all duration-150 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                    layout
                  />
                </div>
                <div className="flex justify-between text-sm font-mono text-neutral-500 font-black tracking-wider">
                  <span>PROGRESSO DIGITAL</span>
                  <span className="text-violet-400 font-black">{loadingProgress}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
