import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CategoriaRequest } from '../../models/categoria-request.model';
import { CategoriaResponse } from '../../models/categoria-response.model';
import { BrInputMaskUtil } from '../../../../shared/utils/br-input-mask.util';

@Component({
  selector: 'app-categoria-form',
  templateUrl: './categoria-form.component.html',
  styleUrls: ['./categoria-form.component.scss']
})
export class CategoriaFormComponent implements OnChanges {
  @Input() categoriaSelecionada: CategoriaResponse | null = null;
  @Input() saving = false;

  @Output() saved = new EventEmitter<CategoriaRequest>();
  @Output() cancelled = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    descricao: ['']
  });

  constructor(private readonly fb: FormBuilder) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoriaSelecionada']) {
      this.preencherFormulario(this.categoriaSelecionada);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const nome = BrInputMaskUtil.normalizeSpaces(this.form.controls.nome.value);
    const descricao = BrInputMaskUtil.normalizeSpaces(this.form.controls.descricao.value);

    if (!nome) {
      this.form.controls.nome.setErrors({ required: true });
      this.form.controls.nome.markAsTouched();
      return;
    }

    this.saved.emit({
      nome,
      descricao: descricao || undefined
    });
  }

  onNomeBlur(): void {
    const nomeNormalizado = BrInputMaskUtil.normalizeSpaces(this.form.controls.nome.value);
    this.form.controls.nome.setValue(nomeNormalizado, { emitEvent: false });
  }

  onDescricaoBlur(): void {
    const descricaoNormalizada = BrInputMaskUtil.normalizeSpaces(this.form.controls.descricao.value);
    this.form.controls.descricao.setValue(descricaoNormalizada, { emitEvent: false });
  }

  private preencherFormulario(categoria: CategoriaResponse | null): void {
    if (!categoria) {
      this.form.reset({
        nome: '',
        descricao: ''
      });
      return;
    }

    this.form.reset({
      nome: categoria.nome,
      descricao: categoria.descricao ?? ''
    });
  }
}
