import { TipoMovimentacaoEstoque } from './tipo-movimentacao.model';

export interface HistoricoEstoqueResponse {
  id: number;
  produtoId: number;
  produtoNome: string;
  produtoSku: string;
  tipoMovimentacao: TipoMovimentacaoEstoque;
  quantidade: number;
  quantidadeAtualProduto: number;
  motivo: string;
  dataMovimentacao: string;
}
