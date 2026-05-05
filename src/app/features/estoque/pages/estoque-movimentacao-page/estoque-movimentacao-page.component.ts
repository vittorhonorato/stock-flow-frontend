import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/errors/api-error';
import { SelectOption } from '../../../../shared/models/select-option.model';
import { BrInputMaskUtil } from '../../../../shared/utils/br-input-mask.util';
import { ProdutoService } from '../../../produtos/services/produto.service';
import { AjusteEstoqueRequest } from '../../models/ajuste-estoque-request.model';
import { HistoricoEstoqueResponse } from '../../models/historico-estoque-response.model';
import { MovimentacaoEstoqueRequest } from '../../models/movimentacao-estoque-request.model';
import { TipoMovimentacaoEstoque } from '../../models/tipo-movimentacao.model';
import { EstoqueService } from '../../services/estoque.service';

type ModoMovimentacao = TipoMovimentacaoEstoque;

@Component({
  selector: 'app-estoque-movimentacao-page',
  templateUrl: './estoque-movimentacao-page.component.html',
  styleUrls: ['./estoque-movimentacao-page.component.scss']
})
export class EstoqueMovimentacaoPageComponent implements OnInit {
  readonly modos: ModoMovimentacao[] = ['ENTRADA', 'SAIDA', 'AJUSTE'];

  readonly movimentacaoForm = this.fb.group({
    produtoId: this.fb.control<number | null>(null, [Validators.required]),
    quantidade: this.fb.control<number | null>(null, [Validators.required, Validators.min(1)]),
    motivo: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(255)])
  });

  readonly ajusteForm = this.fb.group({
    produtoId: this.fb.control<number | null>(null, [Validators.required]),
    novaQuantidade: this.fb.control<number | null>(0, [Validators.required, Validators.min(0)]),
    motivo: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(255)])
  });

  modoSelecionado: ModoMovimentacao = 'ENTRADA';

  produtos: SelectOption<number>[] = [];
  loadingProdutos = false;
  enviando = false;

  erroMensagem: string | null = null;
  sucessoMensagem: string | null = null;

  ultimaMovimentacao: HistoricoEstoqueResponse | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly estoqueService: EstoqueService,
    private readonly produtoService: ProdutoService
  ) {}

  ngOnInit(): void {
    this.carregarProdutos();
  }

  selecionarModo(modo: ModoMovimentacao): void {
    this.modoSelecionado = modo;
    this.erroMensagem = null;
    this.sucessoMensagem = null;
  }

  salvarMovimentacao(): void {
    this.erroMensagem = null;
    this.sucessoMensagem = null;

    if (this.modoSelecionado === 'AJUSTE') {
      this.salvarAjuste();
      return;
    }

    this.salvarEntradaOuSaida();
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

  private salvarEntradaOuSaida(): void {
    if (this.movimentacaoForm.invalid) {
      this.movimentacaoForm.markAllAsTouched();
      return;
    }

    const produtoId = this.movimentacaoForm.controls.produtoId.value;
    const quantidade = this.movimentacaoForm.controls.quantidade.value;
    const motivo = BrInputMaskUtil.normalizeSpaces(this.movimentacaoForm.controls.motivo.value);

    if (produtoId == null || quantidade == null || !motivo) {
      this.movimentacaoForm.markAllAsTouched();
      return;
    }

    this.movimentacaoForm.controls.motivo.setValue(motivo, { emitEvent: false });

    const payload: MovimentacaoEstoqueRequest = {
      produtoId,
      quantidade,
      motivo
    };

    const request$ =
      this.modoSelecionado === 'ENTRADA'
        ? this.estoqueService.entrada(payload)
        : this.estoqueService.saida(payload);

    this.enviando = true;

    request$
      .pipe(
        finalize(() => {
          this.enviando = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.ultimaMovimentacao = response;
          this.sucessoMensagem =
            this.modoSelecionado === 'ENTRADA'
              ? 'Entrada registrada com sucesso.'
              : 'Saída registrada com sucesso.';

          this.movimentacaoForm.patchValue({
            quantidade: null,
            motivo: ''
          });
        },
        error: (error) => {
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage('registrar a movimentação de estoque');
        }
      });
  }

  private salvarAjuste(): void {
    if (this.ajusteForm.invalid) {
      this.ajusteForm.markAllAsTouched();
      return;
    }

    const produtoId = this.ajusteForm.controls.produtoId.value;
    const novaQuantidade = this.ajusteForm.controls.novaQuantidade.value;
    const motivo = BrInputMaskUtil.normalizeSpaces(this.ajusteForm.controls.motivo.value);

    if (produtoId == null || novaQuantidade == null || !motivo) {
      this.ajusteForm.markAllAsTouched();
      return;
    }

    this.ajusteForm.controls.motivo.setValue(motivo, { emitEvent: false });

    const payload: AjusteEstoqueRequest = {
      produtoId,
      novaQuantidade,
      motivo
    };

    this.enviando = true;

    this.estoqueService
      .ajuste(payload)
      .pipe(
        finalize(() => {
          this.enviando = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.ultimaMovimentacao = response;
          this.sucessoMensagem = 'Ajuste de estoque registrado com sucesso.';

          this.ajusteForm.patchValue({
            novaQuantidade: 0,
            motivo: ''
          });
        },
        error: (error) => {
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage('registrar o ajuste de estoque');
        }
      });
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
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage(
            'carregar os produtos para movimentação'
          );
        }
      });
  }
}
