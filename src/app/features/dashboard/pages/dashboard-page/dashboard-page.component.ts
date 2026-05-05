import { Component, OnInit } from '@angular/core';
import { EMPTY, Observable, catchError, expand, finalize, forkJoin, from, map, mergeMap, of, reduce, toArray } from 'rxjs';
import { ApiError } from '../../../../core/errors/api-error';
import { HistoricoEstoqueResponse } from '../../../estoque/models/historico-estoque-response.model';
import { EstoqueService } from '../../../estoque/services/estoque.service';
import { FornecedorResponse } from '../../../fornecedores/models/fornecedor-response.model';
import { FornecedorService } from '../../../fornecedores/services/fornecedor.service';
import { ProdutoResponse } from '../../../produtos/models/produto-response.model';
import { ProdutoService } from '../../../produtos/services/produto.service';

interface DashboardResumoCard {
  readonly titulo: string;
  readonly valor: string;
  readonly subtitulo: string;
  readonly icone: string;
  readonly variante: 'primary' | 'warning' | 'danger' | 'info';
  readonly destaque?: string;
}

interface DashboardMovimentacao {
  readonly produto: string;
  readonly sku: string;
  readonly tipo: 'Entrada' | 'Saída' | 'Ajuste';
  readonly quantidade: number;
  readonly data: string;
  readonly motivo: string;
  readonly iconeProduto: string;
}

interface DashboardAtalho {
  readonly label: string;
  readonly icone: string;
  readonly rota: string;
  readonly variante: 'purple' | 'green' | 'blue' | 'amber';
}

interface DashboardEstoqueSlice {
  readonly label: string;
  readonly quantidade: number;
  readonly color: string;
}

@Component({
  selector: 'app-dashboard-page',
  templateUrl: './dashboard-page.component.html',
  styleUrls: ['./dashboard-page.component.scss']
})
export class DashboardPageComponent implements OnInit {
  readonly atalhos: readonly DashboardAtalho[] = [
    { label: 'Novo Produto', icone: 'inventory_2', rota: '/produtos', variante: 'purple' },
    { label: 'Nova Movimentação', icone: 'sync_alt', rota: '/estoque', variante: 'green' },
    { label: 'Novo Fornecedor', icone: 'local_shipping', rota: '/fornecedores', variante: 'blue' },
    { label: 'Nova Categoria', icone: 'folder_open', rota: '/categorias', variante: 'amber' }
  ];

  resumoCards: DashboardResumoCard[] = [];
  movimentacoes: DashboardMovimentacao[] = [];
  estoqueSlices: DashboardEstoqueSlice[] = [];

  erroMensagem: string | null = null;
  loading = false;
  ultimaAtualizacao = '';

  readonly pageSize = 5;
  currentPage = 1;

  constructor(
    private readonly produtoService: ProdutoService,
    private readonly fornecedorService: FornecedorService,
    private readonly estoqueService: EstoqueService
  ) {}

  ngOnInit(): void {
    this.carregarDashboard();
  }

  get movimentacoesPaginadas(): DashboardMovimentacao[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.movimentacoes.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    const total = Math.ceil(this.movimentacoes.length / this.pageSize);
    return Math.max(total, 1);
  }

  get pagesToShow(): number[] {
    const maxPages = 3;
    const limite = Math.min(this.totalPages, maxPages);
    return Array.from({ length: limite }, (_, index) => index + 1);
  }

  get exibirEllipsis(): boolean {
    return this.totalPages > this.pagesToShow.length;
  }

  get totalEstoque(): number {
    return this.estoqueSlices.reduce((acc, item) => acc + item.quantidade, 0);
  }

  get donutGradient(): string {
    if (!this.estoqueSlices.length || this.totalEstoque === 0) {
      return 'conic-gradient(#e2e8f0 0% 100%)';
    }

    let start = 0;
    const segments = this.estoqueSlices.map((item) => {
      const percent = (item.quantidade / this.totalEstoque) * 100;
      const end = start + percent;
      const segment = `${item.color} ${start}% ${end}%`;
      start = end;
      return segment;
    });

    return `conic-gradient(${segments.join(', ')})`;
  }

  getTipoBadge(tipo: DashboardMovimentacao['tipo']): 'success' | 'danger' | 'info' {
    switch (tipo) {
      case 'Entrada':
        return 'success';
      case 'Saída':
        return 'danger';
      default:
        return 'info';
    }
  }

