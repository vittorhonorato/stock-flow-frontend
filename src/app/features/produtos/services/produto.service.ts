import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../shared/models/page-response.model';
import { ProdutoFilter } from '../models/produto-filter.model';
import { ProdutoRequest } from '../models/produto-request.model';
import { ProdutoResponse } from '../models/produto-response.model';

@Injectable({
  providedIn: 'root'
})
export class ProdutoService {
  private readonly apiUrl = `${environment.apiUrl}/produtos`;

  constructor(private readonly http: HttpClient) {}

  listar(filter: ProdutoFilter): Observable<PageResponse<ProdutoResponse>> {
    const params = new HttpParams()
      .set('page', String(filter.page))
      .set('size', String(filter.size))
      .set('sort', 'id,asc');

    return this.http.get<PageResponse<ProdutoResponse>>(this.apiUrl, { params });
  }

  buscarPorId(id: number): Observable<ProdutoResponse> {
    return this.http.get<ProdutoResponse>(`${this.apiUrl}/${id}`);
  }

  buscarPorSku(sku: string): Observable<ProdutoResponse> {
    return this.http.get<ProdutoResponse>(`${this.apiUrl}/sku/${encodeURIComponent(sku)}`);
  }

  criar(request: ProdutoRequest, imagem?: File | null): Observable<ProdutoResponse> {
    if (imagem) {
      return this.http.post<ProdutoResponse>(this.apiUrl, this.criarFormData(request, imagem));
    }

    return this.http.post<ProdutoResponse>(this.apiUrl, request);
  }

  atualizar(id: number, request: ProdutoRequest, imagem?: File | null): Observable<ProdutoResponse> {
    if (imagem) {
      return this.http.put<ProdutoResponse>(
        `${this.apiUrl}/atualizar/${id}`,
        this.criarFormData(request, imagem)
      );
    }

    return this.http.put<ProdutoResponse>(`${this.apiUrl}/atualizar/${id}`, request);
  }

  desativar(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/desativar`, null);
  }

  private criarFormData(request: ProdutoRequest, imagem: File): FormData {
    const formData = new FormData();
    formData.append(
      'produto',
      new Blob([JSON.stringify(request)], { type: 'application/json' })
    );
    formData.append('imagem', imagem);

    return formData;
  }
}
