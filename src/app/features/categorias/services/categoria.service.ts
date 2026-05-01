import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../shared/models/page-response.model';
import { SelectOption } from '../../../shared/models/select-option.model';
import { CategoriaFilter } from '../models/categoria-filter.model';
import { CategoriaRequest } from '../models/categoria-request.model';
import { CategoriaResponse } from '../models/categoria-response.model';

interface CategoriaOpcaoApi {
  id: number;
  nome: string;
}

@Injectable({
  providedIn: 'root'
})
export class CategoriaService {
  private readonly apiUrl = `${environment.apiUrl}/categorias`;

  constructor(private readonly http: HttpClient) {}

  listar(filter: CategoriaFilter): Observable<PageResponse<CategoriaResponse>> {
    let params = new HttpParams()
      .set('page', String(filter.page))
      .set('size', String(filter.size));

    if (filter.termo?.trim()) {
      params = params.set('termo', filter.termo.trim());
    }

    return this.http.get<PageResponse<CategoriaResponse>>(this.apiUrl, { params });
  }

  buscarPorId(id: number): Observable<CategoriaResponse> {
    return this.http.get<CategoriaResponse>(`${this.apiUrl}/${id}`);
  }

  criar(request: CategoriaRequest): Observable<CategoriaResponse> {
    return this.http.post<CategoriaResponse>(this.apiUrl, request);
  }

  atualizar(id: number, request: CategoriaRequest): Observable<CategoriaResponse> {
    return this.http.put<CategoriaResponse>(`${this.apiUrl}/${id}`, request);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  listarOpcoes(): Observable<SelectOption<number>[]> {
    return this.http.get<CategoriaOpcaoApi[]>(`${this.apiUrl}/opcoes`).pipe(
      map((options) =>
        options.map((option) => ({
          value: option.id,
          label: option.nome
        }))
      )
    );
  }
}
