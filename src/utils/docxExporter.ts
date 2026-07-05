import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType, 
  PageBreak,
  HeightRule
} from "docx";
import { Estabelecimento, TermoSanitario } from "../types";
import { DEFAULT_FULL_REPORT_TEMPLATE } from "./fullReportTemplate";
import { saveAs } from "file-saver";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { doc, getDoc, collection, getDocs, db } from "../lib/supabase";

export interface ExportMunicipalProps {
  selectedCity: string;
  filterLabel: string;
  filteredEstabs: Estabelecimento[];
  termos: TermoSanitario[];
  customAvaliacaoGeralText?: string;
  dateFormat?: 'apenas_data' | 'data_hora' | 'sem_data';
  travelPeriod?: string;
  travelFiscais?: string;
  // Resolved mapping results
  nomeFiscalStr?: string;
  crfFiscalStr?: string;
  sexoFiscalStr?: string;
  customTemplateVariables?: Record<string, string>;
  totalInspecoes?: number;
  totalAutos?: number;
}

// Global variable replacement helper
export const replaceVarMatches = (
  text: string,
  selectedCity: string,
  travelPeriod: string,
  nomeFiscalStr: string,
  crfFiscalStr: string,
  sexoFiscalStr: string,
  customVars: Record<string, string> = {},
  filteredEstabsCount?: number,
  totalAutosCount?: number
): string => {
  if (!text) return "";
  let res = text;
  
  const dateFormatted = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
  const localDataStr = `${selectedCity}, ${dateFormatted}`;
  const countStr = filteredEstabsCount !== undefined ? String(filteredEstabsCount) : "0";
  const autosStr = totalAutosCount !== undefined ? String(totalAutosCount) : "0";

  res = res.replace(/\[MUNICIPIO\]/gi, selectedCity || "")
           .replace(/\[CIDADE\]/gi, selectedCity || "")
           .replace(/<cidade>/gi, selectedCity || "")
           .replace(/<municipio>/gi, selectedCity || "")
           .replace(/\[DATA\]/gi, dateFormatted)
           .replace(/\[DADOS\]/gi, dateFormatted)
           .replace(/<data>/gi, dateFormatted)
           .replace(/<dados>/gi, dateFormatted)
           .replace(/\[LOCAL_DATA_POR_EXTENSO\]/gi, localDataStr)
           .replace(/\[PERIODO_DE_FISCALIZAÇÃO\]/gi, travelPeriod || "NÃO INFORMADO")
           .replace(/\[PERIODO_DE_FISCALIZACAO\]/gi, travelPeriod || "NÃO INFORMADO")
           .replace(/\[PERIODO_VIAGEM\]/gi, travelPeriod || "NÃO INFORMADO")
           .replace(/\[NOME_FISCAL\]/gi, nomeFiscalStr || "")
           .replace(/\[CRF_FISCAL\]/gi, crfFiscalStr || "")
           .replace(/\[SEXO_FISCAL\]/gi, sexoFiscalStr || "")
           .replace(/<fiscal>/gi, nomeFiscalStr || "")
           .replace(/<inspetor>/gi, nomeFiscalStr || "")
           .replace(/\[QUANTIDADE_INSPEÇÕES_NO_MUNICIPIO_SELECIONADO\]/gi, countStr)
           .replace(/\[QUANTIDADE_INSPECOES_NO_MUNICIPIO_SELECIONADO\]/gi, countStr)
           .replace(/\[QUANTIDADE_EMPRESAS_NO_MUNICIPIO_SELECIONADO\]/gi, countStr)
           .replace(/\[QDT_AUTOS_DE_INFRACAO_MUNIC_SELC\]/gi, autosStr)
           .replace(/\[QTD_AUTOS_DE_INFRACAO_MUNIC_SELC\]/gi, autosStr);

  // Replacement of admin custom variables [KEYS]
  Object.keys(customVars).forEach(key => {
    const keyWithBrackets = `[${key}]`;
    const regex = new RegExp(keyWithBrackets.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
    if (res.includes(keyWithBrackets) || res.search(regex) !== -1) {
      let val = customVars[key] || "";
      val = val.replace(/<cidade>/gi, selectedCity || "")
               .replace(/<municipio>/gi, selectedCity || "")
               .replace(/\[CIDADE\]/gi, selectedCity || "")
               .replace(/\[MUNICIPIO\]/gi, selectedCity || "")
               .replace(/\[DATA\]/gi, dateFormatted)
               .replace(/\[DADOS\]/gi, dateFormatted)
               .replace(/\[PERIODO_DE_FISCALIZAÇÃO\]/gi, travelPeriod || "NÃO INFORMADO")
               .replace(/\[NOME_FISCAL\]/gi, nomeFiscalStr || "")
               .replace(/\[CRF_FISCAL\]/gi, crfFiscalStr || "")
               .replace(/\[SEXO_FISCAL\]/gi, sexoFiscalStr || "")
               .replace(/\[QUANTIDADE_INSPEÇÕES_NO_MUNICIPIO_SELECIONADO\]/gi, countStr)
               .replace(/\[QUANTIDADE_INSPECOES_NO_MUNICIPIO_SELECIONADO\]/gi, countStr)
               .replace(/\[QUANTIDADE_EMPRESAS_NO_MUNICIPIO_SELECIONADO\]/gi, countStr)
               .replace(/\[QDT_AUTOS_DE_INFRACAO_MUNIC_SELC\]/gi, autosStr)
               .replace(/\[QTD_AUTOS_DE_INFRACAO_MUNIC_SELC\]/gi, autosStr);
      res = res.replace(regex, val);
    }
  });

  return res;
};

// Global DB mapping loader
export const loadMappingsAndCustomVars = async (selectedCity: string, travelPeriod: string, travelFiscais: string) => {
  const customTemplateVariables: Record<string, string> = {};
  try {
    const varsSnap = await getDocs(collection(db, "templateVariables"));
    varsSnap.forEach(v => {
      const data = v.data();
      if (data.name && data.value !== undefined) {
        customTemplateVariables[data.name] = data.value;
      }
    });
  } catch (e) {
    console.error("Erro ao carregar variaveis customizadas", e);
  }

  const crfMappings: {namePart: string; crfValue: string}[] = [];
  try {
    const mappingsSnap = await getDocs(collection(db, "fiscal_crf_mappings"));
    mappingsSnap.forEach(d => {
      const data = d.data() || {};
      const namePartVal = data.namePart ?? data.namepart ?? data.name_part ?? data.nome_part ?? data.nome ?? data.name ?? "";
      const crfValueVal = data.crfValue ?? data.crfvalue ?? data.crf_value ?? data.crf ?? data.valor ?? "";
      if (namePartVal && crfValueVal) {
        crfMappings.push({ 
          namePart: String(namePartVal).trim().toUpperCase(), 
          crfValue: String(crfValueVal).trim() 
        });
      }
    });
  } catch (e) {
    console.error("Erro ao carregar mapeamentos de CRF", e);
  }

  const getCrfForName = (name: string) => {
    const upperName = name.toUpperCase();
    for (const m of crfMappings) {
      if (upperName.includes(m.namePart)) {
        return m.crfValue;
      }
    }
    // Deep defaults
    if (upperName.includes("JEFFERSON")) return "CRF/AM 05566";
    if (upperName.includes("RAFAELLA")) return "CRF/AM 01683";
    if (upperName.includes("DAIANE")) return "CRF/AM 04510";
    if (upperName.includes("GLAUCIANE")) return "CRF/AM 04732";
    return "NÃO INFORMADO";
  };

  const nameMappings: {namePart: string; fullNameValue: string; gender?: string}[] = [];
  try {
    const mappingsSnap = await getDocs(collection(db, "fiscal_name_mappings"));
    mappingsSnap.forEach(d => {
      const data = d.data() || {};
      const namePartVal = data.namePart ?? data.namepart ?? data.name_part ?? data.nome_part ?? data.nome ?? data.name ?? "";
      const fullNameValueVal = data.fullNameValue ?? data.fullnamevalue ?? data.full_name_value ?? data.fullName ?? data.fullname ?? data.nome_completo ?? data.nomeCompleto ?? "";
      const genderVal = data.gender ?? data.sexo ?? "Masculino";

      if (namePartVal && fullNameValueVal) {
        nameMappings.push({ 
          namePart: String(namePartVal).trim().toUpperCase(), 
          fullNameValue: String(fullNameValueVal).trim().toUpperCase(), 
          gender: (genderVal === "Feminino" || genderVal === "feminino" || genderVal === "female" || genderVal === "F") ? "Feminino" : "Masculino"
        });
      }
    });
  } catch (e) {
    console.error("Erro ao carregar mapeamentos de Nome", e);
  }

  const getFullNameForName = (name: string) => {
    const upperName = name.toUpperCase();
    for (const m of nameMappings) {
      if (upperName.includes(m.namePart)) {
        return m.fullNameValue;
      }
    }
    return name;
  };

  const getGenderForName = (name: string) => {
    const upperName = name.toUpperCase();
    for (const m of nameMappings) {
      if (upperName.includes(m.namePart)) {
        return m.gender === "Feminino" ? "Fiscal Farmacêutica" : "Fiscal Farmacêutico";
      }
    }
    return "Fiscal Farmacêutico(a)";
  };

  let processedTravelFiscais = travelFiscais || "CRF/AM (Fiscais)";
  const initialNames = processedTravelFiscais.split(" / ");
  processedTravelFiscais = initialNames.map(f => getFullNameForName(f.trim())).join(" / ");

  const nomeFiscalStr = processedTravelFiscais;
  const fiscalNames = nomeFiscalStr.split(" / ");
  const crfFiscalStr = fiscalNames.map(f => getCrfForName(f.trim())).join(" / ");
  const sexoFiscalStr = initialNames.map(f => getGenderForName(f.trim())).join(" / ");

  return {
    customTemplateVariables,
    nomeFiscalStr,
    crfFiscalStr,
    sexoFiscalStr,
    getCrfForName,
    getGenderForName,
    initialNames
  };
};

export const createParagraph = (text: string, options: { 
  bold?: boolean; 
  italic?: boolean; 
  size?: number; 
  align?: any; 
  color?: string;
  after?: number;
  before?: number;
  font?: string;
  indent?: boolean;
} = {}) => {
  const lines = text.split(/\r?\n/);
  const children = lines.map((line, i) => new TextRun({
    text: line,
    break: i > 0 ? 1 : undefined,
    bold: options.bold,
    italics: options.italic,
    size: options.size || 24, // 12pt default (24 dxa half-points)
    font: options.font || "Times New Roman",
    color: options.color || "000000" // Pure black for standard documents
  }));

  return new Paragraph({
    alignment: options.align || AlignmentType.JUSTIFIED, // Default to justified text
    spacing: {
      before: options.before !== undefined ? options.before : 60,
      after: options.after !== undefined ? options.after : 60,
      line: 360, // 360 twips is exactly 1.5 line spacing (1.5 * 240)
    },
    indent: options.indent ? { firstLine: 709 } : undefined, // 1.25 cm standard paragraph indentation
    children: children,
  });
};

export const createFieldParagraph = (
  label: string,
  value: string,
  options: { 
    before?: number; 
    after?: number; 
  } = {}
) => {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: {
      before: options.before !== undefined ? options.before : 30,
      after: options.after !== undefined ? options.after : 30,
      line: 360, // 1.5 line spacing
    },
    children: [
      new TextRun({
        text: label,
        bold: true,
        size: 24, // 12pt (24 half-points)
        font: "Times New Roman"
      }),
      new TextRun({
        text: value,
        bold: false,
        size: 24, // 12pt (24 half-points)
        font: "Times New Roman"
      })
    ]
  });
};

