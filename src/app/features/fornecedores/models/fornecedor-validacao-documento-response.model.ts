import { TipoDocumentoFornecedor } from './fornecedor-request.model';

export interface ValidacaoDocumentoFornecedorResponse {
  documento: string;
  nome: string;
  tipoDocumento: TipoDocumentoFornecedor;
  situacaoCadastral: string;
  documentoValido: boolean;
  permiteCadastro: boolean;
  dataValidacao?: string;
}
