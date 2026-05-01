import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CategoriaRequest } from '../../models/categoria-request.model';
import { CategoriaResponse } from '../../models/categoria-response.model';

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

    const nome = this.form.controls.nome.value.trim();
    const descricao = this.form.controls.descricao.value.trim();

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

