import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { PageEvent } from '@angular/material/paginator';
import { finalize } from 'rxjs';
import { ApiError } from '../../../../core/errors/api-error';
import { CategoriaService } from '../../services/categoria.service';
import { CategoriaFilter } from '../../models/categoria-filter.model';
import { CategoriaRequest } from '../../models/categoria-request.model';
import { CategoriaResponse } from '../../models/categoria-response.model';
import { BrInputMaskUtil } from '../../../../shared/utils/br-input-mask.util';

@Component({
  selector: 'app-categoria-list-page',
  templateUrl: './categoria-list-page.component.html',
  styleUrls: ['./categoria-list-page.component.scss']
})
export class CategoriaListPageComponent implements OnInit {
  readonly termoControl = new FormControl('', { nonNullable: true });
  readonly pageSizeOptions = [5, 10, 20];

  categorias: CategoriaResponse[] = [];
  totalElements = 0;
  loading = false;
  saving = false;
  showForm = false;
  confirmandoExclusao = false;
  erroMensagem: string | null = null;

  categoriaSelecionada: CategoriaResponse | null = null;
  categoriaParaExcluir: CategoriaResponse | null = null;

  filter: CategoriaFilter = {
    page: 0,
    size: 5
  };

  constructor(private readonly categoriaService: CategoriaService) {}

  ngOnInit(): void {
    this.carregarCategorias();
  }

  carregarCategorias(): void {
    this.loading = true;
    this.erroMensagem = null;

    this.categoriaService
      .listar(this.filter)
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.categorias = response.content;
          this.totalElements = response.totalElements;
        },
        error: (error) => {
          this.categorias = [];
          this.totalElements = 0;
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage('carregar as categorias');
        }
      });
  }

  pesquisar(): void {
    const termo = BrInputMaskUtil.normalizeSpaces(this.termoControl.value);
    this.termoControl.setValue(termo, { emitEvent: false });

    this.filter = {
      ...this.filter,
      termo: termo || undefined,
      page: 0
    };

    this.carregarCategorias();
  }

  limparFiltros(): void {
    this.termoControl.setValue('');

    this.filter = {
      ...this.filter,
      termo: undefined,
      page: 0
    };

    this.carregarCategorias();
  }

  novaCategoria(): void {
    this.categoriaSelecionada = null;
    this.showForm = true;
  }

  editarCategoria(categoria: CategoriaResponse): void {
    this.categoriaSelecionada = categoria;
    this.showForm = true;
  }

  excluirCategoria(categoria: CategoriaResponse): void {
    this.categoriaParaExcluir = categoria;
    this.confirmandoExclusao = true;
  }

  confirmarExclusao(): void {
    if (!this.categoriaParaExcluir) {
      return;
    }

    const categoria = this.categoriaParaExcluir;
    this.loading = true;
    this.erroMensagem = null;

    this.categoriaService
      .excluir(categoria.id)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cancelarExclusao();
        })
      )
      .subscribe({
        next: () => {
          this.carregarCategorias();
        },
        error: (error) => {
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage('excluir a categoria');
        }
      });
  }

  cancelarExclusao(): void {
    this.confirmandoExclusao = false;
    this.categoriaParaExcluir = null;
  }

  salvarCategoria(request: CategoriaRequest): void {
    this.saving = true;
    this.erroMensagem = null;

    const categoriaId = this.categoriaSelecionada?.id;
    const request$ =
      categoriaId != null
        ? this.categoriaService.atualizar(categoriaId, request)
        : this.categoriaService.criar(request);

    request$
      .pipe(
        finalize(() => {
          this.saving = false;
        })
      )
      .subscribe({
        next: () => {
          this.showForm = false;
          this.categoriaSelecionada = null;
          this.carregarCategorias();
        },
        error: (error) => {
          this.erroMensagem = ApiError.fromHttpError(error).getFriendlyMessage('salvar a categoria');
        }
      });
  }

  cancelarFormulario(): void {
    this.showForm = false;
    this.categoriaSelecionada = null;
  }

  onPageChange(event: PageEvent): void {
    this.filter = {
      ...this.filter,
      page: event.pageIndex,
      size: event.pageSize
    };

    this.carregarCategorias();
  }
}
