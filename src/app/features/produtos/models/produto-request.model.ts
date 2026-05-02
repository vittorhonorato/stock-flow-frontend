export interface ProdutoRequest {
  nome: string;
  sku: string;
  descricao?: string;
  precoDeCusto: number;
  precoDeVenda: number;
  quantidadeMinima: number;
  categoriaId: number;
  fornecedorId: number;
}
