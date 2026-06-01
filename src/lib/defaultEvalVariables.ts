import { EvalVariable } from "../types";

export const defaultEvalVariables: EvalVariable[] = [
  {
    id: "LABS_INFRA",
    name: "Laboratórios (Infraestrutura Crítica)",
    formatPattern: "Laboratório {nome} (CNPJ {cnpj})",
    fields: [
      { key: "nome", label: "Nome do Lab", placeholder: "Nome do Lab" },
      { key: "cnpj", label: "CNPJ", placeholder: "CNPJ" }
    ]
  },
  {
    id: "LABS_LAMINAS",
    name: "Laboratórios (Leitura de Lâminas)",
    formatPattern: "Laboratório {nome}",
    fields: [
      { key: "nome", label: "Nome do Lab", placeholder: "Nome do Lab" }
    ]
  },
  {
    id: "HOSPITAIS",
    name: "Hospitais",
    formatPattern: "Unidade Hospitalar de {nome}",
    fields: [
      { key: "nome", label: "Unidade Hospitalar de...", placeholder: "Unidade Hospitalar de..." }
    ]
  }
];
