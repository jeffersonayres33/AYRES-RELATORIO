import React, { useState } from "react";
import { 
  TrendingUp, 
  FileText, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  User, 
  AlertCircle, 
  Search, 
  ShieldCheck, 
  Activity, 
  ArrowRight,
  TrendingDown,
  Info
} from "lucide-react";
import { Estabelecimento, TermoSanitario, FarmaciaChecklist, CitySummary } from "../types";
import { getActiveInspectors } from "../utils/mockData";
import { motion } from "motion/react";

interface DashboardProps {
  estabelecimentos: Estabelecimento[];
  termos: TermoSanitario[];
  checklists: FarmaciaChecklist[];
  onNavigateToTab: (tab: string) => void;
}

export default function Dashboard({ estabelecimentos, termos, checklists, onNavigateToTab }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChartCity, setSelectedChartCity] = useState<string | null>(null);

  const totalInspecoes = termos.length;
  const totalIntimacoes = termos.filter(t => t.nrSeqIntimacao && t.nrSeqIntimacao !== "null").length;
  const totalAutos = termos.filter(t => t.nrSeqAuto && t.nrSeqAuto !== "null").length;
  
  // New Establishments logic: ID contains letter 'I'
  const novosEstabelecimentos = estabelecimentos.filter(e => e.inscricao.toUpperCase().includes("I")).length;

  // Group stats by city
  const cityMap = new Map<string, { inspecoes: number; intimacoes: number; autos: number; novos: number }>();
  
  estabelecimentos.forEach(e => {
    const city = e.cidade.toUpperCase();
    if (!cityMap.has(city)) {
      cityMap.set(city, { inspecoes: 0, intimacoes: 0, autos: 0, novos: 0 });
    }
    const stat = cityMap.get(city)!;
    if (e.inscricao.toUpperCase().includes("I")) {
      stat.novos += 1;
    }
  });

  termos.forEach(t => {
    const est = estabelecimentos.find(e => e.inscricao === t.estabelecimentoId);
    const city = est ? est.cidade.toUpperCase() : "INTERIOR AM";
    if (!cityMap.has(city)) {
      cityMap.set(city, { inspecoes: 0, intimacoes: 0, autos: 0, novos: 0 });
    }
    const stat = cityMap.get(city)!;
    stat.inspecoes += 1;
    if (t.nrSeqIntimacao && t.nrSeqIntimacao !== "null") stat.intimacoes += 1;
    if (t.nrSeqAuto && t.nrSeqAuto !== "null") stat.autos += 1;
  });

  const cityList: CitySummary[] = Array.from(cityMap.entries()).map(([cidade, stats]) => ({
    cidade,
    inspecoes: stats.inspecoes,
    intimacoes: stats.intimacoes,
    autos: stats.autos,
    novosEstabelecimentos: stats.novos
  }));

  const activeInspectors = getActiveInspectors(termos);

  // Search filtered cities
  const filteredCityList = cityList.filter(c => 
    c.cidade.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate highest infraction rate city for recommendation
  const warningCities = cityList.filter(c => c.autos > 0 || c.intimacoes > 0)
    .sort((a, b) => (b.autos + b.intimacoes) - (a.autos + a.intimacoes));

  return (
    <div className="space-y-6 text-slate-800">
      {/* Introduction Greeting card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-xs">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight font-display text-slate-900 leading-tight">
              Painel Integrado de Gestão e automação de Relatórios de inspeções
            </h2>
            <p className="text-slate-500 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed font-medium">
              Consolidação analítica de termos de inspeção, relatórios de RDC 44, dados cadastrais e escalas de responsáveis técnicos para os Fiscais Farmacêuticos do CRF-AM no interior do Amazonas.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-extrabold text-slate-500 font-mono tracking-widest uppercase bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg select-none">
              SISTEMA HOMOLOGADO
            </span>
          </div>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-xs rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all duration-300 transform hover:-translate-y-0.5 group cursor-pointer">
          <div className="p-3 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 group-hover:scale-110 transition-transform duration-300">
            <FileText className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">Inspeções Importadas</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">{totalInspecoes}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-xs rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all duration-300 transform hover:-translate-y-0.5 group cursor-pointer">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-650 group-hover:scale-110 transition-transform duration-300">
            <AlertCircle className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">Termos de Intimação</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">{totalIntimacoes}</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-xs rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all duration-300 transform hover:-translate-y-0.5 group cursor-pointer">
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">Autos de Infração</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">{totalAutos}</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-xs rounded-2xl p-5 shadow-xs flex items-center gap-4 transition-all duration-300 transform hover:-translate-y-0.5 group cursor-pointer">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-650 group-hover:scale-110 transition-transform duration-300">
            <Sparkles className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-display">Novas Inscrições</span>
            <span className="text-2xl font-black text-slate-900 tracking-tight font-mono">{novosEstabelecimentos}</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics section with custom Chart & detailed overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dynamic Interactive Chart & Statistics list */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-5.5 h-5.5 text-violet-600" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm font-display tracking-wide uppercase">
                  Volume de Atividades de Fiscalização
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Indicadores consolidados por município AM</p>
              </div>
            </div>

            {/* Quick search input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Filtrar Município..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:bg-white w-full sm:w-48 transition-all"
              />
            </div>
          </div>

          {cityList.length === 0 ? (
            <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-2xl border border-slate-100 p-6">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Nenhum dado de viagem importado</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                Para visualizar as análises de volume, vá até a aba de <strong>Importação XML</strong> e faça o upload de seus lotes de controle.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Beautiful Modern Multi-Metric Horizontal Bar List */}
              <div className="space-y-4 bg-slate-50/70 border border-slate-150 p-5 rounded-2xl">
                <span className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest block leading-none mb-1">
                  DETALHAMENTO DE ATIVIDADES DE CAMPO POR MUNICÍPIO
                </span>
                
                <div className="space-y-4">
                  {filteredCityList.map((c, idx) => {
                    // Maximum value across all metrics to normalize the fill percentages accurately
                    const maxMetricValue = Math.max(
                      ...cityList.map(item => Math.max(item.inspecoes, item.intimacoes, item.autos, item.novosEstabelecimentos)),
                      1
                    );
                    
                    const pInspec = (c.inspecoes / maxMetricValue) * 100;
                    const pIntima = (c.intimacoes / maxMetricValue) * 100;
                    const pAuto = (c.autos / maxMetricValue) * 100;
                    const pNovo = (c.novosEstabelecimentos / maxMetricValue) * 100;

                    return (
                      <div key={idx} className="bg-white border border-slate-150 p-4 rounded-xl shadow-xs space-y-3 hover:border-violet-300 transition-colors">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="font-extrabold text-xs text-slate-800 uppercase flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-violet-650" />
                            {c.cidade}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">
                            Atos Registrados: <strong className="text-slate-700">{c.inspecoes + c.intimacoes + c.autos + c.novosEstabelecimentos}</strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Inspeções */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-violet-600 rounded-full" /> Inspeções</span>
                              <span className="font-mono font-bold text-slate-800">{c.inspecoes}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-violet-650 h-full rounded-full transition-all duration-500" style={{ width: `${pInspec}%` }} />
                            </div>
                          </div>

                          {/* Intimações */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full" /> Intimações</span>
                              <span className="font-mono font-bold text-amber-600">{c.intimacoes}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${pIntima}%` }} />
                            </div>
                          </div>

                          {/* Autos */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Autos</span>
                              <span className="font-mono font-bold text-rose-600">{c.autos}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-rose-500 h-full rounded-full transition-all duration-500" style={{ width: `${pAuto}%` }} />
                            </div>
                          </div>

                          {/* Novas Empresas */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center text-[9px] font-bold text-slate-500">
                              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Novas Empresas</span>
                              <span className="font-mono font-bold text-emerald-600">{c.novosEstabelecimentos}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${pNovo}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* SUM FOOTER OF THE WIDGET */}
                <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] font-bold text-slate-500 mt-4 px-4 py-3 bg-white hover:border-slate-300 transition-all rounded-xl border border-slate-200">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400">Somatório Geral da Viagem:</span>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    <span className="flex items-center gap-1.5"><span className="w-2 rounded-full bg-violet-600 aspect-square" /> Inspeções: <strong className="text-slate-800 font-mono text-[12px]">{cityList.reduce((acc, c) => acc + c.inspecoes, 0)}</strong></span>
                    <span className="flex items-center gap-1.5"><span className="w-2 rounded-full bg-amber-500 aspect-square" /> Intimações: <strong className="text-slate-800 font-mono text-[12px]">{cityList.reduce((acc, c) => acc + c.intimacoes, 0)}</strong></span>
                    <span className="flex items-center gap-1.5"><span className="w-2 rounded-full bg-rose-500 aspect-square" /> Autos: <strong className="text-slate-800 font-mono text-[12px]">{cityList.reduce((acc, c) => acc + c.autos, 0)}</strong></span>
                    <span className="flex items-center gap-1.5"><span className="w-2 rounded-full bg-emerald-500 aspect-square" /> Novas Empresas: <strong className="text-slate-800 font-mono text-[12px]">{cityList.reduce((acc, c) => acc + c.novosEstabelecimentos, 0)}</strong></span>
                  </div>
                </div>
              </div>

              {/* Responsive stats table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 uppercase font-black text-[10px] tracking-wider select-none">
                      <th className="py-2.5 px-2">Município AM</th>
                      <th className="py-2.5 text-center">Inspeções</th>
                      <th className="py-2.5 text-center text-amber-600">Termos Intimação</th>
                      <th className="py-2.5 text-center text-rose-600">Autos Lavrados</th>
                      <th className="py-2.5 text-center text-emerald-600">Empresas Novas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCityList.map((c, i) => (
                      <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-2 font-extrabold text-slate-800 flex items-center gap-1.5 uppercase">
                          <MapPin className="w-3.5 h-3.5 text-violet-600" />
                          {c.cidade}
                        </td>
                        <td className="py-3.5 text-center font-mono font-bold text-slate-600">{c.inspecoes}</td>
                        <td className="py-3.5 text-center font-mono font-black text-amber-600">{c.intimacoes}</td>
                        <td className="py-3.5 text-center font-mono font-black text-rose-600">{c.autos}</td>
                        <td className="py-3.5 text-center font-mono font-black text-emerald-600">{c.novosEstabelecimentos}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right column: active inspectors + quick recommendations */}
        <div className="space-y-6">
          {/* Active Field Inspectors */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-5 h-5 text-violet-600" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm font-display tracking-wide uppercase">Inspetores Ativos</h3>
                <p className="text-[10px] text-slate-400">Equipe ativa nos termos de campo importados</p>
              </div>
            </div>

            {activeInspectors.length === 0 ? (
              <div className="text-slate-400 text-xs py-6 text-center italic font-medium">
                Nenhum inspetor encontrado. Importe termos para cruzar os dados de equipe.
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {activeInspectors.map((ins, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-150 hover:border-slate-250 rounded-xl transition-all duration-200">
                    <span className="font-extrabold text-xs text-slate-800 uppercase truncate max-w-[150px]">{ins.nome}</span>
                    <span className="text-[10.5px] font-mono bg-white border border-slate-205 text-violet-600 px-2.5 py-1 rounded-lg font-black shrink-0 shadow-2xs">
                      {ins.count} {ins.count === 1 ? "ação" : "ações"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick recommendations / Alerts */}
          {warningCities.length > 0 && (
            <div className="bg-amber-50 border border-amber-150 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-display font-extrabold text-xs uppercase tracking-wider">Foco Crítico de Exigências</span>
              </div>
              <p className="text-[11px] text-amber-850 leading-relaxed font-semibold">
                O município de <strong className="text-slate-900 underline font-extrabold">{warningCities[0].cidade}</strong> registrou o maior volume de inconformidades sanitárias, com <strong>{warningCities[0].intimacoes} intimação(ões)</strong> e <strong>{warningCities[0].autos} auto(s) de infração</strong>.
              </p>
              <button
                onClick={() => onNavigateToTab("cidades")}
                className="inline-flex items-center gap-1.5 text-xs text-amber-700 font-extrabold hover:text-amber-800 transition-colors"
              >
                Auditar Localidade <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
