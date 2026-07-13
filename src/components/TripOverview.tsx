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
  Trash2,
  PenSquare,
  Cog
} from "lucide-react";
import { collection, getDocs, doc, getDoc, db } from "../lib/supabase";
import { Estabelecimento, TermoSanitario, EvalItem, EvalVariable, TechnicalResponsible } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { exportMunicipalDocx, exportTravelDocx, exportFullMunicipalDocx } from "../utils/docxExporter";
import { defaultEvaluationItems } from "../lib/defaultEvalItems";
import { defaultEvalVariables } from "../lib/defaultEvalVariables";
import { useLoading } from "../contexts/LoadingContext";

interface TripOverviewProps {
  estabelecimentos: Estabelecimento[];
  termos: TermoSanitario[];
  rts?: TechnicalResponsible[];
}

export default function TripOverview({ estabelecimentos, termos, rts = [] }: TripOverviewProps) {
  const { showLoading, hideLoading } = useLoading();
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [municipalFilter, setMunicipalFilter] = useState<"todos" | "intimados" | "autuados" | "intimados_autuados">("todos");
  const [travelFiscais, setTravelFiscais] = useState<string>("");
  const [travelPeriod, setTravelPeriod] = useState<string>("15/05/2026 a 22/05/2026");
  const [includeClosed, setIncludeClosed] = useState<boolean>(false);
  const [autoCorrectText, setAutoCorrectText] = useState<boolean>(false);
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

  // Helper to calculate acting period based on actual XML records
  const calculatePeriod = React.useCallback((city: string): string => {
    if (!termos || termos.length === 0) return "15/05/2026 a 22/05/2026";
    
    // Filter by city if specified
    const filteredTermos = city && estabelecimentos && estabelecimentos.length > 0
      ? (() => {
          const cityInscricoes = new Set(
            estabelecimentos
              .filter(e => e.cidade.toUpperCase() === city.toUpperCase())
              .map(e => e.inscricao)
          );
          return termos.filter(t => t.estabelecimentoId && cityInscricoes.has(t.estabelecimentoId));
        })()
      : termos;

    let minDate: Date | null = null;
    let maxDate: Date | null = null;

    const targetTermos = filteredTermos.length > 0 ? filteredTermos : termos;

    targetTermos.forEach(t => {
      if (!t.dtInicio || t.dtInicio === "null" || t.dtInicio === "NÃO INFORMADO") return;
      
      const parts = t.dtInicio.trim().split(/\s+/);
      if (parts.length === 0) return;
      
      const datePart = parts[0];
      const dateMatch = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
      if (!dateMatch) return;
      
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1;
      const yearStr = dateMatch[3];
      let year = parseInt(yearStr, 10);
      if (yearStr.length === 2) {
        year += 2000;
      }
      
      let hr = 0, min = 0, sec = 0;
      if (parts.length > 1) {
        const timeMatch = parts[1].match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
        if (timeMatch) {
          hr = parseInt(timeMatch[1], 10);
          min = parseInt(timeMatch[2], 10);
          if (timeMatch[3]) {
            sec = parseInt(timeMatch[3], 10);
          }
        }
      }
      
      const currentDt = new Date(year, month, day, hr, min, sec);
      if (!isNaN(currentDt.getTime())) {
        if (!minDate || currentDt < minDate) {
          minDate = currentDt;
        }
        if (!maxDate || currentDt > maxDate) {
          maxDate = currentDt;
        }
      }
    });

    if (minDate && maxDate) {
      const formatZero = (num: number) => String(num).padStart(2, '0');
      const minStr = `${formatZero((minDate as Date).getDate())}/${formatZero((minDate as Date).getMonth() + 1)}/${(minDate as Date).getFullYear()}`;
      const maxStr = `${formatZero((maxDate as Date).getDate())}/${formatZero((maxDate as Date).getMonth() + 1)}/${(maxDate as Date).getFullYear()}`;
      
      if (minStr === maxStr) {
        return minStr;
      } else {
        return `${minStr} a ${maxStr}`;
      }
    }

    return "15/05/2026 a 22/05/2026";
  }, [termos, estabelecimentos]);

  React.useEffect(() => {
    const period = calculatePeriod(selectedCity);
    setTravelPeriod(period);
  }, [selectedCity, termos, estabelecimentos, calculatePeriod]);

  // Checks if an establishment was found closed
  const isEstabClosed = React.useCallback((e: Estabelecimento) => {
    if (e.encontrava && e.encontrava.toUpperCase() === "FECHADA") return true;
    const t = termos.find(term => term.estabelecimentoId === e.inscricao);
    if (t?.encontrava && t.encontrava.toUpperCase() === "FECHADA") return true;
    return false;
  }, [termos]);

  const visibleEstabelecimentos = React.useMemo(() => {
    return estabelecimentos;
  }, [estabelecimentos]);

  // 3. DA AVALIAÇÃO GERAL Modal & Toggles State
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
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
  const [aiJustifications, setAiJustifications] = useState<Record<string, string>>({});
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const runClientSideAutomark = async (payload: any, apiKeyToUse: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeyToUse}`;
    const prompt = `Você é um assistente analista especializado em fiscalização técnica do CRF/AM.
Sua missão é realizar um cruzamento inteligente de dados de fiscalização para identificar quais critérios de infrações sanitárias ocorreram na cidade.

--- ESTABELECIMENTOS INSPECIONADOS NA CIDADE ---
${JSON.stringify(payload.establishments || [], null, 2)}

--- TERMOS DE VISITA E OBSERVAÇÕES DOS FISCAIS EM CAMPO ---
${JSON.stringify(payload.termos || [], null, 2)}

--- CRITÉRIOS DE AVALIAÇÃO DISPONÍVEIS ---
${JSON.stringify(payload.evalItems.map((item: any) => ({ id: item.id, title: item.title, description: item.description, paragraph: item.paragraph })), null, 2)}

Analise minuciosamente as observações de campo e as informações de presença de Responsável Técnico ("rtPresente": "NÃO" ou similar) para cada critério.
Para critérios genéricos ou padrão como apelos ou parágrafos de conclusão de avaliação que devem sempre constar no relatório, marque como true se eles forem padrão ou se forem de apelo à fiscalização.
Considere termos técnicos equivalentes, sinônimos, e abreviações comuns de fiscalização sanitária brasileira (ex: "AFE", "Alvará", "RDC 44", "Receita controlada", "Portaria 344", "UBS", "Posto de Saúde", "CAF", "CFT", "REMUME", "Lâminas", "Laudos", "Laboratório", "Supermercado").

Determine quais itens de avaliação devem ser marcados (matched: true ou false) e forneça uma justificativa concisa (até 1 frase em português) citando as evidências ou dados específicos do estabelecimento/termo correspondente.
IMPORTANTE: Sempre que citar ou basear a decisão em um estabelecimento específico, inclua obrigatoriamente o seu Nome Fantasia ou Razão Social juntamente com o respectivo CNPJ do estabelecimento no texto da justificativa (exemplo: "Identificada ausência de RT na Farmácia Silva (CNPJ: 12.345.678/0001-90) de acordo com as observações do fiscal.").`;

    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            results: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  id: { type: "STRING", description: "O ID único do item de avaliação correspondente." },
                  matched: { type: "BOOLEAN", description: "Se o critério de infração ou irregularidade foi identificado nos dados." },
                  justification: { type: "STRING", description: "Uma breve explicação de no máximo 1 frase do porquê foi marcado ou não com base nos dados fornecidos." }
                },
                required: ["id", "matched", "justification"]
              }
            }
          },
          required: ["results"]
        }
      }
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errMsg = errorData?.error?.message || `HTTP ${res.status}`;
      throw new Error(`Erro na API direta do Gemini: ${errMsg}`);
    }

    const data = await res.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResponse) {
      throw new Error("Resposta vazia da API do Gemini.");
    }

    try {
      return JSON.parse(textResponse);
    } catch (err) {
      console.error("Failed to parse client-side Gemini response as JSON", textResponse);
      throw new Error("Erro de formatação na resposta da IA.");
    }
  };

  const runClientSideCorrect = async (text: string, apiKeyToUse: string) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKeyToUse}`;
    const prompt = `Você é um corretor ortográfico e gramatical técnico. Corrija o texto abaixo. 
Mantenha a estrutura de parágrafos idêntica. Melhore o espaçamento, pontuação e fluidez se necessário, mas mantenha a integridade do conteúdo legal, técnico e formal.
Não adicione cabeçalhos, introduções ou explicações. Retorne apenas o texto corrigido estruturado.\n\n${text}`;

    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errMsg = errorData?.error?.message || `HTTP ${res.status}`;
      throw new Error(`Erro na API direta do Gemini: ${errMsg}`);
    }

    const data = await res.json();
    const correctedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!correctedText) {
      throw new Error("Resposta vazia da API do Gemini.");
    }

    return correctedText;
  };

  const [dbEvalVariables, setDbEvalVariables] = useState<EvalVariable[]>([]);
  const [dbEvalIntroText, setDbEvalIntroText] = useState<string>("");
  const [customVariablesData, setCustomVariablesData] = useState<Record<string, Record<string, string>[]>>({});
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});

  React.useEffect(() => {
    const fetchDbParams = async () => {
      let itemsQs, varsQs, introDoc, templateVarsQs;
      try {
        itemsQs = await getDocs(collection(db, "evaluation_items"));
      } catch(e) {
        console.error("Error fetching evaluation_items", e);
      }
      
      try {
        varsQs = await getDocs(collection(db, "evaluation_variables"));
      } catch(e) {
        console.error("Error fetching evaluation_variables", e);
      }
      
      try {
        introDoc = await getDoc(doc(db, "evaluation_intro", "default"));
      } catch(e) {
        console.error("Error fetching evaluation_intro", e);
      }

      try {
        templateVarsQs = await getDocs(collection(db, "templateVariables"));
      } catch(e) {
        console.error("Error fetching templateVariables", e);
      }
        
      const list: EvalItem[] = [];
      if (itemsQs) {
        itemsQs.forEach((d) => list.push({ id: d.id, ...d.data() } as EvalItem));
      }
      if (list.length === 0) list.push(...defaultEvaluationItems);
      const sortedList = list.sort((a, b) => (a.order || 0) - (b.order || 0));
      setDbEvalItems(sortedList);

      const varsList: EvalVariable[] = [];
      if (varsQs) {
        varsQs.forEach((d) => varsList.push({ id: d.id, ...d.data() } as EvalVariable));
      }
      if (varsList.length === 0) varsList.push(...defaultEvalVariables);
      setDbEvalVariables(varsList);

      const tVars: Record<string, string> = {};
      if (templateVarsQs) {
        templateVarsQs.forEach(d => {
          const dData = d.data();
          if (dData.name && dData.value !== undefined) {
            tVars[dData.name] = dData.value;
          }
        });
      }
      setTemplateVariables(tVars);

      if (introDoc && introDoc.exists() && introDoc.data().text) {
         setDbEvalIntroText(introDoc.data().text);
      } else {
         setDbEvalIntroText(`Como é sabido, é de competência do Conselho Regional de Farmácia a fiscalização do exercício da profissão farmacêutica no Estado do Amazonas, visando resguardar o cumprimento da legislação vigente e, indiretamente, atuar na promoção da saúde em todo Estado.\n\nNo Município de [MUNICIPIO] foram realizadas [QUANTIDADE_INSPEÇÕES_NO_MUNICIPIO_SELECIONADO] inspeções técnicas em estabelecimentos farmacêuticos privados e assistência pública do SUS, de modo a mensurar a conformidade sanitária nas ações locais.\n\nPor fim, é de fundamental importância que as autoridades sanitárias intensifiquem a fiscalização nos estabelecimentos citados, a fim de coibir as irregularidades sanitárias que podem comprometer a saúde da população e garantir que as normas e regulamentações sejam cumpridas, assegurando a qualidade dos serviços prestados e a segurança dos pacientes.`);
      }

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

    // 1. HIGH-FIDELITY REFINED REGULAR EXPRESSIONS & HEURISTICS
    // 1.1 Ausência de Receituários Especiais
    const lackReceit = (
      hasMatch(/receitu[áa]rio|prescri[çc][ãa]o|notifica[çc][ãa]o\s+de\s+receita|medicamento.*controle\s+especial|portaria\s*344/i) && 
      (hasMatch(/falta|aus[êe]ncia|n[ãa]o\s+fornecido|sem|indispon|n[ãa]o\s+dispon|n[ãa]o\s+possui|ausente/i) || hasMatch(/prefeitura|municipal/i))
    );

    // 1.2 Deficiências em Salas de Injetáveis
    const defInjet = hasMatch(/injet[áa]vel|inje[çc]ao|inje[çc][õo]es|aplica[çc][ãa]o|sala.*aplica[çc][ãa]o|pia|lavagem|lavar.*m[ãa]os|privacidade|RDC\s*44|declara[çc][ãa]o.*servi[çc]o/i);

    // 1.3 Ausência de AFE expedida pela ANVISA e Alvará Sanitário
    const faltaAfe = (
      hasMatch(/AFE|autoriza[çc][ãa]o\s+de\s+funcionamento|alvar[áa]\s+sanit[áa]rio|licen[çc]a\s+sanit[áa]ria|licenciamento|licen[çc]a\s+sanitaria|RDC\s*44\/2009/i) &&
      (hasMatch(/falta|aus[êe]ncia|n[ãa]o\s+possu[íi]|vencid[oa]|sem|irregular|inexist/i) || 
       hasMatch(/sem\s+AFE|n[ãa]o\s+apresentou\s+AFE|sem\s+alvar/i))
    );

    // 1.4 Irregularidades Críticas de Infraestrutura (Laboratório)
    const isLab = cityEstabs.some(e => /laborat[óo]rio|analises.*clinicas/i.test(`${e.fantasia} ${e.razaoSocial} ${e.nomeArea || ""}`));
    const labInfra = isLab || (
      hasMatch(/infiltra[çc][ãa]o|mofo|goteira|reagente|geladeira|temperatura|piso|parede|bancada|equipamento|estufa|centr[íi]fuga|condi[çc][ãa]o\s+inadequada|desorganiza[çc][ãa]o|armazenamento\s+irregular|limpeza/i) && 
      hasMatch(/laborat[óo]rio|fisioterapia|cl[íi]nica/i)
    );

    // 1.5 Leitura de Lâminas por Profissional Não Habilitado (Laboratório)
    const laminas = (
      hasMatch(/l[âa]mina|biom[ée]dic|laudo|em\s+branco|laudos.*assinados|patologia/i) && 
      (hasMatch(/t[ée]cnico|auxiliar|n[ãa]o\s+habilitado|sem\s+presen[çc]a|aus[êe]ncia|sem\s+farmac[êe]utico/i) || 
       cityTermos.some(t => t.rtPresente === "NÃO" && /lamin/i.test(t.obs || "")))
    );

    // 1.6 Ausência de Farmacêutico nas UBS
    const ubsInvolved = hasMatch(/ubs|posto.*sa[úu]de|unidade.*b[áa]sica|caf|central.*abastecimento/i);
    const lackUbs = (
      (ubsInvolved && hasMatch(/falta|aus[êe]ncia|sem\s+farmac[êe]utico|desprovido|sem\s+assist[êe]ncia|assist[êe]ncia\s+farmac[êe]utica|car[êe]ncia/i)) ||
      cityTermos.some(t => t.rtPresente === "NÃO" && /ubs|posto|unidade|saude|caf/i.test(t.obs || ""))
    );

    // 1.7 Orientação para Instituição da CFT e REMUME
    const cftRemume = (
      hasMatch(/cft|remume|comiss[ãa]o.*farm[áa]cia|rela[çc][ãa]o.*medicamento|padroniza[çc][ãa]o|sele[çc][ãa]o/i) ||
      (ubsInvolved && !hasMatch(/comiss[ãa]o.*terap[êe]utica|cft\s+ativa/i))
    );

    // 1.8 Sugestão de Implementação do Sistema HÓRUS
    const horus = hasMatch(/h[óo]rus|horus|sistema.*h[óo]rus|informatiza[çc][ãa]o|controle\s+de\s+estoque|rastreabilidade/i);

    // 1.9 Fragilidades na Rotina da farmácia Hospitalar
    const containsHospital = cityEstabs.some(e => /hospital|maternidade/i.test(`${e.fantasia} ${e.razaoSocial}`));
    const hospitalFragil = containsHospital || (
      hasMatch(/dupla\s+chegagem|seguran[çc]a\s+do\s+paciente|concilia[çc][ãa]o\s+medicamentosa|fracionamento|quantitativo.*insuficiente/i) ||
      cityTermos.some(t => t.rtPresente === "NÃO" && /hospital/i.test(t.obs || ""))
    );

    // 1.10 Recomendação de Adesão/Caronas em Licitações
    const carona = hasMatch(/carona|licita[çc][ãa]o|preg[ãa]o|preg[oõ]es|Lei\s*14\.133|economicidade|desabastecimento|comprar|aquisi[çc][ãa]o|secret[áa]rio/i);

    // 1.11 Venda Irregular de Medicamentos em Supermercados
    const vendaMercado = (
      cityEstabs.some(e => /supermercado|mercado|mercearia|kitanda/i.test(`${e.fantasia} ${e.razaoSocial} ${e.nomeArea || ""}`)) ||
      hasMatch(/venda\s+irregular|venda.*supermercado|exposto\s+a\s+venda|comercializa[çc][ãa]o\s+de\s+medicamento|venda.*g[êe]neros\s+aliment[íi]cios/i)
    );

    // Apply standard labs and hospital state setters
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

    // 2. DYNAMIC MATCHER FOR EXTRA/CUSTOM DB ITEMS
    const getDynamicMatch = (itemTitle: string, itemDescription: string, itemParagraph: string) => {
      const combinedText = `${itemTitle} ${itemDescription || ""} ${itemParagraph || ""}`.toLowerCase();
      
      const stopWords = new Set([
        "para", "como", "esta", "com", "uma", "uns", "pela", "pelo", "onde", "dentro", "sobre", "entre", "algum", 
        "seria", "mais", "fiel", "possivel", "pelas", "pelos", "este", "estes", "esta", "estas", "tudo", "todo", 
        "todos", "cada", "deve", "devem", "geral", "específica", "qualquer", "alguma", "algumas", "alguns", 
        "outra", "outras", "outro", "outros", "através", "conforme", "diante", "desde", "pode", "podem", "sem", "não", "nas"
      ]);
      
      const words = combinedText
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // remove diacritics
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length >= 4 && !stopWords.has(w));

      if (words.length === 0) return false;

      let matchCount = 0;
      const uniqueWords = Array.from(new Set(words));
      
      const obsTexts = cityTermos
        .map(t => (t.obs || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
        .join(" ");

      const estabTexts = cityEstabs
        .map(e => `${e.fantasia} ${e.razaoSocial} ${e.nomeArea || ""}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
        .join(" ");

      const searchTargetText = `${obsTexts} ${estabTexts}`;

      uniqueWords.forEach(word => {
        if (searchTargetText.includes(word)) {
          matchCount++;
        }
      });

      // Threshold is 25% of unique key words or minimum 2 matched words
      const threshold = Math.min(2, Math.ceil(uniqueWords.length * 0.25));
      return matchCount >= threshold;
    };

    // 3. SEMANTIC ROUTER FOR DB-LOADED ITEMS
    const findRefinedMatch = (item: any) => {
      const id = (item.id || "").toLowerCase();
      const title = (item.title || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const desc = (item.description || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const para = (item.paragraph || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const combined = `${id} ${title} ${desc} ${para}`;

      // 3.1 Receita / Receituários
      if (combined.includes("receit") || combined.includes("prescri") || combined.includes("notificac") || combined.includes("controle especial") || combined.includes("portaria 344") || id === "hasfaltareceituario") {
        return lackReceit;
      }
      // 3.2 Injetáveis / Aplicação
      if (combined.includes("injet") || combined.includes("sala") || combined.includes("aplica") || combined.includes("inje") || combined.includes("rdc 44") || combined.includes("rdc44") || id === "hasdeficienciainjetaveis") {
        return defInjet;
      }
      // 3.3 AFE / Alvará Sanitário / Licença
      if (combined.includes("afe") || combined.includes("alvara") || combined.includes("licen") || combined.includes("autorizac") || combined.includes("anvisa") || id === "hasfaltaafealvarares") {
        return faltaAfe;
      }
      // 3.4 Laboratório / Infraestrutura
      if (id === "hasirregularidadelabinfra" || (combined.includes("laborat") && (combined.includes("infra") || combined.includes("estrut") || combined.includes("conser") || combined.includes("mofo") || combined.includes("reagent") || combined.includes("geladeir")))) {
        return labInfra;
      }
      // 3.5 Lâminas (Leitura por leigo)
      if (combined.includes("lamina") || combined.includes("laudo") || combined.includes("biomed") || combined.includes("patolog") || id === "hasleituralaminassemfarmac") {
        return laminas;
      }
      // 3.6 Farmacêutico nas UBS
      if (combined.includes("ubs") || combined.includes("posto") || combined.includes("unidade basica") || combined.includes("central de abastecimento") || combined.includes("caf") || id === "hasfaltafarmacubs") {
        return lackUbs;
      }
      // 3.7 CFT / REMUME
      if (combined.includes("cft") || combined.includes("remume") || combined.includes("comiss") || combined.includes("terapeut") || combined.includes("padronizac") || id === "hasorientacaocftremume") {
        return cftRemume;
      }
      // 3.8 HÓRUS
      if (combined.includes("horus") || combined.includes("sist") || id === "hasimplementacaohorus") {
        return horus;
      }
      // 3.9 Hospital / Farmácia Hospitalar
      if (combined.includes("hospital") || combined.includes("matern") || combined.includes("fracion") || combined.includes("dupla ch") || id === "hasfragilidadehospital") {
        return hospitalFragil;
      }
      // 3.10 Carona / Licitações
      if (combined.includes("carona") || combined.includes("licit") || combined.includes("pregao") || combined.includes("lei 14.133") || combined.includes("lei 14133") || id === "hascaronalicitacao") {
        return carona;
      }
      // 3.11 Supermercado / Venda Irregular
      if (combined.includes("supermerc") || combined.includes("mercado") || combined.includes("mercear") || combined.includes("kitand") || combined.includes("alimen") || combined.includes("venda irregular") || id === "hasvendasupermercado") {
        return vendaMercado;
      }
      // 3.12 Apelo
      if (combined.includes("apelo") || combined.includes("fiscalizac") || id === "hasapelofiscalizacao") {
        return true;
      }

      // Default fallback: use the dynamic text overlap matcher!
      return getDynamicMatch(item.title || "", item.description || "", item.paragraph || "");
    };

    const newEvals: Record<string, boolean> = {};
    dbEvalItems.forEach(item => {
      newEvals[item.id] = item.defaultChecked || findRefinedMatch(item);
    });

    setEvalItems(newEvals);
  };

  const runAiAutomark = async (targetCity?: string) => {
    const city = targetCity || selectedCity;
    if (!city) return;
    setIsAiLoading(true);
    setAiError(null);
    try {
      const cityEstabs = visibleEstabelecimentos.filter(e => e.cidade.toUpperCase() === city.toUpperCase());
      const estabIds = cityEstabs.map(e => e.inscricao);
      const cityTermos = termos.filter(t => estabIds.includes(t.estabelecimentoId));

      const payload = {
        establishments: cityEstabs.map(e => ({
          inscricao: e.inscricao,
          fantasia: e.fantasia,
          razaoSocial: e.razaoSocial,
          cnpj: e.cnpj,
          nomeArea: e.nomeArea,
          cidade: e.cidade
        })),
        termos: cityTermos.map(t => ({
          estabelecimentoId: t.estabelecimentoId,
          obs: t.obs,
          rtPresente: t.rtPresente
        })),
        evalItems: dbEvalItems.map(item => ({
          id: item.id,
          title: item.title,
          description: item.description,
          paragraph: item.paragraph
        }))
      };

      let data;
      let useClientFallback = false;
      const appKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || "";
      const isStaticEnv = window.location.hostname.includes("github.io") || window.location.hostname.includes("github.preview");

      if (isStaticEnv && appKey) {
        useClientFallback = true;
      }

      if (!useClientFallback) {
        try {
          const response = await fetch("/api/gemini/automark", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

          if (response.ok) {
            data = await response.json();
          } else {
            if (appKey) {
              useClientFallback = true;
            } else {
              throw new Error("O servidor de IA está indisponível e nenhuma chave oculta da aplicação foi configurada.");
            }
          }
        } catch (serverErr: any) {
          console.warn("Server call failed, attempting client fallback", serverErr);
          if (appKey) {
            useClientFallback = true;
          } else {
            throw serverErr;
          }
        }
      }

      if (useClientFallback) {
        if (!appKey) {
          throw new Error("Chave de API do Gemini não configurada na aplicação (VITE_GEMINI_API_KEY ausente).");
        }
        data = await runClientSideAutomark(payload, appKey);
      }

      if (data && Array.isArray(data.results)) {
        setEvalItems(prev => {
          const next = { ...prev };
          data.results.forEach((res: { id: string; matched: boolean }) => {
            next[res.id] = res.matched;
          });
          return next;
        });

        setAiJustifications(prev => {
          const next = { ...prev };
          data.results.forEach((res: { id: string; justification: string }) => {
            next[res.id] = res.justification;
          });
          return next;
        });
      }
    } catch (err: any) {
      console.error("AI AutoMark failed:", err);
      setAiError(err.message || "Erro desconhecido ao executar IA");
    } finally {
      setIsAiLoading(false);
    }
  };

  const clearGeneralEvaluation = () => {
    const cleared: Record<string, boolean> = {};
    dbEvalItems.forEach(item => {
      if (item.isHidden && item.defaultChecked) {
        cleared[item.id] = true;
      } else if (item.isHidden) {
        cleared[item.id] = !!evalItems[item.id];
      } else {
        cleared[item.id] = false;
      }
    });
    setEvalItems(cleared);
    setAutoMarkActive(false);
    setCustomVariablesData({});
    setLabsInfra([]);
    setLabsLaminas([]);
    setHospitals([]);
    setAiJustifications({});
  };

  const handleSelectCity = (city: string) => {
    setSelectedCity(city);
    clearGeneralEvaluation();
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

  React.useEffect(() => {
    if (selectedCity && autoMarkActive && dbEvalItems.length > 0) {
      autoMarkFromXml();
      runAiAutomark(selectedCity);
    }
  }, [selectedCity, autoMarkActive, dbEvalItems]);

  // Aggregate stats per city
  const citySummaries = React.useMemo(() => uniqueCities.map(city => {
    const cityEstabs = visibleEstabelecimentos.filter(e => e.cidade.toUpperCase() === city);
    const estabIds = cityEstabs.map(e => e.inscricao);
    const cityTermos = termos.filter(t => estabIds.includes(t.estabelecimentoId));

    const totalInspecoes = cityTermos.length;
    const totalIntimacoes = cityTermos.filter(t => t.nrSeqIntimacao && t.nrSeqIntimacao !== "null").length;
    const totalAutos = cityTermos.filter(t => t.nrSeqAuto && t.nrSeqAuto !== "null").length;
    const novos = cityEstabs.filter(e => e.inscricao.toUpperCase().includes("I")).length;
    const fechadas = cityEstabs.filter(e => isEstabClosed(e)).length;

    return {
      cidade: city,
      inspecoes: totalInspecoes,
      intimacoes: totalIntimacoes,
      autos: totalAutos,
      novos,
      fechadas,
      estabelecimentos: cityEstabs
    };
  }), [uniqueCities, visibleEstabelecimentos, termos, isEstabClosed]);

  const activeSum = citySummaries.find(s => s.cidade === selectedCity);
  const cityEstabs = activeSum ? activeSum.estabelecimentos : [];

  // Dynaimc text compiled based on checkboxes status
  const getCompiledEvaluationText = (targetEstabs: Estabelecimento[] = cityEstabs) => {
    const paragraphs: string[] = [];

    // Base Intro
    let finalIntro = dbEvalIntroText;
    
    const cityInscricoesWhole = new Set(estabelecimentos.filter(e => e.cidade.toUpperCase() === selectedCity.toUpperCase()).map(e => e.inscricao));
    const totalInspecoesWhole = termos.filter(t => t.estabelecimentoId && cityInscricoesWhole.has(t.estabelecimentoId)).length;
    const totalAutosWhole = termos.filter(t => t.estabelecimentoId && cityInscricoesWhole.has(t.estabelecimentoId) && t.nrSeqAuto && t.nrSeqAuto !== "null" && t.nrSeqAuto.trim() !== "").length;

    const pharmacistsInCity = rts.filter(rt => rt.estabelecimentoId && cityInscricoesWhole.has(rt.estabelecimentoId) && rt.nome && rt.nome !== "null");
    const uniquePharNames = new Set(pharmacistsInCity.map(rt => rt.nome.trim().toUpperCase()));
    const qtdFarmaceutico = uniquePharNames.size;

    finalIntro = finalIntro.replace(/\[MUNICIPIO\]/g, selectedCity.toUpperCase());
    finalIntro = finalIntro.replace(/\[QUANTIDADE_INSPEÇÕES_NO_MUNICIPIO_SELECIONADO\]/g, totalInspecoesWhole.toString());
    finalIntro = finalIntro.replace(/\[QUANTIDADE_INSPECOES_NO_MUNICIPIO_SELECIONADO\]/g, totalInspecoesWhole.toString());
    finalIntro = finalIntro.replace(/\[QDT_AUTOS_DE_INFRACAO_MUNIC_SELC\]/g, totalAutosWhole.toString());
    finalIntro = finalIntro.replace(/\[QTD_AUTOS_DE_INFRACAO_MUNIC_SELC\]/g, totalAutosWhole.toString());
    finalIntro = finalIntro.replace(/\[QTD_FARMACEUTICO\]/g, qtdFarmaceutico.toString());
    finalIntro = finalIntro.replace(/\[PERIODO_DE_FISCALIZAÇÃO\]/g, calculatePeriod(selectedCity));
    finalIntro = finalIntro.replace(/\[PERIODO_DE_FISCALIZACAO\]/g, calculatePeriod(selectedCity));
    finalIntro = finalIntro.replace(/\[PERIODO_VIAGEM\]/g, calculatePeriod(selectedCity));

    paragraphs.push(finalIntro);

    const formattedLabsInfra = labsInfra.map(l => `Laboratório ${l.nome.toUpperCase()} (CNPJ ${l.cnpj})`).join(", ");
    const formattedLabsLaminas = labsLaminas.map(l => `Laboratório ${l.nome.toUpperCase()}`).join(", ");
    const formattedHospitals = hospitals.map(h => `Unidade Hospitalar de ${h.nome.toUpperCase()}`).join(" e ");
    
    // Group into categories
    const baseCategories = [
      { id: "farmacias", titleBase: "FARMÁCIAS E DROGARIAS" },
      { id: "laboratorios", titleBase: "LABORATÓRIOS" },
      { id: "farmacia_hospitalar", titleBase: "FARMÁCIA HOSPITALAR" },
      { id: "remume", titleBase: "REMUME, CFT E GOVERNANÇA DA ASSISTÊNCIA FARMACÊUTICA" },
      { id: "outras_irregularidades", titleBase: "OUTRAS IRREGULARIDADES SANITÁRIAS RELEVANTES" },
      { id: "conclusao_especifica", titleBase: "DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO" }
    ];

    let subIndex = 1;

    baseCategories.forEach(cat => {
      const isConclusao = cat.id === "conclusao_especifica";
      const catItems = dbEvalItems.filter(item => (item.category === cat.id) || (!item.category && cat.id === "farmacias"))
        .filter(item => evalItems[item.id]);

      if (catItems.length > 0) {
        if (isConclusao) {
           paragraphs.push(`**4. ${cat.titleBase}**`);
        } else {
           paragraphs.push(`**3.${subIndex} ${cat.titleBase}**`);
           subIndex++;
        }
        
        catItems.forEach(item => {
           let p = item.paragraph;
           p = p.replace(/\[LABS_INFRA\]/g, formattedLabsInfra);
           p = p.replace(/\[LABS_LAMINAS\]/g, formattedLabsLaminas);
           p = p.replace(/\[HOSPITAIS\]/g, formattedHospitals);
           
           // Process Custom Variables (Text & Tables)
           dbEvalVariables.forEach(v => {
              if (v.type === "condition") return;
              const regex = new RegExp(`\\\[${v.id}\\\]`, 'g');
              if (p.match(regex)) {
                 const valuesList = customVariablesData[v.id] || [];
                 const formattedV = valuesList.map(record => {
                    if (v.type === "text") {
                       return record[v.fields[0]?.key || "val"] || "";
                    }
                    let fp = v.formatPattern || "";
                    (v.fields || []).forEach(f => {
                       const key = `{${f.key}}`;
                       const val = record[f.key] || "";
                       fp = fp.split(key).join(val);
                    });
                    return fp;
                 }).join(", ");
                 p = p.replace(regex, formattedV);
              }
           });
           
           // Process Conditions
           dbEvalVariables.forEach(v => {
              if (v.type !== "condition") return;
              const regex = new RegExp(`\\\[${v.id}\\\]`, 'g');
              if (p.match(regex)) {
                 // Evaluate Condition
                 let refValueText = "";
                 const refVarId = (v.conditionRefVar || "").replace(/[\[\]]/g, "").trim();
                 
                 // System variables
                 if (refVarId === "MUNICIPIO") refValueText = selectedCity.toUpperCase();
                 else if (refVarId === "QUANTIDADE_INSPEÇÕES_NO_MUNICIPIO_SELECIONADO" || refVarId.includes("INSPECOES")) refValueText = totalInspecoesWhole.toString();
                 else if (refVarId === "QDT_AUTOS_DE_INFRACAO_MUNIC_SELC" || refVarId.includes("AUTOS")) {
                    refValueText = totalAutosWhole.toString();
                 }
                 else if (refVarId === "QTD_FARMACEUTICO") {
                    const cityInscricoesWholeFl = new Set(estabelecimentos.filter(e => e.cidade.toUpperCase() === selectedCity.toUpperCase()).map(e => e.inscricao));
                    const pharmacistsInCityFl = rts.filter(rt => rt.estabelecimentoId && cityInscricoesWholeFl.has(rt.estabelecimentoId) && rt.nome && rt.nome !== "null");
                    const uniquePharNamesFl = new Set(pharmacistsInCityFl.map(rt => rt.nome.trim().toUpperCase()));
                    refValueText = uniquePharNamesFl.size.toString();
                 }
                 else if (refVarId) {
                    const refVDef = dbEvalVariables.find(d => d.id === refVarId);
                    if (refVDef && refVDef.type === "text") {
                       refValueText = customVariablesData[refVarId]?.[0]?.[refVDef.fields[0]?.key || "val"] || "";
                    } else if (refVDef) {
                       refValueText = (customVariablesData[refVarId] || []).length.toString();
                    } else {
                       refValueText = "";
                    }
                 }
                 
                 let evalResult = false;
                 const target = (v.conditionTargetValue || "").trim();
                 let numRef = parseFloat(refValueText);
                 let numTarget = parseFloat(target);
                 
                 if (v.conditionOperator === "greater_than") {
                    evalResult = !isNaN(numRef) && !isNaN(numTarget) ? numRef > numTarget : refValueText > target;
                 } else if (v.conditionOperator === "less_than") {
                    evalResult = !isNaN(numRef) && !isNaN(numTarget) ? numRef < numTarget : refValueText < target;
                 } else if (v.conditionOperator === "greater_equals") {
                    evalResult = !isNaN(numRef) && !isNaN(numTarget) ? numRef >= numTarget : refValueText >= target;
                 } else if (v.conditionOperator === "less_equals") {
                    evalResult = !isNaN(numRef) && !isNaN(numTarget) ? numRef <= numTarget : refValueText <= target;
                 } else if (v.conditionOperator === "not_equals") {
                    evalResult = refValueText.toString().toLowerCase() !== target.toLowerCase();
                 } else { // equals
                    evalResult = refValueText.toString().toLowerCase() === target.toLowerCase();
                 }
                 
                 const replacementText = evalResult ? (v.conditionTrueText || "") : (v.conditionFalseText || "");
                 p = p.replace(regex, replacementText);
              }
           });
           
           paragraphs.push(p);
        });
      }
    });

    let joined = paragraphs.join("\n\n");
    
    // Also process conditions inside `finalIntro` before returning, but we already added finalIntro to paragraphs!
    // Wait, the variables inside finalIntro were not processed by the condition loop because it was pushed at index 0.
    // Let's re-run condition loop over the entire `joined` text just to be safe!
    let keepRunning = true;
    let iter = 0;
    while(keepRunning && iter < 5) {
       keepRunning = false;
       iter++;
       dbEvalVariables.forEach(v => {
          if (v.type !== "condition") return;
          const regex = new RegExp(`\\\[${v.id}\\\]`, 'g');
          if (joined.match(regex)) {
             keepRunning = true;
             let refValueText = "";
             const refVarId = (v.conditionRefVar || "").replace(/[\[\]]/g, "").trim();
             
             if (refVarId === "MUNICIPIO") refValueText = selectedCity.toUpperCase();
             else if (refVarId === "QUANTIDADE_INSPEÇÕES_NO_MUNICIPIO_SELECIONADO" || refVarId.includes("INSPECOES")) refValueText = totalInspecoesWhole.toString();
             else if (refVarId === "QDT_AUTOS_DE_INFRACAO_MUNIC_SELC" || refVarId.includes("AUTOS")) {
                refValueText = totalAutosWhole.toString();
             }
             else if (refVarId === "QTD_FARMACEUTICO") {
                const cityInscricoesWholeFl = new Set(estabelecimentos.filter(e => e.cidade.toUpperCase() === selectedCity.toUpperCase()).map(e => e.inscricao));
                const pharmacistsInCityFl = rts.filter(rt => rt.estabelecimentoId && cityInscricoesWholeFl.has(rt.estabelecimentoId) && rt.nome && rt.nome !== "null");
                const uniquePharNamesFl = new Set(pharmacistsInCityFl.map(rt => rt.nome.trim().toUpperCase()));
                refValueText = uniquePharNamesFl.size.toString();
             }
             else if (refVarId) {
                const refVDef = dbEvalVariables.find(d => d.id === refVarId);
                if (refVDef && refVDef.type === "text") {
                   refValueText = customVariablesData[refVarId]?.[0]?.[refVDef.fields[0]?.key || "val"] || "";
                } else if (refVDef) {
                   refValueText = (customVariablesData[refVarId] || []).length.toString();
                } else {
                   refValueText = "";
                }
             }
             
             let evalResult = false;
             const target = (v.conditionTargetValue || "").trim();
             let numRef = parseFloat(refValueText);
             let numTarget = parseFloat(target);
             
             if (v.conditionOperator === "greater_than") {
                evalResult = !isNaN(numRef) && !isNaN(numTarget) ? numRef > numTarget : refValueText > target;
             } else if (v.conditionOperator === "less_than") {
                evalResult = !isNaN(numRef) && !isNaN(numTarget) ? numRef < numTarget : refValueText < target;
             } else if (v.conditionOperator === "greater_equals") {
                evalResult = !isNaN(numRef) && !isNaN(numTarget) ? numRef >= numTarget : refValueText >= target;
             } else if (v.conditionOperator === "less_equals") {
                evalResult = !isNaN(numRef) && !isNaN(numTarget) ? numRef <= numTarget : refValueText <= target;
             } else if (v.conditionOperator === "not_equals") {
                evalResult = refValueText.toString().toLowerCase() !== target.toLowerCase();
             } else { // equals
                evalResult = refValueText.toString().toLowerCase() === target.toLowerCase();
             }
             
             const replacementText = evalResult ? (v.conditionTrueText || "") : (v.conditionFalseText || "");
             joined = joined.replace(regex, replacementText);
          }
       });
    }
    
    // Process text Variables for joined text as well
    dbEvalVariables.forEach(v => {
       if (v.type === "condition") return;
       const regex = new RegExp(`\\\[${v.id}\\\]`, 'g');
       if (joined.match(regex)) {
          const valuesList = customVariablesData[v.id] || [];
          const formattedV = valuesList.map(record => {
             if (v.type === "text") {
                return record[v.fields[0]?.key || "val"] || "";
             }
             let fp = v.formatPattern || "";
             (v.fields || []).forEach(f => {
                const key = `{${f.key}}`;
                const val = record[f.key] || "";
                fp = fp.split(key).join(val);
             });
             return fp;
          }).join(", ");
          joined = joined.replace(regex, formattedV);
       }
    });

    const fiscalNames = travelFiscais.split(" / ");
    fiscalNames.forEach((name, i) => {
       const regex = new RegExp(`\\\[NOME_FISCAL${i + 1}\\\]`, 'g');
       joined = joined.replace(regex, name.trim());
    });
    joined = joined.replace(/\[PERIODO_DE_FISCALIZAÇÃO\]/g, travelPeriod || "NÃO INFORMADO");
    joined = joined.replace(/\[QTD_FARMACEUTICO\]/g, qtdFarmaceutico.toString());

    // Process admin template variables (like [NOME_GESTOR], [CARGO_GESTOR], etc.)
    Object.keys(templateVariables).forEach(key => {
       const regex = new RegExp(`\\\[${key}\\\]`, 'g');
       if (joined.match(regex)) {
          let text = templateVariables[key] || "";
          // Replace nested tags inside template variables
          const dateFormatted = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
          text = text.replace(/<cidade>/gi, selectedCity || "")
                     .replace(/<municipio>/gi, selectedCity || "")
                     .replace(/\[CIDADE\]/gi, selectedCity || "")
                     .replace(/\[MUNICIPIO\]/gi, selectedCity || "")
                     .replace(/<fiscal>/gi, travelFiscais || "")
                     .replace(/<inspetor>/gi, travelFiscais || "")
                     .replace(/\[NOME_FISCAL\]/gi, travelFiscais || "")
                     .replace(/<data>/gi, dateFormatted)
                     .replace(/\[DATA\]/gi, dateFormatted)
                     .replace(/<dados>/gi, dateFormatted)
                     .replace(/\[DADOS\]/gi, dateFormatted)
                     .replace(/\[PERIODO_DE_FISCALIZAÇÃO\]/gi, travelPeriod || "NÃO INFORMADO");
          joined = joined.replace(regex, text);
       }
    });

    return joined;
  };

  const downloadMunicipalReport = async () => {
    if (!selectedCity) return;
    
    // Filter establishments in this city
    const filteredEstabs = cityEstabs.filter(e => {
      if (!includeClosed && isEstabClosed(e)) return false;
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

    let compiledText = getCompiledEvaluationText(filteredEstabs);
    
    if (autoCorrectText) {
      showLoading("Revisando texto com IA (Isso pode demorar alguns segundos)...");
      try {
        let correctedText = null;
        let useClientFallback = false;
        const appKey = ((import.meta as any).env?.VITE_GEMINI_API_KEY as string) || "";
        const isStaticEnv = window.location.hostname.includes("github.io") || window.location.hostname.includes("github.preview");

        if (isStaticEnv && appKey) {
          useClientFallback = true;
        }

        if (!useClientFallback) {
          try {
            const response = await fetch("/api/gemini/correct", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: compiledText })
            });
            if (response.ok) {
              const data = await response.json();
              if (data.correctedText) correctedText = data.correctedText;
            } else if (appKey) {
              useClientFallback = true;
            } else {
              console.error("Falha ao corrigir com IA");
            }
          } catch (serverErr) {
            console.warn("Server correction failed, trying client fallback", serverErr);
            if (appKey) {
              useClientFallback = true;
            } else {
              console.error("Failed to auto-correct text", serverErr);
            }
          }
        }

        if (useClientFallback) {
          if (appKey) {
            correctedText = await runClientSideCorrect(compiledText, appKey);
          }
        }

        if (correctedText) {
          compiledText = correctedText;
        }
      } catch (err) {
        console.error("Failed to auto-correct text with fallback", err);
      }
    }

    showLoading("Gerando documento...");
    try {
      const cityInscricoesWhole = new Set(estabelecimentos.filter(e => e.cidade.toUpperCase() === selectedCity.toUpperCase()).map(e => e.inscricao));
      const totalInspecoes = termos.filter(t => t.estabelecimentoId && cityInscricoesWhole.has(t.estabelecimentoId)).length;
      const totalAutos = termos.filter(t => t.estabelecimentoId && cityInscricoesWhole.has(t.estabelecimentoId) && t.nrSeqAuto && t.nrSeqAuto !== "null" && t.nrSeqAuto.trim() !== "").length;

      await exportMunicipalDocx(`Relatorio_Municipal_${selectedCity.toUpperCase()}`, {
        selectedCity,
        filterLabel: filterLabels[municipalFilter],
        filteredEstabs,
        termos,
        customAvaliacaoGeralText: compiledText,
        dateFormat,
        travelPeriod: calculatePeriod(selectedCity),
        travelFiscais,
        totalInspecoes,
        totalAutos
      });
    } catch(e) {
      console.error(e);
      console.error("Erro ao exportar");
    } finally {
      hideLoading();
    }
  };

  const downloadFullMunicipalReport = async () => {
    if (!selectedCity) return;
    
    // Filter establishments in this city
    const filteredEstabs = cityEstabs.filter(e => {
      if (!includeClosed && isEstabClosed(e)) return false;
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

    const compiledText = getCompiledEvaluationText(filteredEstabs);
    
    showLoading("Gerando documento, por favor aguarde...");
    try {
      const cityInscricoesWhole = new Set(estabelecimentos.filter(e => e.cidade.toUpperCase() === selectedCity.toUpperCase()).map(e => e.inscricao));
      const totalInspecoes = termos.filter(t => t.estabelecimentoId && cityInscricoesWhole.has(t.estabelecimentoId)).length;
      const totalAutos = termos.filter(t => t.estabelecimentoId && cityInscricoesWhole.has(t.estabelecimentoId) && t.nrSeqAuto && t.nrSeqAuto !== "null" && t.nrSeqAuto.trim() !== "").length;

      await exportFullMunicipalDocx(`Relatorio_Completo_${selectedCity.toUpperCase()}`, {
        selectedCity,
        filterLabel: filterLabels[municipalFilter],
        filteredEstabs,
        termos,
        customAvaliacaoGeralText: compiledText,
        dateFormat,
        travelPeriod: calculatePeriod(selectedCity),
        totalInspecoes,
        totalAutos
      }, travelFiscais);
    } catch (err) {
      console.error(err);
      console.error("Ocorreu um erro ao gerar o arquivo. Verifique o console.");
    } finally {
      hideLoading();
    }
  };

  const downloadTravelSummary = async () => {
    // Generate filtered establishments based on includeClosed flag for each city inside travel summary
    const filteredCitySummaries = citySummaries.map(sum => {
      const filteredEsts = sum.estabelecimentos.filter(e => includeClosed || !isEstabClosed(e));
      const filteredIds = filteredEsts.map(e => e.inscricao);
      const filteredCityTermos = termos.filter(t => filteredIds.includes(t.estabelecimentoId));
      
      const totalInspecoes = filteredCityTermos.length;
      const totalIntimacoes = filteredCityTermos.filter(t => t.nrSeqIntimacao && t.nrSeqIntimacao !== "null").length;
      const totalAutos = filteredCityTermos.filter(t => t.nrSeqAuto && t.nrSeqAuto !== "null").length;
      const novos = filteredEsts.filter(e => e.inscricao.toUpperCase().includes("I")).length;

      return {
        ...sum,
        inspecoes: totalInspecoes,
        intimacoes: totalIntimacoes,
        autos: totalAutos,
        novos,
        estabelecimentos: filteredEsts
      };
    });

    const totalTermos = filteredCitySummaries.reduce((acc, s) => acc + s.inspecoes, 0);
    
    const countFiscalizados = totalTermos;
    const countIntimados = filteredCitySummaries.reduce((acc, s) => acc + s.intimacoes, 0);
    const countAutuados = filteredCitySummaries.reduce((acc, s) => acc + s.autos, 0);
    const countNovos = filteredCitySummaries.reduce((acc, s) => acc + s.novos, 0);

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
        citySummaries: filteredCitySummaries
      });
    } catch(e) {
      console.error(e);
      console.error("Erro ao exportar");
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
              onClick={() => handleSelectCity(sum.cidade)}
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

                {/* Fechadas */}
                <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-2xl flex flex-col justify-between col-span-2">
                  <span className="block font-extrabold text-slate-400 uppercase tracking-wider text-[8px]">Fechadas</span>
                  <span className="font-mono font-black text-base text-slate-600 block mt-1">{sum.fechadas}</span>
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

              {/* Opção: Corrigir Texto Automático com IA */}
              <label className="bg-gradient-to-r from-violet-50 to-fuchsia-50 border-2 border-violet-200 hover:border-violet-300 shadow-sm rounded-2xl p-4 flex items-center justify-between gap-4 cursor-pointer transition-all">
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={autoCorrectText} 
                  onChange={() => setAutoCorrectText(!autoCorrectText)} 
                />
                <div className="space-y-1">
                  <span className="text-sm font-extrabold text-violet-900 uppercase tracking-widest block font-display flex items-center gap-1.5">
                    ✨ Corrigir Texto Automático
                  </span>
                  <p className="text-xs text-violet-600/80 font-medium leading-relaxed">
                    Faz uma varredura com Inteligência Artificial no relatório gerado corrigindo a ortografia, espaçamento e pontuação.
                  </p>
                </div>
                <div
                  className={`w-14 h-7 rounded-full transition-all duration-300 ease-in-out relative flex items-center shrink-0 border-2 ${
                    autoCorrectText ? "bg-violet-600 border-violet-600" : "bg-white border-violet-300"
                  }`}
                >
                  <span
                    className={`absolute bg-white w-5 h-5 rounded-full transition-transform duration-300 shadow-sm ${
                      autoCorrectText ? "translate-x-7" : "translate-x-1"
                    } ${!autoCorrectText && 'bg-violet-200'}`}
                  />
                </div>
              </label>

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
                <div className="bg-violet-50/50 border border-violet-150 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4.5 h-4.5 text-violet-600 animate-pulse shrink-0" />
                        <span className="text-sm font-extrabold text-violet-950 uppercase tracking-wider block font-display">Marcar Automaticamente (IA e Heurística)</span>
                      </div>
                      <p className="text-sm text-slate-500 font-medium leading-relaxed max-w-lg">
                        Cruza os dados de vistorias técnicas e observações de campo deste polo. Combina regras heurísticas rápidas com análise de IA avançada.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newState = !autoMarkActive;
                        setAutoMarkActive(newState);
                        if (newState) {
                          autoMarkFromXml();
                          runAiAutomark();
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

                  {autoMarkActive && (
                    <div className="space-y-4 pt-3 border-t border-violet-100">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          {isAiLoading ? (
                            <span className="flex items-center gap-1.5 text-violet-700 font-bold animate-pulse">
                              <span className="inline-block w-2 h-2 rounded-full bg-violet-600 animate-ping" />
                              Análise Avançada de IA em andamento...
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                              Análise refinada com IA concluída com sucesso!
                            </span>
                          )}
                          {aiError && (
                            <span className="text-rose-600 font-bold">
                              (Erro: {aiError})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={isAiLoading}
                          onClick={() => runAiAutomark()}
                          className="bg-white border border-violet-200 text-violet-700 px-3 py-1.5 rounded-lg font-bold hover:bg-violet-50 hover:border-violet-300 transition-all shadow-3xs disabled:opacity-50 cursor-pointer text-xs"
                        >
                          {isAiLoading ? "Processando..." : "Reforçar Análise de IA ✨"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Dynamically Fetched Items from Firestore */}
                  {["farmacias", "laboratorios", "farmacia_hospitalar", "remume", "outras_irregularidades", "conclusao_especifica"].map(cat => {
                     const catItems = dbEvalItems.filter(item => ((item.category === cat) || (!item.category && cat === "farmacias")) && !item.isHidden);
                     if (catItems.length === 0) return null;
                     
                     let catTitle = "";
                     if (cat === "farmacias") catTitle = "3.1 FARMÁCIAS E DROGARIAS";
                     if (cat === "laboratorios") catTitle = "3.2 LABORATÓRIOS";
                     if (cat === "farmacia_hospitalar") catTitle = "3.3 FARMÁCIA HOSPITALAR";
                     if (cat === "remume") catTitle = "3.4 REMUME, CFT E GOVERNANÇA";
                     if (cat === "outras_irregularidades") catTitle = "3.5 OUTRAS IRREGULARIDADES SANITÁRIAS RELEVANTES";
                     if (cat === "conclusao_especifica") catTitle = "4. DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO";

                     return (
                        <div key={cat} className="space-y-4">
                           <h3 className="font-extrabold text-sm uppercase tracking-widest text-slate-800 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                             {catTitle}
                           </h3>
                           {catItems.map((item, index) => {
                              const textToSearch = `${item.title || ""} ${item.description || ""} ${item.paragraph || ""}`;
                              const hasLabsInfra = textToSearch.includes("[LABS_INFRA]");
                              const hasLabsLaminas = textToSearch.includes("[LABS_LAMINAS]");
                              const hasHospitals = textToSearch.includes("[HOSPITAIS]");
                              const isChecked = !!evalItems[item.id];
                              const isExpanded = !!expandedItems[item.id];
                              const getRequiredVars = (txt: string) => {
                                let req: any[] = [];
                                const visited = new Set<string>();
                                const processText = (text: string) => {
                                   dbEvalVariables.forEach(v => {
                                      if (!visited.has(v.id) && text.includes(`[${v.id}]`)) {
                                         visited.add(v.id);
                                         if (v.type === "condition") {
                                            // Handle the referent variable
                                            const refId = (v.conditionRefVar || "").replace(/[\[\]]/g, "").trim();
                                            const refVar = dbEvalVariables.find(d => d.id === refId);
                                            if (refVar && refVar.type !== "condition" && !visited.has(refVar.id)) {
                                               visited.add(refVar.id);
                                               req.push(refVar);
                                            } else if (refVar && refVar.type === "condition") {
                                                processText(`[${refVar.id}]`);
                                            }
                                            // Search its output texts for more placeholders
                                            processText(`${v.conditionTrueText || ""} ${v.conditionFalseText || ""}`);
                                         } else {
                                            req.push(v);
                                         }
                                      }
                                   });
                                };
                                processText(txt);
                                return req;
                              };
                              const variablesInThisItem = getRequiredVars(textToSearch);
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
                                    <div className="flex-1 select-none">
                                      <label htmlFor={`eval-item-${item.id}`} className="cursor-pointer">
                                        <span className="font-extrabold text-slate-900 font-display block text-sm">{index + 1}. {item.title}</span>
                                        {item.description && (
                                          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                                            {item.description}
                                          </p>
                                        )}
                                      </label>
                                      
                                      <button 
                                        type="button" 
                                        onClick={() => setExpandedItems({ ...expandedItems, [item.id]: !isExpanded })}
                                        className="mt-2 text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 cursor-pointer transition-colors"
                                      >
                                        {isExpanded ? "Esconder Texto" : "Visualizar Texto Completo"}
                                      </button>
                                      
                                      {isExpanded && (
                                        <div className="mt-2 p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 italic leading-relaxed">
                                          {item.paragraph}
                                        </div>
                                      )}

                                      {aiJustifications[item.id] && (
                                        <div className="mt-2.5 p-2.5 bg-violet-50/70 border border-violet-100 rounded-xl text-xs text-violet-850 flex items-start gap-1.5 leading-relaxed animate-in fade-in duration-250">
                                          <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
                                          <div>
                                            <strong className="text-violet-950">Justificativa da IA:</strong> {aiJustifications[item.id]}
                                          </div>
                                        </div>
                                      )}
                                    </div>
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
                                                  {v.type !== "text" && (
                                                    <button 
                                                      type="button"
                                                      onClick={() => {
                                                        const newRec = {};
                                                        (v.fields || []).forEach(f => newRec[f.key] = "");
                                                        setCustomVariablesData({
                                                          ...customVariablesData,
                                                          [v.id]: [...records, newRec]
                                                        });
                                                      }}
                                                      className="text-xs text-violet-600 hover:text-violet-750 font-black uppercase flex items-center gap-1 cursor-pointer"
                                                    >
                                                       <Plus className="w-3.5 h-3.5" /> Adicionar
                                                    </button>
                                                  )}
                                                </div>
                                                {v.type !== "text" ? (
                                                  <div className="space-y-3">
                                                    {records.map((record, idx) => (
                                                      <div key={idx} className="flex gap-2 items-start relative border-l-2 border-slate-200 pl-3">
                                                        <div className="flex-1 grid gap-2 grid-cols-1 md:grid-cols-2">
                                                          {(v.fields || []).map(f => (
                                                             <div key={f.key} className="flex flex-col gap-1">
                                                                {f.inputType === "radio" ? (
                                                                   <div className="bg-slate-50 p-2 border border-slate-200 rounded-lg">
                                                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1.5">{f.label}</span>
                                                                      <div className="flex flex-wrap gap-2">
                                                                         {(f.options || []).map((opt, oIdx) => (
                                                                            <label key={oIdx} className="flex items-center gap-1.5 cursor-pointer text-[10px] font-medium text-slate-700 bg-white border border-slate-200 p-1.5 rounded-md hover:bg-violet-50 hover:border-violet-200 transition-colors">
                                                                               <input
                                                                                  type="radio"
                                                                                  name={`radio_${v.id}_${idx}_${f.key}`}
                                                                                  value={opt}
                                                                                  checked={record[f.key] === opt}
                                                                                  onChange={() => {
                                                                                     const newRecords = [...records];
                                                                                     newRecords[idx] = { ...newRecords[idx], [f.key]: opt };
                                                                                     setCustomVariablesData({ ...customVariablesData, [v.id]: newRecords });
                                                                                  }}
                                                                                  className="w-3 h-3 text-violet-600 focus:ring-violet-500 cursor-pointer"
                                                                               />
                                                                               {opt}
                                                                            </label>
                                                                         ))}
                                                                      </div>
                                                                   </div>
                                                                ) : (
                                                                    <input 
                                                                      type="text" 
                                                                      placeholder={f.placeholder || f.label} 
                                                                      value={record[f.key] || ""} 
                                                                      onChange={(e) => {
                                                                        const newRecords = [...records];
                                                                        newRecords[idx] = { ...newRecords[idx], [f.key]: e.target.value };
                                                                        setCustomVariablesData({ ...customVariablesData, [v.id]: newRecords });
                                                                      }}
                                                                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-50 focus:bg-white transition-all h-full" 
                                                                    />
                                                                )}
                                                             </div>
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
                                                      <p className="text-[10px] text-slate-400 italic">Nenhum registro adicionado. Clique em "Adicionar".</p>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <div className="space-y-3 pt-2">
                                                    <input 
                                                      type="text" 
                                                      placeholder={`Valor para ${v.name}`} 
                                                      value={records[0]?.[v.fields[0]?.key || "val"] || ""} 
                                                      onChange={(e) => {
                                                        const key = v.fields[0]?.key || "val";
                                                        setCustomVariablesData({ ...customVariablesData, [v.id]: [{ [key]: e.target.value }] });
                                                      }} 
                                                      className="w-full text-xs px-2.5 py-2 border border-slate-200 rounded-lg outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 bg-slate-50 focus:bg-white transition-all" 
                                                    />
                                                  </div>
                                                )}
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
                    onClick={clearGeneralEvaluation}
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

        {isAiLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[10001] flex flex-col items-center justify-center p-6 text-center select-none"
          >
            <div className="flex flex-col items-center gap-6 max-w-md">
              <div className="relative">
                <div className="absolute inset-0 bg-violet-500/30 rounded-full blur-2xl animate-pulse scale-150" />
                <Cog className="w-20 h-20 text-violet-500 animate-spin relative z-10" style={{ animationDuration: '2.5s' }} />
              </div>
              <div className="space-y-2 relative z-10">
                <h4 className="text-xl font-black text-white uppercase tracking-wider font-display leading-snug">
                  A IA está analisando todo o relatório, aguarde!...
                </h4>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">
                  Cruzando dados de visitas técnicas, conformidades e observações de campo de {selectedCity} para sugestões de enquadramento legal automático.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
