export const defaultEvaluationItems = [
  {
    id: "hasFaltaReceituario",
    title: "Ausência de Receituários Especiais (Gestão Municipal)",
    description: "Falta de blocos de prescrições apropriados fornecidos pela Prefeitura.",
    paragraph: "Outro ponto preocupante é a ausência de receituários adequados para a prescrição de medicamentos sujeitos a controle especial, pela Prefeitura do municipio. Essa lacuna dificulta o acesso dos pacientes a esses medicamentos essenciais, comprometendo o tratamento adequado. Ademais, a falta de um sistema de prescrição apropriado pode contribuir para irregularidades sanitárias. Assim, é fundamental que medidas sejam adotadas para garantir a disponibilização de receituários apropriados, assegurando assim a conformidade com as normas sanitárias e o acesso seguro aos medicamentos controlados.",
    order: 1
  },
  {
    id: "hasDeficienciaInjetaveis",
    title: "Deficiências em Salas de Injetáveis e Declaração de Serviço (Drogarias)",
    description: "Espaço inadequado, ausência de pias, falta de privacidade.",
    paragraph: "Por conseguinte, constatou-se que algumas das drogarias fiscalizadas apresentavam deficiências na infraestrutura das salas de injetáveis, incluindo espaço inadequado, ausência de pia para lavagem das mãos e falta de um ambiente que garanta a privacidade do cliente, como determinado pela RDC 44/2009 da ANVISA. Além disso, constatou-se, ainda, que nem todas as drogarias realizavam a prestação dos serviços farmacêuticos com a emissão da Declaração do Serviço Farmacêutico Prestado, conforme exigido pela mesma resolução.",
    order: 2
  },
  {
    id: "hasFaltaAfeAlvarares",
    title: "Ausência de AFE expedida pela ANVISA e Alvará Sanitário",
    description: "Estabelecimentos operando sem Autorização de Funcionamento ou Alvarás Locais regulares.",
    paragraph: "No tocante a Autorização de Funcionamento da ANVISA (AFE) emitida pela ANVISA, identificou-se, durante inspeção, que nem todos os estabelecimentos privados possuíam essa autorização de funcionamento, estando em desconformidade com a RDC 44/2009 ANVISA, sendo necessário adequação da Vigilância Sanitária, quanto a emissão do Alvará Sanitário, uma vez que trata-se de um documento obrigatório para o licenciamento de farmácias e drogarias.",
    order: 3
  },
  {
    id: "hasIrregularidadeLabInfra",
    title: "Irregularidades Críticas de Infraestrutura (Laboratório de Análises)",
    description: "Infiltrações graves, armazenamento impróprio de reagentes, falta de controle.",
    paragraph: "Por conseguinte, no(s) [LABS_INFRA] constatou-se situações críticas de infraestrutura e gestão da qualidade. As irregularidades observadas incluíam infiltrações significativas no ambiente, armazenamento inadequado de reagentes, falta de separação apropriada das áreas, dimensões inadequadas das salas e bancadas, ausência de controle de temperatura na geladeira destinada aos reagentes, ausência de equipamentos compatíveis com a rotina, além de iluminação, piso e paredes em condições inadequadas. Essas irregularidades comprometem a qualidade dos serviços e produtos oferecidos, representando riscos à saúde de usuários e trabalhadores.",
    order: 4
  },
  {
    id: "hasLeituraLaminasSemFarmac",
    title: "Leitura de Lâminas por Profissional Não Habilitado (Laboratório)",
    description: "Análises realizadas apenas por biomédicas/técnicos, emissão irregular de laudos em branco.",
    paragraph: "Além do mais, verificou-se, ainda que no(s) [LABS_LAMINAS], as análises laboratoriais, bem como a leitura das lâminas estavam sendo realizadas apenas por técnicos em patologia, sem a presença de um profissional farmacêutico ou outro legalmente habilitado. Além disso, foram encontrados laudos em branco assinados pelas Biomédicas, havendo indícios de emissão de laudo de forma irregular.",
    order: 5
  },
  {
    id: "hasFaltaFarmacUbs",
    title: "Ausência de Farmacêuticos nas Unidades Básicas de Saúde (UBS)",
    description: "Apenas um profissional na CAF; demais UBS sem assistência.",
    paragraph: "No setor público, constatou-se que o Município conta com apenas uma farmacêutica, que atua na Central de Abastecimento Farmacêutico (CAF), logo as demais Unidades Básicas de Saúde (UBS) não dispõem de um farmacêutico. Ressalta-se que a presença dos farmacêuticos não apenas assegura a oferta de medicamentos de qualidade, mas também viabiliza um atendimento especializado em assistência farmacêutica. Isso permite que os cidadãos recebam orientações seguras e eficazes sobre o uso correto dos medicamentos, promovendo um cuidado integral à saúde e contribuindo para a melhoria da qualidade de vida no município.",
    order: 6
  },
  {
    id: "hasOrientacaoCftRemume",
    title: "Orientação para Instituição da CFT e REMUME",
    description: "Necessidade de Comissão de Farmácia e Terapêutica.",
    paragraph: "Ainda considerando a avaliação das condições de gestão da Assistência Farmacêutica do Município, foi orientado a instituição da Comissão de Farmácia e Terapêutica (CFT) em âmbito Municipal, a qual tem caráter técnico e consultivo, responsável por assessorar a gestão municipal na definição de políticas relacionadas ao uso racional de medicamentos, bem como na seleção, padronização e revisão periódica da Relação Municipal de Medicamentos Essenciais (REMUME), que é o instrumento norteador para planejamento, programação, aquisição e dispensação de medicamentos na rede pública.",
    order: 7
  },
  {
    id: "hasImplementacaoHorus",
    title: "Sugestão de Implementação do Sistema HÓRUS",
    description: "Controle de rastreabilidade e estoques.",
    paragraph: "Outro aspecto de grande relevância, sugerido durante a inspeção no Município, foi quanto a implementação do Sistema HÓRUS desenvolvido pelo Ministério da Saúde. Esse sistema permitirá o controle e monitoramento de estoques, rastreabilidade, geração de indicadores de consumo e emissão de relatórios gerenciais que subsidiarão a tomada de decisões estratégicas dentro da Assistência Farmacêutica, permitindo uma gestão eficiente do estoque, bem como no uso racional de recursos públicos.",
    order: 8
  },
  {
    id: "hasFragilidadeHospital",
    title: "Fragilidades na Rotina da Farmácia Hospitalar (Falta de Farmacêuticos)",
    description: "Necessidade de contratação de mais profissionais para dispensação, segurança e gestão.",
    paragraph: "Por conseguinte, na farmácia hospitalar da(s) [HOSPITAIS] foi evidenciado avanços importantes, como a presença de farmacêutico durante a atividade e a implementação de rotinas básicas de dispensação e registro. Entretanto, foram constatadas, ainda, fragilidades significativas que impactam diretamente a segurança do paciente e o cumprimento das normas sanitárias, destacando a necessidade de contratação de mais profissionais, já que o quantitativo atual é insuficiente para atender às demandas de análise de prescrições, fracionamento, controle de medicamentos e atividades relacionadas à segurança do paciente.",
    order: 9
  },
  {
    id: "hasCaronaLicitacao",
    title: "Recomendação de Adesão/Caronas em Licitações de Medicamentos",
    description: "Medida sugerida em reunião com o Secretário para evitar desabastecimento.",
    paragraph: "Por fim, em reunião com o Secretário de Saúde, como medida para redução de custos, considerando que o repasse do Estado para aquisição de medicamentos e produtos para a saúde é significativamente inferior ao necessário, foi recomendada a adoção da prática de solicitar caronas em licitações e pregões eletrônicos. Essa estratégia deve ser implementada sempre em observância ao princípio da economicidade e da legalidade, conforme previsto na Lei nº 14.133/2021, e respeitando o preço máximo ao governo. Tal medida visa evitar o desabastecimento de itens críticos.",
    order: 10
  },
  {
    id: "hasVendaSupermercado",
    title: "Venda Irregular de Medicamentos em Supermercados",
    description: "Prática ilegal e risco à saúde.",
    paragraph: "É oportuno mencionar que no referido Município foi identificado a venda irregular de medicamentos em supermercados, cuja prática é proibida no Brasil e representa um grave risco à saúde da população. De acordo com a legislação sanitária vigente, a venda de qualquer medicamento deve ocorrer exclusivamente em farmácias e drogarias, estabelecimentos devidamente regulamentados. Assim, é de fundamental importância que as autoridades sanitárias intensifiquem a fiscalização para coibir essa prática e que haja comunicação ao Ministério Público Estadual.",
    order: 11
  },
  {
    id: "hasApeloFiscalizacao",
    title: "Apelo a Vigilância Sanitária para Intensificação",
    description: "Fechamento solicitando ações de coibição.",
    paragraph: "Por fim, é de fundamental importância que as autoridades sanitárias intensifiquem a fiscalização nos estabelecimentos citados, a fim de coibir as irregularidades sanitárias que podem comprometer a saúde da população e garantir que as normas e regulamentações sejam cumpridas, assegurando a qualidade dos serviços prestados e a segurança dos pacientes.",
    order: 12
  }
];
