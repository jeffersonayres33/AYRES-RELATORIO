import { Estabelecimento, TermoSanitario, FarmaciaChecklist, TechnicalResponsible, ChecklistQuestao } from "../types";

export const QUESTAO_LIST: ChecklistQuestao[] = [
  { id: "01", textoSim: "Possui Certidão de Regularidade atualizada, visível na área pública da farmácia.", textoNao: "Não Possui Certidão de Regularidade atualizada, visível na área pública da farmácia." },
  { id: "02", textoSim: "Possui Licença Sanitária atualizada, expedida pela Visa local, visível na área pública da farmácia.", textoNao: "Não Possui Licença Sanitária atualizada, expedida pela Visa local, visível na área pública da farmácia." },
  { id: "03", textoSim: "Possui Autorização de Funcionamento (AFE) da Anvisa.", textoNao: "Não Possui Autorização de Funcionamento (AFE) da Anvisa." },
  { id: "04", textoSim: "O farmacêutico mantém todos os medicamentos de dispensa sujeito à prescrição em uma área da farmácia sob seu controle e fora do alcance do usuário.", textoNao: "O farmacêutico não mantém todos os medicamentos de dispensa sujeito à prescrição em uma área da farmácia sob seu controle ou fora do alcance do usuário." },
  { id: "05", textoSim: "O farmacêutico mantém todos os medicamentos não sujeitos à prescrição fora do alcance do usuário ou em área única da farmácia, organizadas e identificados de forma ostensiva pela DCB e com alertas específicas aos usuários.", textoNao: "O farmacêutico não mantém todos os medicamentos não sujeitos à prescrição fora do alcance do usuário ou em área única da farmácia, organizadas e identificados de forma ostensiva pela DCB e com alertas específicas aos usuários." },
  { id: "06", textoSim: "Existe procedimento de gerência de prazo de validade de medicamentos.", textoNao: "Não existe procedimento de gerência de prazo de validade de medicamentos." },
  { id: "07", textoSim: "O farmacêutico possui procedimento que contemple a segregação, identificação e inutilização de todos os medicamentos e produtos com prazos de validade expirados, de acordo com o PGRSS.", textoNao: "O farmacêutico não possui procedimento que contemple a segregação, identificação e inutilização de todos os medicamentos e produtos com prazos de validade expirados, de acordo com o PGRSS." },
  { id: "08", textoSim: "O estabelecimento dispensa medicamentos termossensíveis.", textoNao: "O estabelecimento não dispensa medicamentos termossensíveis." },
  { id: "09", textoSim: "O farmacêutico mantém os medicamentos termossensíveis armazenados de modo a garantir a sua integridade, qualidade e eficácia.", textoNao: "O farmacêutico não mantém os medicamentos termossensíveis armazenados de modo a garantir a sua integridade, qualidade e eficácia." },
  { id: "10", textoSim: "Oferece serviços farmacêuticos.", textoNao: "Não oferece serviços farmacêuticos." },
  { id: "11", textoSim: "O farmacêutico possui procedimento que garante que os serviços realizados estão de acordo com legislação sanitária e profissional.", textoNao: "O farmacêutico não possui procedimento que garante que os serviços realizados estão de acordo com legislação sanitária e profissional." },
  { id: "12", textoSim: "O farmacêutico realiza o registro, análise e avaliação de todos os parâmetros aferidos e orienta o paciente.", textoNao: "O farmacêutico não realiza o registro, análise e avaliação de todos os parâmetros aferidos e não orienta o paciente." },
  { id: "13", textoSim: "As substituições de medicamentos prescritos (intercambialidade) são feitas pelo farmacêutico de acordo com a legislação sanitária.", textoNao: "As substituções de medicamentos prescritos (intercambialidade) não são feitas por profissional farmacêutico, estando em desacordo com a legislação sanitária." },
  { id: "14", textoSim: "O estabelecimento dispensa substâncias e produtos sujeitos a regime especial de controle (Portaria M.S. 344/1998).", textoNao: "O estabelecimento não dispensa substâncias e produtos sujeitos a regime especial de controle (Portaria M.S. 344/1998)." },
  { id: "15", textoSim: "O farmacêutico mantém todos os medicamentos sujeitos a controle especial (Portaria 344/98 e atualizações) acondicionados em armário ou sala específica com chave.", textoNao: "O farmacêutico não mantém todos os medicamentos sujeitos a controle especial (Portaria 344/98 e atualizações) acondicionados em armário ou sala específica com chave." },
  { id: "16", textoSim: "A chave se encontra com o(s) farmacêutico(s).", textoNao: "A chave não se encontra com o(s) farmacêutico(s)." },
  { id: "17", textoSim: "O farmacêutico realiza escrituração da Portaria 344/98 e/ou antimicrobianos, no sistema SNGPC com frequência no máximo semanal.", textoNao: "O farmacêutico realiza escrituração da Portaria 344/98 e/ou antimicrobianos, no sistema SNGPC com frequência acima de uma semana." },
  { id: "18", textoSim: "Possui Certificado de Escrituração Digital.", textoNao: "Não Possui Certificado de Escrituração Digital." },
  { id: "19", textoSim: "O farmacêutico consegue emitir relatórios de estoque de medicamentos da Portaria 344/98 para conferência de estoque, anexar uma cópia com a conferência dos principais itens.", textoNao: "O farmacêutico não consegue emitir relatórios de estoque de medicamentos da Portaria 344/98 para conferência de estoque, relatar os motivos da não emissão." },
  { id: "20", textoSim: "Foram avaliados os receituários da portaria 344/98 e/ou antimicrobianos nesta inspeção.", textoNao: "Não foram avaliados os receituários da portaria 344/98 e/ou antimicrobianos nesta inspeção." },
  { id: "21", textoSim: "O farmacêutico realiza previamente a verificação legal de todos os receituários e notificações de receita dos medicamentos sujeitos a controle especial.", textoNao: "O farmacêutico não realiza previamente a verificação legal de todos os receituários e notificações de receita dos medicamentos sujeitos a controle especial." },
  { id: "22", textoSim: "O farmacêutico realiza previamente a verificação técnica de todos os receituários e notificações de receita dos medicamentos sujeitos a controle especial.", textoNao: "O farmacêutico não realiza previamente a verificação técnica de todos os receituários e notificações de receita dos medicamentos sujeitos a controle especial." },
  { id: "23", textoSim: "O farmacêutico realiza a validação (apondo carimbo e assinatura) previamente de todos os receituários e notificações de receita e respectiva autorização para dispensar os medicamentos sujeitos a controle especial.", textoNao: "O farmacêutico não realiza a validação (apondo carimbo e assinatura) previamente de todos os receituários e notificações de receita e respectiva autorização para dispensar os medicamentos sujeitos a controle especial." },
  { id: "24", textoSim: "Possui Manual de Boas Práticas e/ou POPs disponível, atualizados e que contemple todas as atividades executadas.", textoNao: "Não possui Manual de Boas Práticas e/ou POPs disponível, atualizados e que contemple todas as atividades executadas." },
  { id: "25", textoSim: "O farmacêutico efetua treinamento da sua equipe sobre os POPs, registrando-os.", textoNao: "O farmacêutico não efetua treinamento da sua equipe sobre os POPs, registrando-os." },
  { id: "26", textoSim: "O estabelecimento atende a integralidade dos quesitos sanitários avaliados.", textoNao: "O estabelecimento apresenta inconformidades em quesitos essenciais do checklist sanitário." }
];

