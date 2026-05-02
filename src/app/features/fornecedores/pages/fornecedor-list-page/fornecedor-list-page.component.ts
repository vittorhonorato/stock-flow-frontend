import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  FornecedorRequest,
  TipoDocumentoFornecedor
} from '../../models/fornecedor-request.model';
import { FornecedorResponse } from '../../models/fornecedor-response.model';
import { ValidacaoDocumentoFornecedorResponse } from '../../models/fornecedor-validacao-documento-response.model';
import { FornecedorService } from '../../services/fornecedor.service';

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

  validandoDocumento = false;
  salvando = false;
  documentoValidado = false;

  mensagemErro: string | null = null;
  mensagemSucesso: string | null = null;

  validacaoDocumento: ValidacaoDocumentoFornecedorResponse | null = null;
  fornecedorEmEdicao: FornecedorResponse | null = null;

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
          this.cadastroForm.disable();
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
        },
        error: () => {
          this.mensagemErro = 'Não foi possível salvar o fornecedor.';
        }
      });
  }

  redefinirFluxo(): void {
    this.documentoForm.reset({ documento: '' });
    this.documentoValidado = false;
    this.validandoDocumento = false;
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
