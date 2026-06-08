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
import { Estabelecimento, TermoSanitario, EvalItem, EvalVariable } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { exportMunicipalDocx, exportTravelDocx, exportFullMunicipalDocx } from "../utils/docxExporter";
import { useLoading } from "../contexts/LoadingContext";

interface TripOverviewProps {
  estabelecimentos: Estabelecimento[];
  termos: TermoSanitario[];
}

export default function TripOverview({ estabelecimentos, termos }: TripOverviewProps) {
  const { showLoading, hideLoading } = useLoading();
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [municipalFilter, setMunicipalFilter] = useState<"todos" | "intimados" | "autuados" | "intimados_autuados">("todos");
  const [travelFiscais, setTravelFiscais] = useState<string>("");
  const [travelPeriod, setTravelPeriod] = useState<string>("15/05/2026 a 22/05/2026");
  const [includeClosed, setIncludeClosed] = useState<boolean>(false);
  const [dateFormat, setDateFormat] = useState<"apenas_data" | "data_hora" | "sem_data">("apenas_data");

  React.useEffect(() => {
    const inspetores = new Set<string>();
    termos.forEach(t => {
      if (t.inspetorFiscalizacao && t.inspetorFiscalizacao !== "null") {
        inspetores.add(t.inspetorFiscalizacao);
      }
    });
    if (inspetores.size > 0) {
      setTravelFiscais(Array.from(inspetores).join(" / "));
    }
  }, [termos]);

  // Checks if an establishment was found closed
  const isEstabClosed = React.useCallback((e: Estabelecimento) => {
    if (e.encontrava && e.encontrava.toUpperCase() === "FECHADA") return true;
    const t = termos.find(term => term.estabelecimentoId === e.inscricao);
    if (t?.encontrava && t.encontrava.toUpperCase() === "FECHADA") return true;
    return false;
  }, [termos]);

  const visibleEstabelecimentos = React.useMemo(() => {
    return estabelecimentos.filter(e => {
      if (includeClosed) return true;
      return !isEstabClosed(e);
    });
  }, [estabelecimentos, includeClosed, isEstabClosed]);

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
  const [dbEvalVariables, setDbEvalVariables] = useState<EvalVariable[]>([]);
  const [customVariablesData, setCustomVariablesData] = useState<Record<string, Record<string, string>[]>>({});

  React.useEffect(() => {
    const fetchDbParams = async () => {
      try {
        const [itemsQs, varsQs] = await Promise.all([
           getDocs(collection(db, "evaluation_items")),
           getDocs(collection(db, "evaluation_variables"))
        ]);
        
        const list: EvalItem[] = [];
        itemsQs.forEach((d) => list.push({ id: d.id, ...d.data() } as EvalItem));
        const sortedList = list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setDbEvalItems(sortedList);

        const varsList: EvalVariable[] = [];
        varsQs.forEach((d) => varsList.push({ id: d.id, ...d.data() } as EvalVariable));
        setDbEvalVariables(varsList);

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
  const uniqueCities = React.useMemo(() => {
    return Array.from(new Set<string>(visibleEstabelecimentos.map(e => e.cidade.toUpperCase()))).sort();
  }, [visibleEstabelecimentos]);

  React.useEffect(() => {
    if (uniqueCities.length > 0 && !selectedCity) {
      setSelectedCity(uniqueCities[0]);
    }
  }, [uniqueCities, selectedCity]);

  // Aggregate stats per city
  const citySummaries = React.useMemo(() => uniqueCities.map(city => {
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
  }), [uniqueCities, visibleEstabelecimentos, termos]);

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
         
         // Process Custom Variables
         dbEvalVariables.forEach(v => {
            const regex = new RegExp(`\\[${v.id}\\]`, 'g');
            if (p.match(regex)) {
               const valuesList = customVariablesData[v.id] || [];
               const formattedV = valuesList.map(record => {
                  let fp = v.formatPattern;
                  v.fields.forEach(f => {
                     const key = `{${f.key}}`;
                     const val = record[f.key] || "";
                     fp = fp.split(key).join(val);
                  });
                  return fp;
               }).join(", ");
               p = p.replace(regex, formattedV);
            }
         });

         paragraphs.push(p);
      }
    });

    let joined = paragraphs.join("\n\n");
    
    const fiscalNames = travelFiscais.split(" / ");
    fiscalNames.forEach((name, i) => {
       const regex = new RegExp(`\\[NOME_FISCAL${i + 1}\\]`, 'g');
       joined = joined.replace(regex, name.trim());
    });
    joined = joined.replace(/\[PERIODO_DE_FISCALIZAÇÃO\]/g, travelPeriod || "NÃO INFORMADO");

    return joined;
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

    showLoading("Gerando documento...");
    try {
      await exportMunicipalDocx(`Relatorio_Municipal_${selectedCity.toUpperCase()}`, {
        selectedCity,
        filterLabel: filterLabels[municipalFilter],
        filteredEstabs,
        termos,
        customAvaliacaoGeralText: compiledText,
        dateFormat
      });
    } catch(e) {
      console.error(e);
      alert("Erro ao exportar");
    } finally {
      hideLoading();
    }
  };

  const downloadFullMunicipalReport = async () => {
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
    
    showLoading("Gerando documento, por favor aguarde...");
    try {
      await exportFullMunicipalDocx(`Relatorio_Completo_${selectedCity.toUpperCase()}`, {
        selectedCity,
        filterLabel: filterLabels[municipalFilter],
        filteredEstabs,
        termos,
        customAvaliacaoGeralText: compiledText,
        dateFormat,
        travelPeriod
      }, travelFiscais);
    } catch (err) {
      console.error(err);
      alert("Ocorreu um erro ao gerar o arquivo. Verifique o console.");
    } finally {
      hideLoading();
    }
  };

  const downloadTravelSummary = async () => {
    const totalEstabs = visibleEstabelecimentos.length;
    const totalTermos = termos.filter(t => visibleEstabelecimentos.some(e => e.inscricao === t.estabelecimentoId)).length;
    
    const countFiscalizados = totalTermos;
    const countIntimados = termos.filter(t => visibleEstabelecimentos.some(e => e.inscricao === t.estabelecimentoId) && t.nrSeqIntimacao && t.nrSeqIntimacao !== "null").length;
    const countAutuados = termos.filter(t => visibleEstabelecimentos.some(e => e.inscricao === t.estabelecimentoId) && t.nrSeqAuto && t.nrSeqAuto !== "null").length;
    const countNovos = visibleEstabelecimentos.filter(e => e.isClandestina || e.inscricao.toUpperCase().includes("I")).length;

    showLoading("Gerando resumo de viagem...");
    try {
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
    } catch(e) {
      console.error(e);
      alert("Erro ao exportar");
    } finally {
      hideLoading();
    }
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
                    Relatório de {selectedCity}
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

            <div className="space-y-5 mt-4">
              <div>
                <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2 px-1">
                  Filtrar Situação Fiscal:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setMunicipalFilter("todos")}
                    className={`p-3 rounded-xl border-2 text-left text-xs uppercase tracking-wide font-black transition-all cursor-pointer ${
                      municipalFilter === "todos"
                        ? "bg-violet-50 border-violet-600 text-violet-800 shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    📂 Todas 
                  </button>
                  <button
                    onClick={() => setMunicipalFilter("intimados")}
                    className={`p-3 rounded-xl border-2 text-left text-xs uppercase tracking-wide font-black transition-all cursor-pointer ${
                      municipalFilter === "intimados"
                        ? "bg-amber-50 border-amber-500 text-amber-800 shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    ⚠️ Só Intimadas
                  </button>
                  <button
                    onClick={() => setMunicipalFilter("autuados")}
                    className={`p-3 rounded-xl border-2 text-left text-xs uppercase tracking-wide font-black transition-all cursor-pointer ${
                      municipalFilter === "autuados"
                        ? "bg-rose-50 border-rose-500 text-rose-800 shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    🛑 Só Autuadas
                  </button>
                  <button
                    onClick={() => setMunicipalFilter("intimados_autuados")}
                    className={`p-3 rounded-xl border-2 text-left text-xs uppercase tracking-wide font-black transition-all cursor-pointer ${
                      municipalFilter === "intimados_autuados"
                        ? "bg-fuchsia-50 border-fuchsia-600 text-fuchsia-800 shadow-sm"
                        : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    ⚡ Intimadas e Autuadas
                  </button>
                </div>
              </div>

              {/* Opções de Data (DOCX) */}
              <div>
                <label className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-widest block mb-2 px-1 mt-4">
                  Exibição da Data (DOCX):
                </label>
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setDateFormat("apenas_data")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10.5px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                      dateFormat === "apenas_data"
                        ? "bg-white text-violet-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Apenas Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateFormat("data_hora")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10.5px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                      dateFormat === "data_hora"
                        ? "bg-white text-violet-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Data e Hora
                  </button>
                  <button
                    type="button"
                    onClick={() => setDateFormat("sem_data")}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10.5px] uppercase tracking-wider font-extrabold transition-all cursor-pointer ${
                      dateFormat === "sem_data"
                        ? "bg-white text-rose-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Sem Data / Hora
                  </button>
                </div>
              </div>

              {/* Opção: Incluir Empresas Fechadas */}
              <label className="bg-white border-2 border-slate-200 hover:border-slate-300 shadow-sm rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer transition-all">
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={includeClosed} 
                  onChange={() => setIncludeClosed(!includeClosed)} 
                />
                <div className="space-y-1">
                  <span className="text-sm font-extrabold text-slate-800 uppercase tracking-widest block font-display">Incluir Empresas Fechadas</span>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    Se desativado, exclui do relatório as empresas encontradas fechadas no momento da inspeção.
                  </p>
                </div>
                <div
                  className={`w-14 h-7 rounded-full transition-all duration-300 ease-in-out relative flex items-center shrink-0 border-2 ${
                    includeClosed ? "bg-violet-600 border-violet-600" : "bg-slate-200 border-slate-300"
                  }`}
                >
                  <span
                    className={`absolute bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${
                      includeClosed ? "translate-x-7" : "translate-x-1"
                    }`}
                  />
                </div>
              </label>

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

          <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
            <button
              onClick={downloadMunicipalReport}
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-sm px-5 py-3.5 rounded-xl cursor-pointer shadow-md transition-all active:translate-y-0.5"
            >
              <FileDown className="w-4 h-4" /> Exportar Relatório Simples de {selectedCity} (.DOCX)
            </button>
            <button
              onClick={downloadFullMunicipalReport}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm px-5 py-3.5 rounded-xl cursor-pointer shadow-md transition-all active:translate-y-0.5"
            >
              <FileDown className="w-4 h-4 animate-bounce" /> Exportar Relatório completo de {selectedCity} (.DOCX)
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
                  {/* Dynamically Fetched Items from Firestore */}
                  {dbEvalItems.map((item, index) => {
                    const textToSearch = `${item.title || ""} ${item.description || ""} ${item.paragraph || ""}`;
                    const hasLabsInfra = textToSearch.includes("[LABS_INFRA]");
                    const hasLabsLaminas = textToSearch.includes("[LABS_LAMINAS]");
                    const hasHospitals = textToSearch.includes("[HOSPITAIS]");
                    const isChecked = !!evalItems[item.id];
                    const variablesInThisItem = dbEvalVariables.filter(v => textToSearch.includes(`[${v.id}]`));
                    const hasCustomVariables = variablesInThisItem.length > 0;

                    return (
                      <div key={item.id} className="p-4 bg-slate-55/70 border border-slate-150 border-r-4 border-r-emerald-400 hover:border-slate-300 rounded-2xl transition-colors block">
                        <div className="flex items-start gap-3.5">
                          <input 
                            id={`eval-item-${item.id}`}
                            type="checkbox" 
                            className="mt-1 rounded text-violet-600 focus:ring-violet-500 shrink-0 h-4.5 w-4.5 cursor-pointer"
                            checked={isChecked}
                            onChange={(e) => setEvalItems({ ...evalItems, [item.id]: e.target.checked })}
                          />
                          <label htmlFor={`eval-item-${item.id}`} className="cursor-pointer flex-1 select-none">
                            <span className="font-extrabold text-slate-900 font-display block text-sm">{index + 1}. {item.title}</span>
                            {item.description && (
                              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                {item.description}
                              </p>
                            )}
                          </label>
                        </div>

                        {isChecked && (hasLabsInfra || hasLabsLaminas || hasHospitals || hasCustomVariables) && (
                          <div className="mt-4 pt-4 border-t border-slate-200/60 space-y-4 animate-in fade-in duration-200">
                            {variablesInThisItem.map(v => {
                               const records = customVariablesData[v.id] || [];
                               return (
                                  <div key={v.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                                     <div className="flex items-center justify-between">
                                        <h5 className="text-[11px] uppercase font-black text-slate-700 tracking-wider flex items-center gap-1.5">
                                           ⚙️ [{v.id}] - {v.name}
                                        </h5>
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            const newRec: Record<string, string> = {};
                                            v.fields.forEach(f => newRec[f.key] = "");
                                            setCustomVariablesData({
                                              ...customVariablesData,
                                              [v.id]: [...records, newRec]
                                            });
                                          }}
                                          className="text-xs text-violet-600 hover:text-violet-750 font-black uppercase flex items-center gap-1 cursor-pointer"
                                        >
                                           <Plus className="w-3.5 h-3.5" /> Adicionar
                                        </button>
                                     </div>
                                     <div className="space-y-3">
                                        {records.map((record, idx) => (
                                          <div key={idx} className="flex gap-2 items-start relative border-l-2 border-slate-200 pl-3">
                                            <div className="flex-1 grid gap-2 grid-cols-1 sm:grid-cols-2">
                                              {v.fields.map(f => (
                                                <input 
                                                  key={f.key}
                                                  type="text" 
                                                  placeholder={f.placeholder || f.label} 
                                                  value={record[f.key] || ""} 
                                                  onChange={(e) => {
                                                    const newRecords = [...records];
                                                    newRecords[idx] = { ...newRecords[idx], [f.key]: e.target.value };
                                                    setCustomVariablesData({ ...customVariablesData, [v.id]: newRecords });
                                                  }} 
                                                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-50 focus:bg-white transition-all" 
                                                />
                                              ))}
                                            </div>
                                            <button 
                                              onClick={() => {
                                                const newRecords = records.filter((_, i) => i !== idx);
                                                setCustomVariablesData({ ...customVariablesData, [v.id]: newRecords });
                                              }} 
                                              className="p-1.5 mt-0.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0 transition-colors"
                                              title="Remover"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        ))}
                                        {records.length === 0 && (
                                          <p className="text-[10px] text-slate-400 italic">Nenhum {v.name.toLowerCase()} adicionado. Clique no botão acima para adicionar.</p>
                                        )}
                                     </div>
                                  </div>
                               );
                            })}
                            
                            {hasLabsInfra && (
                              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[11px] uppercase font-black text-slate-700 tracking-wider flex items-center gap-1.5">
                                    🏢 [LABS_INFRA] - Laboratórios (Infraestrutura Crítica)
                                  </h5>
                                  <button 
                                    type="button"
                                    onClick={() => setLabsInfra([...labsInfra, { nome: "", cnpj: "" }])}
                                    className="text-xs text-violet-600 hover:text-violet-750 font-black uppercase flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Adicionar
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {labsInfra.map((lab, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                      <input 
                                        type="text" 
                                        placeholder="Nome do Lab" 
                                        value={lab.nome} 
                                        onChange={(e) => { 
                                          const n = [...labsInfra]; 
                                          n[idx].nome = e.target.value; 
                                          setLabsInfra(n); 
                                        }} 
                                        className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-50 focus:bg-white transition-all" 
                                      />
                                      <input 
                                        type="text" 
                                        placeholder="CNPJ" 
                                        value={lab.cnpj} 
                                        onChange={(e) => { 
                                          const n = [...labsInfra]; 
                                          n[idx].cnpj = e.target.value; 
                                          setLabsInfra(n); 
                                        }} 
                                        className="w-1/3 text-sm px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-50 focus:bg-white transition-all" 
                                      />
                                      <button 
                                        type="button" 
                                        onClick={() => setLabsInfra(labsInfra.filter((_, i) => i !== idx))} 
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                        title="Remover"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                  {labsInfra.length === 0 && (
                                    <p className="text-xs text-slate-400 italic font-medium px-1">Nenhum laboratório cadastrado.</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {hasLabsLaminas && (
                              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[11px] uppercase font-black text-slate-700 tracking-wider flex items-center gap-1.5">
                                    🔬 [LABS_LAMINAS] - Laboratórios (Leitura de Lâminas)
                                  </h5>
                                  <button 
                                    type="button"
                                    onClick={() => setLabsLaminas([...labsLaminas, { nome: "" }])}
                                    className="text-xs text-violet-600 hover:text-violet-750 font-black uppercase flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Adicionar
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {labsLaminas.map((lab, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                      <input 
                                        type="text" 
                                        placeholder="Nome do Lab" 
                                        value={lab.nome} 
                                        onChange={(e) => { 
                                          const n = [...labsLaminas]; 
                                          n[idx].nome = e.target.value; 
                                          setLabsLaminas(n); 
                                        }} 
                                        className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-50 focus:bg-white transition-all" 
                                      />
                                      <button 
                                        type="button" 
                                        onClick={() => setLabsLaminas(labsLaminas.filter((_, i) => i !== idx))} 
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                        title="Remover"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                  {labsLaminas.length === 0 && (
                                    <p className="text-xs text-slate-400 italic font-medium px-1">Nenhum laboratório cadastrado.</p>
                                  )}
                                </div>
                              </div>
                            )}

                            {hasHospitals && (
                              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between">
                                  <h5 className="text-[11px] uppercase font-black text-slate-700 tracking-wider flex items-center gap-1.5">
                                    🏥 [HOSPITAIS] - Hospitais
                                  </h5>
                                  <button 
                                    type="button"
                                    onClick={() => setHospitals([...hospitals, { nome: "" }])}
                                    className="text-xs text-violet-600 hover:text-violet-750 font-black uppercase flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" /> Adicionar
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {hospitals.map((h, idx) => (
                                    <div key={idx} className="flex gap-2 items-center">
                                      <input 
                                        type="text" 
                                        placeholder="Unidade Hospitalar de..." 
                                        value={h.nome} 
                                        onChange={(e) => { 
                                          const n = [...hospitals]; 
                                          n[idx].nome = e.target.value; 
                                          setHospitals(n); 
                                        }} 
                                        className="flex-1 text-sm px-3 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-50 focus:bg-white transition-all" 
                                      />
                                      <button 
                                        type="button" 
                                        onClick={() => setHospitals(hospitals.filter((_, i) => i !== idx))} 
                                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                                        title="Remover"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                  {hospitals.length === 0 && (
                                    <p className="text-xs text-slate-400 italic font-medium px-1">Nenhum hospital cadastrado.</p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-violet-700">
                    {Object.values(evalItems).filter(Boolean).length} cláusulas ativas na Avaliação Geral
                  </span>
                  <button 
                    onClick={() => {
                      const cleared: Record<string, boolean> = {};
                      dbEvalItems.forEach(item => {
                        cleared[item.id] = false;
                      });
                      setEvalItems(cleared);
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wide rounded-lg cursor-pointer transition-all"
                  >
                    Limpar Seleção
                  </button>
                </div>
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
