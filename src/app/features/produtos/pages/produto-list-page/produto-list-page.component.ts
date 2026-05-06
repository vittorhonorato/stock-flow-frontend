import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, ValidationErrors, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { forkJoin, finalize } from 'rxjs';
import { ApiError } from '../../../../core/errors/api-error';
import { SelectOption } from '../../../../shared/models/select-option.model';
import { BrInputMaskUtil } from '../../../../shared/utils/br-input-mask.util';
import { CategoriaService } from '../../../categorias/services/categoria.service';
import { FornecedorService } from '../../../fornecedores/services/fornecedor.service';
import { ProdutoFilter } from '../../models/produto-filter.model';
import { ProdutoRequest } from '../../models/produto-request.model';
import { ProdutoResponse } from '../../models/produto-response.model';
import { ProdutoService } from '../../services/produto.service';

@Component({
  selector: 'app-produto-list-page',
  templateUrl: './produto-list-page.component.html',
  styleUrls: ['./produto-list-page.component.scss']
})
export class ProdutoListPageComponent implements OnInit, OnDestroy {
  readonly displayedColumns = [
    'nome',
    'sku',
    'categoria',
    'fornecedor',
    'precoVenda',
    'estoque',
    'status',
    'acoes'
  ];
  readonly pageSizeOptions = [5, 10, 20];
  readonly formatosImagemPermitidos = '.png,.jpg,.jpeg,.webp';
  readonly tamanhoMaximoImagemBytes = 5 * 1024 * 1024;

  readonly skuControl = new FormControl('', { nonNullable: true });