export const isLineTopic = (text: string): boolean => {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;

  // 1. Markdown style header prefix
  if (trimmed.startsWith("#")) return true;

  // 2. Already markdown bolded
  if (trimmed.startsWith("**") && trimmed.endsWith("**")) return true;

  // 3. Keep topics reasonably short to prevent false positives (e.g. max 100 chars)
  if (trimmed.length > 100) return false;

  // 4. Must contain at least one uppercase letter (Portguese/English)
  const hasUppercase = /[A-ZÀ-ÖØ-ß]/.test(trimmed);
  if (!hasUppercase) return false;

  // 5. Must NOT contain any lowercase letters
  const hasLowercase = /[a-zà-öø-ÿ]/.test(trimmed);
  if (hasLowercase) return false;

  return true;
};


export const generateMunicipalReportChildren = (
  options: ExportMunicipalProps
) => {
  const { 
    selectedCity, 
    filterLabel, 
    filteredEstabs, 
    termos, 
    customAvaliacaoGeralText, 
    dateFormat = 'apenas_data',
    travelPeriod = "NÃO INFORMADO",
    nomeFiscalStr = "",
    crfFiscalStr = "",
    sexoFiscalStr = "",
    customTemplateVariables = {},
    totalInspecoes,
    totalAutos
  } = options;

  const childrenElements: any[] = [];

  const clean = (txt: string) => replaceVarMatches(
    txt, 
    selectedCity, 
    travelPeriod, 
    nomeFiscalStr, 
    crfFiscalStr, 
    sexoFiscalStr, 
    customTemplateVariables,
    totalInspecoes !== undefined ? totalInspecoes : filteredEstabs.length,
    totalAutos
  );

  // 2. ITEM 3.0 DA AVALIAÇÃO GERAL
  childrenElements.push(
    createParagraph("3. DA AVALIAÇÃO GERAL", {
      bold: true,
      size: 24, // 12pt
      before: 100,
      after: 150,
    })
  );

  const defaultAssessmentFallback = `Como é sabido, é de competência do Conselho Regional de Farmácia a fiscalização do exercício da profissão farmacêutica no Estado do Amazonas, visando resguardar o cumprimento da legislação vigente e, indiretamente, atuar na promoção da saúde em todo Estado. 

No Município de [MUNICIPIO] foram realizadas [QUANTIDADE_INSPEÇÕES_NO_MUNICIPIO_SELECIONADO] inspeções em estabelecimentos privados e unidades públicas, sem aplicação de auto de infração.`;

  const assessmentText = customAvaliacaoGeralText || defaultAssessmentFallback;

  clean(assessmentText).split(/\r?\n\n/).forEach(pBlock => {
    if (pBlock.trim() === "") return;
    if (pBlock.startsWith("**") && pBlock.endsWith("**")) {
      childrenElements.push(
        createParagraph(pBlock.substring(2, pBlock.length - 2), {
          bold: true,
          size: 24, // 12pt
          before: 300,
          after: 150,
        })
      );
    } else {
      pBlock.split(/\r?\n/).forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine !== "") {
          const isTopic = isLineTopic(trimmedLine);
          childrenElements.push(
            createParagraph(trimmedLine, {
              bold: isTopic,
              size: 24,
              before: isTopic ? 200 : 100,
              after: isTopic ? 100 : 150,
              indent: !isTopic,
            })
          );
        }
      });
    }
  });

  // 4. DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO
  if (!clean(assessmentText).includes("4. DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO")) {
    childrenElements.push(
      createParagraph("4. DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO", {
        bold: true,
        size: 24, // 12pt
        before: 350,
        after: 150,
      })
    );

    childrenElements.push(
      createParagraph(
        clean("Em virtude do risco sanitário e das irregularidades identificadas perante o CRF/AM, será realizada uma análise individualizada de alguns estabelecimentos afetados. Essa medida visa fornecer informações detalhadas aos órgãos competentes, garantindo que as devidas providências sejam tomadas para assegurar a conformidade e a segurança na prestação de serviços farmacêuticos."),
        {
          size: 24,
          before: 100,
          after: 200,
          indent: true,
        }
      )
    );
  }

  if (filteredEstabs.length === 0) {
    childrenElements.push(
      createParagraph(clean("Nenhum estabelecimento comercial local sob as condições de filtro atualmente aplicadas."), {
        italic: true,
        size: 24,
        color: "555555"
      })
    );
  } else {
    filteredEstabs.forEach((e, index) => {
      const t = termos.find(term => term.estabelecimentoId === e.inscricao);
      
      const getValueOrFallback = (val: string | undefined, fallback = "NÃO INFORMADO"): string => {
        if (!val || val.trim() === "" || val === "null" || val === "N/A" || val === "UNDEFINED") {
          return fallback;
        }
        return val.trim();
      };

      const rtLabel = t?.nomeRtPresente && t.nomeRtPresente !== "null" ? t.nomeRtPresente : "";
      const termoInspeção = getValueOrFallback(t?.nrSeqTermo, "NÃO EMITIDO");
      
      let crfAm = "NÃO INFORMADO";
      if (t?.nomeRtPresente && t.nomeRtPresente !== "null") {
        const match = t.nomeRtPresente.match(/CRF\/?\s*(?:AM)?\s*([0-9\-\/A-Z]+)/i);
        if (match) {
          crfAm = match[1];
        }
      }

      let cleanPharmaName = "NÃO INFORMADO";
      if (rtLabel && rtLabel.trim() !== "") {
        let tempName = rtLabel;
        if (tempName.toUpperCase().includes("CRF")) {
          const idx = tempName.toUpperCase().indexOf("CRF");
          tempName = tempName.substring(0, idx).trim();
        }
        tempName = tempName.replace(/,\s*$/, "").trim();
        cleanPharmaName = tempName || "NÃO INFORMADO";
      }

      const dataFull = t?.dtInicio && t.dtInicio !== "null" ? t.dtInicio : "NÃO INFORMADO";
      let dataFinal = dataFull;
      if (dateFormat === "apenas_data" && dataFull !== "NÃO INFORMADO") {
        dataFinal = dataFull.split(" ")[0];
      } else if (dateFormat === "sem_data") {
        dataFinal = "";
      }
      
      let rtPresCheck = "NÃO INFORMADO";
      if (t?.rtPresente === "SIM") {
        rtPresCheck = "Presente";
      } else if (t?.rtPresente === "NÃO") {
        rtPresCheck = "Ausente";
      }

      const ipPor = getValueOrFallback(t?.informacoesPrestadasPor);
      const cargo = getValueOrFallback(t?.cargoFuncao);
      const rgVal = getValueOrFallback(t?.ifpRg);
      const cpfVal = getValueOrFallback(t?.ifpCpf);
      const loteVal = getValueOrFallback(t?.lote);

      // Detail fields formatted with bold labels and normal values just like Complete Report
      childrenElements.push(createFieldParagraph("Nome Fantasia: ", clean(getValueOrFallback(e.fantasia).toUpperCase())));
      childrenElements.push(createFieldParagraph("Razão Social: ", clean(getValueOrFallback(e.razaoSocial).toUpperCase())));
      childrenElements.push(createFieldParagraph("CNPJ: ", clean(getValueOrFallback(e.cnpj))));
      childrenElements.push(createFieldParagraph("Inscrição: ", clean(getValueOrFallback(e.inscricao))));
      childrenElements.push(createFieldParagraph("Endereço: ", clean(getValueOrFallback(e.endereco).toUpperCase())));
      childrenElements.push(createFieldParagraph("Bairro: ", clean(getValueOrFallback(e.bairro).toUpperCase())));
      childrenElements.push(createFieldParagraph("Município: ", clean(getValueOrFallback(e.cidade).toUpperCase())));
      childrenElements.push(createFieldParagraph("Termo de Inspeção: ", clean(termoInspeção)));
      
      if (t?.nrSeqIntimacao && t.nrSeqIntimacao !== "null" && t.nrSeqIntimacao.trim() !== "") {
        childrenElements.push(createFieldParagraph("Termo de Intimação: ", clean(t.nrSeqIntimacao)));
      }
      
      if (t?.nrSeqAuto && t.nrSeqAuto !== "null" && t.nrSeqAuto.trim() !== "") {
        childrenElements.push(createFieldParagraph("Auto de Infração: ", clean(t.nrSeqAuto)));
      }
      
      if (dataFinal !== "") {
        childrenElements.push(createFieldParagraph("Data: ", clean(dataFinal)));
      }
      
      childrenElements.push(createFieldParagraph("Lote: ", clean(loteVal)));
      childrenElements.push(createFieldParagraph("Farmacêutico (a): ", clean(cleanPharmaName.toUpperCase())));
      childrenElements.push(createFieldParagraph("CRF AM: ", clean(getValueOrFallback(t?.inscricaoRtPresente))));
      childrenElements.push(createFieldParagraph("Responsável Técnico: ", clean(getValueOrFallback(t?.nomeRtPresente).toUpperCase())));
      childrenElements.push(createFieldParagraph("Inf. Prestadas Por: ", clean(ipPor.toUpperCase())));
      childrenElements.push(createFieldParagraph("Cargo: ", clean(cargo.toUpperCase())));
      childrenElements.push(createFieldParagraph("RG: ", clean(rgVal.toUpperCase())));
      childrenElements.push(createFieldParagraph("CPF: ", clean(cpfVal.toUpperCase())));

      // Notes (Organized and formatted from t.obs XML field)
      if (t?.obs && t.obs !== "null") {
        childrenElements.push(createParagraph("", { before: 100, after: 100 }));
        
        const obsLines = t.obs.split(/\r?\n/);
        obsLines.forEach((line) => {
          const trimmed = line.trim();
          if (trimmed === "") return;
          
          const isMainTitle = trimmed.toUpperCase().includes("REGULARIDADE PERANTE") || 
                              trimmed.toUpperCase().includes("ASPECTOS TÉCNICOS OBSERVADOS") ||
                              trimmed.toUpperCase().includes("OBSERVAÇÕES TÉCNICAS") || 
                              trimmed.toUpperCase().startsWith("1. REGULARIDADE PERANTE") ||
                              trimmed.toUpperCase().startsWith("1)") ||
                              trimmed.toUpperCase().startsWith("2)") ||
                              trimmed.toUpperCase().startsWith("2. CONSIDERAÇÕES INICIAIS") ||
                              trimmed.toUpperCase().startsWith("3. OBSERVAÇÕES TÉCNICAS") ||
                              trimmed.startsWith("#REGULAR") ||
                              trimmed.startsWith("#IRREGULAR");

          const isSubTitle = trimmed.toUpperCase().startsWith("INFRAESTRUTURA") || 
                             trimmed.toUpperCase().startsWith("ARMAZENAMENTO") || 
                             trimmed.toUpperCase().startsWith("TERMOLÁBEIS") || 
                             trimmed.toUpperCase().startsWith("FRACIONAMENTO") || 
                             trimmed.toUpperCase().startsWith("PORTARIA M.S 344/98") ||
                             trimmed.toUpperCase().startsWith("DOCUMENTAÇÃO") ||
                             trimmed.toUpperCase().startsWith("CONTROLE DE ESTOQUE") ||
                             trimmed.toUpperCase().startsWith("TRANSPARÊNCIA DO ESTOQUE") ||
                             trimmed.toUpperCase().startsWith("FFEAF") ||
                             trimmed.toUpperCase().startsWith("SEGURANÇA DO PACIENTE") ||
                             trimmed.toUpperCase().startsWith("SISTEMA DE DISPENSAÇÃO") ||
                             trimmed.toUpperCase().includes("OBSERVAÇÃO") ||
                             trimmed.toUpperCase().includes("OBSERVAÇÕES") ||
                             trimmed.toUpperCase().startsWith("PISO") ||
                             trimmed.toUpperCase().startsWith("CLIMATIZAÇÃO") ||
                             trimmed.toUpperCase().startsWith("ESPAÇO") ||
                             trimmed.toUpperCase().startsWith("AMBIENTE") ||
                             trimmed.startsWith("#");

          const isTopic = isLineTopic(trimmed) || isMainTitle || isSubTitle;

          if (isTopic) {
            childrenElements.push(
              createParagraph(clean(trimmed), {
                bold: true,
                size: 24, // 12pt
                before: 180,
                after: 90,
              })
            );
          } else {
            const hasConforme = trimmed.toUpperCase().startsWith("CONFORME:") || 
                               trimmed.toUpperCase().includes("NÃO CONFORME") || 
                               trimmed.toUpperCase().includes("NÃO-CONFORME") || 
                               trimmed.toUpperCase().startsWith("AUSÊNCIA DE") ||
                               trimmed.toUpperCase().includes("OBSERVAÇÃO") ||
                               trimmed.toUpperCase().includes("OBSERVAÇÕES");
            childrenElements.push(
              createParagraph(clean(trimmed), {
                size: 24, // 12pt
                before: 60,
                after: 60,
                bold: hasConforme,
                indent: true,
              })
            );
          }
        });
      }

      // Centered Separator line identical to the complete report
      childrenElements.push(
        createParagraph("------------------------------------------------------------------------------------------------------------------------", {
          before: 200,
          after: 200,
          align: AlignmentType.CENTER
        })
      );
    });
  }
  return childrenElements;
};

