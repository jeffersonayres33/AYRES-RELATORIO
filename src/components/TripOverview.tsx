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
import { Estabelecimento, TermoSanitario, FarmaciaChecklist } from "../types";
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
  const [evalItems, setEvalItems] = useState({
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

    setEvalItems({
      hasFaltaReceituario: lackReceit,
      hasDeficienciaInjetaveis: defInjet,
      hasFaltaAfeAlvarares: faltaAfe,
      hasIrregularidadeLabInfra: labInfra,
      hasLeituraLaminasSemFarmac: laminas,
      hasFaltaFarmacUbs: lackUbs,
      hasOrientacaoCftRemume: cftRemume,
      hasImplementacaoHorus: horus,
      hasFragilidadeHospital: hospitalFragil,
      hasCaronaLicitacao: carona,
      hasVendaSupermercado: vendaMercado,
      hasApeloFiscalizacao: true
    });
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

    if (evalItems.hasFaltaReceituario) {
      paragraphs.push(
        `Outro ponto preocupante é a ausência de receituários adequados para a prescrição de medicamentos sujeitos a controle especial, pela Prefeitura do municipio. Essa lacuna dificulta o acesso dos pacientes a esses medicamentos essenciais, comprometendo o tratamento adequado. Ademais, a falta de um sistema de prescrição apropriado pode contribuir para irregularidades sanitárias. Assim, é fundamental que medidas sejam adotadas para garantir a disponibilização de receituários apropriados, assegurando assim a conformidade com as normas sanitárias e o acesso seguro aos medicamentos controlados.`
      );
    }

    if (evalItems.hasDeficienciaInjetaveis) {
      paragraphs.push(
        `Por conseguinte, constatou-se que algumas das drogarias fiscalizadas apresentavam deficiências na infraestrutura das salas de injetáveis, incluindo espaço inadequado, ausência de pia para lavagem das mãos e falta de um ambiente que garanta a privacidade do cliente, como determinado pela RDC 44/2009 da ANVISA. Além disso, constatou-se, ainda, que nem todas as drogarias realizavam a prestação dos serviços farmacêuticos com a emissão da Declaração do Serviço Farmacêutico Prestado, conforme exigido pela mesma resolução.`
      );
    }

    if (evalItems.hasFaltaAfeAlvarares) {
      paragraphs.push(
        `No tocante a Autorização de Funcionamento da ANVISA (AFE) emitida pela ANVISA, identificou-se, durante inspeção, que nem todos os estabelecimentos privados não possuíam essa autorização de funcionamento, estando em desconformidade com a RDC 44/2009 ANVISA, sendo necessário adequação da Vigilância Sanitária, quanto a emissão do Alvará Sanitário, uma vez trata-se de um documento obrigatório para o licenciamento de farmácias e drogarias.`
      );
    }

    if (evalItems.hasIrregularidadeLabInfra) {
      const formattedLabs = labsInfra.map(l => `Laboratório ${l.nome.toUpperCase()} (CNPJ ${l.cnpj})`).join(", ");
      paragraphs.push(
        `Por conseguinte, no(s) ${formattedLabs} constatou-se situações críticas de infraestrutura e gestão da qualidade. As irregularidades observadas incluíam infiltrações significativas no ambiente, armazenamento inadequado de reagentes, falta de separação apropriada das áreas, dimensões inadequadas das salas e bancadas, ausência de controle de temperatura na geladeira destinada aos reagentes, ausência de equipamentos compatíveis com a rotina, além de iluminação, piso e paredes em condições inadequadas. Essas irregularidades comprometem a qualidade dos serviços e produtos oferecidos, representando riscos à saúde de usuários e trabalhadores.`
      );
    }

    if (evalItems.hasLeituraLaminasSemFarmac) {
      const formattedLabs = labsLaminas.map(l => `Laboratório ${l.nome.toUpperCase()}`).join(", ");
      paragraphs.push(
        `Além do mais, verificou-se, ainda que no(s) ${formattedLabs}, as análises laboratoriais, bem como a leitura das lâminas estavam sendo realizadas apenas por técnicos em patologia, sem a presença de um profissional farmacêutico ou outro legalmente habilitado. Além disso, foram encontrados laudos em branco assinados pelas Biomédicas, havendo indícios de emissão de laudo de forma irregular.`
      );
    }

    if (evalItems.hasFaltaFarmacUbs) {
      paragraphs.push(
        `No setor público, constatou-se que o Município conta com apenas uma farmacêutica, que atua na Central de Abastecimento Farmacêutico (CAF), logo as demais Unidades Básicas de Saúde (UBS) não dispõem de um farmacêutico. Ressalta-se que a presença dos farmacêuticos não apenas assegura a oferta de medicamentos de qualidade, mas também viabiliza um atendimento especializado em assistência farmacêutica. Isso permite que os cidadãos recebam orientações seguras e eficazes sobre o uso correto dos medicamentos, promovendo um cuidado integral à saúde e contribuindo para a melhoria da qualidade de vida no município.`
      );
    }

    if (evalItems.hasOrientacaoCftRemume) {
      paragraphs.push(
        `Ainda considerando a avaliação das condições de gestão da Assistência Farmacêutica do Município, foi orientado a instituição da Comissão de Farmácia e Terapêutica (CFT) em âmbito Municipal, a qual tem caráter técnico e consultivo, responsável por assessorar a gestão municipal na definição de políticas relacionadas ao uso racional de medicamentos, bem como na seleção, padronização e revisão periódica da Relação Municipal de Medicamentos Essenciais (REMUME), que é o instrumento norteador para planejamento, programação, aquisição e dispensação de medicamentos na rede pública.`
      );
    }

    if (evalItems.hasImplementacaoHorus) {
      paragraphs.push(
        `Outro aspecto de grande relevância, sugerido durante a inspeção no Município, foi quanto a implementação do Sistema HÓRUS desenvolvido pelo Ministério da Saúde. Esse sistema permitirá o controle e monitoramento de estoques, rastreabilidade, geração de indicadores de consumo e emissão de relatórios gerenciais que subsidiarão a tomada de decisões estratégicas dentro da Assistência Farmacêutica, permitindo uma gestão eficiente do estoque, bem como no uso racional de recursos públicos.`
      );
    }

    if (evalItems.hasFragilidadeHospital) {
      const formattedHospitals = hospitals.map(h => `Unidade Hospitalar de ${h.nome.toUpperCase()}`).join(" e ");
      const genericHospName = hospitals.map(h => h.nome.toUpperCase()).join(" / ");
      paragraphs.push(
        `Por conseguinte, na farmácia hospitalar da(s) ${formattedHospitals} foi evidenciado avanços importantes, como a presença de farmacêutico durante a atividade e a implementação de rotinas básicas de dispensação e registro. Entretanto, foram constatadas, ainda, fragilidades significativas que impactam diretamente a segurança do paciente e o cumprimento das normas sanitárias, como:\n` +
        `● Segurança do Paciente: Verificou-se que a análise de prescrições não é realizada em sua totalidade em razão da quantidade reduzida de farmacêuticos, descumprindo a Portaria MS nº 2.095/2013 (Protocolo de Segurança na Prescrição). 也 não há protocolos de dupla checagem, lista de medicamentos de alta vigilância ou conciliação medicamentosa.\n` +
        `● Medicamentos Sujeitos a Controle Especial: Foram observadas falhas na escrituração, armazenamento e dispensação de psicotrópicos e entorpecentes, em desconformidade com a Portaria MS nº 344/1998.\n` +
        `● Gestão e Capacitação: Ausência de POPs, Manual de Boas Práticas, PGRSS, registros de treinamento da equipe, comprovantes de calibração de equipamentos e controle de pragas.\n` +
        `Assim, diante das inconformidades detectadas, destaca-se a necessidade de contratação de mais farmacêuticos para a Farmácia Hospitalar de ${genericHospName}, já que o quantitativo atual é insuficiente para atender às demandas de análise de prescrições, fracionamento, controle de medicamentos sujeitos a controle especial, implantação de Farmácia Clínica e atividades relacionadas à segurança do paciente.`
      );
    }

    if (evalItems.hasCaronaLicitacao) {
      paragraphs.push(
        `Por fim, em reunião com o Secretário de Saúde, como medida para redução de custos, considerando que o repasse do Estado para aquisição de medicamentos e produtos para a saúde é significativamente inferior ao necessário, foi recomendada a adoção da prática de solicitar caronas em licitações e pregões eletrônicos. Essa estratégia deve ser implementada sempre em observância ao princípio da economicidade e da legalidade, conforme previsto na Lei nº 14.133/2021, e respeitando o preço máximo ao governo. Tal medida visa evitar o desabastecimento de itens críticos, garantir a continuidade da assistência farmacêutica e promover uma gestão mais eficiente dos recursos públicos destinados à saúde.`
      );
    }

    if (evalItems.hasVendaSupermercado) {
      paragraphs.push(
        `É oportuno mencionar que no referido Município foi identificado a venda irregular de medicamentos em supermercados, cuja prática é proibida no Brasil e representa um grave risco à saúde da população. De acordo com a legislação sanitária vigente, a venda de qualquer medicamento deve ocorrer exclusivamente em farmácias e drogarias, estabelecimentos devidamente regulamentados e que contam com a presença obrigatória de um farmacêutico, que é profissional responsável por orientar os pacientes sobre dosagens, interações medicamentosas, contraindicações e possíveis efeitos adversos, prevenindo automedicação inadequada e intoxicações. Quando medicamentos são vendidos em locais não autorizados, como supermercados, há um risco maior de armazenamento inadequado, venda de produtos vencidos ou falsificados e uso indiscriminado pela população. Além disso, a ausência de um profissional capacitado para oferecer orientações aumenta as chances de erros de administração, podendo levar a agravamento de doenças, reações adversas e até intoxicações graves. Assim, é de fundamental importância que as autoridades sanitárias intensifiquem a fiscalização para coibir essa prática ilegal de venda de medicamentos nos supermercados e que haja também a comunicação ao Ministério Público Estadual para adoção de medidas cabíveis, a fim de resguardar a saúde da população.`
      );
    }

    if (evalItems.hasApeloFiscalizacao) {
      paragraphs.push(
        `Por fim, é de fundamental importância que as autoridades sanitárias intensifiquem a fiscalização nos estabelecimentos citados, a fim de coibir as irregularidades sanitárias que podem comprometer a saúde da população e garantir que as normas e regulamentações sejam cumpridas, assegurando a qualidade dos serviços prestados e a segurança dos pacientes. Irregularidades, como a falta de infraestrutura adequada, a ausência de controle sanitário e a não conformidade com as diretrizes estabelecidas, podem resultar em sérios riscos à saúde pública.`
      );
    }

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
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
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
          <p className="text-slate-500 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed font-semibold">
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
                    <span className="font-extrabold font-display text-xs uppercase tracking-wider block text-slate-900 leading-tight">
                      {sum.cidade}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 select-none block mt-0.5">
                      {coord}
                    </span>
                  </div>
                </div>

                {isSelected && (
                  <span className="text-[9px] font-extrabold bg-violet-600 text-white px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                    Ativo
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Inspeções */}
                <div className="p-3 bg-violet-50/40 border border-violet-100/30 rounded-2xl flex flex-col justify-between">
                  <span className="block font-extrabold text-slate-400 uppercase tracking-wider text-[8px]">Inspeções</span>
                  <span className="font-mono font-black text-sm text-violet-700 block mt-1">{sum.inspecoes}</span>
                </div>

                {/* Intimações */}
                <div className="p-3 bg-amber-50/40 border border-amber-100/30 rounded-2xl flex flex-col justify-between">
                  <span className="block font-extrabold text-slate-400 uppercase tracking-wider text-[8px]">Intimações</span>
                  <span className="font-mono font-black text-sm text-amber-600 block mt-1">{sum.intimacoes}</span>
                </div>

                {/* Autos */}
                <div className="p-3 bg-rose-50/40 border border-rose-100/30 rounded-2xl flex flex-col justify-between">
                  <span className="block font-extrabold text-slate-400 uppercase tracking-wider text-[8px]">Autos</span>
                  <span className="font-mono font-black text-sm text-rose-600 block mt-1">{sum.autos}</span>
                </div>

                {/* Novas Empresas */}
                <div className="p-3 bg-emerald-50/40 border border-emerald-100/30 rounded-2xl flex flex-col justify-between">
                  <span className="block font-extrabold text-slate-400 uppercase tracking-wider text-[8px]">Novas Empresas</span>
                  <span className="font-mono font-black text-sm text-emerald-600 block mt-1">{sum.novos}</span>
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
                  <h4 className="font-extrabold text-slate-900 text-sm font-display tracking-wide uppercase">
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
                    className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all cursor-pointer ${
                      municipalFilter === "todos"
                        ? "bg-violet-600/10 border-violet-500/30 text-violet-900 shadow-2xs"
                        : "bg-slate-50 border-slate-150 text-slate-510 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    📂 Todas as Empresas
                  </button>
                  <button
                    onClick={() => setMunicipalFilter("intimados")}
                    className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all cursor-pointer ${
                      municipalFilter === "intimados"
                        ? "bg-amber-652/10 border-amber-500/30 text-amber-800 shadow-2xs"
                        : "bg-slate-50 border-slate-150 text-slate-510 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    ⚠️ Só as Intimadas
                  </button>
                  <button
                    onClick={() => setMunicipalFilter("autuados")}
                    className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all cursor-pointer ${
                      municipalFilter === "autuados"
                        ? "bg-rose-600/10 border-rose-500/30 text-rose-800 shadow-2xs"
                        : "bg-slate-50 border-slate-150 text-slate-510 hover:border-slate-300 hover:text-slate-900"
                    }`}
                  >
                    🛑 Só as Autuadas
                  </button>
                  <button
                    onClick={() => setMunicipalFilter("intimados_autuados")}
                    className={`p-2.5 rounded-xl border text-left text-[11px] font-bold transition-all cursor-pointer ${
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
                  <span className="text-[10px] font-bold text-slate-850 uppercase tracking-widest block font-display">Incluir Empresas Fechadas</span>
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
              className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl cursor-pointer shadow-md transition-all active:translate-y-0.5"
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
                <h4 className="font-extrabold text-slate-900 text-sm font-display tracking-wide uppercase">
                  Resumo de Viagem Geral
                </h4>
                <p className="text-[10.5px] text-slate-500 mt-0.5">
                  Compilação administrativa e de produtividade no percurso geral da equipe
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                  Fiscais Farmacêuticos Atuantes:
                </label>
                <input
                  type="text"
                  value={travelFiscais}
                  onChange={(e) => setTravelFiscais(e.target.value.toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 px-3 text-xs font-bold text-slate-800 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
                  placeholder="EX: ROBERTO BENEVENUTO / JEFFERSON AYRES"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                  Período Operacional de Fiscalizações:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={travelPeriod}
                    onChange={(e) => setTravelPeriod(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 px-3 pr-10 text-xs font-bold text-slate-800 focus:outline-none focus:border-violet-500 focus:bg-white transition-all"
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
              className="w-full flex items-center justify-center gap-2 bg-violet-600/90 hover:bg-violet-600 text-white font-extrabold text-xs px-5 py-3.5 rounded-xl cursor-pointer shadow-md transition-all active:translate-y-0.5"
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
            <span className="text-[10px] font-bold font-mono text-violet-600 block uppercase tracking-widest leading-none">MUNICÍPIO SOB AUDITORIA DE CAMPO</span>
            <h3 className="text-base font-extrabold text-slate-900 font-display uppercase tracking-widest flex items-center gap-2">
              <Compass className="w-5 h-5 text-violet-600 rotate-12" /> Cobertura Sanitária: {selectedCity}
            </h3>
          </div>

          <div className="flex flex-wrap gap-4 font-mono text-xs text-slate-500 font-bold">
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
                    <h4 className="font-extrabold text-slate-905 font-display text-xs tracking-wide uppercase truncate max-w-[200px]">{e.fantasia}</h4>
                    <div className="flex gap-1.5 shrink-0">
                      {isNovo && (
                        <span className="text-[8.5px] font-bold bg-emerald-50 border border-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                          NOVO Cad
                        </span>
                      )}
                      <span className="text-[9px] font-bold font-mono bg-violet-50 border border-violet-100/50 text-violet-700 px-2 py-0.5 rounded-md select-all">
                        I.E: {e.inscricao}
                      </span>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 select-all font-mono mt-1 uppercase font-bold tracking-tight">{e.razaoSocial} • CNPJ: {e.cnpj}</p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">{e.endereco}, {e.bairro}</p>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-semibold">
                    <div className="p-2.5 border border-slate-100 bg-white rounded-xl">
                      <span className="text-[8px] font-bold text-slate-400 uppercase block leading-none mb-1.5 select-none font-display">Laudo Geral</span>
                      <span className="font-mono font-bold text-slate-700 block truncate leading-none text-[10px]">
                        {t?.nrSeqTermo && t.nrSeqTermo !== "null" ? t.nrSeqTermo : "SEM TERMO"}
                      </span>
                    </div>
                    <div className="p-2.5 border border-slate-100 bg-white rounded-xl">
                      <span className="text-[8px] font-bold text-slate-400 uppercase block leading-none mb-1.5 select-none font-display">Termo Intim.</span>
                      <span className={`font-mono font-black block truncate leading-none text-[10px] ${t?.nrSeqIntimacao && t.nrSeqIntimacao !== "null" ? "text-amber-600 underline" : "text-slate-400"}`}>
                        {t?.nrSeqIntimacao && t.nrSeqIntimacao !== "null" ? t.nrSeqIntimacao : "NENHUM"}
                      </span>
                    </div>
                    <div className="p-2.5 border border-slate-100 bg-white rounded-xl">
                      <span className="text-[8px] font-bold text-slate-400 uppercase block leading-none mb-1.5 select-none font-display">Auto Infração</span>
                      <span className={`font-mono font-black block truncate leading-none text-[10px] ${t?.nrSeqAuto && t.nrSeqAuto !== "null" ? "text-rose-600 underline" : "text-slate-400"}`}>
                        {t?.nrSeqAuto && t.nrSeqAuto !== "null" ? t.nrSeqAuto : "NENHUM"}
                      </span>
                    </div>
                  </div>

                  {t && (
                    <div className="mt-4 bg-white border border-slate-150 p-3 rounded-xl flex items-start gap-2.5 text-xs">
                      <UserCheck className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-700">Farmacêutico Presente: <span className="text-slate-900 font-extrabold">{t.nomeRtPresente !== "null" ? t.nomeRtPresente : "AUSENTE / NÃO DECLARADO"}</span></p>
                        <p className="mt-1.5 leading-relaxed text-slate-500 text-[11px] overflow-hidden text-ellipsis line-clamp-2" title={t.obs}>
                          "{t.obs}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <div className="text-[10px] text-slate-400 font-mono font-bold uppercase select-none">
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
                    <p className="text-xs text-slate-500">Selecione as ocorrências identificadas na viagem para compor o relatório consolidado</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsEvalModalOpen(false)}
                  className="p-1 px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold uppercase tracking-wider cursor-pointer"
                >
                  <X className="w-4 h-4 inline mr-1" />Fechar
                </button>
              </div>

              {/* Modal Checklist list */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-sm">
                
                <div className="bg-amber-50 border border-amber-200 text-amber-850 p-3.5 rounded-2xl flex items-start gap-2 text-xs">
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
                      <span className="text-xs font-extrabold text-violet-950 uppercase tracking-wider block font-display">Marcar Automaticamente pelo sistema</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-lg">
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
                  {/* Item 1 */}
                  <label className="flex items-start gap-3.5 p-3.5 bg-slate-50/60 border border-slate-150 hover:border-slate-350 rounded-2xl cursor-pointer transition-colors block">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded text-violet-600 focus:ring-violet-500 shrink-0 h-4.5 w-4.5"
                      checked={evalItems.hasFaltaReceituario}
                      onChange={(e) => setEvalItems({ ...evalItems, hasFaltaReceituario: e.target.checked })}
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 font-display block text-xs">1. Ausência de Receituários Especiais (Gestão Municipal)</span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Falta de blocos de prescrições apropriados fornecidos pela Prefeitura para substâncias sujeitas a controle especial.
                      </p>
                    </div>
                  </label>

                  {/* Item 2 */}
                  <label className="flex items-start gap-3.5 p-3.5 bg-slate-50/60 border border-slate-150 hover:border-slate-350 rounded-2xl cursor-pointer transition-colors block">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded text-violet-600 focus:ring-violet-500 shrink-0 h-4.5 w-4.5"
                      checked={evalItems.hasDeficienciaInjetaveis}
                      onChange={(e) => setEvalItems({ ...evalItems, hasDeficienciaInjetaveis: e.target.checked })}
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 font-display block text-xs">2. Deficiências em Salas de Injetáveis e Declaração de Serviço (Drogarias)</span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Espaço inadequado, ausência de pias, falta de privacidade e falta de emissão da Declaração de Serviço Farmacêutico (RDC 44/2009).
                      </p>
                    </div>
                  </label>

                  {/* Item 3 */}
                  <label className="flex items-start gap-3.5 p-3.5 bg-slate-50/60 border border-slate-150 hover:border-slate-300 rounded-2xl cursor-pointer transition-colors block">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded text-violet-600 focus:ring-violet-500 shrink-0 h-4.5 w-4.5"
                      checked={evalItems.hasFaltaAfeAlvarares}
                      onChange={(e) => setEvalItems({ ...evalItems, hasFaltaAfeAlvarares: e.target.checked })}
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 font-display block text-xs">3. Ausência de AFE expedida pela ANVISA e Alvará Sanitário</span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Estabelecimentos operando sem Autorização de Funcionamento ou Alvarás Locais regulares para licenciamento de farmácias.
                      </p>
                    </div>
                  </label>

                  {/* Item 4 */}
                  <div className="p-3.5 bg-slate-50/60 border border-slate-150 rounded-2xl space-y-3.5">
                    <label className="flex items-start gap-3.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mt-1 rounded text-violet-600 focus:ring-violet-500 shrink-0 h-4.5 w-4.5"
                        checked={evalItems.hasIrregularidadeLabInfra}
                        onChange={(e) => setEvalItems({ ...evalItems, hasIrregularidadeLabInfra: e.target.checked })}
                      />
                      <div>
                        <span className="font-extrabold text-slate-900 font-display block text-xs">4. Irregularidades Críticas de Infraestrutura (Laboratório de Análises)</span>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Infiltrações graves, armazenamento impróprio de reagentes, falta de controle térmico de geladeiras, etc.
                        </p>
                      </div>
                    </label>

                    {evalItems.hasIrregularidadeLabInfra && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 pl-8 pt-1"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Lista de Laboratórios</label>
                          <button
                            type="button"
                            onClick={() => setLabsInfra([...labsInfra, { nome: "", cnpj: "" }])}
                            className="inline-flex items-center gap-1 text-[10px] bg-violet-50 border border-violet-200 text-violet-700 px-2 py-1 rounded-md font-bold hover:bg-violet-100 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Adicionar
                          </button>
                        </div>
                        {labsInfra.map((lab, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-end bg-white border border-slate-205 p-2 rounded-xl shadow-2xs">
                            <div>
                              <label className="text-[9px] font-bold text-slate-450 uppercase block mb-1">Nome do Laboratório</label>
                              <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg font-bold"
                                value={lab.nome}
                                onChange={(e) => {
                                  const next = [...labsInfra];
                                  next[idx].nome = e.target.value;
                                  setLabsInfra(next);
                                }}
                                placeholder="Ex: LABORATÓRIO SÃO JOSÉ"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-slate-450 uppercase block mb-1">CNPJ</label>
                              <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg font-bold"
                                value={lab.cnpj}
                                onChange={(e) => {
                                  const next = [...labsInfra];
                                  next[idx].cnpj = e.target.value;
                                  setLabsInfra(next);
                                }}
                                placeholder="00.000.000/0000-00"
                              />
                            </div>
                            <button
                              type="button"
                              disabled={labsInfra.length <= 1}
                              onClick={() => {
                                const next = labsInfra.filter((_, i) => i !== idx);
                                setLabsInfra(next);
                              }}
                              className="p-1.5 text-rose-650 text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg cursor-pointer flex justify-center items-center h-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Item 5 */}
                  <div className="p-3.5 bg-slate-50/60 border border-slate-150 rounded-2xl space-y-3.5">
                    <label className="flex items-start gap-3.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mt-1 rounded text-violet-600 focus:ring-violet-500 shrink-0 h-4.5 w-4.5"
                        checked={evalItems.hasLeituraLaminasSemFarmac}
                        onChange={(e) => setEvalItems({ ...evalItems, hasLeituraLaminasSemFarmac: e.target.checked })}
                      />
                      <div>
                        <span className="font-extrabold text-slate-900 font-display block text-xs">5. Leitura de Lâminas sem Profissional Habilitador / Laudos em Branco Assinados</span>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Exames executados exclusivamente por técnicos em patologia/biotecnologia sem Farmacêutico, e laudos pré-assinados vazios.
                        </p>
                      </div>
                    </label>

                    {evalItems.hasLeituraLaminasSemFarmac && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 pl-8 pt-1"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Lista de Laboratórios (Lâminas)</label>
                          <button
                            type="button"
                            onClick={() => setLabsLaminas([...labsLaminas, { nome: "" }])}
                            className="inline-flex items-center gap-1 text-[10px] bg-violet-50 border border-violet-200 text-violet-700 px-2 py-1 rounded-md font-bold hover:bg-violet-100 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Adicionar
                          </button>
                        </div>
                        {labsLaminas.map((lab, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr_40px] gap-2 items-end bg-white border border-slate-205 p-2 rounded-xl shadow-2xs">
                            <div>
                              <label className="text-[9px] font-bold text-slate-450 uppercase block mb-1">Nome do Laboratório</label>
                              <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg font-bold"
                                value={lab.nome}
                                onChange={(e) => {
                                  const next = [...labsLaminas];
                                  next[idx].nome = e.target.value;
                                  setLabsLaminas(next);
                                }}
                                placeholder="Ex: LABORATÓRIO MATER DEI"
                              />
                            </div>
                            <button
                              type="button"
                              disabled={labsLaminas.length <= 1}
                              onClick={() => {
                                const next = labsLaminas.filter((_, i) => i !== idx);
                                setLabsLaminas(next);
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg cursor-pointer flex justify-center items-center h-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Item 6 */}
                  <label className="flex items-start gap-3.5 p-3.5 bg-slate-50/60 border border-slate-150 hover:border-slate-350 rounded-2xl cursor-pointer transition-colors block">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded text-violet-600 focus:ring-violet-500 shrink-0 h-4.5 w-4.5"
                      checked={evalItems.hasFaltaFarmacUbs}
                      onChange={(e) => setEvalItems({ ...evalItems, hasFaltaFarmacUbs: e.target.checked })}
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 font-display block text-xs">6. Ausência de Farmacêuticos nas Unidades Básicas de Saúde (UBS)</span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Rede pública deficitária: apenas 01 profissional na CAF e nenhum nas demais Unidades Básicas de dispensação da cidade.
                      </p>
                    </div>
                  </label>

                  {/* Item 7 */}
                  <label className="flex items-start gap-3.5 p-3.5 bg-slate-50/60 border border-slate-150 hover:border-slate-350 rounded-2xl cursor-pointer transition-colors block">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded text-violet-600 focus:ring-violet-500 shrink-0 h-4.5 w-4.5"
                      checked={evalItems.hasOrientacaoCftRemume}
                      onChange={(e) => setEvalItems({ ...evalItems, hasOrientacaoCftRemume: e.target.checked })}
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 font-display block text-xs">7. Recomendação de CFT & REMUME em Âmbito Municipal</span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Implementação da Comissão de Farmácia e Terapêutica para monitoramento permanente da Relação Municipal de Medicamentos Essenciais.
                      </p>
                    </div>
                  </label>

                  {/* Item 8 */}
                  <label className="flex items-start gap-3.5 p-3.5 bg-slate-50/60 border border-slate-150 hover:border-slate-350 rounded-2xl cursor-pointer transition-colors block">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded text-violet-600 focus:ring-violet-500 shrink-0 h-4.5 w-4.5"
                      checked={evalItems.hasImplementacaoHorus}
                      onChange={(e) => setEvalItems({ ...evalItems, hasImplementacaoHorus: e.target.checked })}
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 font-display block text-xs">8. Recomendação do Sistema HÓRUS (Ministério da Saúde)</span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Vetor de rastreamento de estoques, acompanhamento de gastos públicos e monitoramento farmacoterapêutico nacional.
                      </p>
                    </div>
                  </label>

                  {/* Item 9 */}
                  <div className="p-3.5 bg-slate-50/60 border border-slate-150 rounded-2xl space-y-3.5">
                    <label className="flex items-start gap-3.5 cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="mt-1 rounded text-violet-600 focus:ring-violet-500 shrink-0 h-4.5 w-4.5"
                        checked={evalItems.hasFragilidadeHospital}
                        onChange={(e) => setEvalItems({ ...evalItems, hasFragilidadeHospital: e.target.checked })}
                      />
                      <div>
                        <span className="font-extrabold text-slate-900 font-display block text-xs">9. Fragilidades Críticas na Farmácia Hospitalar (Portaria MS 2.095/2013)</span>
                        <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                          Ausência de dupla checagem, falta de controle da Portaria 344/1998, falta de POPs, calibragem e fomento à Farmácia Clínica.
                        </p>
                      </div>
                    </label>

                    {evalItems.hasFragilidadeHospital && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 pl-8 pt-1"
                      >
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Lista de Unidades Hospitalares</label>
                          <button
                            type="button"
                            onClick={() => setHospitals([...hospitals, { nome: "" }])}
                            className="inline-flex items-center gap-1 text-[10px] bg-violet-50 border border-violet-200 text-violet-700 px-2 py-1 rounded-md font-bold hover:bg-violet-100 transition-all cursor-pointer"
                          >
                            <Plus className="w-3 h-3" /> Adicionar
                          </button>
                        </div>
                        {hospitals.map((hosp, idx) => (
                          <div key={idx} className="grid grid-cols-[1fr_40px] gap-2 items-end bg-white border border-slate-205 p-2 rounded-xl shadow-2xs">
                            <div>
                              <label className="text-[9px] font-bold text-slate-450 uppercase block mb-1">Nome da Unidade Hospitalar</label>
                              <input
                                type="text"
                                className="w-full bg-slate-50 border border-slate-200 text-xs p-1.5 rounded-lg font-bold"
                                value={hosp.nome}
                                onChange={(e) => {
                                  const next = [...hospitals];
                                  next[idx].nome = e.target.value;
                                  setHospitals(next);
                                }}
                                placeholder="Ex: REGIONAL DE TEFÉ"
                              />
                            </div>
                            <button
                              type="button"
                              disabled={hospitals.length <= 1}
                              onClick={() => {
                                const next = hospitals.filter((_, i) => i !== idx);
                                setHospitals(next);
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-30 disabled:hover:bg-transparent rounded-lg cursor-pointer flex justify-center items-center h-8"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Item 10 */}
                  <label className="flex items-start gap-3.5 p-3.5 bg-slate-50/60 border border-slate-150 hover:border-slate-350 rounded-2xl cursor-pointer transition-colors block">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded text-violet-600 focus:ring-violet-500 shrink-0 h-4.5 w-4.5"
                      checked={evalItems.hasCaronaLicitacao}
                      onChange={(e) => setEvalItems({ ...evalItems, hasCaronaLicitacao: e.target.checked })}
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 font-display block text-xs">10. Recomendação de "Carona" em Licitações (Lei 14.133/2021)</span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Sugestão técnica ao Secretário de Saúde visando economicidade e superação do desabastecimento local crítico de fomento público.
                      </p>
                    </div>
                  </label>

                  {/* Item 11 */}
                  <label className="flex items-start gap-3.5 p-3.5 bg-slate-50/60 border border-slate-150 hover:border-slate-350 rounded-2xl cursor-pointer transition-colors block">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded text-violet-600 focus:ring-violet-500 shrink-0 h-4.5 w-4.5"
                      checked={evalItems.hasVendaSupermercado}
                      onChange={(e) => setEvalItems({ ...evalItems, hasVendaSupermercado: e.target.checked })}
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 font-display block text-xs">11. Comercialização Irregular em Supermercados e Mercados Locais</span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Medicamentos vendidos ao relento sem farmacêutico responsável, gerando alto risco de intoxicações e requerendo acionamento do MP Estadual.
                      </p>
                    </div>
                  </label>

                  {/* Item 12 */}
                  <label className="flex items-start gap-3.5 p-3.5 bg-slate-50/60 border border-slate-150 hover:border-slate-350 rounded-2xl cursor-pointer transition-colors block">
                    <input 
                      type="checkbox" 
                      className="mt-1 rounded text-violet-600 focus:ring-violet-500 shrink-0 h-4.5 w-4.5"
                      checked={evalItems.hasApeloFiscalizacao}
                      onChange={(e) => setEvalItems({ ...evalItems, hasApeloFiscalizacao: e.target.checked })}
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 font-display block text-xs">12. Apelo Final: Intensificação de Fiscalização Continuada pelas Autoridades</span>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Cláusula de encerramento incentivando monitoramento ativo sobre saneamento de desvios e conformidade sanitária regional.
                      </p>
                    </div>
                  </label>
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-bold text-violet-700">
                  {Object.values(evalItems).filter(Boolean).length} cláusulas ativas na Avaliação Geral
                </span>
                <button 
                  onClick={() => setIsEvalModalOpen(false)}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-md active:scale-95 transition-all text-center"
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
