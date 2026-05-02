import { TipoDocumentoFornecedor } from './fornecedor-request.model';

export interface FornecedorFilter {
  termo?: string;
  tipoDocumento?: TipoDocumentoFornecedor;
  page: number;
  size: number;
}
