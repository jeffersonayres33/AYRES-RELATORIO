import React, { useState } from "react";
import { 
  MapPin, 
  ArrowRight, 
  Clipboard, 
  AlertCircle, 
  AlertTriangle, 
  Sparkles, 
  UserCheck, 
  Compass, 
  FileDown, 
  Briefcase, 
  Calendar, 
  Printer,
  Sliders,
  Check,
  X,
  HelpCircle,
  Building,
  Activity,
  FileText,
  Plus,
  Trash2
} from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Estabelecimento, TermoSanitario, FarmaciaChecklist, EvalItem } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { exportMunicipalDocx, exportTravelDocx } from "../utils/docxExporter";

interface TripOverviewProps {
  estabelecimentos: Estabelecimento[];
  termos: TermoSanitario[];
  checklists: FarmaciaChecklist[];
}

export default function TripOverview({ estabelecimentos, termos, checklists }: TripOverviewProps) {
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [municipalFilter, setMunicipalFilter] = useState<"todos" | "intimados" | "autuados" | "intimados_autuados">("todos");
  const [travelFiscais, setTravelFiscais] = useState<string>("ROBERTO BENEVENUTO / JEFFERSON AYRES");
  const [travelPeriod, setTravelPeriod] = useState<string>("15/05/2026 a 22/05/2026");
  const [includeClosed, setIncludeClosed] = useState<boolean>(false);

  // Checks if an establishment was found closed
  const isEstabClosed = (e: Estabelecimento) => {
    if (e.encontrava && e.encontrava.toUpperCase() === "FECHADA") return true;
    const t = termos.find(term => term.estabelecimentoId === e.inscricao);
    if (t?.encontrava && t.encontrava.toUpperCase() === "FECHADA") return true;
    return false;
  };

  const visibleEstabelecimentos = estabelecimentos.filter(e => {
    if (includeClosed) return true;
    return !isEstabClosed(e);
  });

  // 3. DA AVALIAÇÃO GERAL Modal & Toggles State
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalItems, setEvalItems] = useState<Record<string, boolean>>({
    hasFaltaReceituario: false,
    hasDeficienciaInjetaveis: false,
    hasFaltaAfeAlvarares: false,
    hasIrregularidadeLabInfra: false,
    hasLeituraLaminasSemFarmac: false,
    hasFaltaFarmacUbs: false,
    hasOrientacaoCftRemume: false,
    hasImplementacaoHorus: false,
    hasFragilidadeHospital: false,
    hasCaronaLicitacao: false,
    hasVendaSupermercado: false,
    hasApeloFiscalizacao: true,
  });

  const [dbEvalItems, setDbEvalItems] = useState<EvalItem[]>([]);

  React.useEffect(() => {
    const fetchDbParams = async () => {
      try {
        const qs = await getDocs(collection(db, "evaluation_items"));
        const list: EvalItem[] = [];
        qs.forEach((d) => list.push({ id: d.id, ...d.data() } as EvalItem));
        const sortedList = list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setDbEvalItems(sortedList);

        // Populate evalItems with defaultChecked ones
        setEvalItems((prev) => {
          const next = { ...prev };
          sortedList.forEach(item => {
             if (item.defaultChecked) {
                next[item.id] = true;
             }
          });
          return next;
        });

      } catch (e) {
        console.error("Evaluation Config Fetch Error", e);
      }
    };
    fetchDbParams();
  }, []);

  // Inputs for specific custom parameters
  const [labsInfra, setLabsInfra] = useState<{ nome: string; cnpj: string }[]>([
    { nome: "SÃO JOSÉ", cnpj: "04.091.222/0001-90" }
  ]);
  const [labsLaminas, setLabsLaminas] = useState<{ nome: string }[]>([
    { nome: "MATER DEI" }
  ]);
  const [hospitals, setHospitals] = useState<{ nome: string }[]>([
    { nome: "REGIONAL DE TEFÉ" }
  ]);

  const [autoMarkActive, setAutoMarkActive] = useState(false);

  const autoMarkFromXml = () => {
    const cityEstabs = visibleEstabelecimentos.filter(e => e.cidade.toUpperCase() === selectedCity.toUpperCase());
    const estabIds = cityEstabs.map(e => e.inscricao);
    const cityTermos = termos.filter(t => estabIds.includes(t.estabelecimentoId));

    const hasMatch = (regex: RegExp) => {
      const matchInTermos = cityTermos.some(t => t.obs && regex.test(t.obs));
      if (matchInTermos) return true;
      const matchInEstabs = cityEstabs.some(e => {
        const textToSearch = `${e.fantasia} ${e.razaoSocial} ${e.nomeArea || ""}`;
        return regex.test(textToSearch);
      });
      return matchInEstabs;
    };

    const lackReceit = hasMatch(/receitu[áa]rio|prescri[çc][ãa]o/i) && 
                       (hasMatch(/falta|aus[êe]ncia|n[ãa]o\s+fornecido|sem|indispon/i) || hasMatch(/prefeitura|municipal/i));

    const defInjet = hasMatch(/injet[áa]vel|inje[çc][ãa]o|sala.*aplica[çc][ãa]o|pia|lavagem|privacidade/i);

    const faltaAfe = hasMatch(/afe|autoriza[çc][ãa]o.*funcionamento|alvar[áa]|licen[çc]a|licenciamento/i) && 
                     hasMatch(/falta|aus[êe]ncia|n[ãa]o\s+possu[íi]|vencido|vencida|sem|desconformidade/i);

    const isLab = cityEstabs.some(e => /laborat[óo]rio|analises.*clinicas/i.test(`${e.fantasia} ${e.razaoSocial} ${e.nomeArea || ""}`));
    const labInfra = isLab || (hasMatch(/infiltra[çc][ãa]o|reagente|geladeira|temperatura/i) && hasMatch(/laborat[óo]rio|infraestrutura/i));

    const laminas = hasMatch(/l[âa]mina|biom[ée]dica|laudo|em\s+branco|laudos.*assinados/i) && hasMatch(/laborat[óo]rio|analises.*clinicas|patologia/i);

    const lackUbs = hasMatch(/ubs|posto.*sa[úu]de|unidade.*b[áa]sica|caf/i) && hasMatch(/falta|aus[êe]ncia|sem\s+farmac[êe]utico/i);

    const cftRemume = hasMatch(/cft|remume|comiss[ãa]o.*farm[áa]cia|rela[çc][ãa]o.*medicamento/i);

    const horus = hasMatch(/h[óo]rus|horus|sistema.*h[óo]rus/i);

    const containsHospital = cityEstabs.some(e => /hospital|maternidade/i.test(`${e.fantasia} ${e.razaoSocial}`));
    const hospitalFragil = containsHospital || hasMatch(/dupla\s+chegagem|seguran[çc]a\s+do\s+paciente|concilia[çc][ãa]o\s+medicamentosa|fracionamento|hospitalar/i);

    const carona = hasMatch(/carona|licita[çc][ãa]o|preg[ãa]o|preg[oõ]es|Lei\s*14\.133/i);

    const vendaMercado = cityEstabs.some(e => /supermercado|mercado|mercearia|kitanda/i.test(`${e.fantasia} ${e.razaoSocial} ${e.nomeArea || ""}`)) ||
                         hasMatch(/venda\s+irregular|supermercado|kitanda/i);

    const labEstabs = cityEstabs.filter(e => /laborat[óo]rio|analises.*clinicas/i.test(`${e.fantasia} ${e.razaoSocial} ${e.nomeArea || ""}`));
    if (labEstabs.length > 0) {
      setLabsInfra(labEstabs.map(le => ({ nome: le.fantasia.toUpperCase(), cnpj: le.cnpj })));
      setLabsLaminas(labEstabs.map(le => ({ nome: le.fantasia.toUpperCase() })));
    } else {
      setLabsInfra([{ nome: "SÃO JOSÉ", cnpj: "04.091.222/0001-90" }]);
      setLabsLaminas([{ nome: "MATER DEI" }]);
    }

    const hospEstabs = cityEstabs.filter(e => /hospital|maternidade/i.test(`${e.fantasia} ${e.razaoSocial}`));
    if (hospEstabs.length > 0) {
      setHospitals(hospEstabs.map(he => ({ nome: he.fantasia.toUpperCase() })));
    } else {
      setHospitals([{ nome: "REGIONAL DE TEFÉ" }]);
    }

    const newEvals: Record<string, boolean> = {};
    dbEvalItems.forEach(item => {
      newEvals[item.id] = item.defaultChecked || false;
    });

    // Auto-analysis overwrites for standard items based on detected phrases
    newEvals.hasFaltaReceituario = newEvals.hasFaltaReceituario || lackReceit;
    newEvals.hasDeficienciaInjetaveis = newEvals.hasDeficienciaInjetaveis || defInjet;
    newEvals.hasFaltaAfeAlvarares = newEvals.hasFaltaAfeAlvarares || faltaAfe;
    newEvals.hasIrregularidadeLabInfra = newEvals.hasIrregularidadeLabInfra || labInfra;
    newEvals.hasLeituraLaminasSemFarmac = newEvals.hasLeituraLaminasSemFarmac || laminas;
    newEvals.hasFaltaFarmacUbs = newEvals.hasFaltaFarmacUbs || lackUbs;
    newEvals.hasOrientacaoCftRemume = newEvals.hasOrientacaoCftRemume || cftRemume;
    newEvals.hasImplementacaoHorus = newEvals.hasImplementacaoHorus || horus;
    newEvals.hasFragilidadeHospital = newEvals.hasFragilidadeHospital || hospitalFragil;
    newEvals.hasCaronaLicitacao = newEvals.hasCaronaLicitacao || carona;
    newEvals.hasVendaSupermercado = newEvals.hasVendaSupermercado || vendaMercado;
    newEvals.hasApeloFiscalizacao = true;

    setEvalItems(newEvals);
  };

  // Calculate unique list of cities present in establishing records
  const uniqueCities = Array.from(new Set(visibleEstabelecimentos.map(e => e.cidade.toUpperCase()))).sort();

  React.useEffect(() => {
    if (uniqueCities.length > 0 && !selectedCity) {
      setSelectedCity(uniqueCities[0]);
    }
  }, [uniqueCities, selectedCity]);

  // Aggregate stats per city
  const citySummaries = uniqueCities.map(city => {
    const cityEstabs = visibleEstabelecimentos.filter(e => e.cidade.toUpperCase() === city);
    const estabIds = cityEstabs.map(e => e.inscricao);
    const cityTermos = termos.filter(t => estabIds.includes(t.estabelecimentoId));

    const totalInspecoes = cityTermos.length;
    const totalIntimacoes = cityTermos.filter(t => t.nrSeqIntimacao && t.nrSeqIntimacao !== "null").length;
    const totalAutos = cityTermos.filter(t => t.nrSeqAuto && t.nrSeqAuto !== "null").length;
    const novos = cityEstabs.filter(e => e.inscricao.toUpperCase().includes("I")).length;

    return {
      cidade: city,
      inspecoes: totalInspecoes,
      intimacoes: totalIntimacoes,
      autos: totalAutos,
      novos,
      estabelecimentos: cityEstabs
    };
  });

  const activeSum = citySummaries.find(s => s.cidade === selectedCity);
  const cityEstabs = activeSum ? activeSum.estabelecimentos : [];

  // Dynaimc text compiled based on checkboxes status
  const getCompiledEvaluationText = () => {
    const paragraphs: string[] = [];

    // Base Intro
    paragraphs.push(
      `Como é sabido, é de competência do Conselho Regional de Farmácia a fiscalização do exercício da profissão farmacêutica no Estado do Amazonas, visando resguardar o cumprimento da legislação vigente e, indiretamente, atuar na promoção da saúde em todo Estado.\n\n` +
      `No Município de ${selectedCity.toUpperCase()} foram realizadas ${cityEstabs.length} inspeções técnicas em estabelecimentos farmacêuticos privados e assistência pública do SUS, de modo a mensurar a conformidade sanitária nas ações locais.`
    );

    const formattedLabsInfra = labsInfra.map(l => `Laboratório ${l.nome.toUpperCase()} (CNPJ ${l.cnpj})`).join(", ");
    const formattedLabsLaminas = labsLaminas.map(l => `Laboratório ${l.nome.toUpperCase()}`).join(", ");
    const formattedHospitals = hospitals.map(h => `Unidade Hospitalar de ${h.nome.toUpperCase()}`).join(" e ");
    
    dbEvalItems.forEach(item => {
      // For completely dynamic ones, if they are checked, add them
      if (evalItems[item.id]) {
         let p = item.paragraph;
         p = p.replace(/\[LABS_INFRA\]/g, formattedLabsInfra);
         p = p.replace(/\[LABS_LAMINAS\]/g, formattedLabsLaminas);
         p = p.replace(/\[HOSPITAIS\]/g, formattedHospitals);
         paragraphs.push(p);
      }
    });

    return paragraphs.join("\n\n");
  };

  const downloadMunicipalReport = async () => {
    if (!selectedCity) return;
    
    // Filter establishments in this city
    const filteredEstabs = cityEstabs.filter(e => {
      const t = termos.find(term => term.estabelecimentoId === e.inscricao);
      const isIntimado = !!(t?.nrSeqIntimacao && t.nrSeqIntimacao !== "null");
      const isAutuado = !!(t?.nrSeqAuto && t.nrSeqAuto !== "null");

      if (municipalFilter === "intimados") return isIntimado;
      if (municipalFilter === "autuados") return isAutuado;
      if (municipalFilter === "intimados_autuados") return isIntimado || isAutuado;
      return true; // "todos"
    });

    const filterLabels = {
      todos: "Todos os Estabelecimentos",
      intimados: "Apenas Estabelecimentos Intimados",
      autuados: "Apenas Estabelecimentos Autuados",
      intimados_autuados: "Estabelecimentos Intimados e Autuados"
    };

    const compiledText = getCompiledEvaluationText();

    await exportMunicipalDocx(`Relatorio_Municipal_${selectedCity.toUpperCase()}`, {
      selectedCity,
      filterLabel: filterLabels[municipalFilter],
      filteredEstabs,
      termos,
      checklists,
      customAvaliacaoGeralText: compiledText
    });
  };

  const downloadTravelSummary = async () => {
    const totalEstabs = visibleEstabelecimentos.length;
    const totalTermos = termos.filter(t => visibleEstabelecimentos.some(e => e.inscricao === t.estabelecimentoId)).length;
    
    const countFiscalizados = totalTermos;
    const countIntimados = termos.filter(t => visibleEstabelecimentos.some(e => e.inscricao === t.estabelecimentoId) && t.nrSeqIntimacao && t.nrSeqIntimacao !== "null").length;
    const countAutuados = termos.filter(t => visibleEstabelecimentos.some(e => e.inscricao === t.estabelecimentoId) && t.nrSeqAuto && t.nrSeqAuto !== "null").length;
    const countNovos = visibleEstabelecimentos.filter(e => e.isClandestina || e.inscricao.toUpperCase().includes("I")).length;

    await exportTravelDocx(`Resumo_Viagem_CRFAM_${selectedCity.toUpperCase()}`, {
      travelFiscais,
      travelPeriod,
      uniqueCities,
      countFiscalizados,
      countIntimados,
      countAutuados,
      countNovos,
      citySummaries
    });
  };

  if (uniqueCities.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-slate-205/90 p-8 text-center text-slate-500 shadow-xs max-w-lg mx-auto mt-12">
        <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="font-extrabold text-slate-900 text-lg">Aguardando Cobertura Cartográfica</p>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Por favor, carregue os registros XML originais para carregar a grade geográfica e gerar os resumos demográficos e de mobilidade de campo.
        </p>
      </div>
    );
  }

  // Coordinates values for Amazon towns
  const getTownCoordinates = (town: string) => {
    const coords: Record<string, string> = {
      "TEFE": "3.3544° S, 64.7114° W",
      "COARI": "4.0850° S, 63.1417° W",
      "TABATINGA": "4.2181° S, 69.9381° W",
      "MAUES": "3.3776° S, 57.7126° W",
      "ITACOATIARA": "3.1431° S, 58.4442° W",
      "MANAUS": "3.1190° S, 60.0217° W"
    };
    return coords[town.toUpperCase()] || "3.4167° S, 65.8500° W";
  };

  return (
    <div className="space-y-6 text-slate-800">
      
      {/* Visual Title & Subtitle for Relatórios Tab */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 relative overflow-hidden shadow-xs">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />
        <div>
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight font-display text-slate-900 uppercase">
            Relatórios
          </h2>
          <p className="text-slate-500 text-sm md:text-base mt-1 max-w-2xl leading-relaxed font-semibold">
            Gere em segundos os seus relatórios de inspeções de forma organizada e sem complicações.
          </p>
        </div>
      </div>
      
      {/* CitySelector Grid designed to be spacious and fully detailed */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {citySummaries.map((sum) => {
          const isSelected = sum.cidade === selectedCity;
          const coord = getTownCoordinates(sum.cidade);
          
          return (
            <button
              key={sum.cidade}
              onClick={() => setSelectedCity(sum.cidade)}
              className={`p-5 rounded-3xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? "bg-white border-violet-500 text-slate-900 shadow-md ring-2 ring-violet-500/20"
                  : "bg-white border-slate-200 text-slate-650 hover:border-violet-300 hover:shadow-2xs"
              }`}
            >
              {/* Highlight selector line */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 transition-all ${isSelected ? "bg-violet-600" : "bg-transparent"}`} />

              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl transition-all ${isSelected ? "bg-violet-50 text-violet-600" : "bg-slate-50 text-slate-400 group-hover:bg-violet-50 group-hover:text-violet-600"}`}>
                    <MapPin className="w-4 h-4 shrink-0" />
                  </div>
                  <div>
                    <span className="font-extrabold font-display text-sm uppercase tracking-wider block text-slate-900 leading-tight">
                      {sum.cidade}
                    </span>
                    <span className="text-sm font-mono text-slate-400 select-none block mt-0.5">
                      {coord}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-sm font-extrabold bg-violet-600 text-white px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                    Ativo
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Inspeções */}
                <div className="p-3 bg-violet-50/40 border border-violet-100/30 rounded-2xl flex flex-col justify-between">
                  <span className="block font-extrabold text-slate-400 uppercase tracking-wider text-[8px]">Inspeções</span>
                  <span className="font-mono font-black text-base text-violet-700 block mt-1">{sum.inspecoes}</span>
                </div>

                {/* Intimações */}
                <div className="p-3 bg-amber-50/40 border border-amber-100/30 rounded-2xl flex flex-col justify-between">
                  <span className="block font-extrabold text-slate-400 uppercase tracking-wider text-[8px]">Intimações</span>
                  <span className="font-mono font-black text-base text-amber-600 block mt-1">{sum.intimacoes}</span>
                </div>

                {/* Autos */}
                <div className="p-3 bg-rose-50/40 border border-rose-100/30 rounded-2xl flex flex-col justify-between">
                  <span className="block font-extrabold text-slate-400 uppercase tracking-wider text-[8px]">Autos</span>
                  <span className="font-mono font-black text-base text-rose-600 block mt-1">{sum.autos}</span>
                </div>

                {/* Novas Empresas */}
                <div className="p-3 bg-emerald-50/40 border border-emerald-100/30 rounded-2xl flex flex-col justify-between">
                  <span className="block font-extrabold text-slate-400 uppercase tracking-wider text-[8px]">Novas Empresas</span>
                  <span className="font-mono font-black text-base text-emerald-600 block mt-1">{sum.novos}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* SEÇÃO INTEGRADA DE RELATÓRIOS E EXPORTAÇÃO DOCX */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Relatório Consolidado do Município */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-violet-600" />
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base font-display tracking-wide uppercase">
                    Relatório Consolidado de {selectedCity}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 mt-0.5">
                    Gerar relatório de todos os estabelecimentos no município selecionado
                  </p>
                </div>
              </div>

              {/* Configure Eval items Button */}
              <button
                onClick={() => setIsEvalModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-100 hover:bg-violet-100 text-violet-700 text-[10.5px] font-black tracking-wide transition-all uppercase cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5" />
                Configurar Item 3
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10.5px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1.5">
                  Situação Fiscal das Empresas a Incluir:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMunicipalFilter("todos")}
                    className={`p-2.5 rounded-xl border text-left text-sm font-bold transition-all cursor-pointer ${
                      municipalFilter === "todos"
                        ? "bg-violet-600/10 border-violet-500/30 text-violet-900 shadow-2xs"
                        : "bg-slate-50 border-slate-150 text-slate-510 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    📂 Todas as Empresas
                  </button>
                  <button
                    onClick={() => setMunicipalFilter("intimados")}
                    className={`p-2.5 rounded-xl border text-left text-sm font-bold transition-all cursor-pointer ${
                      municipalFilter === "intimados"
                        ? "bg-amber-652/10 border-amber-500/30 text-amber-800 shadow-2xs"
                        : "bg-slate-50 border-slate-150 text-slate-510 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    ⚠️ Só as Intimadas
                  </button>
                  <button
                    onClick={() => setMunicipalFilter("autuados")}
                    className={`p-2.5 rounded-xl border text-left text-sm font-bold transition-all cursor-pointer ${
                      municipalFilter === "autuados"
                        ? "bg-rose-600/10 border-rose-500/30 text-rose-800 shadow-2xs"
                        : "bg-slate-50 border-slate-150 text-slate-510 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    🛑 Só as Autuadas
                  </button>
                  <button
                    onClick={() => setMunicipalFilter("intimados_autuados")}
                    className={`p-2.5 rounded-xl border text-left text-sm font-bold transition-all cursor-pointer ${
                      municipalFilter === "intimados_autuados"
                        ? "bg-purple-600/10 border-purple-500/30 text-purple-800 shadow-2xs"
                        : "bg-slate-50 border-slate-150 text-slate-510 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    ⚡ Intimadas e Autuadas
                  </button>
                </div>
              </div>

              {/* Opção: Incluir Empresas Fechadas */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-sm font-bold text-slate-850 uppercase tracking-widest block font-display">Incluir Empresas Fechadas</span>
                  <p className="text-[9.5px] text-slate-400 font-medium leading-relaxed">
                    Se desativado, exclui do relatório as empresas encontradas fechadas no momento da inspeção.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIncludeClosed(!includeClosed)}
                  className={`w-11 h-6 rounded-full transition-all duration-200 ease-in-out relative flex items-center shrink-0 cursor-pointer outline-none ${
                    includeClosed ? "bg-violet-600" : "bg-slate-350"
                  }`}
                >
                  <span
                    className={`absolute bg-white w-5 h-5 rounded-full transition-transform duration-205 shadow-sm ${
                      includeClosed ? "translate-x-5.5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Quick feedback on evaluation paragraphs configured */}
              <div className="bg-slate-50 border border-slate-150 rounded-2xl p-3.5 space-y-1">
                <span className="text-[9.5px] font-bold text-slate-400 tracking-wider uppercase block">Status Avaliação Geral (Item 3)</span>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(evalItems).map(([key, active]) => {
                    if (!active) return null;
                    const cleanName = key.replace("has", "").slice(0, 8);
                    return (
                      <span key={key} className="text-[8.5px] font-bold bg-violet-50 border border-violet-100 text-violet-700 px-2 py-0.5 rounded">
                        +{cleanName}...
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={downloadMunicipalReport}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-sm px-5 py-3.5 rounded-xl cursor-pointer shadow-md transition-all active:translate-y-0.5"
            >
              <FileDown className="w-4 h-4 animate-bounce" /> Exportar Relatório de {selectedCity} (.DOCX)
            </button>
          </div>
        </div>

        {/* Card 2: Resumo de Viagem Corporativa */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4 mb-4">
              <Briefcase className="w-5 h-5 text-violet-600" />
              <div>
                <h4 className="font-extrabold text-slate-900 text-base font-display tracking-wide uppercase">
                  Resumo de Viagem Geral
                </h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5">
                  Compilação administrativa e de produtividade no percurso geral da equipe
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-sm font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                  Fiscais Farmacêuticos Atuantes:
                </label>
                <input
                  type="text"
                  value={travelFiscais}
                  onChange={(e) => setTravelFiscais(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 px-3 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                  placeholder="EX: ROBERTO BENEVENUTO / JEFFERSON AYRES"
                />
              </div>

              <div>
                <label className="text-sm font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                  Período Operacional de Fiscalizações:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={travelPeriod}
                    onChange={(e) => setTravelPeriod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 px-3 pr-10 text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                    placeholder="EX: 15/05/2026 a 22/05/2026"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <button
              onClick={downloadTravelSummary}
              className="w-full flex items-center justify-center gap-2 bg-violet-600/90 hover:bg-violet-600 text-white font-extrabold text-sm px-5 py-3.5 rounded-xl cursor-pointer shadow-md transition-all active:translate-y-0.5"
            >
              <FileDown className="w-4 h-4" /> Exportar Resumo de Viagem (.DOCX)
            </button>
          </div>
        </div>

      </div>

      {/* Selected City Listings */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
        
        {/* Localized view header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <div className="space-y-1">
            <span className="text-sm font-bold font-mono text-violet-600 block uppercase tracking-widest leading-none">MUNICÍPIO SOB AUDITORIA DE CAMPO</span>
            <h3 className="text-base font-extrabold text-slate-900 font-display uppercase tracking-widest flex items-center gap-2">
              <Compass className="w-5 h-5 text-violet-600 rotate-12" /> Cobertura Sanitária: {selectedCity}
            </h3>
          </div>

          <div className="flex flex-wrap gap-4 font-mono text-sm text-slate-500 font-bold">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 rounded-lg px-3 py-1.5 text-slate-700">
              <Clipboard className="w-4 h-4 text-slate-400" /> {cityEstabs.length} Farmácias
            </div>
            
            <div className="flex items-center gap-1.5 bg-amber-50/70 border border-amber-150 rounded-lg px-3 py-1.5 text-amber-800">
              <AlertCircle className="w-4 h-4 text-amber-600 hover:scale-105" /> {termos.filter(t => cityEstabs.map(e => e.inscricao).includes(t.estabelecimentoId) && t.nrSeqIntimacao !== "null").length} Intimações
            </div>
            
            <div className="flex items-center gap-1.5 bg-rose-50/70 border border-rose-150 rounded-lg px-3 py-1.5 text-rose-800">
              <AlertTriangle className="w-4 h-4 text-rose-600" /> {termos.filter(t => cityEstabs.map(e => e.inscricao).includes(t.estabelecimentoId) && t.nrSeqAuto !== "null").length} Autuações
            </div>
          </div>
        </div>

        {/* Detailed cards list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cityEstabs.map((e) => {
            const t = termos.find(term => term.estabelecimentoId === e.inscricao);
            const cl = checklists.find(check => check.estabelecimentoId === e.inscricao);
            const isNovo = e.inscricao.toUpperCase().includes("I");

            return (
              <div key={e.inscricao} className="border border-slate-205 rounded-2xl p-5 hover:border-violet-200 transition-all flex flex-col justify-between bg-slate-50/30 hover:bg-white relative overflow-hidden group">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h4 className="font-extrabold text-slate-905 font-display text-sm tracking-wide uppercase truncate max-w-[200px]">{e.fantasia}</h4>
                    <div className="flex gap-1.5 shrink-0">
                      {isNovo && (
                        <span className="text-[8.5px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          NOVO Cad
                        </span>
                      )}
                      <span className="text-sm font-bold font-mono bg-violet-50 border border-violet-100/50 text-violet-700 px-2 py-0.5 rounded-md select-all">
                        I.E: {e.inscricao}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 select-all font-mono mt-1 uppercase font-bold tracking-tight">{e.razaoSocial} • CNPJ: {e.cnpj}</p>
                  <p className="text-sm text-slate-600 mt-3 leading-relaxed">{e.endereco}, {e.bairro}</p>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm font-semibold">
                    <div className="p-2.5 border border-slate-100 bg-white rounded-xl">
                      <span className="text-[8px] font-bold text-slate-400 uppercase block leading-none mb-1.5 select-none font-display">Laudo Geral</span>
                      <span className="font-mono font-bold text-slate-700 block truncate leading-none text-sm">
                        {t?.nrSeqTermo && t.nrSeqTermo !== "null" ? t.nrSeqTermo : "SEM TERMO"}
                      </span>
                    </div>
                    <div className="p-2.5 border border-slate-100 bg-white rounded-xl">
                      <span className="text-[8px] font-bold text-slate-400 uppercase block leading-none mb-1.5 select-none font-display">Termo Intim.</span>
                      <span className={`font-mono font-black block truncate leading-none text-sm ${t?.nrSeqIntimacao && t.nrSeqIntimacao !== "null" ? "text-amber-600 underline" : "text-slate-400"}`}>
                        {t?.nrSeqIntimacao && t.nrSeqIntimacao !== "null" ? t.nrSeqIntimacao : "NENHUM"}
                      </span>
                    </div>
                    <div className="p-2.5 border border-slate-100 bg-white rounded-xl">
                      <span className="text-[8px] font-bold text-slate-400 uppercase block leading-none mb-1.5 select-none font-display">Auto Infração</span>
                      <span className={`font-mono font-black block truncate leading-none text-sm ${t?.nrSeqAuto && t.nrSeqAuto !== "null" ? "text-rose-600 underline" : "text-slate-400"}`}>
                        {t?.nrSeqAuto && t.nrSeqAuto !== "null" ? t.nrSeqAuto : "NENHUM"}
                      </span>
                    </div>
                  </div>

                  {t && (
                    <div className="mt-4 bg-white border border-slate-150 p-3 rounded-xl flex items-start gap-2.5 text-sm">
                      <UserCheck className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-700">Farmacêutico Presente: <span className="text-slate-900 font-extrabold">{t.nomeRtPresente !== "null" ? t.nomeRtPresente : "AUSENTE / NÃO DECLARADO"}</span></p>
                        <p className="mt-1.5 leading-relaxed text-slate-500 text-sm overflow-hidden text-ellipsis line-clamp-2" title={t.obs}>
                          "{t.obs}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="text-sm text-slate-400 font-mono font-bold uppercase select-none">
                    {t?.dtInicio && t.dtFim ? `Sincronia: ${t.dtInicio.split(" ")[0]}` : "Sem Periodo Informado"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* REVOLUTIONARY CONFIGURATOR INBOX MODAL */}
      <AnimatePresence>
        {isEvalModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[9999] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-violet-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-violet-600 text-white rounded-xl">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base font-display">CONSTRUTOR DA AVALIAÇÃO GERAL</h3>
                    <p className="text-sm text-slate-500">Selecione as ocorrências identificadas na viagem para compor o relatório consolidado</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEvalModalOpen(false)}
                  className="p-1 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold uppercase tracking-wider cursor-pointer"
                >
                  <X className="w-4 h-4 inline mr-1" />Fechar
                </button>
              </div>

              {/* Modal Checklist list */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-base">
                
                <div className="bg-amber-50 border border-amber-200 text-amber-850 p-3.5 rounded-2xl flex items-start gap-2 text-sm">
                  <HelpCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-700" />
                  <p className="leading-relaxed">
                    Marque as caixas para cada situation/infração identificada em campo. Ao marcar uma situação, o sistema automaticamente acoplará a fundamentação legal e técnica correspondente no relatório exportável.
                  </p>
                </div>

                {/* Opção: Marcar Automaticamente pelo sistema */}
                <div className="bg-violet-50/50 border border-violet-150 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-violet-600 animate-pulse shrink-0" />
                      <span className="text-sm font-extrabold text-violet-950 uppercase tracking-wider block font-display">Marcar Automaticamente pelo sistema</span>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-lg">
                      Quando ativado, o cruzamento inteligente de dados XML identifica e marca de forma inteligente as opções condizentes com os dados de vistorias técnicas deste Polo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newState = !autoMarkActive;
                      setAutoMarkActive(newState);
                      if (newState) {
                        autoMarkFromXml();
                      }
                    }}
                    className={`w-12 h-6.5 rounded-full transition-all duration-300 ease-in-out relative flex items-center shrink-0 cursor-pointer outline-none shadow-xs ${
                      autoMarkActive ? "bg-violet-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`absolute bg-white w-5.5 h-5.5 rounded-full transition-transform duration-300 shadow-md flex items-center justify-center ${
                        autoMarkActive ? "translate-x-6" : "translate-x-0.5"
                      }`}
                    >
                      {autoMarkActive && <Check className="w-3 h-3 text-violet-600 font-bold" />}
                    </span>
                  </button>
                </div>

                <div className="space-y-4">
                  
                {/* Custom Variables Section */}
                <div className="bg-white border border-slate-200 rounded-3xl p-5 mb-6 shadow-sm">
                  <h4 className="font-extrabold text-slate-900 text-sm font-display uppercase tracking-widest mb-3">Variáveis do Relatório (Opcional)</h4>
                  <p className="text-sm text-slate-500 mb-4 leading-relaxed max-w-2xl">
                    Se você utilizar etiquetas como <strong>[LABS_INFRA]</strong>, <strong>[LABS_LAMINAS]</strong> ou <strong>[HOSPITAIS]</strong> nos parágrafos do Construtor, eles serão substituídos pelos itens abaixo.
                  </p>

                  <div className="space-y-4">
                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl">
                       <h5 className="text-sm uppercase font-bold text-slate-700 tracking-wider mb-2">[LABS_INFRA] - Laboratórios (Infraestrutura Crítica)</h5>
                       {labsInfra.map((lab, index) => (
                         <div key={index} className="flex gap-2 mb-2">
                           <input type="text" placeholder="Nome do Lab" value={lab.nome} onChange={(e) => { const n = [...labsInfra]; n[index].nome = e.target.value; setLabsInfra(n); }} className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500" />
                           <input type="text" placeholder="CNPJ" value={lab.cnpj} onChange={(e) => { const n = [...labsInfra]; n[index].cnpj = e.target.value; setLabsInfra(n); }} className="w-1/3 text-sm px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500" />
                           <button onClick={() => setLabsInfra(labsInfra.filter((_, i) => i !== index))} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                         </div>
                       ))}
                       <button onClick={() => setLabsInfra([...labsInfra, {nome:"", cnpj:""}])} className="text-sm text-violet-600 font-bold uppercase hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar</button>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl">
                       <h5 className="text-sm uppercase font-bold text-slate-700 tracking-wider mb-2">[LABS_LAMINAS] - Laboratórios (Leitura de Lâminas)</h5>
                       {labsLaminas.map((lab, index) => (
                         <div key={index} className="flex gap-2 mb-2">
                           <input type="text" placeholder="Nome do Lab" value={lab.nome} onChange={(e) => { const n = [...labsLaminas]; n[index].nome = e.target.value; setLabsLaminas(n); }} className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500" />
                           <button onClick={() => setLabsLaminas(labsLaminas.filter((_, i) => i !== index))} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                         </div>
                       ))}
                       <button onClick={() => setLabsLaminas([...labsLaminas, {nome:""}])} className="text-sm text-violet-600 font-bold uppercase hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar</button>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-150 rounded-2xl">
                       <h5 className="text-sm uppercase font-bold text-slate-700 tracking-wider mb-2">[HOSPITAIS] - Hospitais</h5>
                       {hospitals.map((h, index) => (
                         <div key={index} className="flex gap-2 mb-2">
                           <input type="text" placeholder="Unidade Hospitalar de..." value={h.nome} onChange={(e) => { const n = [...hospitals]; n[index].nome = e.target.value; setHospitals(n); }} className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500" />
                           <button onClick={() => setHospitals(hospitals.filter((_, i) => i !== index))} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                         </div>
                       ))}
                       <button onClick={() => setHospitals([...hospitals, {nome:""}])} className="text-sm text-violet-600 font-bold uppercase hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Adicionar</button>
                    </div>
                  </div>
                </div>

                {/* Dinamycaly Fetched Items from Firestore */}
                  {dbEvalItems.map((item, index) => (
                    <label key={item.id} className="flex items-start gap-3.5 p-3.5 bg-slate-50/60 border border-slate-150 border-r-4 border-r-emerald-400 hover:border-slate-350 rounded-2xl cursor-pointer transition-colors block">
                      <input 
                        type="checkbox" 
                        className="mt-1 rounded text-violet-600 focus:ring-violet-500 shrink-0 h-4.5 w-4.5"
                        checked={evalItems[item.id] || false}
                        onChange={(e) => setEvalItems({ ...evalItems, [item.id]: e.target.checked })}
                      />
                      <div>
                        <span className="font-extrabold text-slate-900 font-display block text-sm">{index + 1}. {item.title}</span>
                        {item.description && (
                          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-sm font-bold text-violet-700">
                  {Object.values(evalItems).filter(Boolean).length} cláusulas ativas na Avaliação Geral
                </span>
                <button 
                  onClick={() => setIsEvalModalOpen(false)}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-sm rounded-xl cursor-pointer shadow-md active:scale-95 transition-all text-center"
                >
                  <Check className="w-4 h-4 inline mr-1" /> Aplicar Configuração e Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
