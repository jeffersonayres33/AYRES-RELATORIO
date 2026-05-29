import { Estabelecimento, TechnicalResponsible, TermoSanitario, FarmaciaChecklist } from "../types";

/**
 * Utility to parse Delphi-compatible XML documents using standard DOMParser.
 */

const getTagText = (element: Element, tagName: string, defaultValue = "null"): string => {
  const node = element.getElementsByTagName(tagName)[0];
  return node && node.textContent ? node.textContent.trim() : defaultValue;
};

const getTagNumber = (element: Element, tagName: string, defaultValue = 0): number => {
  const text = getTagText(element, tagName, "");
  if (!text) return defaultValue;
  const parsed = parseInt(text, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const parseLoteXML = (xmlContent: string): { estabelecimentos: Estabelecimento[]; rts: TechnicalResponsible[] } => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
  
  const estabelecimentos: Estabelecimento[] = [];
  const rts: TechnicalResponsible[] = [];

  // Parse Establishments
  const estabRoot = xmlDoc.getElementsByTagName("Estabelecimento")[0];
  if (estabRoot) {
    const children = Array.from(estabRoot.children);
    children.forEach((child) => {
      // Typically named R1, R2, etc.
      if (child.tagName.startsWith("R")) {
        const inscricao = getTagText(child, "Inscricao");
        if (inscricao && inscricao !== "null") {
          estabelecimentos.push({
            inscricao,
            fantasia: getTagText(child, "Fantasia"),
            razaoSocial: getTagText(child, "Razao"),
            cidade: getTagText(child, "Cidade").toUpperCase(),
            bairro: getTagText(child, "Bairro"),
            endereco: getTagText(child, "Endereco"),
            cnpj: getTagText(child, "CNPJ"),
            nomeArea: getTagText(child, "Nome_Area", "DROGARIA"),
            origem: "SISCON",
            isClandestina: false,
            encontrava: getTagText(child, "Encontrava", "null")
          });
        }
      }
    });
  }

  // Parse Technical Responsibles
  const rtRoot = xmlDoc.getElementsByTagName("RespTecnico")[0];
  if (rtRoot) {
    const children = Array.from(rtRoot.children);
    children.forEach((child) => {
      if (child.tagName.startsWith("R")) {
        const estabId = getTagText(child, "Estabelecimento");
        if (estabId && estabId !== "null") {
          rts.push({
            nome: getTagText(child, "Nome"),
            crf: getTagText(child, "CRF"),
            estabelecimentoId: estabId,
            segunda: getTagText(child, "SEGUNDA_RT", "--"),
            terca: getTagText(child, "TERCA_RT", "--"),
            quarta: getTagText(child, "QUARTA_RT", "--"),
            quinta: getTagText(child, "QUINTA_RT", "--"),
            sexta: getTagText(child, "SEXTA_RT", "--"),
            sabado: getTagText(child, "SABADO_RT", "--"),
            domingo: getTagText(child, "DOMINGO_RT", "--")
          });
        }
      }
    });
  }

  return { estabelecimentos, rts };
};

export const parseNovosCadastros20XML = (xmlContent: string): Estabelecimento[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
  const estabelecimentos: Estabelecimento[] = [];

  // xxxx_20.xml could list establishments inside <NovoEstabelecimento>, <Estabelecimento>, <Item>, or <FEM_20>
  let items = Array.from(xmlDoc.getElementsByTagName("NovoEstabelecimento"));
  if (items.length === 0) {
    items = Array.from(xmlDoc.getElementsByTagName("Estabelecimento"));
  }
  if (items.length === 0 && xmlDoc.documentElement) {
    items = Array.from(xmlDoc.documentElement.children);
  }

  items.forEach((item) => {
    const inscricao = getTagText(item, "Inscricao");
    if (inscricao && inscricao !== "null") {
      estabelecimentos.push({
        inscricao,
        fantasia: getTagText(item, "Fantasia"),
        razaoSocial: getTagText(item, "Razao"),
        cidade: getTagText(item, "Cidade").toUpperCase(),
        bairro: getTagText(item, "Bairro"),
        endereco: getTagText(item, "Endereco"),
        cnpj: getTagText(item, "CNPJ"),
        nomeArea: getTagText(item, "Nome_Area", "DROGARIA"),
        origem: "FEM_NOVO",
        isClandestina: true,
        encontrava: getTagText(item, "Encontrava", "null")
      });
    }
  });

  return estabelecimentos;
};

export const parseTermos0XML = (xmlContent: string): TermoSanitario[] => {
  return parseFemXML(xmlContent);
};

export const parseFemXML = (xmlContent: string): TermoSanitario[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
  const termos: TermoSanitario[] = [];

  // FEM could have <Inspecao> nodes or children directly under root
  let items = Array.from(xmlDoc.getElementsByTagName("Inspecao"));
  if (items.length === 0 && xmlDoc.documentElement) {
    // If direct elements under root
    items = Array.from(xmlDoc.documentElement.children);
  }

  items.forEach((item) => {
    const estabId = getTagText(item, "Estabelecimento");
    if (estabId && estabId !== "null") {
      termos.push({
        estabelecimentoId: estabId,
        nrSeqTermo: getTagText(item, "NrSeqTermo"),
        nrSeqIntimacao: getTagText(item, "NrSeqIntimacao"),
        nrSeqAuto: getTagText(item, "NrSeqAuto"),
        dtInicio: getTagText(item, "DtInicio"),
        dtFim: getTagText(item, "DtFim"),
        lote: getTagText(item, "Lote"),
        obs: getTagText(item, "Obs"),
        informacoesPrestadasPor: getTagText(item, "InformacoesPrestadasPor"),
        cargoFuncao: getTagText(item, "CargoFuncao"),
        ifpRg: getTagText(item, "IfpRg"),
        ifpCpf: getTagText(item, "IfpCpf"),
        nomeRtPresente: getTagText(item, "NomeRtPresente"),
        rtPresente: getTagText(item, "RTPresente", "NÃO"),
        inspetorFiscalizacao: getTagText(item, "InspetorFiscalizacao", "INSPETOR COORDENADOR"),
        encontrava: getTagText(item, "Encontrava", "null")
      });
    }
  });

  return termos;
};

export const parseChecklistXML = (xmlContent: string): FarmaciaChecklist[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, "application/xml");
  const checklists: FarmaciaChecklist[] = [];

  let items = Array.from(xmlDoc.getElementsByTagName("Item"));
  if (items.length === 0 && xmlDoc.documentElement) {
    items = Array.from(xmlDoc.documentElement.children);
  }

  const catList = [
    { key: "A", name: "Com rasuras e/ou adulterações" },
    { key: "B", name: "Sem data de prescrição" },
    { key: "C", name: "Aviadas fora do prazo legal" },
    { key: "D", name: "Sem identificação correta do emitente" },
    { key: "E", name: "Sem identificação correta do comprador" },
    { key: "F", name: "Sem identificação correta do fornecedor" },
    { key: "G", name: "Aviadas em quantidade acima do limite" },
    { key: "H", name: "Aviadas acima de concentração farmacológica" },
    { key: "I", name: "Sem a rubrica do farmacêutico" },
    { key: "J", name: "Provenientes de outra unidade federativa" },
    { key: "K", name: "Sem número de lote anotado" },
    { key: "L", name: "Prescrição em nome comercial" }
  ];

  items.forEach((item) => {
    const estabId = getTagText(item, "Estabelecimento");
    if (estabId && estabId !== "null") {
      const respostas: Record<string, "S" | "N"> = {};
      for (let q = 1; q <= 26; q++) {
        const qStr = q.toString().padStart(2, "0");
        const val = getTagText(item, `FdaV1Cep${qStr}`, "N");
        respostas[qStr] = val === "S" ? "S" : "N";
      }

      const irregularidades: Record<string, { categoria: string; receita: number; notificacao: number; antimicrobiano: number }> = {};
      catList.forEach((cat) => {
        irregularidades[cat.key.toLowerCase()] = {
          categoria: cat.name,
          receita: getTagNumber(item, `FdaV1Rec${cat.key}Receita`),
          notificacao: getTagNumber(item, `FdaV1Rec${cat.key}Notificacao`),
          antimicrobiano: getTagNumber(item, `FdaV1Rec${cat.key}Antimicrobianos`)
        };
      });

      checklists.push({
        estabelecimentoId: estabId,
        termo: getTagText(item, "Termo"),
        nomeRt: getTagText(item, "NomeRt"),
        inscricaoRt: getTagText(item, "InscricaoRt"),
        numFicha: getTagText(item, "NumFicha"),
        dtInicio: getTagText(item, "DtInicio"),
        dtFim: getTagText(item, "DtFim"),
        data: getTagText(item, "Data"),
        arquivarFVPE: getTagText(item, "ArquivarFVPE", "S"),
        outros: getTagText(item, "Outros"),
        respostas,
        totalAnaliseReceita: getTagNumber(item, "FTotalAnaliseReceita"),
        totalAnaliseNotificacao: getTagNumber(item, "FTotalAnaliseNotificacao"),
        totalAnaliseAntimicrobiano: getTagNumber(item, "FTotalAnaliseAntimicrobianos"),
        irregularidades
      });
    }
  });

  return checklists;
};
