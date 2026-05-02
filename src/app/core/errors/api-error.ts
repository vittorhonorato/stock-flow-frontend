import { HttpErrorResponse } from '@angular/common/http';

interface ApiErrorResponsePayload {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  path?: string;
  details?: string[];
}

export class ApiError extends Error {
  readonly timestamp?: string;
  readonly status: number;
  readonly error?: string;
  readonly path?: string;
  readonly details: string[];

  constructor(payload: ApiErrorResponsePayload) {
    super(payload.message ?? 'Erro inesperado.');
    this.name = 'ApiError';
    this.timestamp = payload.timestamp;
    this.status = payload.status ?? 0;
    this.error = payload.error;
    this.path = payload.path;
    this.details = payload.details ?? [];
  }

  static fromHttpError(error: unknown): ApiError {
    if (!(error instanceof HttpErrorResponse)) {
      return new ApiError({
        status: 0,
        message: 'Falha inesperada ao processar a resposta da API.'
      });
    }

    const payload = (error.error ?? {}) as ApiErrorResponsePayload;
    const message =
      typeof payload.message === 'string' && payload.message.trim()
        ? payload.message
        : error.message;

    return new ApiError({
      timestamp: payload.timestamp,
      status: payload.status ?? error.status,
      error: payload.error ?? error.statusText,
      message,
      path: payload.path,
      details: payload.details
    });
  }

  getFriendlyMessage(action: string): string {
    const detalhePrincipal = this.details[0]?.trim();

    if (detalhePrincipal) {
      return detalhePrincipal;
    }

    if (this.message?.trim() && this.message !== 'Http failure response for (unknown url): 0 Unknown Error') {
      return this.message;
    }

    switch (this.status) {
      case 0:
        return `Não foi possível ${action}. Verifique sua conexão com o backend.`;
      case 400:
        return `Não foi possível ${action}. Verifique os dados informados.`;
      case 401:
        return `Não foi possível ${action}. Sua sessão não está autorizada.`;
      case 403:
        return `Não foi possível ${action}. Você não tem permissão para essa ação.`;
      case 404:
        return `Não foi possível ${action}. Recurso não encontrado.`;
      case 409:
        return `Não foi possível ${action}. Já existe um registro conflitante.`;
      case 422:
        return `Não foi possível ${action}. Os dados enviados são inválidos.`;
      case 500:
        return `Não foi possível ${action}. O servidor encontrou um erro interno.`;
      default:
        return `Não foi possível ${action}. Tente novamente em instantes.`;
    }
  }
}
