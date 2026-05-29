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
  Settings
} from "lucide-react";
import { Estabelecimento, TechnicalResponsible, TermoSanitario, FarmaciaChecklist } from "./types";
import { motion, AnimatePresence } from "motion/react";

// Components
import Dashboard from "./components/Dashboard";
import Importer from "./components/Importer";
import ChecklistCheck from "./components/ChecklistCheck";
import TripOverview from "./components/TripOverview";
import LicenseAdmin from "./components/LicenseAdmin";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("importacao");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Global state for uploaded data
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([]);
  const [rts, setRts] = useState<TechnicalResponsible[]>([]);
  const [termos, setTermos] = useState<TermoSanitario[]>([]);
  const [checklists, setChecklists] = useState<FarmaciaChecklist[]>([]);

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
    checklists: FarmaciaChecklist[];
  }) => {
    simulateLoading("Importando e Cruzando Dados XML...", () => {
      if (data.estabelecimentos.length > 0) {
        setEstabelecimentos(prev => {
          const merged = [...prev];
          data.estabelecimentos.forEach(e => {
            if (!merged.some(x => x.inscricao === e.inscricao)) {
              merged.push(e);
            }
          });
          return merged;
        });
      }

      if (data.rts.length > 0) {
        setRts(prev => {
          const merged = [...prev];
          data.rts.forEach(r => {
            if (!merged.some(x => x.estabelecimentoId === r.estabelecimentoId && x.crf === r.crf)) {
              merged.push(r);
            }
          });
          return merged;
        });
      }

      if (data.termos.length > 0) {
        setTermos(prev => {
          const merged = [...prev];
          data.termos.forEach(t => {
            if (!merged.some(x => x.estabelecimentoId === t.estabelecimentoId && x.dtInicio === t.dtInicio)) {
              merged.push(t);
            }
          });
          return merged;
        });
      }

      if (data.checklists.length > 0) {
        setChecklists(prev => {
          const merged = [...prev];
          data.checklists.forEach(c => {
            if (!merged.some(x => x.estabelecimentoId === c.estabelecimentoId && x.numFicha === c.numFicha)) {
              merged.push(c);
            }
          });
          return merged;
        });
      }
    });
  };

  const handleClearAll = () => {
    setEstabelecimentos([]);
    setRts([]);
    setTermos([]);
    setChecklists([]);
    setTargetedInscricao("");
    setActiveTab("importacao");
  };

  const hasData = estabelecimentos.length > 0;

  const tabs = [
    { id: "importacao", label: "Importação XML", icon: Upload, badge: !hasData ? "Pendente" : "Carregado" },
    { id: "dashboard", label: "Painel Geral", icon: FileText, badge: hasData ? "Ativo" : null },
    { id: "checklists", label: "RDC 44 Checklists", icon: ClipboardCheck, badge: checklists.length || null },
    { id: "cidades", label: "Resumo Cobertura", icon: MapPin, badge: null },
    { id: "licenciamento", label: "Licenciamento", icon: ShieldAlert, badge: null }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none print:bg-white text-slate-800 overflow-x-hidden relative">
      {/* Upper Navigation and Brand Header */}
      <header className="bg-white border-b border-slate-200/85 sticky top-0 z-50 shadow-xs print:hidden transition-all">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-18 items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-505 flex items-center justify-center text-white font-display font-extrabold shadow-md shadow-indigo-600/10 transform hover:scale-105 transition-all duration-300">
                S
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-slate-900 font-display uppercase leading-none">
                  Siscon XML Auditoria
                </h1>
                <span className="text-[9px] text-indigo-600 font-mono tracking-widest block font-black leading-none mt-1.5 uppercase">
                  AUDITORIA DIGITAL DE DADOS DE FISCALIZAÇÃO • CRF-AM
                </span>
              </div>
            </div>

            {/* Header action panel (Consolidated Menu trigger!) */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all cursor-pointer shadow-md shadow-indigo-600/10 active:scale-95"
                id="menu-trigger-btn"
              >
                <Menu className="w-4 h-4" />
                <span>Menu de Navegação</span>
              </button>

              {hasData && (
                <button
                  onClick={handleClearAll}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 hover:bg-rose-100 hover:text-rose-800 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                  title="Apaga os dados carregados na memória temporária"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Limpar Base</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Slide-in left Sidebar Navigation Menu (with backdrop overlay for ALL SCREEN TYPES) */}
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
                <div>
                  <h3 className="text-xs font-black tracking-widest text-slate-900 font-sans uppercase">
                    CRF-AM • AUDITORIA
                  </h3>
                  <span className="text-[9px] text-slate-500 font-mono tracking-widest mt-1 block font-black">
                    SISTEMA DE MUNICÍPIOS
                  </span>
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
                        <h4 className="text-[11px] font-black text-amber-900 uppercase">
                          Importação Obrigatória
                        </h4>
                        <p className="text-[11px] text-amber-800 leading-normal mt-1 font-medium font-sans">
                          Por segurança, todos os recursos da aplicação permanecem bloqueados até que ao menos um arquivo XML da fiscalização seja importado pelo sistema.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const isLocked = !hasData && tab.id !== "importacao";
                  
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
                          ? "bg-indigo-600 text-white font-extrabold shadow-md shadow-indigo-600/10"
                          : isLocked
                          ? "opacity-35 bg-slate-50 text-slate-400 cursor-not-allowed border border-dashed border-slate-200"
                          : "bg-slate-50 text-slate-700 hover:bg-slate-100/90 cursor-pointer hover:text-slate-900 font-semibold"
                      }`}
                    >
                      <div className="flex items-center gap-3 text-xs font-black">
                        <Icon className={`w-4.5 h-4.5 ${isActive ? "text-white" : isLocked ? "text-slate-350" : "text-slate-550"}`} />
                        {tab.label}
                      </div>
                      
                      {isLocked ? (
                        <span className="text-[9px] font-extrabold px-2 py-0.5 bg-slate-100 text-slate-400 rounded-md border border-slate-200 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-slate-400" />
                          Inacessível
                        </span>
                      ) : tab.badge ? (
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                          isActive ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        }`}>
                          {tab.badge}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Drawer footer operations */}
              {hasData && (
                <div className="p-4 border-t border-slate-100 bg-slate-50/70">
                  <button
                    onClick={() => {
                      handleClearAll();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-150 rounded-xl text-xs font-black transition-all shadow-xs cursor-pointer active:scale-98"
                  >
                    <Trash2 className="w-4 h-4" />
                    Limpar Banco de Dados
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Body container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 print:p-0 print:m-0">
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
                estabelecimentos={estabelecimentos}
                termos={termos}
                checklists={checklists}
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

            {activeTab === "checklists" && (
              <ChecklistCheck
                estabelecimentos={estabelecimentos}
                checklists={checklists}
                rts={rts}
              />
            )}

            {activeTab === "cidades" && (
              <TripOverview
                estabelecimentos={estabelecimentos}
                termos={termos}
                checklists={checklists}
              />
            )}

            {activeTab === "licenciamento" && <LicenseAdmin />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer information */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 print:hidden transition-all">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-500 font-bold tracking-wider uppercase text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <span className="bg-slate-100 border border-slate-200 text-indigo-700 px-2 py-0.5 rounded-md font-bold">
              SYS-AUDIT v4.5
            </span>
            <span>
              Desenvolvido com React, TypeScript e Tailwind CSS
            </span>
          </div>
          <span>
            © 2026 Fiscalização de Farmácia do Amazonas — CRF-AM
          </span>
        </div>
      </footer>

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
                <div className="p-5 bg-indigo-600/10 border border-indigo-500/20 rounded-full animate-[spin_5s_linear_infinite]">
                  <Settings className="w-14 h-14 text-indigo-500" />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <h3 className="text-2xl font-black font-display tracking-tight text-white">Aguarde...</h3>
                <p className="text-xs text-neutral-400 font-mono tracking-wider uppercase">{loadingMessage}</p>
              </div>

              <div className="space-y-2">
                <div className="w-full h-2.5 bg-neutral-900 border border-neutral-800 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-150 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                    layout
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-neutral-500 font-black tracking-wider">
                  <span>PROGRESSO DIGITAL</span>
                  <span className="text-indigo-400 font-black">{loadingProgress}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
