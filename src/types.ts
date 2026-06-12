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
  inscricaoRtPresente?: string;
  rtPresente: string;
  inspetorFiscalizacao: string;
  encontrava?: string;
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

export interface EvalItem {
  id: string;
  title: string;
  description: string;
  paragraph: string;
  order: number;
  defaultChecked?: boolean;
  category?: string;
  isHidden?: boolean;
}

export interface EvalVariableField {
  key: string;
  label: string;
  placeholder?: string;
}

export interface EvalVariable {
  id: string; // e.g. "LABS_INFRA" - placeholder will be [LABS_INFRA]
  name: string;
  formatPattern: string; // e.g. "Laboratório {nome} (CNPJ {cnpj})"
  fields: EvalVariableField[];
  type?: "text" | "table" | "condition"; // type of the variable
  
  // Condições
  conditionRefVar?: string;
  conditionOperator?: "equals" | "greater_than" | "less_than";
  conditionTargetValue?: string;
  conditionTrueText?: string;
  conditionFalseText?: string;
}

