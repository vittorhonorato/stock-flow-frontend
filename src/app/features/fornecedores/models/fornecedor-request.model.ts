export type TipoDocumentoFornecedor = 'CPF' | 'CNPJ';

export interface FornecedorRequest {
  nome: string;
  documento: string;
  tipoDocumento: TipoDocumentoFornecedor;
  situacaoCadastral: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
}
