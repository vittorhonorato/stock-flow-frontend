import { Component, OnInit } from '@angular/core';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/errors/api-error';
import { ProdutoResponse } from '../../../produtos/models/produto-response.model';
import { ProdutoService } from '../../../produtos/services/produto.service';

@Component({
  selector: 'app-estoque-baixo-page',
  templateUrl: './estoque-baixo-page.component.html',
  styleUrls: ['./estoque-baixo-page.component.scss']
})
export class EstoqueBaixoPageComponent implements OnInit {
  readonly displayedColumns = [
    'produto',
    'sku',
    'estoqueAtual',
    'estoqueMinimo',
    'fornecedor',
    'acoes'
  ];

  produtosAbaixoMinimo: ProdutoResponse[] = [];
  loading = false;
  erroMensagem: string | null = null;
  sucessoMensagem: string | null = null;
  produtoSelecionado: ProdutoResponse | null = null;

  constructor(private readonly produtoService: ProdutoService) {}

  ngOnInit(): void {
    this.carregarEstoqueBaixo();
  }

  atualizar(): void {
    this.carregarEstoqueBaixo();
  }

  abrirDetalhes(produto: ProdutoResponse): void {
    this.produtoSelecionado = produto;
  }

  fecharDetalhes(): void {
    this.produtoSelecionado = null;
  }

  gerarSolicitacao(): void {
    if (!this.produtoSelecionado) {
      return;
    }

    this.sucessoMensagem =
      `Solicitação para reposição de "${this.produtoSelecionado.nome}" registrada localmente. ` +
      'Integração de compras será habilitada na próxima fase.';
    this.produtoSelecionado = null;
  }

  exportarCsv(): void {
    if (this.produtosAbaixoMinimo.length === 0) {
      return;
    }

    const cabecalho = ['Produto', 'SKU', 'Estoque Atual', 'Estoque Minimo', 'Faltante', 'Fornecedor'];
    const linhas = this.produtosAbaixoMinimo.map((produto) => [
      produto.nome,
      produto.sku,
      produto.quantidadeAtual,
      produto.quantidadeMinima,
      this.getQuantidadeFaltante(produto),
      produto.fornecedorNome
    ]);

    const csv = [cabecalho, ...linhas]
      .map((linha) => linha.map((coluna) => this.escapeCsv(coluna)).join(';'))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estoque-baixo-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  getQuantidadeFaltante(produto: ProdutoResponse): number {
    return Math.max(produto.quantidadeMinima - produto.quantidadeAtual, 0);
  }

  private carregarEstoqueBaixo(): void {
    this.loading = true;
    this.erroMensagem = null;
    this.sucessoMensagem = null;

    this.produtoService
      .listar({ page: 0, size: 200 })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.produtosAbaixoMinimo = response.content
            .filter((produto) => produto.ativo && produto.quantidadeAtual < produto.quantidadeMinima)
            .sort(
              (produtoA, produtoB) =>
                this.getQuantidadeFaltante(produtoB) - this.getQuantidadeFaltante(produtoA)
            );
        },
        error: (error) => {
          this.produtosAbaixoMinimo = [];
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage(
            'carregar os alertas de estoque baixo'
          );
        }
      });
  }

  private escapeCsv(valor: string | number): string {
    return `"${String(valor).replace(/"/g, '""')}"`;
  }
}