export const getMockData = (): {
  estabelecimentos: Estabelecimento[];
  termos: TermoSanitario[];
  checklists: FarmaciaChecklist[];
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

  const checklists: FarmaciaChecklist[] = [
    {
      estabelecimentoId: "12409",
      termo: "INS-2026-TEF01",
      nomeRt: "DR. JEFFERSON AYRES CASTRO",
      inscricaoRt: "AM-4509",
      numFicha: "FCH-1090",
      dtInicio: "15/05/2026 09:30:00",
      dtFim: "15/05/2026 11:45:00",
      data: "15/05/2026",
      arquivarFVPE: "S",
      outros: "Observações gerais: O estabelecimento foi aprovado em 23 das 25 questões normativas do roteiro.",
      respostas: {
        "01": "S", "02": "S", "03": "S", "04": "S", "05": "N", // Falha de alertas
        "06": "S", "07": "S", "08": "S", "09": "S", "10": "S",
        "11": "S", "12": "S", "13": "S", "14": "S", "15": "S",
        "16": "S", "17": "S", "18": "N", // Sem escrituração digital visível
        "19": "S", "20": "S", "21": "S", "22": "S", "23": "S",
        "24": "S", "25": "S", "26": "N"
      },
      totalAnaliseReceita: 35,
      totalAnaliseNotificacao: 15,
      totalAnaliseAntimicrobiano: 40,
      irregularidades: {
        a: { categoria: "Com rasuras e/ou adulterações", receita: 0, notificacao: 0, antimicrobiano: 0 },
        b: { categoria: "Sem data de prescrição", receita: 1, notificacao: 0, antimicrobiano: 0 },
        c: { categoria: "Aviadas fora do prazo legal", receita: 0, notificacao: 0, antimicrobiano: 0 },
        d: { categoria: "Sem identificação correta do emitente", receita: 0, notificacao: 0, antimicrobiano: 1 },
        e: { categoria: "Sem identificação correta do comprador", receita: 0, notificacao: 1, antimicrobiano: 0 },
        f: { categoria: "Sem identificação correta do fornecedor", receita: 0, notificacao: 0, antimicrobiano: 0 },
        g: { categoria: "Aviadas em quantidade acima do limite", receita: 0, notificacao: 0, antimicrobiano: 0 },
        h: { categoria: "Aviadas acima de concentração farmacológica", receita: 0, notificacao: 0, antimicrobiano: 0 },
        i: { categoria: "Sem a rubrica do farmacêutico", receita: 0, notificacao: 0, antimicrobiano: 0 },
        j: { categoria: "Provenientes de outra unidade federativa", receita: 0, notificacao: 0, antimicrobiano: 0 },
        k: { categoria: "Sem número de lote anotado", receita: 2, notificacao: 1, antimicrobiano: 3 },
        l: { categoria: "Prescrição em nome comercial", receita: 0, notificacao: 0, antimicrobiano: 0 }
      }
    },
    {
      estabelecimentoId: "39401",
      termo: "INS-2026-TEF02",
      nomeRt: "DRA. ANA CAROLINA REBOUCAS",
      inscricaoRt: "AM-8730",
      numFicha: "FCH-1092",
      dtInicio: "15/05/2026 14:15:00",
      dtFim: "15/05/2026 16:30:00",
      data: "15/05/2026",
      arquivarFVPE: "N",
      outros: "Inconformidade grave: RT ausente no momento. Falhas recorrentes no armário de injetáveis.",
      respostas: {
        "01": "S", "02": "N", // Falha de licença sanitária atualizada
        "03": "S", "04": "N", "05": "N", "06": "N", "07": "N",
        "08": "S", "09": "N", "10": "N", "11": "N", "12": "N",
        "13": "N", "14": "S", "15": "N", // Armário destrancado!
        "16": "N", "17": "N", "18": "N", "19": "N", "20": "S",
        "21": "N", "22": "N", "23": "N", "24": "N", "25": "N",
        "26": "N"
      },
      totalAnaliseReceita: 20,
      totalAnaliseNotificacao: 5,
      totalAnaliseAntimicrobiano: 18,
      irregularidades: {
        a: { categoria: "Com rasuras e/ou adulterações", receita: 2, notificacao: 1, antimicrobiano: 1 },
        b: { categoria: "Sem data de prescrição", receita: 1, notificacao: 0, antimicrobiano: 2 },
        c: { categoria: "Aviadas fora do prazo legal", receita: 3, notificacao: 1, antimicrobiano: 1 },
        d: { categoria: "Sem identificação correta do emitente", receita: 1, notificacao: 0, antimicrobiano: 0 },
        e: { categoria: "Sem identificação correta do comprador", receita: 2, notificacao: 1, antimicrobiano: 1 },
        f: { categoria: "Sem identificação correta do fornecedor", receita: 0, notificacao: 0, antimicrobiano: 0 },
        g: { categoria: "Aviadas em quantidade acima do limite", receita: 0, notificacao: 0, antimicrobiano: 1 },
        h: { categoria: "Aviadas acima de concentração farmacológica", receita: 0, notificacao: 0, antimicrobiano: 0 },
        i: { categoria: "Sem a rubrica do farmacêutico", receita: 4, notificacao: 2, antimicrobiano: 2 },
        j: { categoria: "Provenientes de outra unidade federativa", receita: 1, notificacao: 0, antimicrobiano: 0 },
        k: { categoria: "Sem número de lote anotado", receita: 5, notificacao: 2, antimicrobiano: 4 },
        l: { categoria: "Prescrição em nome comercial", receita: 3, notificacao: 0, antimicrobiano: 1 }
      }
    }
  ];

  return { estabelecimentos, termos, checklists, rts };
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
