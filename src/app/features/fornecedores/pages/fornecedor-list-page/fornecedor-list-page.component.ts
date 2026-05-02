import { Component } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { FornecedorFilter } from '../../models/fornecedor-filter.model';
import {
  FornecedorRequest,
  TipoDocumentoFornecedor
} from '../../models/fornecedor-request.model';
import { FornecedorResponse } from '../../models/fornecedor-response.model';
import { ValidacaoDocumentoFornecedorResponse } from '../../models/fornecedor-validacao-documento-response.model';
import { FornecedorService } from '../../services/fornecedor.service';

type FornecedorModo = 'cadastro' | 'lista';

@Component({
  selector: 'app-fornecedor-list-page',
  templateUrl: './fornecedor-list-page.component.html',
  styleUrls: ['./fornecedor-list-page.component.scss']
})
export class FornecedorListPageComponent {
  private readonly camposValidados = [
    'nome',
    'documento',
    'tipoDocumento',
    'situacaoCadastral'
  ] as const;
  private readonly camposComplementares = [
    'email',
    'telefone',
    'endereco',
    'cidade',
    'uf'
  ] as const;

  readonly tiposDocumento: TipoDocumentoFornecedor[] = ['CNPJ', 'CPF'];
  readonly situacoesCadastrais = ['ATIVA', 'INATIVA', 'SUSPENSA', 'BAIXADA'];
  readonly estadosUf = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO'
  ];

  readonly displayedColumns = ['nome', 'documento', 'tipoDocumento', 'situacao', 'status', 'acoes'];
  readonly pageSizeOptions = [5, 10, 20];

  modo: FornecedorModo = 'cadastro';
  validandoDocumento = false;
  carregandoEdicao = false;
  salvando = false;
  documentoValidado = false;
  loadingLista = false;

  mensagemErro: string | null = null;
  mensagemSucesso: string | null = null;
  mensagemListaErro: string | null = null;

  validacaoDocumento: ValidacaoDocumentoFornecedorResponse | null = null;
  fornecedorEmEdicao: FornecedorResponse | null = null;
  fornecedorParaDesativar: FornecedorResponse | null = null;
  confirmandoDesativacao = false;

  fornecedores: FornecedorResponse[] = [];
  totalElements = 0;

  filtro: FornecedorFilter = {
    page: 0,
    size: 5
  };

  readonly termoControl = new FormControl('', { nonNullable: true });
  readonly tipoDocumentoFiltroControl = new FormControl<TipoDocumentoFornecedor | ''>('', {
    nonNullable: true
  });

  readonly documentoForm = this.fb.nonNullable.group({
    documento: ['', [Validators.required, Validators.minLength(11)]]
  });

  readonly cadastroForm = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    documento: ['', [Validators.required]],
    tipoDocumento: ['CNPJ' as TipoDocumentoFornecedor, [Validators.required]],
    situacaoCadastral: ['ATIVA', [Validators.required]],
    email: ['', [Validators.email]],
    telefone: [''],
    endereco: [''],
    cidade: [''],
    uf: ['', [Validators.minLength(2), Validators.maxLength(2)]]
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly fornecedorService: FornecedorService
  ) {
    this.bloquearFormularioCadastro();
  }

  get emModoCadastro(): boolean {
    return this.modo === 'cadastro';
  }

  get exibirLoadingOverlay(): boolean {
    return this.validandoDocumento || this.carregandoEdicao;
  }

  get loadingOverlayMessage(): string {
    if (this.carregandoEdicao) {
      return 'Carregando fornecedor...';
    }

    return 'Validando documento...';
  }

  onToggleModoPrincipal(): void {
    if (this.emModoCadastro) {
      this.irParaLista();
      return;
    }

    this.prepararNovoCadastro();
  }

  irParaLista(): void {
    this.modo = 'lista';
    this.mensagemListaErro = null;
    this.carregarFornecedores();
  }

  prepararNovoCadastro(): void {
    this.modo = 'cadastro';
    this.redefinirFluxo(true);
  }

  pesquisarFornecedores(): void {
    this.filtro = {
      ...this.filtro,
      termo: this.termoControl.value.trim() || undefined,
      tipoDocumento: this.tipoDocumentoFiltroControl.value || undefined,
      page: 0
    };

    this.carregarFornecedores();
  }

  limparFiltrosLista(): void {
    this.termoControl.setValue('');
    this.tipoDocumentoFiltroControl.setValue('');

    this.filtro = {
      ...this.filtro,
      termo: undefined,
      tipoDocumento: undefined,
      page: 0
    };

    this.carregarFornecedores();
  }

  onPageChangeLista(event: PageEvent): void {
    this.filtro = {
      ...this.filtro,
      page: event.pageIndex,
      size: event.pageSize
    };

    this.carregarFornecedores();
  }

  validarDocumento(): void {
    if (this.documentoForm.invalid) {
      this.documentoForm.markAllAsTouched();
      return;
    }

    this.mensagemErro = null;
    this.mensagemSucesso = null;
    this.validandoDocumento = true;

    const documento = this.somenteDigitos(this.documentoForm.controls.documento.value);

    this.fornecedorService
      .validarDocumento(documento)
      .pipe(
        finalize(() => {
          this.validandoDocumento = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.validacaoDocumento = response;

          if (!response.permiteCadastro || !response.documentoValido) {
            this.documentoValidado = false;
            this.bloquearFormularioCadastro();
            this.mensagemErro = 'Documento inválido. Não foi possível liberar o cadastro.';
            return;
          }

          this.documentoValidado = true;
          this.preencherFormularioComValidacao(response);
          this.mensagemSucesso = 'Documento válido. Cadastro liberado para campos complementares.';
        },
        error: () => {
          this.documentoValidado = false;
          this.bloquearFormularioCadastro();
          this.validacaoDocumento = null;
          this.mensagemErro = 'Não foi possível validar o documento informado.';
        }
      });
  }

  salvarFornecedor(): void {
    if (!this.documentoValidado) {
      this.mensagemErro = 'Valide o documento antes de salvar o fornecedor.';
      return;
    }

    if (this.cadastroForm.invalid) {
      this.cadastroForm.markAllAsTouched();
      return;
    }

    this.mensagemErro = null;
    this.mensagemSucesso = null;
    this.salvando = true;

    const payload = this.montarRequest();
    const request$ =
      this.fornecedorEmEdicao != null
        ? this.fornecedorService.atualizar(this.fornecedorEmEdicao.id, payload)
        : this.fornecedorService.criar(payload);

    request$
      .pipe(
        finalize(() => {
          this.salvando = false;
        })
      )
      .subscribe({
        next: (fornecedor) => {
          this.fornecedorEmEdicao = fornecedor;
          this.mensagemSucesso = 'Fornecedor salvo com sucesso.';

          this.validacaoDocumento = {
            documento: fornecedor.documento,
            nome: fornecedor.nome,
            tipoDocumento: fornecedor.tipoDocumento,
            situacaoCadastral: fornecedor.situacaoCadastral,
            documentoValido: true,
            permiteCadastro: true,
            dataValidacao: new Date().toISOString()
          };

          this.documentoForm.controls.documento.setValue(fornecedor.documento);
          this.preencherFormularioComFornecedor(fornecedor);

          if (!this.emModoCadastro) {
            this.irParaLista();
          }
        },
        error: () => {
          this.mensagemErro = 'Não foi possível salvar o fornecedor.';
        }
      });
  }

  editarFornecedor(fornecedor: FornecedorResponse): void {
    this.modo = 'cadastro';
    this.carregandoEdicao = true;
    this.mensagemErro = null;
    this.mensagemSucesso = null;

    this.fornecedorService
      .buscarPorId(fornecedor.id)
      .pipe(
        finalize(() => {
          this.carregandoEdicao = false;
        })
      )
      .subscribe({
        next: (fornecedorCompleto) => {
          this.fornecedorEmEdicao = fornecedorCompleto;
          this.documentoValidado = true;

          this.validacaoDocumento = {
            documento: fornecedorCompleto.documento,
            nome: fornecedorCompleto.nome,
            tipoDocumento: fornecedorCompleto.tipoDocumento,
            situacaoCadastral: fornecedorCompleto.situacaoCadastral,
            documentoValido: true,
            permiteCadastro: true,
            dataValidacao: undefined
          };

          this.documentoForm.controls.documento.setValue(fornecedorCompleto.documento);
          this.preencherFormularioComFornecedor(fornecedorCompleto);
        },
        error: () => {
          this.mensagemErro = 'Não foi possível carregar o fornecedor para edição.';
          this.redefinirFluxo(true);
        }
      });
  }

  solicitarDesativacao(fornecedor: FornecedorResponse): void {
    this.fornecedorParaDesativar = fornecedor;
    this.confirmandoDesativacao = true;
  }

  confirmarDesativacao(): void {
    if (!this.fornecedorParaDesativar) {
      return;
    }

    const fornecedor = this.fornecedorParaDesativar;
    this.loadingLista = true;
    this.mensagemListaErro = null;

    this.fornecedorService
      .excluir(fornecedor.id)
      .pipe(
        finalize(() => {
          this.loadingLista = false;
          this.cancelarDesativacao();
        })
      )
      .subscribe({
        next: () => {
          this.mensagemSucesso = 'Fornecedor desativado com sucesso.';

          if (this.fornecedorEmEdicao?.id === fornecedor.id) {
            this.redefinirFluxo(true);
          }

          this.carregarFornecedores();
        },
        error: () => {
          this.mensagemListaErro = 'Não foi possível desativar o fornecedor.';
        }
      });
  }

  cancelarDesativacao(): void {
    this.confirmandoDesativacao = false;
    this.fornecedorParaDesativar = null;
  }

  redefinirFluxo(manterModoAtual = false): void {
    if (!manterModoAtual) {
      this.modo = 'cadastro';
    }

    this.documentoForm.reset({ documento: '' });
    this.documentoValidado = false;
    this.validandoDocumento = false;
    this.carregandoEdicao = false;
    this.salvando = false;
    this.mensagemErro = null;
    this.mensagemSucesso = null;
    this.validacaoDocumento = null;
    this.fornecedorEmEdicao = null;

    this.cadastroForm.reset({
      nome: '',
      documento: '',
      tipoDocumento: 'CNPJ',
      situacaoCadastral: 'ATIVA',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      uf: ''
    });
    this.bloquearFormularioCadastro();
  }

  private carregarFornecedores(): void {
    this.loadingLista = true;
    this.mensagemListaErro = null;

    this.fornecedorService
      .listar(this.filtro)
      .pipe(
        finalize(() => {
          this.loadingLista = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.fornecedores = response.content;
          this.totalElements = response.totalElements;
        },
        error: () => {
          this.fornecedores = [];
          this.totalElements = 0;
          this.mensagemListaErro = 'Não foi possível carregar os fornecedores.';
        }
      });
  }

  private preencherFormularioComValidacao(
    validacao: ValidacaoDocumentoFornecedorResponse
  ): void {
    this.cadastroForm.enable({ emitEvent: false });
    this.cadastroForm.patchValue({
      nome: validacao.nome ?? '',
      documento: validacao.documento ?? this.documentoForm.controls.documento.value,
      tipoDocumento: validacao.tipoDocumento ?? 'CNPJ',
      situacaoCadastral: validacao.situacaoCadastral ?? 'ATIVA'
    });
    this.bloquearCamposValidados();
    this.habilitarCamposComplementares();
  }

  private preencherFormularioComFornecedor(fornecedor: FornecedorResponse): void {
    this.cadastroForm.enable({ emitEvent: false });
    this.cadastroForm.patchValue({
      nome: fornecedor.nome,
      documento: fornecedor.documento,
      tipoDocumento: fornecedor.tipoDocumento,
      situacaoCadastral: fornecedor.situacaoCadastral,
      email: fornecedor.email ?? '',
      telefone: fornecedor.telefone ?? '',
      endereco: fornecedor.endereco ?? '',
      cidade: fornecedor.cidade ?? '',
      uf: fornecedor.uf ?? ''
    });
    this.bloquearCamposValidados();
    this.habilitarCamposComplementares();
  }

  private montarRequest(): FornecedorRequest {
    const nome = this.cadastroForm.controls.nome.value.trim();
    const documento = this.somenteDigitos(this.cadastroForm.controls.documento.value);
    const email = this.cadastroForm.controls.email.value.trim();
    const telefone = this.cadastroForm.controls.telefone.value.trim();
    const endereco = this.cadastroForm.controls.endereco.value.trim();
    const cidade = this.cadastroForm.controls.cidade.value.trim();
    const uf = this.cadastroForm.controls.uf.value.trim().toUpperCase();

    return {
      nome,
      documento,
      tipoDocumento: this.cadastroForm.controls.tipoDocumento.value,
      situacaoCadastral: this.cadastroForm.controls.situacaoCadastral.value,
      email: email || undefined,
      telefone: telefone || undefined,
      endereco: endereco || undefined,
      cidade: cidade || undefined,
      uf: uf || undefined
    };
  }

  private somenteDigitos(valor: string): string {
    return valor.replace(/\D+/g, '');
  }

  private bloquearFormularioCadastro(): void {
    this.cadastroForm.disable({ emitEvent: false });
  }

  private bloquearCamposValidados(): void {
    for (const campo of this.camposValidados) {
      this.cadastroForm.controls[campo].disable({ emitEvent: false });
    }
  }

  private habilitarCamposComplementares(): void {
    for (const campo of this.camposComplementares) {
      this.cadastroForm.controls[campo].enable({ emitEvent: false });
    }
  }
}
