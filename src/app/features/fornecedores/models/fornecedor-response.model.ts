import {
  SituacaoCadastralFornecedor,
  TipoDocumentoFornecedor
} from './fornecedor-request.model';

export interface FornecedorResponse {
  id: number;
  nome: string;
  documento: string;
  tipoDocumento: TipoDocumentoFornecedor;
  situacaoCadastral: SituacaoCadastralFornecedor;
  email?: string;
  telefone?: string;
  street?: string;
  city?: string;
  state?: string;
  ativo: boolean;
  dataUltimaValidacao?: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
}
