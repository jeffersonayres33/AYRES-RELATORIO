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
    { id: "cidades", label: "Relatórios", icon: MapPin, badge: null },
    { id: "licenciamento", label: "Licenciamento", icon: ShieldAlert, badge: null }
  ];

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex font-sans select-none print:bg-white text-slate-800 relative">
      
      {/* 1. PERSISTENT SIDEBAR - For Desktop (md:flex) */}
      <aside className="hidden md:flex w-72 flex-col fixed inset-y-0 left-0 bg-white border-r border-slate-200/80 z-30 select-none print:hidden">
        {/* Sidebar Banner / Logo Header */}
        <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/45">
          <div className="w-10 h-10 rounded-2xl bg-violet-600 hover:bg-violet-700 flex items-center justify-center text-white font-display font-extrabold shadow-md shadow-violet-600/20 transform hover:scale-105 transition-all duration-300 shrink-0">
            S
          </div>
          <div>
            <h1 className="text-sm font-extrabold tracking-tight text-slate-900 font-display uppercase leading-tight">
              Siscon XML
            </h1>
            <span className="text-[9px] text-violet-600 font-mono tracking-widest block font-black leading-none mt-1 uppercase">
              CRF-AM AUDITORIA
            </span>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {!hasData && (
            <div className="bg-amber-50 border border-amber-150 rounded-2xl p-4 mb-4">
              <div className="flex gap-2.5 items-start">
                <ShieldAlert className="w-4 h-4 text-amber-655 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[10px] font-black text-amber-900 uppercase">
                    Importação Obrigatória
                  </h4>
                  <p className="text-[10.5px] text-amber-800 leading-normal mt-1 font-medium font-sans">
                    Os recursos permanecem bloqueados até que ao menos um arquivo XML da fiscalização seja importado.
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
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? "bg-violet-600 text-white font-extrabold shadow-md shadow-violet-600/15"
                    : isLocked
                    ? "opacity-35 bg-slate-50/70 text-slate-400 cursor-not-allowed border border-dashed border-slate-200"
                    : "bg-transparent text-slate-650 hover:bg-slate-50 hover:text-slate-900 font-semibold"
                }`}
              >
                <div className="flex items-center gap-3.5 text-xs font-black">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-white" : isLocked ? "text-slate-350" : "text-slate-500"}`} />
                  {tab.label}
                </div>
                
                {isLocked ? (
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                ) : tab.badge ? (
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md ${
                    isActive ? "bg-white/20 text-white" : "bg-violet-50 text-violet-700 border border-violet-100"
                  }`}>
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {/* Database Stats Badge / Status indicator */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-4.5 mb-3 text-left">
            <span className="text-[8.5px] font-mono tracking-widest text-slate-500 font-black block uppercase mb-1.5">
              ESTADO DO SISTEMA
            </span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${hasData ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
              <span className="text-[11px] font-bold text-slate-700">
                {hasData ? `${estabelecimentos.length} Estab. Carregados` : "Aguardando Importação"}
              </span>
            </div>
            {checklists.length > 0 && (
              <div className="text-[9.5px] font-mono font-bold text-slate-400 mt-1 block">
                {checklists.length} Fichas de Roteiros RDC 44
              </div>
            )}
          </div>

          {hasData && (
            <button
              onClick={handleClearAll}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-100 rounded-xl text-xs font-extrabold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar Base de Dados
            </button>
          )}
        </div>
      </aside>

      {/* 2. SLIDE-IN DRAWER - For Mobile & Tablet (triggered by menu button) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer md:hidden"
            />

            {/* Sidebar drawer panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 left-0 w-80 bg-white z-50 shadow-2xl flex flex-col border-r border-slate-250 select-none md:hidden"
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
                          ? "bg-violet-600 text-white font-extrabold shadow-md shadow-violet-600/10"
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

      {/* 3. MAIN CONTAINER AREA - Shifted right on desktop to accommodate sidebar */}
      <div className="flex-1 flex flex-col md:pl-72 min-h-screen overflow-x-hidden">
        
        {/* Mobile top-bar (shown only on small screens) */}
        <header className="md:hidden bg-white border-b border-slate-200/85 sticky top-0 z-40 shadow-xs px-4 h-16 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center text-white font-display font-extrabold shadow-sm shadow-violet-600/10 shrink-0">
              S
            </div>
            <div>
              <h1 className="text-xs font-extrabold tracking-tight text-slate-900 font-display uppercase leading-none">
                Siscon XML
              </h1>
              <span className="text-[8px] text-violet-600 font-mono tracking-widest block font-bold leading-none mt-1 uppercase">
                CRF-AM • AUDITORIA
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2.5 rounded-xl bg-violet-55 text-violet-700 hover:bg-violet-100 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Dynamic Desktop Header Bar to display content context and action */}
        <header className="hidden md:block bg-white border-b border-slate-150 py-4.5 px-8 sticky top-0 z-20 print:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase font-display tracking-tight flex items-center gap-2">
                <span>{tabs.find(t => t.id === activeTab)?.label}</span>
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5 font-sans font-bold uppercase tracking-wider">
                Controle de Monitoramento Sanitário de Municípios do Interior do Amazonas
              </p>
            </div>
            
            <div className="flex items-center gap-3">
            </div>
          </div>
        </header>

        {/* Main Body container */}
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
          <div className="w-full px-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-[11px] font-mono text-slate-400 font-bold tracking-wider uppercase text-center">
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
                <p className="text-xs text-neutral-400 font-mono tracking-wider uppercase">{loadingMessage}</p>
              </div>

              <div className="space-y-2">
                <div className="w-full h-2.5 bg-neutral-900 border border-neutral-800 rounded-full overflow-hidden p-0.5">
                  <motion.div 
                    className="h-full bg-violet-500 rounded-full transition-all duration-150 ease-out"
                    style={{ width: `${loadingProgress}%` }}
                    layout
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-neutral-500 font-black tracking-wider">
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
