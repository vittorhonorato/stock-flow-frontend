import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { CategoriaResponse } from '../../models/categoria-response.model';

@Component({
  selector: 'app-categoria-table',
  templateUrl: './categoria-table.component.html',
  styleUrls: ['./categoria-table.component.scss']
})
export class CategoriaTableComponent {
  @Input() categorias: CategoriaResponse[] = [];
  @Input() totalElements = 0;
  @Input() pageIndex = 0;
  @Input() pageSize = 10;

  @Output() editar = new EventEmitter<CategoriaResponse>();
  @Output() excluir = new EventEmitter<CategoriaResponse>();
  @Output() pageChange = new EventEmitter<PageEvent>();

  readonly displayedColumns = ['nome', 'descricao', 'status', 'acoes'];
}