  getPercentual(quantidade: number): string {
    if (!this.totalEstoque) {
      return '0%';
    }

    const percentual = (quantidade / this.totalEstoque) * 100;
    return `${Math.round(percentual)}%`;
  }

  selecionarPagina(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.currentPage = page;
  }

  proximaPagina(): void {
    this.selecionarPagina(this.currentPage + 1);
  }

  paginaAnterior(): void {
    this.selecionarPagina(this.currentPage - 1);
  }

  recarregar(): void {
    this.carregarDashboard();
  }

  private carregarDashboard(): void {
    this.loading = true;
    this.erroMensagem = null;

    forkJoin({
      produtos: this.carregarTodosProdutos(),
      fornecedores: this.carregarTodosFornecedores()
    })
      .pipe(
        mergeMap(({ produtos, fornecedores }) => {
          const produtosAtivos = produtos.filter((produto) => produto.ativo);
          this.atualizarResumo(produtos, produtosAtivos, fornecedores);
          this.atualizarGraficoEstoque(produtosAtivos);

          return this.carregarUltimasMovimentacoes(produtosAtivos);
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (movimentacoes) => {
          this.movimentacoes = movimentacoes;
          this.currentPage = 1;
          this.ultimaAtualizacao = this.formatarDataHora(new Date().toISOString());
        },
        error: (error) => {
          this.resumoCards = [];
          this.movimentacoes = [];
          this.estoqueSlices = [];
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage(
            'carregar os dados do dashboard'
          );
        }
      });
  }

  private carregarTodosProdutos(size = 200): Observable<ProdutoResponse[]> {
    return this.produtoService.listar({ page: 0, size }).pipe(
      expand((pageResponse) => {
        if (pageResponse.last) {
          return EMPTY;
        }

        return this.produtoService.listar({
          page: pageResponse.number + 1,
          size
        });
      }),
      map((pageResponse) => pageResponse.content),
      reduce((allProducts, pageProducts) => allProducts.concat(pageProducts), [] as ProdutoResponse[])
    );
  }

  private carregarTodosFornecedores(size = 200): Observable<FornecedorResponse[]> {
    return this.fornecedorService.listar({ page: 0, size }).pipe(
      expand((pageResponse) => {
        if (pageResponse.last) {
          return EMPTY;
        }

        return this.fornecedorService.listar({
          page: pageResponse.number + 1,
          size
        });
      }),
      map((pageResponse) => pageResponse.content),
      reduce(
        (allFornecedores, pageFornecedores) => allFornecedores.concat(pageFornecedores),
        [] as FornecedorResponse[]
      )
    );
  }

  private carregarUltimasMovimentacoes(produtosAtivos: ProdutoResponse[]): Observable<DashboardMovimentacao[]> {
    if (!produtosAtivos.length) {
      return of([]);
    }

    return from(produtosAtivos).pipe(
      mergeMap(
        (produto) =>
          this.estoqueService.listarHistoricoPorProduto(produto.id, 0, 1).pipe(
            map((pageResponse) => pageResponse.content[0] ?? null),
            catchError(() => of(null))
          ),
        10
      ),
      toArray(),
      map((historicos) =>
        historicos
          .filter((historico): historico is HistoricoEstoqueResponse => historico !== null)
          .sort(
            (a, b) =>
              this.toTimestamp(b.dataMovimentacao) - this.toTimestamp(a.dataMovimentacao)
          )
          .slice(0, 20)
          .map((historico) => ({
            produto: historico.produtoNome,
            sku: historico.produtoSku,
            tipo: this.mapTipoMovimentacao(historico.tipoMovimentacao),
            quantidade: historico.quantidade,
            data: historico.dataMovimentacao,
            motivo: historico.motivo,
            iconeProduto: this.getIconeProduto(historico.produtoNome)
          }))
      )
    );
  }

  private atualizarResumo(
    produtos: ProdutoResponse[],
    produtosAtivos: ProdutoResponse[],
    fornecedores: FornecedorResponse[]
  ): void {
    const fornecedoresAtivos = fornecedores.filter((fornecedor) => fornecedor.ativo).length;
    const estoqueBaixo = produtosAtivos.filter(
      (produto) => produto.quantidadeAtual > 0 && produto.quantidadeAtual < produto.quantidadeMinima
    ).length;
    const semEstoque = produtosAtivos.filter((produto) => produto.quantidadeAtual === 0).length;

    const crescimento = this.calcularCrescimentoMensal(produtosAtivos);

    this.resumoCards = [
      {
        titulo: 'Total de Produtos',
        valor: this.formatarNumero(produtos.length),
        subtitulo: 'em relação ao mês passado',
        icone: 'inventory_2',
        variante: 'primary',
        destaque: crescimento
      },
      {
        titulo: 'Estoque Baixo',
        valor: this.formatarNumero(estoqueBaixo),
        subtitulo: 'Requer atenção',
        icone: 'warning_amber',
        variante: 'warning'
      },
      {
        titulo: 'Sem Estoque',
        valor: this.formatarNumero(semEstoque),
        subtitulo: 'Itens indisponíveis',
        icone: 'remove_circle_outline',
        variante: 'danger'
      },
      {
        titulo: 'Fornecedores',
        valor: this.formatarNumero(fornecedoresAtivos),
        subtitulo: 'Ativos',
        icone: 'groups',
        variante: 'info'
      }
    ];
  }

  private atualizarGraficoEstoque(produtosAtivos: ProdutoResponse[]): void {
    const estoqueNormal = produtosAtivos.filter(
      (produto) => produto.quantidadeAtual >= produto.quantidadeMinima && produto.quantidadeAtual > 0
    ).length;
    const estoqueBaixo = produtosAtivos.filter(
      (produto) => produto.quantidadeAtual > 0 && produto.quantidadeAtual < produto.quantidadeMinima
    ).length;
    const semEstoque = produtosAtivos.filter((produto) => produto.quantidadeAtual === 0).length;

    this.estoqueSlices = [
      { label: 'Estoque Normal', quantidade: estoqueNormal, color: '#22c55e' },
      { label: 'Estoque Baixo', quantidade: estoqueBaixo, color: '#eab308' },
      { label: 'Sem Estoque', quantidade: semEstoque, color: '#ef4444' }
    ];
  }

  private mapTipoMovimentacao(tipoMovimentacao: string): DashboardMovimentacao['tipo'] {
    if (tipoMovimentacao === 'ENTRADA') {
      return 'Entrada';
    }
    if (tipoMovimentacao === 'SAIDA') {
      return 'Saída';
    }
    return 'Ajuste';
  }

  private getIconeProduto(nomeProduto: string): string {
    const nomeNormalizado = nomeProduto.toLowerCase();

    if (nomeNormalizado.includes('mouse')) {
      return 'mouse';
    }
    if (nomeNormalizado.includes('teclado')) {
      return 'keyboard';
    }
    if (nomeNormalizado.includes('monitor')) {
      return 'desktop_windows';
    }
    if (nomeNormalizado.includes('headset') || nomeNormalizado.includes('fone')) {
      return 'headset';
    }
    if (nomeNormalizado.includes('impressora')) {
      return 'print';
    }
    if (nomeNormalizado.includes('ssd') || nomeNormalizado.includes('hd')) {
      return 'save';
    }

    return 'inventory_2';
  }

  private calcularCrescimentoMensal(produtosAtivos: ProdutoResponse[]): string {
    const agora = new Date();
    const inicioMesAtual = new Date(agora.getFullYear(), agora.getMonth(), 1);
    const inicioMesAnterior = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
    const inicioMesAtualTimestamp = inicioMesAtual.getTime();
    const inicioMesAnteriorTimestamp = inicioMesAnterior.getTime();

    const criadosMesAtual = produtosAtivos.filter((produto) => {
      if (!produto.dataCriacao) {
        return false;
      }
      const dataCriacao = this.toTimestamp(produto.dataCriacao);
      return dataCriacao >= inicioMesAtualTimestamp;
    }).length;

    const criadosMesAnterior = produtosAtivos.filter((produto) => {
      if (!produto.dataCriacao) {
        return false;
      }
      const dataCriacao = this.toTimestamp(produto.dataCriacao);
      return dataCriacao >= inicioMesAnteriorTimestamp && dataCriacao < inicioMesAtualTimestamp;
    }).length;

    if (criadosMesAnterior === 0) {
      return criadosMesAtual > 0 ? '+100%' : '0%';
    }

    const crescimentoPercentual = ((criadosMesAtual - criadosMesAnterior) / criadosMesAnterior) * 100;
    const prefixo = crescimentoPercentual >= 0 ? '+' : '';
    return `${prefixo}${Math.round(crescimentoPercentual)}%`;
  }

  private formatarNumero(valor: number): string {
    return new Intl.NumberFormat('pt-BR').format(valor);
  }

  private formatarDataHora(valor: string): string {
    const data = new Date(valor);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(data);
  }

  private toTimestamp(valorData: string): number {
    const timestamp = new Date(valorData).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }
}
