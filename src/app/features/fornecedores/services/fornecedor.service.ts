import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PageResponse } from '../../../shared/models/page-response.model';
import { SelectOption } from '../../../shared/models/select-option.model';
import { FornecedorFilter } from '../models/fornecedor-filter.model';
import { FornecedorRequest } from '../models/fornecedor-request.model';
import { FornecedorResponse } from '../models/fornecedor-response.model';
import { ValidacaoDocumentoFornecedorResponse } from '../models/fornecedor-validacao-documento-response.model';

interface FornecedorOpcaoApi {
  id: number;
  nome: string;
}

@Injectable({
  providedIn: 'root'
})
export class FornecedorService {
  private readonly apiUrl = `${environment.apiUrl}/fornecedores`;

  constructor(private readonly http: HttpClient) {}

  listar(filter: FornecedorFilter): Observable<PageResponse<FornecedorResponse>> {
    let params = new HttpParams()
      .set('page', String(filter.page))
      .set('size', String(filter.size));

    if (filter.termo?.trim()) {
      params = params.set('termo', filter.termo.trim());
    }

    if (filter.tipoDocumento) {
      params = params.set('tipoDocumento', filter.tipoDocumento);
    }

    return this.http.get<PageResponse<FornecedorResponse>>(this.apiUrl, { params });
  }

  buscarPorId(id: number): Observable<FornecedorResponse> {
    return this.http.get<FornecedorResponse>(`${this.apiUrl}/${id}`);
  }

  criar(request: FornecedorRequest): Observable<FornecedorResponse> {
    return this.http.post<FornecedorResponse>(`${this.apiUrl}/criar-fornecedor`, request);
  }

  atualizar(id: number, request: FornecedorRequest): Observable<FornecedorResponse> {
    return this.http.put<FornecedorResponse>(`${this.apiUrl}/atualizar-fornecedor/${id}`, request);
  }

  excluir(id: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/desativar/${id}`, null);
  }

  listarOpcoes(): Observable<SelectOption<number>[]> {
    return this.http.get<FornecedorOpcaoApi[]>(`${this.apiUrl}/opcoes`).pipe(
      map((options) =>
        options.map((option) => ({
          value: option.id,
          label: option.nome
        }))
      )
    );
  }

  validarDocumento(documento: string): Observable<ValidacaoDocumentoFornecedorResponse> {
    return this.http.get<ValidacaoDocumentoFornecedorResponse>(
      `${this.apiUrl}/validar-documento/${encodeURIComponent(documento)}`
    );
  }
}
