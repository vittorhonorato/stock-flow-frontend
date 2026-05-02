import { TipoDocumentoFornecedor } from './fornecedor-request.model';

export interface FornecedorResponse {
  id: number;
  nome: string;
  documento: string;
  tipoDocumento: TipoDocumentoFornecedor;
  situacaoCadastral: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
  ativo: boolean;
}
