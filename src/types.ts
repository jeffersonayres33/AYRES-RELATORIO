/**
 * Types representing the data models migrated from the Delphi 2010 inspection system.
 */

export interface TechnicalResponsible {
  nome: string;
  crf: string;
  estabelecimentoId: string; // Relates to Inscricao in Estabelecimento
  segunda: string;
  terca: string;
  quarta: string;
  quinta: string;
  sexta: string;
  sabado: string;
  domingo: string;
}

export interface Estabelecimento {
  inscricao: string; // Key ID
  fantasia: string;
  razaoSocial: string;
  cidade: string;
  bairro: string;
  endereco: string;
  cnpj: string;
  nomeArea?: string;
  rtList?: TechnicalResponsible[];
  origem?: "SISCON" | "FEM_NOVO";
  isClandestina?: boolean;
  encontrava?: string;
}

export interface TermoSanitario {
  estabelecimentoId: string; // Relates to Inscricao
  nrSeqTermo: string;
  nrSeqIntimacao: string;
  nrSeqAuto: string;
  dtInicio: string;  // Formatos: "dd/mm/yyyy hh:mm:ss" ou "dd/mm/yyyy"
  dtFim: string;
  lote: string;
  obs: string;
  informacoesPrestadasPor: string;
  cargoFuncao: string;
  ifpRg: string;
  ifpCpf: string;
  nomeRtPresente: string;
  rtPresente: string;
  inspetorFiscalizacao: string;
  encontrava?: string;
}

export interface ChecklistQuestao {
  id: string; // "01" a "25"
  textoSim: string;
  textoNao: string;
}

export interface FarmaciaChecklist {
  estabelecimentoId: string;
  termo: string;
  nomeRt: string;
  inscricaoRt: string;
  numFicha: string;
  dtInicio: string;
  dtFim: string;
  data: string;
  arquivarFVPE: string;
  outros: string;
  
  // Checklist boolean flags (S / N)
  respostas: Record<string, "S" | "N">; // keys like "01" to "25"
  
  // Prescription audit totals
  totalAnaliseReceita: number;
  totalAnaliseNotificacao: number;
  totalAnaliseAntimicrobiano: number;
  
  // Specific irregularities (a to l)
  irregularidades: Record<string, {
    categoria: string; // e.g. "Com rasuras e/ou adulterações"
    receita: number;
    notificacao: number;
    antimicrobiano: number;
  }>;
}

export interface PhotographicEvidence {
  id: string;
  name: string;
  url: string;
  lastModifiedDate: Date; // Used for automatic inspection matching
  size: number;
}

export interface IntegratedInspection {
  estabelecimento: Estabelecimento;
  termo?: TermoSanitario;
  checklist?: FarmaciaChecklist;
  photos: PhotographicEvidence[];
}

export interface CitySummary {
  cidade: string;
  inspecoes: number;
  intimacoes: number;
  autos: number;
  novosEstabelecimentos: number;
}

export interface LicenseStatus {
  isActivated: boolean;
  serialNumber: string;
  licenseDaysLeft: number;
  expiresAt?: string;
  activationKeyUsed?: string;
}
