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

// Helper for standard paragraphs - Defaulting to Times New Roman, 12pt (size 24), pure black, left aligned
const createParagraph = (text: string, options: { 
  bold?: boolean; 
  italic?: boolean; 
  size?: number; 
  align?: any; 
  color?: string;
  after?: number;
  before?: number;
  font?: string;
} = {}) => {
  const lines = text.split(/\r?\n/);
  const children = lines.map((line, i) => new TextRun({
    text: line,
    break: i > 0 ? 1 : undefined,
    bold: options.bold,
    italics: options.italic,
    size: options.size || 24, // 12pt default
    font: options.font || "Times New Roman",
    color: options.color || "000000" // Pure black for standard documents
  }));

  return new Paragraph({
    alignment: options.align || AlignmentType.LEFT,
    spacing: {
      before: options.before !== undefined ? options.before : 60,
      after: options.after !== undefined ? options.after : 60,
    },
    children: children,
  });
};

interface ExportMunicipalProps {
  selectedCity: string;
  filterLabel: string;
  filteredEstabs: Estabelecimento[];
  termos: TermoSanitario[];
  customAvaliacaoGeralText?: string;
  dateFormat?: 'apenas_data' | 'data_hora' | 'sem_data';
  travelPeriod?: string;
}

export const generateMunicipalReportChildren = (
  { selectedCity, filterLabel, filteredEstabs, termos, customAvaliacaoGeralText, dateFormat = 'apenas_data' }: ExportMunicipalProps
) => {
  const childrenElements: any[] = [];

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

No Município de ${selectedCity.toUpperCase()} foram realizadas ${filteredEstabs.length} inspeções em estabelecimentos privados e unidades públicas, sem aplicação de auto de infração.`;

  const assessmentText = customAvaliacaoGeralText || defaultAssessmentFallback;

  assessmentText.split(/\r?\n\n/).forEach(pBlock => {
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
      childrenElements.push(
        createParagraph(pBlock.trim(), {
          size: 24,
          before: 100,
          after: 200,
        })
      );
    }
  });

  // 4. DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO
  if (!assessmentText.includes("4. DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO")) {
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
        "Em virtude do risco sanitário e das irregularidades identificadas perante o CRF/AM, será realizada uma análise individualizada de alguns estabelecimentos afetados. Essa medida visa fornecer informações detalhadas aos órgãos competentes, garantindo que as devidas providências sejam tomadas para assegurar a conformidade e a segurança na prestação de serviços farmacêuticos.",
        {
          size: 24,
          before: 100,
          after: 200,
        }
      )
    );
  }

  if (filteredEstabs.length === 0) {
    childrenElements.push(
      createParagraph("Nenhum estabelecimento comercial local sob as condições de filtro atualmente aplicadas.", {
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

      // Detail fields without tables
      childrenElements.push(createParagraph(`Nome Fantasia: ${getValueOrFallback(e.fantasia).toUpperCase()}`, { bold: true, size: 24, before: 30, after: 30 }));
      childrenElements.push(createParagraph(`Razão Social: ${getValueOrFallback(e.razaoSocial).toUpperCase()}`, { size: 24, before: 30, after: 30 }));
      childrenElements.push(createParagraph(`CNPJ: ${getValueOrFallback(e.cnpj)}`, { size: 24, before: 30, after: 30 }));
      childrenElements.push(createParagraph(`Inscrição: ${getValueOrFallback(e.inscricao)}`, { size: 24, before: 30, after: 30 }));
      childrenElements.push(createParagraph(`Endereço: ${getValueOrFallback(e.endereco).toUpperCase()}`, { size: 24, before: 30, after: 30 }));
      childrenElements.push(createParagraph(`Bairro: ${getValueOrFallback(e.bairro).toUpperCase()}`, { size: 24, before: 30, after: 30 }));
      childrenElements.push(createParagraph(`Município: ${getValueOrFallback(e.cidade).toUpperCase()}`, { size: 24, before: 30, after: 30 }));
      childrenElements.push(createParagraph(`Termo de Inspeção: ${termoInspeção}`, { size: 24, before: 30, after: 30 }));
      
      if (t?.nrSeqIntimacao && t.nrSeqIntimacao !== "null" && t.nrSeqIntimacao.trim() !== "") {
        childrenElements.push(createParagraph(`Termo de Intimação: ${t.nrSeqIntimacao}`, { size: 24, before: 30, after: 30 }));
      }
      
      if (t?.nrSeqAuto && t.nrSeqAuto !== "null" && t.nrSeqAuto.trim() !== "") {
        childrenElements.push(createParagraph(`Auto de Infração: ${t.nrSeqAuto}`, { size: 24, before: 30, after: 30 }));
      }
      
      if (dataFinal !== "") {
        childrenElements.push(createParagraph(`Data: ${dataFinal}`, { size: 24, before: 30, after: 30 }));
      }
      
      childrenElements.push(createParagraph(`Lote: ${loteVal}`, { size: 24, before: 30, after: 30 }));
      childrenElements.push(createParagraph(`Farmacêutico (a): ${cleanPharmaName.toUpperCase()}`, { size: 24, before: 30, after: 30 }));
      childrenElements.push(createParagraph(`CRF AM: ${getValueOrFallback(t?.inscricaoRtPresente)}`, { size: 24, before: 30, after: 30 }));
      childrenElements.push(createParagraph(`Responsável Técnico: ${getValueOrFallback(t?.nomeRtPresente).toUpperCase()}`, { size: 24, before: 30, after: 30 }));
      childrenElements.push(createParagraph(`Inf. Prestadas Por: ${ipPor.toUpperCase()}`, { size: 24, before: 30, after: 30 }));
      childrenElements.push(createParagraph(`Cargo: ${cargo.toUpperCase()}`, { size: 24, before: 30, after: 30 }));
      childrenElements.push(createParagraph(`RG: ${rgVal.toUpperCase()}`, { size: 24, before: 30, after: 30 }));
      childrenElements.push(createParagraph(`CPF: ${cpfVal.toUpperCase()}`, { size: 24, before: 30, after: 30 }));

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

          if (isMainTitle) {
            childrenElements.push(
              createParagraph(trimmed, {
                bold: true,
                size: 24, // 12pt
                before: 200,
                after: 100,
              })
            );
          } else if (isSubTitle) {
            childrenElements.push(
              createParagraph(trimmed, {
                bold: true,
                size: 22, // 11pt
                before: 150,
                after: 80,
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
              createParagraph(trimmed, {
                size: 22, // 11pt
                before: 60,
                after: 60,
                bold: hasConforme
              })
            );
          }
        });
      }

      // Separator line
      childrenElements.push(
        createParagraph("------------------------------------------------------------------------------------------------------------------------", {
          color: "CCCCCC",
          before: 150,
          after: 200,
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
  const childrenElements = generateMunicipalReportChildren(options);

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


import { saveAs } from "file-saver";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export const exportFullMunicipalDocx = async (
  filename: string,
  options: ExportMunicipalProps,
  travelFiscais: string
) => {
  const { selectedCity, filterLabel, filteredEstabs, termos, customAvaliacaoGeralText, travelPeriod, dateFormat = 'apenas_data' } = options;

  let templateBase64 = null;
  let customTemplateVariables: Record<string, string> = {};
  
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

  // Fetch custom variables if we have a template
  if (templateBase64) {
    try {
      const varsSnap = await getDocs(collection(db, "templateVariables"));
      varsSnap.forEach(v => {
        const data = v.data();
        if (data.name && data.value) {
          customTemplateVariables[data.name] = data.value;
        }
      });
    } catch (e) {
      console.error("Erro ao carregar variaveis customizadas", e);
    }
  }

  // Fetch CRF Mappings
  const crfMappings: {namePart: string; crfValue: string}[] = [];
  try {
    const mappingsSnap = await getDocs(collection(db, "fiscal_crf_mappings"));
    mappingsSnap.forEach(d => {
      const data = d.data();
      if (data.namePart && data.crfValue) {
        crfMappings.push({ namePart: data.namePart, crfValue: data.crfValue });
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
    // Hardcoded defaults as requested
    if (upperName.includes("JEFFERSON")) return "CRF/AM 05566";
    if (upperName.includes("RAFAELLA")) return "CRF/AM 01683";
    if (upperName.includes("DAIANE")) return "CRF/AM 04510";
    if (upperName.includes("GLAUCIANE")) return "CRF/AM 04732";
    
    return "NÃO INFORMADO";
  };

  // Fetch Name Mappings
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

  const getGenderForName = (name: string) => {
    const upperName = name.toUpperCase();
    for (const m of nameMappings) {
      if (upperName.includes(m.namePart)) {
        return m.gender === "Feminino" ? "Fiscal Farmacêutica" : "Fiscal Farmacêutico";
      }
    }
    return "Fiscal Farmacêutico(a)";
  };

  // Convert incoming text to full names before further processing
  let processedTravelFiscais = travelFiscais || "CRF/AM (Fiscais)";
  const initialNames = processedTravelFiscais.split(" / ");
  processedTravelFiscais = initialNames.map(f => getFullNameForName(f.trim())).join(" / ");

  // Extract variables
  const nomeFiscalStr = processedTravelFiscais;
  const fiscalNames = nomeFiscalStr.split(" / ");
  const crfFiscalStr = fiscalNames.map(f => getCrfForName(f.trim())).join(" / ");
  const sexoFiscalStr = initialNames.map(f => getGenderForName(f.trim())).join(" / ");
  const dateFormatted = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' });
  const localDataStr = `${selectedCity}, ${dateFormatted}`;

  // Process custom template dynamic tags replacement

  Object.keys(customTemplateVariables).forEach(key => {
    let text = customTemplateVariables[key];
    if (text) {
      text = text.replace(/<cidade>/gi, selectedCity || "")
                 .replace(/<municipio>/gi, selectedCity || "")
                 .replace(/\[CIDADE\]/gi, selectedCity || "")
                 .replace(/<fiscal>/gi, nomeFiscalStr)
                 .replace(/<inspetor>/gi, nomeFiscalStr)
                 .replace(/<data>/gi, dateFormatted)
                 .replace(/\[DATA\]/gi, dateFormatted)
                 .replace(/<dados>/gi, dateFormatted)
                 .replace(/\[DADOS\]/gi, dateFormatted)
                 .replace(/\[PERIODO_DE_FISCALIZAÇÃO\]/gi, travelPeriod || "NÃO INFORMADO");

      fiscalNames.forEach((name, i) => {
         const regexName = new RegExp(`\\[NOME_FISCAL${i + 1}\\]`, 'gi');
         const regexCrf = new RegExp(`\\[CRF_FISCAL${i + 1}\\]`, 'gi');
         const regexSexo = new RegExp(`\\[SEXO_FISCAL${i + 1}\\]`, 'gi');
         text = text.replace(regexName, name.trim());
         text = text.replace(regexCrf, getCrfForName(name.trim()));
         text = text.replace(regexSexo, getGenderForName(initialNames[i].trim()));
      });

      // Optional generic variables targeting exactly [NOME_FISCAL], [CRF_FISCAL], [SEXO_FISCAL]
      text = text.replace(/\[NOME_FISCAL\]/gi, nomeFiscalStr);
      text = text.replace(/\[CRF_FISCAL\]/gi, crfFiscalStr);
      text = text.replace(/\[SEXO_FISCAL\]/gi, sexoFiscalStr);

      customTemplateVariables[key] = text;
    }
  });

  // WordprocessingML helpers for docxtemplater raw XML
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
  const pStyle = `<w:pPr><w:jc w:val="both"/><w:spacing w:before="100" w:after="100"/></w:pPr>`;
  const p = (inner: string) => `<w:p>${pStyle}${inner}</w:p>`;
  const pBold = (inner: string) => `<w:p><w:pPr><w:jc w:val="both"/><w:spacing w:before="200" w:after="100"/></w:pPr><w:r><w:rPr>${rPrContent}<w:b/></w:rPr><w:t xml:space="preserve">${escapeXml(inner)}</w:t></w:r></w:p>`;
  const r = (text: string, bold = false) => `<w:r><w:rPr>${rPrContent}${bold ? `<w:b/>` : ''}</w:rPr><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;

  let relatorioSimplesText = ""; // Plain text fallback
  let relatorioSimplesXml = ""; // Rich text for custom template
  
  const defaultAssessmentFallback = `Como é sabido, é de competência do Conselho Regional de Farmácia a fiscalização do exercício da profissão farmacêutica no Estado do Amazonas, visando resguardar o cumprimento da legislação vigente e, indiretamente, atuar na promoção da saúde em todo Estado.\n\nNo Município de ${selectedCity.toUpperCase()} foram realizadas ${filteredEstabs.length} inspeções em estabelecimentos privados e unidades públicas, sem aplicação de auto de infração.`;
  let assessmentText = customAvaliacaoGeralText || defaultAssessmentFallback;

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
        if (line.trim() !== "") {
          relatorioSimplesXml += p(r(line));
        }
      });
    }
  });

  if (!assessmentText.includes("4. DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO")) {
    relatorioSimplesXml += pBold("4. DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO");
    relatorioSimplesXml += p(r("Em virtude do risco sanitário e das irregularidades identificadas perante o CRF/AM, será realizada uma análise individualizada de alguns estabelecimentos afetados. Essa medida visa fornecer informações detalhadas aos órgãos competentes, garantindo que as devidas providências sejam tomadas para assegurar a conformidade e a segurança na prestação de serviços farmacêuticos."));
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

            if (isMainTitle) {
              relatorioSimplesXml += pBold(trimmed);
            } else {
              relatorioSimplesXml += p(r(trimmed));
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
    alert("Nenhum template customizado foi encontrado no Painel do Administrador. O sistema fará a exportação usando o formato básico.");
    
    const templateText = DEFAULT_FULL_REPORT_TEMPLATE;
    const templateLines = templateText.split(/\r?\n/);
    const fullChildren: any[] = [];

    for (let line of templateLines) {
      if (line.includes("[RELATORIO_SIMPLES]")) {
        const simpleChildren = generateMunicipalReportChildren(options);
        fullChildren.push(...simpleChildren);
      } else {
        let resolvedLine = line;
        resolvedLine = resolvedLine.replace(/\[NOME_FISCAL\]/g, nomeFiscalStr);
        resolvedLine = resolvedLine.replace(/\[CRF_FISCAL\]/g, crfFiscalStr);
        resolvedLine = resolvedLine.replace(/\[SEXO_FISCAL\]/g, sexoFiscalStr);
        resolvedLine = resolvedLine.replace(/\[LOCAL_DATA_POR_EXTENSO\]/g, localDataStr);
        
        const isHeader = resolvedLine.match(/^[A-Z0-9.\- \t]+$/) && resolvedLine.length > 3 && !resolvedLine.includes(",");
        
        fullChildren.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            spacing: { before: 80, after: 80 },
            children: [
              new TextRun({
                text: resolvedLine,
                bold: isHeader ? true : false,
                size: 24,
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
    alert("Ocorreu um erro ao gerar o documento usando o template enviado. Verifique se o formato das variáveis está correto.");
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
