export interface ProdutoResponse {
  id: number;
  nome: string;
  sku: string;
  descricao?: string;
  imagemUrl?: string;
  precoDeCusto: number;
  precoDeVenda: number;
  quantidadeAtual: number;
  quantidadeMinima: number;
  ativo: boolean;
  categoriaId: number;
  categoriaNome: string;
  fornecedorId: number;
  fornecedorNome: string;
  dataCriacao?: string;
  dataAtualizacao?: string;
}