export const exportMunicipalDocx = async (
  filename: string,
  options: ExportMunicipalProps
) => {
  // Asynchronously load custom variables and fiscal/CRF mappings
  const details = await loadMappingsAndCustomVars(
    options.selectedCity,
    options.travelPeriod || "NÃO INFORMADO",
    options.travelFiscais || ""
  );

  const fullOptions: ExportMunicipalProps = {
    ...options,
    nomeFiscalStr: details.nomeFiscalStr,
    crfFiscalStr: details.crfFiscalStr,
    sexoFiscalStr: details.sexoFiscalStr,
    customTemplateVariables: details.customTemplateVariables
  };

  const childrenElements = generateMunicipalReportChildren(fullOptions);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: childrenElements,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  
  const safeFilename = filename.endsWith(".docx") ? filename : filename + ".docx";
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const exportFullMunicipalDocx = async (
  filename: string,
  options: ExportMunicipalProps,
  travelFiscais: string
) => {
  const { selectedCity, filterLabel, filteredEstabs, termos, customAvaliacaoGeralText, travelPeriod, dateFormat = 'apenas_data', totalInspecoes, totalAutos } = options;

  let templateBase64 = null;
  
  try {
    const docRef = doc(db, "settings", "reportTemplate");
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().totalChunks !== undefined) {
      const totalChunks = snap.data().totalChunks;
      let fullBase64 = "";
      
      for (let i = 0; i < totalChunks; i++) {
        const chunkRef = doc(db, `settings/reportTemplate/chunks/chunk_${i}`);
        const chunkSnap = await getDoc(chunkRef);
        if (chunkSnap.exists()) {
          fullBase64 += chunkSnap.data().data;
        }
      }
      
      if (fullBase64.length > 0) {
        templateBase64 = fullBase64;
      }
    }
  } catch (e) {
    console.error("Erro ao buscar template no Firebase", e);
  }

  // Load custom template variables and map fiscal names correctly using our central DB mapping loader!
  const details = await loadMappingsAndCustomVars(
    selectedCity,
    travelPeriod || "NÃO INFORMADO",
    travelFiscais || ""
  );

  const { 
    customTemplateVariables, 
    nomeFiscalStr, 
    crfFiscalStr, 
    sexoFiscalStr, 
    getCrfForName, 
    getGenderForName, 
    initialNames 
  } = details;

  const fiscalNames = nomeFiscalStr.split(" / ");
  const dateFormatted = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
  const localDataStr = `${selectedCity}, ${dateFormatted}`;

  // Process custom template dynamic tags replacement using the clean function
  Object.keys(customTemplateVariables).forEach(key => {
    let text = customTemplateVariables[key];
    if (text) {
      customTemplateVariables[key] = replaceVarMatches(
        text,
        selectedCity,
        travelPeriod || "NÃO INFORMADO",
        nomeFiscalStr,
        crfFiscalStr,
        sexoFiscalStr,
        customTemplateVariables,
        totalInspecoes !== undefined ? totalInspecoes : filteredEstabs.length,
        totalAutos
      );
    }
  });

  // WordprocessingML helpers for docxtemplater raw XML - With justified text (both) and 1.5 line spacing (360)
  const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, c => {
      switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
      }
  });

  const rPrContent = `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:sz w:val="24"/><w:szCs w:val="24"/>`;
  const pStyle = `<w:pPr><w:jc w:val="both"/><w:spacing w:before="100" w:after="100" w:line="360" w:lineRule="auto"/></w:pPr>`;
  const pStyleWithIndent = `<w:pPr><w:jc w:val="both"/><w:spacing w:before="100" w:after="100" w:line="360" w:lineRule="auto"/><w:ind w:firstLine="709"/></w:pPr>`;
  const p = (inner: string) => `<w:p>${pStyle}${inner}</w:p>`;
  const pWithIndent = (inner: string) => `<w:p>${pStyleWithIndent}${inner}</w:p>`;
  const pBold = (inner: string) => `<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="200" w:after="100" w:line="360" w:lineRule="auto"/></w:pPr><w:r><w:rPr>${rPrContent}<w:b/></w:rPr><w:t xml:space="preserve">${escapeXml(inner)}</w:t></w:r></w:p>`;
  const r = (text: string, bold = false) => `<w:r><w:rPr>${rPrContent}${bold ? `<w:b/>` : ''}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;

  let relatorioSimplesText = ""; // Plain text fallback
  let relatorioSimplesXml = ""; // Rich text for custom template
  
  const defaultAssessmentFallback = `Como é sabido, é de competência do Conselho Regional de Farmácia a fiscalização do exercício da profissão farmacêutica no Estado do Amazonas, visando resguardar o cumprimento da legislação vigente e, indiretamente, atuar na promoção da saúde em todo Estado.\n\nNo Município de [MUNICIPIO] foram realizadas [QUANTIDADE_INSPEÇÕES_NO_MUNICIPIO_SELECIONADO] inspeções em estabelecimentos privados e unidades públicas, sem aplicação de auto de infração.`;
  let assessmentText = customAvaliacaoGeralText || defaultAssessmentFallback;

  // Run global variable replacement on assessmentText to fix the [MUNICIPIO] bug in Complete Report
  assessmentText = replaceVarMatches(
    assessmentText,
    selectedCity,
    travelPeriod || "NÃO INFORMADO",
    nomeFiscalStr,
    crfFiscalStr,
    sexoFiscalStr,
    customTemplateVariables,
    totalInspecoes !== undefined ? totalInspecoes : filteredEstabs.length,
    totalAutos
  );

  fiscalNames.forEach((name, i) => {
    const regexName = new RegExp(`\\[NOME_FISCAL${i + 1}\\]`, 'gi');
    const regexCrf = new RegExp(`\\[CRF_FISCAL${i + 1}\\]`, 'gi');
    const regexSexo = new RegExp(`\\[SEXO_FISCAL${i + 1}\\]`, 'gi');
    assessmentText = assessmentText.replace(regexName, name.trim());
    assessmentText = assessmentText.replace(regexCrf, getCrfForName(name.trim()));
    assessmentText = assessmentText.replace(regexSexo, getGenderForName(initialNames[i].trim()));
  });
  
  assessmentText = assessmentText.replace(/\[NOME_FISCAL\]/gi, nomeFiscalStr);
  assessmentText = assessmentText.replace(/\[CRF_FISCAL\]/gi, crfFiscalStr);
  assessmentText = assessmentText.replace(/\[SEXO_FISCAL\]/gi, sexoFiscalStr);

  relatorioSimplesXml += pBold("3. DA AVALIAÇÃO GERAL");
  assessmentText.split(/\r?\n\n/).forEach(pBlock => {
    if (pBlock.trim() === '') return;
    if (pBlock.startsWith("**") && pBlock.endsWith("**")) {
      relatorioSimplesXml += pBold(pBlock.substring(2, pBlock.length - 2));
    } else {
      pBlock.split(/\r?\n/).forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine !== "") {
          if (isLineTopic(trimmedLine)) {
            relatorioSimplesXml += pBold(trimmedLine);
          } else {
            relatorioSimplesXml += pWithIndent(r(trimmedLine));
          }
        }
      });
    }
  });

  if (!assessmentText.includes("4. DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO")) {
    relatorioSimplesXml += pBold("4. DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO");
    relatorioSimplesXml += pWithIndent(r("Em virtude do risco sanitário e das irregularidades identificadas perante o CRF/AM, será realizada uma análise individualizada de alguns estabelecimentos afetados. Essa medida visa fornecer informações detalhadas aos órgãos competentes, garantindo que as devidas providências sejam tomadas para assegurar a conformidade e a segurança na prestação de serviços farmacêuticos."));
  }

  if (filteredEstabs.length === 0) {
    relatorioSimplesXml += p(r(`Nenhum estabelecimento encontrado com este filtro: ${filterLabel}`));
  } else {
    filteredEstabs.forEach((e, index) => {
      const t = termos.find(term => term.estabelecimentoId === e.inscricao);

      const getValueOrFallback = (val: string | undefined, fallback = "NÃO INFORMADO"): string => {
        if (!val || val.trim() === "" || val === "null" || val === "N/A" || val === "UNDEFINED") {
          return fallback;
        }
        return val.trim();
      };

      const rtLabel = t?.nomeRtPresente && t.nomeRtPresente !== "null" ? t.nomeRtPresente : "";
      const termoInspeção = getValueOrFallback(t?.nrSeqTermo, "NÃO EMITIDO");
      
      let crfAm = "NÃO INFORMADO";
      if (t?.nomeRtPresente && t.nomeRtPresente !== "null") {
        const match = t.nomeRtPresente.match(/CRF\/?\s*(?:AM)?\s*([0-9\-\/A-Z]+)/i);
        if (match) {
          crfAm = match[1];
        }
      }

      let cleanPharmaName = "NÃO INFORMADO";
      if (rtLabel && rtLabel.trim() !== "") {
        let tempName = rtLabel;
        if (tempName.toUpperCase().includes("CRF")) {
          const idx = tempName.toUpperCase().indexOf("CRF");
          tempName = tempName.substring(0, idx).trim();
        }
        tempName = tempName.replace(/,\s*$/, "").trim();
        cleanPharmaName = tempName || "NÃO INFORMADO";
      }

      const dataFull = t?.dtInicio && t.dtInicio !== "null" ? t.dtInicio : "NÃO INFORMADO";
      let dataFinal = dataFull;
      if (dateFormat === "apenas_data" && dataFull !== "NÃO INFORMADO") {
        dataFinal = dataFull.split(" ")[0];
      } else if (dateFormat === "sem_data") {
        dataFinal = "";
      }
      
      const ipPor = getValueOrFallback(t?.informacoesPrestadasPor);
      const cargo = getValueOrFallback(t?.cargoFuncao);
      const rgVal = getValueOrFallback(t?.ifpRg);
      const cpfVal = getValueOrFallback(t?.ifpCpf);
      const loteVal = getValueOrFallback(t?.lote);

      relatorioSimplesXml += p(r("Nome Fantasia: ", true) + r(getValueOrFallback(e.fantasia).toUpperCase()));
      relatorioSimplesXml += p(r("Razão Social: ", true) + r(getValueOrFallback(e.razaoSocial).toUpperCase()));
      relatorioSimplesXml += p(r("CNPJ: ", true) + r(getValueOrFallback(e.cnpj)));
      relatorioSimplesXml += p(r("Inscrição: ", true) + r(getValueOrFallback(e.inscricao)));
      relatorioSimplesXml += p(r("Endereço: ", true) + r(getValueOrFallback(e.endereco).toUpperCase()));
      relatorioSimplesXml += p(r("Bairro: ", true) + r(getValueOrFallback(e.bairro).toUpperCase()));
      relatorioSimplesXml += p(r("Município: ", true) + r(getValueOrFallback(e.cidade).toUpperCase()));
      relatorioSimplesXml += p(r("Termo de Inspeção: ", true) + r(termoInspeção));
      
      if (t?.nrSeqIntimacao && t.nrSeqIntimacao !== "null" && t.nrSeqIntimacao.trim() !== "") {
        relatorioSimplesXml += p(r("Termo de Intimação: ", true) + r(t.nrSeqIntimacao));
      }
      
      if (t?.nrSeqAuto && t.nrSeqAuto !== "null" && t.nrSeqAuto.trim() !== "") {
        relatorioSimplesXml += p(r("Auto de Infração: ", true) + r(t.nrSeqAuto));
      }
      
      if (dataFinal !== "") {
        relatorioSimplesXml += p(r("Data: ", true) + r(dataFinal));
      }
      
      relatorioSimplesXml += p(r("Lote: ", true) + r(loteVal));
      relatorioSimplesXml += p(r("Farmacêutico (a): ", true) + r(cleanPharmaName.toUpperCase()));
      relatorioSimplesXml += p(r("CRF AM: ", true) + r(getValueOrFallback(t?.inscricaoRtPresente)));
      relatorioSimplesXml += p(r("Responsável Técnico: ", true) + r(getValueOrFallback(t?.nomeRtPresente).toUpperCase()));
      relatorioSimplesXml += p(r("Inf. Prestadas Por: ", true) + r(ipPor.toUpperCase()));
      relatorioSimplesXml += p(r("Cargo: ", true) + r(cargo.toUpperCase()));
      relatorioSimplesXml += p(r("RG: ", true) + r(rgVal.toUpperCase()));
      relatorioSimplesXml += p(r("CPF: ", true) + r(cpfVal.toUpperCase()));

      // Observações (Organized and formatted from t.obs XML field)
      if (t?.obs && t.obs !== "null") {
        relatorioSimplesXml += `<w:p><w:pPr><w:spacing w:before="100" w:after="100"/></w:pPr></w:p>`; // empty line
        const obsLines = t.obs.split(/\r?\n/);
        obsLines.forEach((line) => {
          const trimmed = line.trim();
          if (trimmed !== "") {
            const upper = trimmed.toUpperCase();
            const isMainTitle = upper.includes("REGULARIDADE PERANTE") || 
                                upper.includes("ASPECTOS TÉCNICOS OBSERVADOS") ||
                                upper.includes("OBSERVAÇÕES TÉCNICAS") || 
                                /^[0-9]+[.)]\s+/.test(trimmed) ||
                                upper.startsWith("OBSERVAÇÃO") ||
                                trimmed.startsWith("#REGULAR") ||
                                trimmed.startsWith("#IRREGULAR") ||
                                (trimmed.length > 3 && upper === trimmed && !trimmed.includes(",") && trimmed.split(" ").length < 10);

            const isTopic = isLineTopic(trimmed) || isMainTitle;

            if (isTopic) {
              relatorioSimplesXml += pBold(trimmed);
            } else {
              relatorioSimplesXml += pWithIndent(r(trimmed));
            }
          }
        });
      }

      // Add separator
      relatorioSimplesXml += `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="200" w:after="200"/></w:pPr><w:r><w:t>------------------------------------------------------------------------------------------------------------------------</w:t></w:r></w:p>`;
    });
  }

  // If no template in DB, use the fallback basic docx generation
  if (!templateBase64) {
    console.error("Nenhum template customizado foi encontrado no Painel do Administrador. O sistema fará a exportação usando o formato básico.");
    
    const templateText = DEFAULT_FULL_REPORT_TEMPLATE;
    const templateLines = templateText.split(/\r?\n/);
    const fullChildren: any[] = [];

    for (let line of templateLines) {
      if (line.includes("[RELATORIO_SIMPLES]")) {
        const simpleChildren = generateMunicipalReportChildren(options);
        fullChildren.push(...simpleChildren);
      } else {
        let resolvedLine = replaceVarMatches(
          line,
          selectedCity,
          travelPeriod || "NÃO INFORMADO",
          nomeFiscalStr,
          crfFiscalStr,
          sexoFiscalStr,
          customTemplateVariables,
          totalInspecoes !== undefined ? totalInspecoes : filteredEstabs.length,
          totalAutos
        );
        
        const isHeader = resolvedLine.match(/^[A-Z0-9.\- \t]+$/) && resolvedLine.length > 3 && !resolvedLine.includes(",");
        
        fullChildren.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { before: 80, after: 80, line: 360 },
            children: [
              new TextRun({
                text: resolvedLine,
                bold: isHeader ? true : false,
                size: 24, // 12pt
                font: "Times New Roman"
              })
            ]
          })
        );
      }
    }

    const doc = new Document({
      sections: [{ properties: {}, children: fullChildren }],
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename.endsWith(".docx") ? filename : filename + ".docx");
    return;
  }

  // We have a custom template DOCX URL! Use docxtemplater.
  try {
    const binaryString = window.atob(templateBase64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    const zip = new PizZip(bytes.buffer);
    const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: "[", end: "]" }
    });

    const fiscalNames = nomeFiscalStr.split(" / ");
    
    const renderData: any = {
        NOME_FISCAL: nomeFiscalStr,
        CRF_FISCAL: crfFiscalStr,
        SEXO_FISCAL: sexoFiscalStr,
        LOCAL_DATA_POR_EXTENSO: localDataStr,
        DATA: dateFormatted,
        DADOS: dateFormatted,
        CIDADE: selectedCity || "",
        MUNICIPIO: selectedCity || "",
        PERIODO_DE_FISCALIZAÇÃO: travelPeriod || "NÃO INFORMADO",
        PERIODO_DE_FISCALIZACAO: travelPeriod || "NÃO INFORMADO",
        PERIODO_VIAGEM: travelPeriod || "NÃO INFORMADO",
        QUANTIDADE_INSPEÇÕES_NO_MUNICIPIO_SELECIONADO: totalInspecoes !== undefined ? String(totalInspecoes) : String(filteredEstabs.length),
        QUANTIDADE_INSPECOES_NO_MUNICIPIO_SELECIONADO: totalInspecoes !== undefined ? String(totalInspecoes) : String(filteredEstabs.length),
        QUANTIDADE_EMPRESAS_NO_MUNICIPIO_SELECIONADO: totalInspecoes !== undefined ? String(totalInspecoes) : String(filteredEstabs.length),
        QDT_AUTOS_DE_INFRACAO_MUNIC_SELC: totalAutos !== undefined ? String(totalAutos) : "0",
        QTD_AUTOS_DE_INFRACAO_MUNIC_SELC: totalAutos !== undefined ? String(totalAutos) : "0",
        ...customTemplateVariables,
        RELATORIO_SIMPLES: relatorioSimplesXml
    };
    
    fiscalNames.forEach((name, i) => {
        renderData[`NOME_FISCAL${i + 1}`] = name.trim();
        renderData[`CRF_FISCAL${i + 1}`] = getCrfForName(name.trim());
        renderData[`SEXO_FISCAL${i + 1}`] = getGenderForName(initialNames[i].trim());
    });

    // docxtemplater will now replace tags inside [ ]
    doc.render(renderData);

    const out = doc.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    saveAs(out, filename.endsWith(".docx") ? filename : filename + ".docx");
  } catch (error) {
    console.error("Error generating docx from template", error);
    console.error("Ocorreu um erro ao gerar o documento usando o template enviado. Verifique se o formato das variáveis está correto.");
  }
};

interface ExportTravelProps {
  travelFiscais: string;
  travelPeriod: string;
  uniqueCities: string[];
  countFiscalizados: number;
  countIntimados: number;
  countAutuados: number;
  countNovos: number;
  citySummaries: any[];
}

export const exportTravelDocx = async (
  filename: string,
  { travelFiscais, travelPeriod, uniqueCities, countFiscalizados, countIntimados, countAutuados, countNovos, citySummaries }: ExportTravelProps
) => {
  const childrenElements: any[] = [];

  const nameMappings: {namePart: string; fullNameValue: string; gender?: string}[] = [];
  try {
    const mappingsSnap = await getDocs(collection(db, "fiscal_name_mappings"));
    mappingsSnap.forEach(d => {
      const data = d.data();
      if (data.namePart && data.fullNameValue) {
        nameMappings.push({ namePart: data.namePart, fullNameValue: data.fullNameValue, gender: data.gender });
      }
    });
  } catch (e) {
    console.error("Erro ao carregar mapeamentos de Nome", e);
  }

  const getFullNameForName = (name: string) => {
    const upperName = name.toUpperCase();
    for (const m of nameMappings) {
      if (upperName.includes(m.namePart)) {
        return m.fullNameValue;
      }
    }
    return name;
  };

  let processedTravelFiscais = travelFiscais || "CRF/AM (Fiscais)";
  processedTravelFiscais = processedTravelFiscais.split(" / ").map(f => getFullNameForName(f.trim())).join(" / ");
  
  // Use the processed names within the generator
  travelFiscais = processedTravelFiscais;

  // Document Title
  childrenElements.push(
    createParagraph("RESUMO CONSOLIDADO DE VIAGEM E FISCALIZAÇÃO MÓVEL", {
      bold: true,
      size: 26,
      align: AlignmentType.CENTER,
      before: 100,
      after: 50,
    })
  );

  // 1. METADADOS DO PERCURSO
  childrenElements.push(
    createParagraph("I. DADOS", {
      bold: true,
      size: 22,
      before: 200,
      after: 100,
    })
  );

  const travelMetaTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: "F3F4F6" },
            children: [createParagraph("Fiscais Cooperantes", { bold: true, size: 18 })],
          }),
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            children: [createParagraph(travelFiscais.toUpperCase(), { size: 18, bold: true })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "F3F4F6" },
            children: [createParagraph("Período de Atuação", { bold: true, size: 18 })],
          }),
          new TableCell({
            children: [createParagraph(travelPeriod, { size: 18 })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: "F3F4F6" },
            children: [createParagraph("Cidades Atendidas", { bold: true, size: 18 })],
          }),
          new TableCell({
            children: [createParagraph(uniqueCities.join(", ").toUpperCase(), { size: 18 })],
          }),
        ],
      }),
    ],
  });

  childrenElements.push(travelMetaTable);
  childrenElements.push(createParagraph("", { before: 0, after: 150 }));

  // II. RESULTADOS CONSOLIDADOS
  childrenElements.push(
    createParagraph("II. RESULTADOS QUANTITATIVOS CONSOLIDADOS", {
      bold: true,
      size: 22,
      before: 200,
      after: 100,
    })
  );

  const statsTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 70, type: WidthType.PERCENTAGE },
            shading: { fill: "F3F4F6" },
            children: [createParagraph("ATO DE FISCALIZAÇÃO MÓVEL EM CAMPO", { bold: true, size: 18 })],
          }),
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            shading: { fill: "F3F4F6" },
            children: [createParagraph("QUANTIDADE", { bold: true, size: 18 })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [createParagraph("Total de termos de inspeções", { size: 18 })],
          }),
          new TableCell({
            children: [createParagraph(`${countFiscalizados} empresa(s)`, { size: 18, bold: true })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [createParagraph("Termos de Intimação", { size: 18 })],
          }),
          new TableCell({
            children: [createParagraph(`${countIntimados} termo(s)`, { size: 18, color: "B45309", bold: true })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [createParagraph("Autos de Infração", { size: 18 })],
          }),
          new TableCell({
            children: [createParagraph(`${countAutuados} auto(s)`, { size: 18, color: "991B1B", bold: true })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [createParagraph("Novos Estabelecimentos", { size: 18 })],
          }),
          new TableCell({
            children: [createParagraph(`${countNovos} cadastro(s)`, { size: 18, color: "065F46", bold: true })],
          }),
        ],
      }),
    ],
  });

  childrenElements.push(statsTable);
  childrenElements.push(createParagraph("", { before: 0, after: 150 }));

  // III. DETALHE INDIVIDUAL POR MUNICÍPIO
  childrenElements.push(
    createParagraph("III. DESMEMBRAMENTO DE COBERTURA POR MUNICÍPIO", {
      bold: true,
      size: 22,
      before: 200,
      after: 100,
    })
  );

  const cityTableRows: TableRow[] = [
    new TableRow({
      children: [
        new TableCell({
          shading: { fill: "F3F4F6" },
          children: [createParagraph("MUNICÍPIO", { bold: true, size: 17 })],
        }),
        new TableCell({
          shading: { fill: "F3F4F6" },
          children: [createParagraph("Termos de Inspeções", { bold: true, size: 17, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: { fill: "F3F4F6" },
          children: [createParagraph("Intimações", { bold: true, size: 17, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: { fill: "F3F4F6" },
          children: [createParagraph("Auto de infrações", { bold: true, size: 17, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: { fill: "F3F4F6" },
          children: [createParagraph("Novos Estabelecimentos", { bold: true, size: 17, align: AlignmentType.CENTER })],
        }),
      ],
    }),
  ];

  citySummaries.forEach(sum => {
    cityTableRows.push(
      new TableRow({
        children: [
          new TableCell({
            children: [createParagraph(sum.cidade.toUpperCase(), { size: 17, bold: true })],
          }),
          new TableCell({
            children: [createParagraph(String(sum.inspecoes), { size: 17, align: AlignmentType.CENTER })],
          }),
          new TableCell({
            children: [createParagraph(String(sum.intimacoes), { size: 17, align: AlignmentType.CENTER, color: sum.intimacoes > 0 ? "B45309" : undefined, bold: sum.intimacoes > 0 })],
          }),
          new TableCell({
            children: [createParagraph(String(sum.autos), { size: 17, align: AlignmentType.CENTER, color: sum.autos > 0 ? "991B1B" : undefined, bold: sum.autos > 0 })],
          }),
          new TableCell({
            children: [createParagraph(String(sum.novos), { size: 17, align: AlignmentType.CENTER, color: sum.novos > 0 ? "065F46" : undefined, bold: sum.novos > 0 })],
          }),
        ],
      })
    );
  });
  
  // Add total row at the end of the cityTableRows
  cityTableRows.push(
    new TableRow({
      children: [
        new TableCell({
          shading: { fill: "F3F4F6" },
          children: [createParagraph("TOTAL", { size: 17, bold: true })],
        }),
        new TableCell({
          shading: { fill: "F3F4F6" },
          children: [createParagraph(String(countFiscalizados), { size: 17, bold: true, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: { fill: "F3F4F6" },
          children: [createParagraph(String(countIntimados), { size: 17, bold: true, align: AlignmentType.CENTER, color: countIntimados > 0 ? "B45309" : undefined })],
        }),
        new TableCell({
          shading: { fill: "F3F4F6" },
          children: [createParagraph(String(countAutuados), { size: 17, bold: true, align: AlignmentType.CENTER, color: countAutuados > 0 ? "991B1B" : undefined })],
        }),
        new TableCell({
          shading: { fill: "F3F4F6" },
          children: [createParagraph(String(countNovos), { size: 17, bold: true, align: AlignmentType.CENTER, color: countNovos > 0 ? "065F46" : undefined })],
        }),
      ],
    })
  );

  const citySummaryTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: cityTableRows,
  });

  childrenElements.push(citySummaryTable);
  childrenElements.push(createParagraph("", { before: 0, after: 200 }));

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: childrenElements,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  
  const safeFilename = filename.endsWith(".docx") ? filename : filename + ".docx";
  a.download = safeFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