  readonly form = this.fb.group({
    nome: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]),
    sku: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(80)]),
    descricao: this.fb.nonNullable.control('', [Validators.maxLength(255)]),
    precoDeCusto: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    precoDeVenda: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
    quantidadeMinima: this.fb.control<number | null>(0, [Validators.required, Validators.min(0)]),
    categoriaId: this.fb.control<number | null>(null, [Validators.required]),
    fornecedorId: this.fb.control<number | null>(null, [Validators.required])
  }, {
    validators: [this.precoVendaMaiorOuIgualCustoValidator]
  });

  produtos: ProdutoResponse[] = [];
  totalElements = 0;

  categorias: SelectOption<number>[] = [];
  fornecedores: SelectOption<number>[] = [];

  loading = false;
  loadingOpcoes = false;
  carregandoEdicao = false;
  saving = false;
  showForm = false;

  erroMensagem: string | null = null;
  mensagemSucesso: string | null = null;

  produtoSelecionado: ProdutoResponse | null = null;
  produtoParaDesativar: ProdutoResponse | null = null;
  confirmandoDesativacao = false;
  imagemSelecionada: File | null = null;
  imagemPreviewUrl: string | null = null;
  imagemAtualUrl: string | null = null;

  filter: ProdutoFilter = {
    page: 0,
    size: 5
  };

  constructor(
    private readonly fb: FormBuilder,
    private readonly produtoService: ProdutoService,
    private readonly categoriaService: CategoriaService,
    private readonly fornecedorService: FornecedorService
  ) {}

  ngOnInit(): void {
    this.carregarOpcoesFormulario();
    this.carregarProdutos();
  }

  ngOnDestroy(): void {
    this.limparPreviewLocal();
  }

  get exibirOverlayLoading(): boolean {
    return this.carregandoEdicao;
  }

  get pesquisandoPorSku(): boolean {
    return Boolean(this.filter.sku);
  }

  get imagemPreviewExibicao(): string | null {
    return this.imagemPreviewUrl || this.imagemAtualUrl;
  }

  isEstoqueBaixo(produto: ProdutoResponse): boolean {
    return produto.quantidadeAtual < produto.quantidadeMinima;
  }

  pesquisar(): void {
    const sku = this.normalizarSku(this.skuControl.value);
    this.skuControl.setValue(sku, { emitEvent: false });

    this.filter = {
      ...this.filter,
      sku: sku || undefined,
      page: 0
    };

    this.carregarProdutos();
  }

  limparFiltros(): void {
    this.skuControl.setValue('');

    this.filter = {
      ...this.filter,
      sku: undefined,
      page: 0
    };

    this.carregarProdutos();
  }

  onSkuFiltroBlur(): void {
    const sku = this.normalizarSku(this.skuControl.value);
    this.skuControl.setValue(sku, { emitEvent: false });
  }

  onPageChange(event: PageEvent): void {
    this.filter = {
      ...this.filter,
      page: event.pageIndex,
      size: event.pageSize
    };

    this.carregarProdutos();
  }

  novoProduto(): void {
    this.mensagemSucesso = null;
    this.erroMensagem = null;
    this.produtoSelecionado = null;
    this.imagemSelecionada = null;
    this.imagemAtualUrl = null;
    this.limparPreviewLocal();
    this.showForm = true;
    this.preencherFormulario(null);
  }

  editarProduto(produto: ProdutoResponse): void {
    this.erroMensagem = null;
    this.mensagemSucesso = null;
    this.carregandoEdicao = true;

    this.produtoService
      .buscarPorId(produto.id)
      .pipe(
        finalize(() => {
          this.carregandoEdicao = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.produtoSelecionado = response;
          this.showForm = true;
          this.preencherFormulario(response);
        },
        error: (error) => {
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage('carregar o produto para edição');
        }
      });
  }

  solicitarDesativacao(produto: ProdutoResponse): void {
    this.produtoParaDesativar = produto;
    this.confirmandoDesativacao = true;
  }

  cancelarDesativacao(): void {
    this.confirmandoDesativacao = false;
    this.produtoParaDesativar = null;
  }

  confirmarDesativacao(): void {
    if (!this.produtoParaDesativar) {
      return;
    }

    this.loading = true;
    this.erroMensagem = null;
    this.mensagemSucesso = null;

    this.produtoService
      .desativar(this.produtoParaDesativar.id)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cancelarDesativacao();
        })
      )
      .subscribe({
        next: () => {
          this.mensagemSucesso = 'Produto desativado com sucesso.';
          this.carregarProdutos();
        },
        error: (error) => {
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage('desativar o produto');
        }
      });
  }

  cancelarFormulario(): void {
    this.showForm = false;
    this.produtoSelecionado = null;
    this.imagemSelecionada = null;
    this.imagemAtualUrl = null;
    this.limparPreviewLocal();
    this.preencherFormulario(null);
  }

  onNomeBlur(): void {
    const nome = BrInputMaskUtil.normalizeSpaces(this.form.controls.nome.value);
    this.form.controls.nome.setValue(nome, { emitEvent: false });
  }

  onSkuBlur(): void {
    const sku = this.normalizarSku(this.form.controls.sku.value);
    this.form.controls.sku.setValue(sku, { emitEvent: false });
  }

  onDescricaoBlur(): void {
    const descricao = BrInputMaskUtil.normalizeSpaces(this.form.controls.descricao.value);
    this.form.controls.descricao.setValue(descricao, { emitEvent: false });
  }

  abrirSeletorImagem(input: HTMLInputElement): void {
    input.click();
  }

  onImagemSelecionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;

    if (!arquivo) {
      return;
    }

    if (!this.isImagemValida(arquivo)) {
      input.value = '';
      this.imagemSelecionada = null;
      this.limparPreviewLocal();
      return;
    }

    this.imagemSelecionada = arquivo;
    this.limparPreviewLocal();
    this.imagemPreviewUrl = URL.createObjectURL(arquivo);
    this.erroMensagem = null;
  }

  removerImagemSelecionada(input?: HTMLInputElement): void {
    this.imagemSelecionada = null;
    this.limparPreviewLocal();

    if (input) {
      input.value = '';
    }
  }

  formatarTamanhoImagem(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(2)} MB`;
  }

  salvarProduto(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request = this.montarRequest();

    if (!request) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.erroMensagem = null;
    this.mensagemSucesso = null;

    const produtoId = this.produtoSelecionado?.id;
    const imagem = this.imagemSelecionada;
    const request$ = produtoId
      ? this.produtoService.atualizar(produtoId, request, imagem)
      : this.produtoService.criar(request, imagem);

    request$
      .pipe(
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe({
        next: () => {
          this.showForm = false;
          this.produtoSelecionado = null;
          this.imagemSelecionada = null;
          this.imagemAtualUrl = null;
          this.limparPreviewLocal();
          this.preencherFormulario(null);
          this.mensagemSucesso = produtoId
            ? 'Produto atualizado com sucesso.'
            : 'Produto cadastrado com sucesso.';
          this.carregarProdutos();
        },
        error: (error) => {
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage('salvar o produto');
        }
      });
  }

  private carregarProdutos(): void {
    this.loading = true;
    this.erroMensagem = null;

    const sku = this.filter.sku;

    if (sku) {
      this.produtoService
        .buscarPorSku(sku)
        .pipe(
          finalize(() => {
            this.loading = false;
          })
        )
        .subscribe({
          next: (response) => {
            this.produtos = [response];
            this.totalElements = 1;
          },
          error: (error) => {
            const apiError = ApiError.fromHttpError(error);
            this.produtos = [];
            this.totalElements = 0;

            if (apiError.status === 404) {
              return;
            }

            this.erroMensagem = apiError.getFriendlyMessage('buscar o produto pelo SKU');
          }
        });

      return;
    }

    this.produtoService
      .listar(this.filter)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.produtos = response.content;
          this.totalElements = response.totalElements;
        },
        error: (error) => {
          this.produtos = [];
          this.totalElements = 0;
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage('carregar os produtos');
        }
      });
  }

  private carregarOpcoesFormulario(): void {
    this.loadingOpcoes = true;

    forkJoin({
      categorias: this.categoriaService.listarOpcoes(),
      fornecedores: this.fornecedorService.listarOpcoes()
    })
      .pipe(
        finalize(() => {
          this.loadingOpcoes = false;
        })
      )
      .subscribe({
        next: ({ categorias, fornecedores }) => {
          this.categorias = categorias;
          this.fornecedores = fornecedores;
        },
        error: (error) => {
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage(
            'carregar categorias e fornecedores'
          );
        }
      });
  }

  private preencherFormulario(produto: ProdutoResponse | null): void {
    this.imagemSelecionada = null;
    this.limparPreviewLocal();
    this.imagemAtualUrl = produto?.imagemUrl ?? null;

    if (!produto) {
      this.form.reset({
        nome: '',
        sku: '',
        descricao: '',
        precoDeCusto: null,
        precoDeVenda: null,
        quantidadeMinima: 0,
        categoriaId: null,
        fornecedorId: null
      });
      return;
    }

    this.form.reset({
      nome: produto.nome,
      sku: produto.sku,
      descricao: produto.descricao ?? '',
      precoDeCusto: produto.precoDeCusto,
      precoDeVenda: produto.precoDeVenda,
      quantidadeMinima: produto.quantidadeMinima,
      categoriaId: produto.categoriaId,
      fornecedorId: produto.fornecedorId
    });
  }

  private montarRequest(): ProdutoRequest | null {
    const precoDeCusto = this.form.controls.precoDeCusto.value;
    const precoDeVenda = this.form.controls.precoDeVenda.value;
    const quantidadeMinima = this.form.controls.quantidadeMinima.value;
    const categoriaId = this.form.controls.categoriaId.value;
    const fornecedorId = this.form.controls.fornecedorId.value;

    if (
      precoDeCusto === null ||
      precoDeVenda === null ||
      quantidadeMinima === null ||
      categoriaId === null ||
      fornecedorId === null
    ) {
      return null;
    }

    const nome = BrInputMaskUtil.normalizeSpaces(this.form.controls.nome.value);
    const sku = this.normalizarSku(this.form.controls.sku.value);
    const descricao = BrInputMaskUtil.normalizeSpaces(this.form.controls.descricao.value);

    if (!nome) {
      this.form.controls.nome.setErrors({ required: true });
      this.form.controls.nome.markAsTouched();
      return null;
    }

    if (!sku) {
      this.form.controls.sku.setErrors({ required: true });
      this.form.controls.sku.markAsTouched();
      return null;
    }

    this.form.controls.nome.setValue(nome, { emitEvent: false });
    this.form.controls.sku.setValue(sku, { emitEvent: false });
    this.form.controls.descricao.setValue(descricao, { emitEvent: false });

    return {
      nome,
      sku,
      descricao: descricao || undefined,
      precoDeCusto,
      precoDeVenda,
      quantidadeMinima,
      categoriaId,
      fornecedorId
    };
  }

  private isImagemValida(arquivo: File): boolean {
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/webp'];

    if (!tiposPermitidos.includes(arquivo.type)) {
      this.erroMensagem = 'Formato de imagem inválido. Use PNG, JPG ou WEBP.';
      return false;
    }

    if (arquivo.size > this.tamanhoMaximoImagemBytes) {
      this.erroMensagem = 'A imagem deve ter no máximo 5MB.';
      return false;
    }

    return true;
  }

  private limparPreviewLocal(): void {
    if (this.imagemPreviewUrl) {
      URL.revokeObjectURL(this.imagemPreviewUrl);
      this.imagemPreviewUrl = null;
    }
  }

  private normalizarSku(value: string): string {
    return BrInputMaskUtil.normalizeSpaces(value).toUpperCase();
  }

  private precoVendaMaiorOuIgualCustoValidator(control: AbstractControl): ValidationErrors | null {
    const precoDeCusto = control.get('precoDeCusto')?.value as number | null;
    const precoDeVenda = control.get('precoDeVenda')?.value as number | null;

    if (precoDeCusto == null || precoDeVenda == null) {
      return null;
    }

    return precoDeVenda < precoDeCusto ? { precoVendaMenorQueCusto: true } : null;
  }
}
