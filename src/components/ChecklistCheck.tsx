import React, { useState } from "react";
import { 
  Building, 
  ClipboardList, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Filter, 
  Search,
  BadgePercent,
  TrendingUp,
  UserCheck
} from "lucide-react";
import { Estabelecimento, TechnicalResponsible, FarmaciaChecklist } from "../types";
import { QUESTAO_LIST } from "../utils/mockData";
import { motion, AnimatePresence } from "motion/react";

interface ChecklistCheckProps {
  estabelecimentos: Estabelecimento[];
  checklists: FarmaciaChecklist[];
  rts: TechnicalResponsible[];
}

export default function ChecklistCheck({ estabelecimentos, checklists, rts }: ChecklistCheckProps) {
  const [selectedInscricao, setSelectedInscricao] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [questionsFilter, setQuestionsFilter] = useState<"all" | "yes" | "no">("all");

  const filteredEstabs = estabelecimentos.filter((e) =>
    e.fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.inscricao.includes(searchTerm) ||
    e.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEstab = filteredEstabs.find(e => e.inscricao === selectedInscricao) || filteredEstabs[0] || estabelecimentos[0];
  
  React.useEffect(() => {
    if (filteredEstabs.length > 0 && !selectedInscricao) {
      setSelectedInscricao(filteredEstabs[0].inscricao);
    }
  }, [filteredEstabs, selectedInscricao]);

  if (estabelecimentos.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-slate-400 shadow-xs">
        <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="font-bold text-slate-800">Aguardando Carga de Estabelecimentos</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Por favor, carregue os dados XML na aba de importação para prosseguir.
        </p>
      </div>
    );
  }

  const selectedChecklist = checklists.find(c => c.estabelecimentoId === selectedEstab?.inscricao);
  const selectedRt = rts.find(r => r.estabelecimentoId === selectedEstab?.inscricao);

  // Math calculated compliance rate for list and right sidebar
  const getComplianceRateEx = (chk?: FarmaciaChecklist) => {
    if (!chk) return 0;
    const totalQ = QUESTAO_LIST.length;
    let yesCount = 0;
    QUESTAO_LIST.forEach((q) => {
      if (chk.respostas[q.id] === "S") yesCount++;
    });
    return Math.round((yesCount / totalQ) * 100);
  };

  const activeCompliance = getComplianceRateEx(selectedChecklist);

  const formatSchedule = (day: string, value?: string) => {
    return (
      <div className="flex items-center justify-between text-sm border-b border-slate-100 py-2.5 last:border-0 hover:bg-white transition-colors px-1">
        <span className="font-bold text-slate-400 uppercase tracking-widest text-sm w-20">{day}</span>
        <span className="font-mono text-slate-700 font-bold text-sm select-all">{value || "FALTA ACORDO"}</span>
      </div>
    );
  };

  // Filtered Checklist items
  const getFilterIconColor = (btnFilter: string) => {
    return questionsFilter === btnFilter 
      ? "bg-violet-600 border-violet-500 text-white shadow-sm"
      : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-violet-600";
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-slate-800">
      {/* Establishments Sidebar search & List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs flex flex-col h-[650px] space-y-4">
        
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-extrabold font-display text-slate-900 text-base uppercase tracking-wider flex items-center gap-2">
            <Building className="w-4 h-4 text-violet-600" /> Estabelecimentos ({filteredEstabs.length})
          </h3>
          <p className="text-sm text-slate-400 mt-1 font-medium">Selecione uma farmácia cadastrada</p>
        </div>

        {/* Search input in sidebar */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Buscar por fantasia, IE, cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-sm text-slate-855 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white w-full transition-all"
          />
        </div>
        
        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredEstabs.map((e) => {
            const checklistForThis = checklists.find(c => c.estabelecimentoId === e.inscricao);
            const compliance = getComplianceRateEx(checklistForThis);
            const isNovo = e.inscricao.toUpperCase().includes("I");
            const isSelected = e.inscricao === selectedEstab?.inscricao;

            return (
              <button
                key={e.inscricao}
                onClick={() => setSelectedInscricao(e.inscricao)}
                className={`w-full text-left p-4 rounded-2xl transition-all border ${
                  isSelected
                    ? "bg-violet-600 border-violet-500 text-white shadow-md relative overflow-hidden"
                    : "bg-white border-slate-150 text-slate-705 hover:border-slate-350 hover:bg-slate-50"
                }`}
                id={`est-item-${e.inscricao}`}
              >
                {isSelected && (
                  <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 w-12 h-12 rounded-full bg-white/5" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <span className="font-extrabold font-display text-sm truncate uppercase tracking-normal block max-w-[200px]">
                    {e.fantasia}
                  </span>
                  {isNovo && (
                    <span className={`text-sm font-extrabold px-1.5 py-0.5 rounded uppercase ${
                      isSelected ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700 border border-emerald-150"
                    }`}>
                      Novo
                    </span>
                  )}
                </div>
                
                <div className={`text-sm mt-1.5 flex items-center justify-between font-bold ${isSelected ? "text-violet-100" : "text-slate-400"}`}>
                  <span>I.E: <span className="font-mono font-bold">{e.inscricao}</span></span>
                  <span className="uppercase text-sm">{e.cidade}</span>
                </div>

                {/* Progress bar compliance indication */}
                {checklistForThis ? (
                  <div className="mt-3.5 space-y-1">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className={isSelected ? "text-violet-200" : "text-slate-400"}>Taxa Conformidade</span>
                      <span className={isSelected ? "text-white" : "text-violet-600 font-mono font-black"}>{compliance}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          compliance >= 80 
                            ? isSelected ? "bg-white" : "bg-emerald-500" 
                            : compliance >= 50 
                            ? "bg-amber-500" 
                            : "bg-rose-500"
                        }`}
                        style={{ width: `${compliance}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className={`mt-3 text-sm font-bold tracking-widest uppercase block ${isSelected ? "text-violet-200" : "text-slate-355"}`}>
                    Sem Checklist Integrado
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Panel */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          
          {/* Header information */}
          <div className="border-b border-slate-150 pb-5 mb-5 space-y-2">
            <span className="text-sm font-extrabold font-mono text-violet-600 tracking-widest block uppercase">DADOS VIGILÂNCIA SANITÁRIA</span>
            <h2 className="text-xl font-extrabold text-slate-900 font-display uppercase tracking-tight">{selectedEstab?.fantasia}</h2>
            <p className="text-sm text-slate-500 leading-relaxed uppercase font-semibold">{selectedEstab?.razaoSocial}</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 pt-4 text-sm font-semibold text-slate-600">
              <div className="leading-snug">Endereço: <span className="text-slate-905 font-extrabold block mt-0.5">{selectedEstab?.endereco}, {selectedEstab?.bairro}</span></div>
              <div className="leading-snug">Município de Atuação: <span className="text-violet-600 font-extrabold block mt-0.5 uppercase">{selectedEstab?.cidade}</span></div>
              <div className="leading-snug">N° CNPJ: <span className="text-slate-905 font-mono font-bold block mt-0.5">{selectedEstab?.cnpj}</span></div>
              <div className="leading-snug">Área Fiscal: <span className="text-slate-905 font-black block mt-0.5 uppercase">{selectedEstab?.nomeArea || "DROGARIA / DISPENSAÇÃO"}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Escala RT weekly */}
            <div className="md:col-span-1 bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between shadow-inner">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-150 pb-2.5 mb-3.5 font-display">
                  <Clock className="w-3.5 h-3.5 text-violet-600" /> Escala Técnica Do RT
                </h4>
                {selectedRt ? (
                  <div className="space-y-0.5">
                    <p className="text-[11.5px] font-black text-slate-900 truncate group hover:text-violet-600 transition-colors" title={selectedRt.nome}>{selectedRt.nome}</p>
                    <p className="text-[9.5px] font-mono text-violet-600 font-bold mb-3 uppercase">CRF ATIVO: {selectedRt.crf}</p>
                    {formatSchedule("Segunda", selectedRt.segunda)}
                    {formatSchedule("Terça", selectedRt.terca)}
                    {formatSchedule("Quarta", selectedRt.quarta)}
                    {formatSchedule("Quinta", selectedRt.quinta)}
                    {formatSchedule("Sexta", selectedRt.sexta)}
                    {formatSchedule("Sábado", selectedRt.sabado)}
                    {formatSchedule("Domingo", selectedRt.domingo)}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-sm font-semibold">
                    Nenhuma escala semanal foi indexada no lote para este estabelecimento.
                  </div>
                )}
              </div>
            </div>

            {/* Checklist Details View */}
            <div className="md:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-150 pb-3">
                <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-widest flex items-center gap-1.5 font-display">
                  <ClipboardList className="w-4 h-4 text-violet-600" /> Roteiro Sanitário RDC 44/2009
                </h4>
                
                {/* Filter buttons */}
                {selectedChecklist && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQuestionsFilter("all")}
                      className={`px-2 py-1 text-sm font-extrabold rounded-lg transition-all cursor-pointer ${getFilterIconColor("all")}`}
                    >
                      Todos ({QUESTAO_LIST.length})
                    </button>
                    <button
                      onClick={() => setQuestionsFilter("yes")}
                      className={`px-2 py-1 text-sm font-extrabold rounded-lg transition-all cursor-pointer ${getFilterIconColor("yes")}`}
                    >
                      Conformidades ({QUESTAO_LIST.filter(q => (selectedChecklist.respostas[q.id] || "N") === "S").length})
                    </button>
                    <button
                      onClick={() => setQuestionsFilter("no")}
                      className={`px-2 py-1 text-sm font-extrabold rounded-lg transition-all cursor-pointer ${getFilterIconColor("no")}`}
                    >
                      Inconformidades ({QUESTAO_LIST.filter(q => (selectedChecklist.respostas[q.id] || "N") === "N").length})
                    </button>
                  </div>
                )}
              </div>

              {!selectedChecklist ? (
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 text-center text-slate-400 text-sm shadow-inner">
                  Não há prontuário de conformidade RDC 44 carregado para esta I.E. Por favor, importe o XML correspondente.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Totals widget */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl shadow-xs select-none">
                    <div className="text-center">
                      <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">Receitas Analisadas</span>
                      <span className="text-base font-black text-slate-800 font-mono mt-0.5 block">{selectedChecklist.totalAnaliseReceita}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">Esp. Portaria 344</span>
                      <span className="text-base font-black text-slate-800 font-mono mt-0.5 block">{selectedChecklist.totalAnaliseNotificacao}</span>
                    </div>
                    <div className="text-center">
                      <span className="text-[8px] text-slate-400 block font-bold uppercase tracking-wider">Antimicrobianos</span>
                      <span className="text-base font-black text-violet-600 font-mono mt-0.5 block">{selectedChecklist.totalAnaliseAntimicrobiano}</span>
                    </div>
                  </div>

                  {/* Checklist Items list scrollable */}
                  <div className="border border-slate-200 rounded-2xl max-h-[300px] overflow-y-auto divide-y divide-slate-150 bg-slate-50/30 shadow-xs">
                    {QUESTAO_LIST.filter((q) => {
                      const ans = selectedChecklist.respostas[q.id] || "N";
                      if (questionsFilter === "yes") return ans === "S";
                      if (questionsFilter === "no") return ans === "N";
                      return true;
                    }).map((q) => {
                      const answer = selectedChecklist.respostas[q.id] || "N";
                      const textToShow = answer === "S" ? q.textoSim : q.textoNao;
                      
                      return (
                        <div key={q.id} className="p-3.5 text-sm flex items-start gap-3 hover:bg-slate-50 transition-colors">
                          <span className="font-mono font-bold bg-white border border-slate-200 text-slate-500 px-2 py-0.5 rounded text-sm shrink-0 mt-0.5">
                            {q.id}
                          </span>
                          <p className={`flex-1 text-[11.5px] leading-relaxed ${answer === "S" ? "text-slate-600 font-medium" : "text-rose-700 font-extrabold"}`}>
                            {textToShow}
                          </p>
                          <div className={`shrink-0 flex items-center gap-1 font-extrabold text-sm px-2.5 py-0.5 rounded-full border ${
                            answer === "S" 
                              ? "bg-emerald-50 border-emerald-150 text-emerald-800" 
                              : "bg-rose-50 border-rose-150 text-rose-750"
                          }`}>
                            {answer === "S" ? (
                              <>
                                <CheckCircle className="w-3 h-3 text-emerald-600" /> Conforme
                              </>
                            ) : (
                              <>
                                <AlertTriangle className="w-3 h-3 text-rose-600" /> Desvio
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
