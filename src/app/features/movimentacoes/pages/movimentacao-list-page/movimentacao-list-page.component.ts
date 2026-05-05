import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/errors/api-error';
import { SelectOption } from '../../../../shared/models/select-option.model';
import { ProdutoService } from '../../../produtos/services/produto.service';
import { HistoricoEstoqueResponse } from '../../../estoque/models/historico-estoque-response.model';
import { TipoMovimentacaoEstoque } from '../../../estoque/models/tipo-movimentacao.model';
import { EstoqueService } from '../../../estoque/services/estoque.service';

@Component({
  selector: 'app-movimentacao-list-page',
  templateUrl: './movimentacao-list-page.component.html',
  styleUrls: ['./movimentacao-list-page.component.scss']
})
export class MovimentacaoListPageComponent implements OnInit {
  readonly displayedColumns = [
    'data',
    'produto',
    'tipo',
    'quantidade',
    'estoqueAtual',
    'motivo'
  ];
  readonly pageSizeOptions = [5, 10, 20];

  readonly produtoControl = new FormControl<number | null>(null);

  produtos: SelectOption<number>[] = [];
  historico: HistoricoEstoqueResponse[] = [];

  loadingProdutos = false;
  loadingHistorico = false;

  erroMensagem: string | null = null;

  totalElements = 0;
  filtro = {
    produtoId: null as number | null,
    page: 0,
    size: 5
  };

  constructor(
    private readonly estoqueService: EstoqueService,
    private readonly produtoService: ProdutoService
  ) {}

  ngOnInit(): void {
    this.carregarProdutos();
  }

  get possuiProdutoSelecionado(): boolean {
    return this.filtro.produtoId != null;
  }

  pesquisar(): void {
    this.filtro = {
      ...this.filtro,
      produtoId: this.produtoControl.value,
      page: 0
    };

    this.carregarHistorico();
  }

  limpar(): void {
    this.produtoControl.setValue(null);

    this.filtro = {
      ...this.filtro,
      produtoId: null,
      page: 0
    };

    this.historico = [];
    this.totalElements = 0;
    this.erroMensagem = null;
  }

  onPageChange(event: PageEvent): void {
    this.filtro = {
      ...this.filtro,
      page: event.pageIndex,
      size: event.pageSize
    };

    this.carregarHistorico();
  }

  getTipoMovimentacaoBadge(tipo: TipoMovimentacaoEstoque): 'success' | 'warning' | 'info' {
    switch (tipo) {
      case 'ENTRADA':
        return 'success';
      case 'SAIDA':
        return 'warning';
      default:
        return 'info';
    }
  }

  private carregarProdutos(): void {
    this.loadingProdutos = true;
    this.erroMensagem = null;

    this.produtoService
      .listar({ page: 0, size: 200 })
      .pipe(
        finalize(() => {
          this.loadingProdutos = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.produtos = response.content
            .filter((produto) => produto.ativo)
            .map((produto) => ({
              value: produto.id,
              label: `${produto.nome} (${produto.sku})`
            }));
        },
        error: (error) => {
          this.produtos = [];
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage('carregar os produtos');
        }
      });
  }

  private carregarHistorico(): void {
    if (!this.filtro.produtoId) {
      this.historico = [];
      this.totalElements = 0;
      return;
    }

    this.loadingHistorico = true;
    this.erroMensagem = null;

    this.estoqueService
      .listarHistoricoPorProduto(this.filtro.produtoId, this.filtro.page, this.filtro.size)
      .pipe(
        finalize(() => {
          this.loadingHistorico = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.historico = response.content;
          this.totalElements = response.totalElements;
        },
        error: (error) => {
          this.historico = [];
          this.totalElements = 0;
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage(
            'carregar o histórico de movimentações'
          );
        }
      });
  }
}
