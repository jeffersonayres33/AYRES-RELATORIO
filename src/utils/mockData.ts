import { Estabelecimento, TermoSanitario, TechnicalResponsible } from "../types";

export const getMockData = (): {
  estabelecimentos: Estabelecimento[];
  termos: TermoSanitario[];
  rts: TechnicalResponsible[];
} => {
  const estabelecimentos: Estabelecimento[] = [
    {
      inscricao: "12409",
      fantasia: "DROGARIA ULTRA POPULAR",
      razaoSocial: "AMAZONAS COMMERCIO FARMACEUTICO LTDA",
      cidade: "TEFE",
      bairro: "CENTRO",
      endereco: "AVENIDA HUGO PINHEIRO, 456",
      cnpj: "10.457.896/0001-20",
      nomeArea: "DROGARIA",
      origem: "SISCON",
      isClandestina: false
    },
    {
      inscricao: "39401",
      fantasia: "FARMACIA TRABALHADOR",
      razaoSocial: "M. N. DOS SANTOS DRUGSTORES",
      cidade: "TEFE",
      bairro: "ABIAL",
      endereco: "RUA MARECHAL DEODORO, 90",
      cnpj: "08.125.741/0001-44",
      nomeArea: "DROGARIA",
      origem: "SISCON",
      isClandestina: false
    },
    {
      inscricao: "87061",
      fantasia: "FARMACIA SANTA ROSA",
      razaoSocial: "SILVA & CASTRO MEDICAMENTOS LTDA",
      cidade: "COARI",
      bairro: "DUQUE DE CAXIAS",
      endereco: "REBELO DE ALENCAR, 1500",
      cnpj: "18.524.369/0002-12",
      nomeArea: "DROGARIA",
      origem: "SISCON",
      isClandestina: false
    },
    {
      inscricao: "99041",
      fantasia: "DROGARIA PARINTINS NOVA",
      razaoSocial: "MEDeiros PARINTINS DISTRIBUIDORA",
      cidade: "PARINTINS",
      bairro: "ITAUNA",
      endereco: "RUA JONATHAS PEDROSA, 203",
      cnpj: "42.963.741/0001-08",
      nomeArea: "DROGARIA",
      origem: "SISCON",
      isClandestina: false
    },
    {
      inscricao: "I9902", // Starts with 'I' for "Novo Estabelecimento" filter in original code!
      fantasia: "DROGARIA VALE DO SOL",
      razaoSocial: "J G PINHEIRO FARMA ME",
      cidade: "ALVARAES",
      bairro: "CENTRO",
      endereco: "AVENIDA GETULIO VARGAS, S/N",
      cnpj: "29.351.487/0001-81",
      nomeArea: "DROGARIA",
      origem: "FEM_NOVO",
      isClandestina: true
    },
    {
      inscricao: "I9903", // Starts with 'I' for "Novo Estabelecimento"
      fantasia: "FARMA-VIDA INTERIOR",
      razaoSocial: "S O MELLO DROGARIA",
      cidade: "MAUES",
      bairro: "CENTRO",
      endereco: "RUA RAMALHO JUNIOR, 12",
      cnpj: "34.120.487/0001-09",
      nomeArea: "DROGARIA",
      origem: "FEM_NOVO",
      isClandestina: true
    },
    {
      inscricao: "40502",
      fantasia: "FARMACIA REDE LAR MAUES",
      razaoSocial: "MAUES COMERCIAL BIO-FARMA LTDA",
      cidade: "MAUES",
      bairro: "RAMALHO",
      endereco: "AVENIDA ANTARCTICA, 888",
      cnpj: "11.233.444/0001-55",
      nomeArea: "DROGARIA",
      origem: "SISCON",
      isClandestina: false
    },
    {
      inscricao: "55502",
      fantasia: "DROGARIA FECHADA DEMONSTRATIVA",
      razaoSocial: "DISTRIBUIDORA DE MEDICAMENTOS INATIVA LTDA",
      cidade: "MAUES",
      bairro: "CENTRO",
      endereco: "RUA DA ESTACAO, 102",
      cnpj: "99.888.777/0001-66",
      nomeArea: "DROGARIA",
      origem: "SISCON",
      isClandestina: false,
      encontrava: "Fechada"
    }
  ];

  const rts: TechnicalResponsible[] = [
    {
      nome: "DR. JEFFERSON AYRES CASTRO",
      crf: "AM-4509",
      estabelecimentoId: "12409",
      segunda: "08:00 - 12:00 / 14:00 - 18:00",
      terca: "08:00 - 12:00 / 14:00 - 18:00",
      quarta: "08:00 - 12:00 / 14:00 - 18:00",
      quinta: "08:00 - 12:00 / 14:00 - 18:00",
      sexta: "08:00 - 12:00 / 14:00 - 18:00",
      sabado: "08:00 - 12:00",
      domingo: "--"
    },
    {
      nome: "DRA. ANA CAROLINA REBOUCAS",
      crf: "AM-8730",
      estabelecimentoId: "39401",
      segunda: "08:00 - 12:00",
      terca: "08:00 - 12:00",
      quarta: "08:00 - 12:00",
      quinta: "08:00 - 12:00",
      sexta: "08:00 - 12:00",
      sabado: "--",
      domingo: "--"
    },
    {
      nome: "DR. THIAGO M. ALBUQUERQUE",
      crf: "AM-7721",
      estabelecimentoId: "87061",
      segunda: "13:00 - 19:00",
      terca: "13:00 - 19:00",
      quarta: "13:00 - 19:00",
      quinta: "13:00 - 19:00",
      sexta: "13:00 - 19:00",
      sabado: "--",
      domingo: "--"
    },
    {
      nome: "DRA. MARIA BEATRIZ SOUZA",
      crf: "AM-1049",
      estabelecimentoId: "99041",
      segunda: "08:00 - 14:00",
      terca: "08:00 - 14:00",
      quarta: "08:00 - 14:00",
      quinta: "08:00 - 14:00",
      sexta: "08:00 - 14:00",
      sabado: "08:00 - 12:00",
      domingo: "--"
    }
  ];

  const termos: TermoSanitario[] = [
    {
      estabelecimentoId: "12409",
      nrSeqTermo: "INS-2026-TEF01",
      nrSeqIntimacao: "INT-2026-TEF19",
      nrSeqAuto: "null", // Equivalent to unissued
      dtInicio: "15/05/2026 09:30:00",
      dtFim: "15/05/2026 11:45:00",
      lote: "LOTE_TEST_TEFE_2026",
      obs: "O estabelecimento farmacêutico apresenta as áreas de distribuição limpas e organizadas. Constatou-se falta de adequação no manual de controle de validade, razão pela qual foi expedido termo de intimação para correção em 15 dias. Armário de controlados (Portaria 344/98) devidamente trancado.",
      informacoesPrestadasPor: "MÁRCIO GOMES SOUZA",
      cargoFuncao: "SUB-GERENTE",
      ifpRg: "459012-AM",
      ifpCpf: "109.874.562-09",
      nomeRtPresente: "DR. JEFFERSON AYRES CASTRO",
      rtPresente: "SIM",
      inspetorFiscalizacao: "ROBERTO BENEVENUTO / JEFFERSON AYRES"
    },
    {
      estabelecimentoId: "39401",
      nrSeqTermo: "INS-2026-TEF02",
      nrSeqIntimacao: "null",
      nrSeqAuto: "AUTO-2026-TEF01",
      dtInicio: "15/05/2026 14:15:00",
      dtFim: "15/05/2026 16:30:00",
      lote: "LOTE_TEST_TEFE_2026",
      obs: "Auto de Infração lavrado em virtude de ausência do Responsável Técnico durante o horário previsto de funcionamento e venda de antibióticos sem devida retenção de receita médica na hora da fiscalização. Medicamentos expostos ao sol na vitrine frontal.",
      informacoesPrestadasPor: "FRANCISCO PINTO SILVA",
      cargoFuncao: "BALCONISTA",
      ifpRg: "884120-AM",
      ifpCpf: "005.122.987-90",
      nomeRtPresente: "DRA. ANA CAROLINA REBOUCAS",
      rtPresente: "NÃO",
      inspetorFiscalizacao: "ROBERTO BENEVENUTO / JEFFERSON AYRES"
    },
    {
      estabelecimentoId: "87061",
      nrSeqTermo: "INS-2026-COA12",
      nrSeqIntimacao: "null",
      nrSeqAuto: "null",
      dtInicio: "17/05/2026 15:00:00",
      dtFim: "17/05/2026 16:50:00",
      lote: "LOTE_TEST_COARI_2026",
      obs: "Visita realizada sem intercorrências graves. AFE e Licença Sanitária expostas e plenamente regulares. Controle de estoque integrado perfeitamente funcional.",
      informacoesPrestadasPor: "THIAGO M. ALBUQUERQUE",
      cargoFuncao: "SÓCIO ADMINISTRADOR",
      ifpRg: "655312-AM",
      ifpCpf: "344.212.980-00",
      nomeRtPresente: "DR. THIAGO M. ALBUQUERQUE",
      rtPresente: "SIM",
      inspetorFiscalizacao: "ANTONIO PINHEIRO SOUZA"
    },
    {
      estabelecimentoId: "99041",
      nrSeqTermo: "INS-2026-PIN50",
      nrSeqIntimacao: "INT-2026-PIN02",
      nrSeqAuto: "null",
      dtInicio: "20/05/2026 10:15:00",
      dtFim: "20/05/2026 12:45:00",
      lote: "LOTE_TEST_PIN04",
      obs: "Encontradas irregularidades formais em 5 receitas de controle especial analisadas (falha na anotação de lote de fabricação). Expedido termo de intimação de adequação imediata na rotina de lançamento do SNGPC.",
      informacoesPrestadasPor: "DRA. MARIA BEATRIZ SOUZA",
      cargoFuncao: "FARMACÊUTICA RT",
      ifpRg: "112990-AM",
      ifpCpf: "622.122.098-77",
      nomeRtPresente: "DRA. MARIA BEATRIZ SOUZA",
      rtPresente: "SIM",
      inspetorFiscalizacao: "JEFFERSON AYRES"
    },
    {
      estabelecimentoId: "I9902", // Novo estabelecimento
      nrSeqTermo: "INS-2026-ALV01",
      nrSeqIntimacao: "INT-2026-ALV01",
      nrSeqAuto: "null",
      dtInicio: "22/05/2026 09:00:00",
      dtFim: "22/05/2026 10:15:00",
      lote: "LOTE_ALVARAES_2026",
      obs: "Fiscalização para fins de concessão de Licença Inicial de Funcionamento. Estrutura física adequada, materiais mínimos presentes. Expedida intimação para anexar certificado de destinação de resíduos no prazo de 5 dias.",
      informacoesPrestadasPor: "JOÃO G. PINHEIRO",
      cargoFuncao: "PROPRIETÁRIO",
      ifpRg: "222129-AM",
      ifpCpf: "712.333.111-09",
      nomeRtPresente: "DR. RAIMUNDO NONATO",
      rtPresente: "SIM",
      inspetorFiscalizacao: "ANTONIO PINHEIRO SOUZA / JEFFERSON AYRES"
    },
    {
      estabelecimentoId: "I9903", // Novo estabelecimento
      nrSeqTermo: "INS-2026-MAU04",
      nrSeqIntimacao: "null",
      nrSeqAuto: "AUTO-2026-MAU02",
      dtInicio: "25/05/2026 15:30:00",
      dtFim: "25/05/2026 16:45:00",
      lote: "LOTE_MAUES_TEST",
      obs: "Auto de Infração lavrado por ausência de termo de inscrição ou qualquer documentação ou licença sanitária pendente durante abertura e vendas já iniciadas ao público.",
      informacoesPrestadasPor: "S. O. MELLO",
      cargoFuncao: "RESPONSÁVEL",
      ifpRg: "555312-AM",
      ifpCpf: "812.990.231-15",
      nomeRtPresente: "NÃO CADASTRADO",
      rtPresente: "NÃO",
      inspetorFiscalizacao: "ROBERTO BENEVENUTO / JEFFERSON AYRES"
    },
    {
      estabelecimentoId: "55502",
      nrSeqTermo: "INS-2026-MAU90",
      nrSeqIntimacao: "null",
      nrSeqAuto: "null",
      dtInicio: "26/05/2026 10:00:00",
      dtFim: "26/05/2026 10:15:00",
      lote: "LOTE_MAUES_TEST",
      obs: "Unidade encontrava-se fechada no momento da fiscalização periódica, impossibilitando a averiguação operacional de rotinas sanitárias inloco.",
      informacoesPrestadasPor: "null",
      cargoFuncao: "null",
      ifpRg: "null",
      ifpCpf: "null",
      nomeRtPresente: "null",
      rtPresente: "NÃO",
      inspetorFiscalizacao: "ROBERTO BENEVENUTO / JEFFERSON AYRES",
      encontrava: "Fechada"
    }
  ];

  return { estabelecimentos, termos, rts };
};

export const getActiveInspectors = (termos: TermoSanitario[]) => {
  const map = new Map<string, number>();
  termos.forEach(t => {
    const inspectors = t.inspetorFiscalizacao.split(/[\/,;]/);
    inspectors.forEach(ins => {
      const clean = ins.trim().toUpperCase();
      if (clean && clean !== "NULL") {
        map.set(clean, (map.get(clean) || 0) + 1);
      }
    });
  });
  return Array.from(map.entries()).map(([nome, count]) => ({ nome, count }));
};
