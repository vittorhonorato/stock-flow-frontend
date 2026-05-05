import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/errors/api-error';
import { BrInputMaskUtil } from '../../../../shared/utils/br-input-mask.util';
import { FornecedorFilter } from '../../models/fornecedor-filter.model';
import {
  FornecedorRequest,
  SituacaoCadastralFornecedor,
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
    'street',
    'city',
    'state'
  ] as const;

  readonly tiposDocumento: TipoDocumentoFornecedor[] = ['CNPJ'];
  readonly situacoesCadastrais: SituacaoCadastralFornecedor[] = [
    'NULA',
    'ATIVA',
    'SUSPENSA',
    'INAPTA',
    'BAIXADA'
  ];
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

  readonly documentoForm = this.fb.nonNullable.group({
    documento: ['', [Validators.required, this.cnpjValidator]]
  });

  readonly cadastroForm = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    documento: ['', [Validators.required]],
    tipoDocumento: ['CNPJ' as TipoDocumentoFornecedor, [Validators.required]],
    situacaoCadastral: ['ATIVA' as SituacaoCadastralFornecedor, [Validators.required]],
    email: ['', [Validators.email]],
    telefone: [''],
    street: [''],
    city: [''],
    state: ['', [Validators.minLength(2), Validators.maxLength(2)]]
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

  atualizarListaFornecedores(): void {
    this.filtro = {
      ...this.filtro,
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

  onDocumentoValidacaoInput(): void {
    const control = this.documentoForm.controls.documento;
    const formatted = this.formatarCnpjProgressivo(control.value);

    if (control.value !== formatted) {
      control.setValue(formatted, { emitEvent: false });
    }
  }

  onDocumentoCadastroInput(): void {
    const control = this.cadastroForm.controls.documento;
    const formatted = this.formatarCnpjProgressivo(control.value);

    if (control.value !== formatted) {
      control.setValue(formatted, { emitEvent: false });
    }
  }

  onTelefoneInput(): void {
    const control = this.cadastroForm.controls.telefone;
    const formatted = BrInputMaskUtil.formatPhone(control.value);

    if (control.value !== formatted) {
      control.setValue(formatted, { emitEvent: false });
    }
  }

  validarDocumento(): void {
    if (this.documentoForm.invalid) {
      this.documentoForm.markAllAsTouched();
      return;
    }

    const documento = BrInputMaskUtil.onlyDigits(this.documentoForm.controls.documento.value);

    if (documento.length !== 14) {
      this.documentoForm.controls.documento.setErrors({ cnpjInvalido: true });
      this.documentoForm.controls.documento.markAsTouched();
      return;
    }

    this.mensagemErro = null;
    this.mensagemSucesso = null;
    this.validandoDocumento = true;

    this.fornecedorService
      .validarDocumento(documento)
      .pipe(
        finalize(() => {
          this.validandoDocumento = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.validacaoDocumento = {
            ...response,
            tipoDocumento: 'CNPJ',
            documento: this.formatarCnpjProgressivo(response.documento),
            telefone: BrInputMaskUtil.formatPhone(response.telefone ?? ''),
            state: BrInputMaskUtil.normalizeUf(response.state ?? '')
          };

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
        error: (error) => {
          this.documentoValidado = false;
          this.bloquearFormularioCadastro();
          this.validacaoDocumento = null;
          this.mensagemErro = ApiError.fromHttpError(error).getFriendlyMessage('validar o documento informado');
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
            documento: this.formatarCnpjProgressivo(fornecedor.documento),
            nome: fornecedor.nome,
            tipoDocumento: 'CNPJ',
            situacaoCadastral: fornecedor.situacaoCadastral,
            email: fornecedor.email,
            telefone: BrInputMaskUtil.formatPhone(fornecedor.telefone ?? ''),
            street: fornecedor.street,
            city: fornecedor.city,
            state: BrInputMaskUtil.normalizeUf(fornecedor.state ?? ''),
            documentoValido: true,
            permiteCadastro: true,
            dataValidacao: new Date().toISOString()
          };

          this.documentoForm.controls.documento.setValue(
            this.formatarCnpjProgressivo(fornecedor.documento)
          );
          this.preencherFormularioComFornecedor(fornecedor);

          if (!this.emModoCadastro) {
            this.irParaLista();
          }
        },
        error: (error) => {
          this.mensagemErro = ApiError.fromHttpError(error).getFriendlyMessage('salvar o fornecedor');
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
            documento: this.formatarCnpjProgressivo(fornecedorCompleto.documento),
            nome: fornecedorCompleto.nome,
            tipoDocumento: 'CNPJ',
            situacaoCadastral: fornecedorCompleto.situacaoCadastral,
            email: fornecedorCompleto.email,
            telefone: BrInputMaskUtil.formatPhone(fornecedorCompleto.telefone ?? ''),
            street: fornecedorCompleto.street,
            city: fornecedorCompleto.city,
            state: BrInputMaskUtil.normalizeUf(fornecedorCompleto.state ?? ''),
            documentoValido: true,
            permiteCadastro: true,
            dataValidacao: undefined
          };

          this.documentoForm.controls.documento.setValue(
            this.formatarCnpjProgressivo(fornecedorCompleto.documento)
          );
          this.preencherFormularioComFornecedor(fornecedorCompleto);
        },
        error: (error) => {
          this.mensagemErro = ApiError.fromHttpError(error).getFriendlyMessage(
            'carregar o fornecedor para edição'
          );
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
        error: (error) => {
          this.mensagemListaErro = ApiError.fromHttpError(error).getFriendlyMessage(
            'desativar o fornecedor'
          );
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
      street: '',
      city: '',
      state: ''
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
        error: (error) => {
          this.fornecedores = [];
          this.totalElements = 0;
          this.mensagemListaErro = ApiError.fromHttpError(error).getFriendlyMessage(
            'carregar os fornecedores'
          );
        }
      });
  }

  private preencherFormularioComValidacao(
    validacao: ValidacaoDocumentoFornecedorResponse
  ): void {
    this.cadastroForm.enable({ emitEvent: false });
    this.cadastroForm.patchValue({
      nome: validacao.nome ?? '',
      documento:
        this.formatarCnpjProgressivo(validacao.documento) ??
        this.documentoForm.controls.documento.value,
      tipoDocumento: 'CNPJ',
      situacaoCadastral: validacao.situacaoCadastral ?? 'ATIVA',
      email: BrInputMaskUtil.normalizeEmail(validacao.email ?? ''),
      telefone: BrInputMaskUtil.formatPhone(validacao.telefone ?? ''),
      street: BrInputMaskUtil.normalizeSpaces(validacao.street ?? ''),
      city: BrInputMaskUtil.normalizeSpaces(validacao.city ?? ''),
      state: BrInputMaskUtil.normalizeUf(validacao.state ?? '')
    });
    this.bloquearCamposValidados();
    this.habilitarCamposComplementares();
  }

  private preencherFormularioComFornecedor(fornecedor: FornecedorResponse): void {
    this.cadastroForm.enable({ emitEvent: false });
    this.cadastroForm.patchValue({
      nome: fornecedor.nome,
      documento: this.formatarCnpjProgressivo(fornecedor.documento),
      tipoDocumento: 'CNPJ',
      situacaoCadastral: fornecedor.situacaoCadastral,
      email: fornecedor.email ?? '',
      telefone: BrInputMaskUtil.formatPhone(fornecedor.telefone ?? ''),
      street: fornecedor.street ?? '',
      city: fornecedor.city ?? '',
      state: BrInputMaskUtil.normalizeUf(fornecedor.state ?? '')
    });
    this.bloquearCamposValidados();
    this.habilitarCamposComplementares();
  }

  private montarRequest(): FornecedorRequest {
    const nome = BrInputMaskUtil.normalizeSpaces(this.cadastroForm.controls.nome.value);
    const documento = BrInputMaskUtil.onlyDigits(this.cadastroForm.controls.documento.value);
    const email = BrInputMaskUtil.normalizeEmail(this.cadastroForm.controls.email.value);
    const telefone = BrInputMaskUtil.onlyDigits(this.cadastroForm.controls.telefone.value);
    const street = BrInputMaskUtil.normalizeSpaces(this.cadastroForm.controls.street.value);
    const city = BrInputMaskUtil.normalizeSpaces(this.cadastroForm.controls.city.value);
    const state = BrInputMaskUtil.normalizeUf(this.cadastroForm.controls.state.value);

    return {
      nome,
      documento,
      tipoDocumento: 'CNPJ',
      situacaoCadastral: this.cadastroForm.controls.situacaoCadastral.value,
      email: email || undefined,
      telefone: telefone || undefined,
      street: street || undefined,
      city: city || undefined,
      state: state || undefined
    };
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

  private formatarCnpjProgressivo(value: string): string {
    const digits = BrInputMaskUtil.onlyDigits(value).slice(0, 14);

    if (digits.length <= 2) {
      return digits;
    }

    if (digits.length <= 5) {
      return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    }

    if (digits.length <= 8) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    }

    if (digits.length <= 12) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    }

    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  private cnpjValidator(control: AbstractControl): { cnpjInvalido: true } | null {
    const value = String(control.value ?? '');
    const digits = BrInputMaskUtil.onlyDigits(value);

    if (!digits) {
      return null;
    }

    return digits.length === 14 ? null : { cnpjInvalido: true };
  }
}
