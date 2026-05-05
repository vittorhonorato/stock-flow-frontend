export type TipoDocumentoFornecedor = 'CPF' | 'CNPJ';
export type SituacaoCadastralFornecedor = 'NULA' | 'ATIVA' | 'SUSPENSA' | 'INAPTA' | 'BAIXADA';

export interface FornecedorRequest {
  nome: string;
  documento: string;
  tipoDocumento: TipoDocumentoFornecedor;
  situacaoCadastral: SituacaoCadastralFornecedor;
  email?: string;
  telefone?: string;
  street?: string;
  city?: string;
  state?: string;
}
