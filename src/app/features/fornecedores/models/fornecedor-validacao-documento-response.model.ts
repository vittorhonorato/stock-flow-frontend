import {
  SituacaoCadastralFornecedor,
  TipoDocumentoFornecedor
} from './fornecedor-request.model';

export interface ValidacaoDocumentoFornecedorResponse {
  documento: string;
  nome: string;
  tipoDocumento: TipoDocumentoFornecedor;
  situacaoCadastral: SituacaoCadastralFornecedor;
  email?: string;
  telefone?: string;
  street?: string;
  city?: string;
  state?: string;
  documentoValido: boolean;
  permiteCadastro: boolean;
  dataValidacao?: string;
}
