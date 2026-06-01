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
import { Estabelecimento, TermoSanitario, FarmaciaChecklist } from "../types";

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
  checklists: FarmaciaChecklist[];
  customAvaliacaoGeralText?: string;
  dateFormat?: 'apenas_data' | 'data_hora' | 'sem_data';
}

export const exportMunicipalDocx = async (
  filename: string, 
  { selectedCity, filterLabel, filteredEstabs, termos, checklists, customAvaliacaoGeralText, dateFormat = 'apenas_data' }: ExportMunicipalProps
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

  childrenElements.push(
    createParagraph(assessmentText, {
      size: 24,
      before: 100,
      after: 200,
    })
  );

  // 3. ITEM 3.1 DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO
  childrenElements.push(
    createParagraph("3.1 DA AVALIAÇÃO ESPECÍFICA DE CADA ESTABELECIMENTO", {
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

  // Header section
  childrenElements.push(
    createParagraph("CONSELHO REGIONAL DE FARMÁCIA DO ESTADO DO AMAZONAS", {
      bold: true,
      size: 24,
      align: AlignmentType.CENTER,
      before: 0,
      after: 40,
    })
  );
  childrenElements.push(
    createParagraph("CRF-AM • SERVIÇO DE FISCALIZAÇÃO PROFISSIONAL", {
      bold: true,
      size: 20,
      align: AlignmentType.CENTER,
      color: "555555",
      before: 0,
      after: 40,
    })
  );
  childrenElements.push(
    createParagraph("Setor de Controle de Escalas e Deslocamentos Operacionais", {
      bold: false,
      italic: true,
      size: 18,
      align: AlignmentType.CENTER,
      color: "777777",
      before: 0,
      after: 200,
    })
  );

  // Decorative border
  childrenElements.push(
    createParagraph("_________________________________________________________________________________", {
      align: AlignmentType.CENTER,
      color: "CCCCCC",
      before: 0,
      after: 300,
    })
  );

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
  childrenElements.push(
    createParagraph(`RELATÓRIO DE PRESTAÇÃO DE CONTAS E PRODUTIVIDADE OPERACIONAL`, {
      bold: true,
      size: 16,
      align: AlignmentType.CENTER,
      color: "555555",
      before: 0,
      after: 300,
    })
  );

  // 1. METADADOS DO PERCURSO
  childrenElements.push(
    createParagraph("I. METADADOS DO DESLOCAMENTO", {
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
            children: [createParagraph("Total de Estabelecimentos Vistoriados (Com Termo de Inspeção)", { size: 18 })],
          }),
          new TableCell({
            children: [createParagraph(`${countFiscalizados} empresa(s)`, { size: 18, bold: true })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [createParagraph("Termos de Intimação / Notificações Sanitárias Emitidos", { size: 18 })],
          }),
          new TableCell({
            children: [createParagraph(`${countIntimados} termo(s)`, { size: 18, color: "B45309", bold: true })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [createParagraph("Autos de Infração Lavrados (Penalidades Operacionais)", { size: 18 })],
          }),
          new TableCell({
            children: [createParagraph(`${countAutuados} auto(s)`, { size: 18, color: "991B1B", bold: true })],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            children: [createParagraph("Novas Empresas / Estabelecimentos Clandestinos Cadastrados", { size: 18 })],
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
          children: [createParagraph("X-VISTORIAS", { bold: true, size: 17, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: { fill: "F3F4F6" },
          children: [createParagraph("X-INTIMAÇÕES", { bold: true, size: 17, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: { fill: "F3F4F6" },
          children: [createParagraph("X-AUTUAÇÕES", { bold: true, size: 17, align: AlignmentType.CENTER })],
        }),
        new TableCell({
          shading: { fill: "F3F4F6" },
          children: [createParagraph("X-NOVOS CADASTROS", { bold: true, size: 17, align: AlignmentType.CENTER })],
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

  const citySummaryTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: cityTableRows,
  });

  childrenElements.push(citySummaryTable);
  childrenElements.push(createParagraph("", { before: 0, after: 200 }));

  // Disclaimer / Declaration
  childrenElements.push(
    new Paragraph({
      spacing: { before: 300, after: 300 },
      children: [
        new TextRun({
          text: "DECLARAÇÃO DA COMISSÃO DE FISCALIZAÇÃO MÓVEL: ",
          bold: true,
          font: "Arial",
          size: 17,
          color: "333333",
        }),
        new TextRun({
          text: `Os fiscais signatários declaram que as informações constantes neste relatório correspondem exatamente às atividades realizadas e registradas no banco operacional durante o período de viagem acima caracterizado, sob as penas do regimento e código profissional em curso.`,
          font: "Arial",
          size: 17,
          color: "666665",
        }),
      ],
    })
  );

  childrenElements.push(
    new Paragraph({
      children: [new PageBreak()],
    })
  );

  childrenElements.push(
    createParagraph("_________________________________________________________________________________", {
      align: AlignmentType.CENTER,
      color: "CCCCCC",
      before: 200,
      after: 400,
    })
  );

  childrenElements.push(
    createParagraph("CRF - AM • SERVIÇO DE FISCALIZAÇÃO PROFISSIONAL", {
      bold: true,
      size: 20,
      align: AlignmentType.CENTER,
      after: 600,
    })
  );

  const names = travelFiscais.split("/");
  const signatureTable = new Table({
    width: {
      size: 100,
      type: WidthType.PERCENTAGE,
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              createParagraph("_________________________", { align: AlignmentType.CENTER, after: 40 }),
              createParagraph((names[0] || "FISCAL OPERANTE 1").trim().toUpperCase(), { bold: true, size: 18, align: AlignmentType.CENTER, after: 20 }),
              createParagraph("Fiscal Farmacêutico Operante", { size: 16, color: "555555", align: AlignmentType.CENTER }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              createParagraph("_________________________", { align: AlignmentType.CENTER, after: 40 }),
              createParagraph((names[1] || "FISCAL OPERANTE 2").trim().toUpperCase(), { bold: true, size: 18, align: AlignmentType.CENTER, after: 20 }),
              createParagraph("Fiscal Farmacêutico Co-Atuante", { size: 16, color: "555555", align: AlignmentType.CENTER }),
            ],
          }),
        ],
      }),
    ],
  });

  childrenElements.push(signatureTable);

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
