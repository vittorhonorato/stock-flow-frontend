import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../shared/models/page-response.model';
import { AjusteEstoqueRequest } from '../models/ajuste-estoque-request.model';
import { HistoricoEstoqueResponse } from '../models/historico-estoque-response.model';
import { MovimentacaoEstoqueRequest } from '../models/movimentacao-estoque-request.model';

@Injectable({
  providedIn: 'root'
})
export class EstoqueService {
  private readonly apiUrl = `${environment.apiUrl}/estoque`;

  constructor(private readonly http: HttpClient) {}

  entrada(request: MovimentacaoEstoqueRequest): Observable<HistoricoEstoqueResponse> {
    return this.http.post<HistoricoEstoqueResponse>(`${this.apiUrl}/entrada`, request);
  }

  saida(request: MovimentacaoEstoqueRequest): Observable<HistoricoEstoqueResponse> {
    return this.http.post<HistoricoEstoqueResponse>(`${this.apiUrl}/saida`, request);
  }

  ajuste(request: AjusteEstoqueRequest): Observable<HistoricoEstoqueResponse> {
    return this.http.post<HistoricoEstoqueResponse>(`${this.apiUrl}/ajuste`, request);
  }

  listarHistoricoPorProduto(
    produtoId: number,
    page: number,
    size: number
  ): Observable<PageResponse<HistoricoEstoqueResponse>> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    return this.http.get<PageResponse<HistoricoEstoqueResponse>>(
      `${this.apiUrl}/produtos/${produtoId}/historico`,
      { params }
    );
  }
}
