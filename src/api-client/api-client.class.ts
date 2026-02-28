import { Logger } from '@nestjs/common';
import { URL } from 'node:url';
import { IValidation } from 'typia';
import { ApiHttpException } from './api-http-exception.class.js';

export enum ApiAuthType {
  QUERY_PARAM = 'query_param',
  AUTHORIZATION_HEADER = 'bearer',
}

export interface BaseApiAuthMethod {
  type: ApiAuthType;
}

export interface QueryParamApiAuthMethod extends BaseApiAuthMethod {
  type: ApiAuthType.QUERY_PARAM;
  paramName: string;
  /**
   * Key in the process.env object that contains the param value
   */
  paramValueEnvKey: string;
}

export interface BearerTokenApiAuthMethod extends BaseApiAuthMethod {
  type: ApiAuthType.AUTHORIZATION_HEADER;
  /**
   * @default 'Bearer'
   */
  tokenType?: string;
  /**
   * Key in the process.env object that contains the token
   */
  tokenEnvKey: string;
}

export type ApiAuthMethods = QueryParamApiAuthMethod | BearerTokenApiAuthMethod;

export interface ApiRequest<T> {
  path: string;
  method?: string;
  query?: Record<string, string>;
  body?: unknown;
  validator: (data: unknown) => IValidation<T>;
  /**
   * Throw an error if the response does not pass validation
   * @default true
   */
  failOnInvalidResponse?: boolean;
}

export interface ApiResponse<T> {
  responseText: string | undefined;
  response: T;
  validation: IValidation<T>;
  ok: boolean;
}

export class ApiClient {
  constructor(
    private logger: Logger,
    private baseUrl: string,
    private authentication: ApiAuthMethods,
  ) {}

  public async request<T>(params: ApiRequest<T>): Promise<ApiResponse<T>> {
    const {
      failOnInvalidResponse = true,
      query,
      path,
      body,
      method = 'GET',
      validator,
    } = params;
    let responseText: string | undefined;
    let response: unknown;
    let r: Response | undefined;
    const queryParams = new URLSearchParams();
    if (this.authentication.type === ApiAuthType.QUERY_PARAM) {
      queryParams.set(
        this.authentication.paramName,
        this.getEnv(this.authentication.paramValueEnvKey),
      );
    }
    if (query) {
      Object.keys(query).forEach((key) => {
        queryParams.set(key, query?.[key] ?? '');
      });
    }
    const requestUrl = new URL(this.baseUrl + this.normalizePath(path));
    requestUrl.search = this.normalizeQueryParams(queryParams);
    const errorPrefix = `fetch ${method} ${String(requestUrl)}:`;

    try {
      const requestHeaders: Record<string, string> = {
        Accept: 'application/json',
      };
      const requestBody =
        typeof body !== 'undefined' ? JSON.stringify(body) : undefined;
      if (body) {
        requestHeaders['Content-Type'] = 'application/json';
      }
      if (this.authentication.type === ApiAuthType.AUTHORIZATION_HEADER) {
        requestHeaders['Authorization'] =
          `${this.authentication.tokenType ?? 'Bearer'} ${this.getEnv(this.authentication.tokenEnvKey)}`;
      }
      r = await fetch(requestUrl, {
        method,
        headers: requestHeaders,
        body: requestBody,
      });
      if (r.ok) {
        responseText = await r.text();
      }
    } catch (e) {
      throw new ApiHttpException(`${errorPrefix} Failed API request`, 500, e);
    }
    if (!r.ok) {
      const clientSideMessage = `API request failed with HTTP status ${r.status} ${r.statusText}`;
      const errorMessage = `${errorPrefix} ${clientSideMessage}\n${responseText}`;
      this.logger.error(errorMessage);
      throw new ApiHttpException(clientSideMessage, 500);
    }

    try {
      if (responseText) {
        response = JSON.parse(responseText);
      }
    } catch (e) {
      const clientSideMessage = 'Failed to parse response as JSON';
      const errorMessage = `${errorPrefix} Failed to parse response as JSON\n${responseText}`;
      this.logger.error(errorMessage);
      throw new ApiHttpException(clientSideMessage, 500, e);
    }

    const validation = validator(response);
    if (!validation.success) {
      const clientSideMessage = 'Response validation failed';
      const errorMessage = `${errorPrefix} ${clientSideMessage}\n${responseText}\n${['', ...validation.errors.map((err) => JSON.stringify(err))].join('\n- ')}`;
      if (failOnInvalidResponse) {
        throw new ApiHttpException(clientSideMessage, 500);
      }
      this.logger.warn(errorMessage);
    }

    return {
      responseText,
      response: response as T,
      validation,
      ok: r?.ok ?? false,
    };
  }
  protected normalizePath(path: string | undefined): string {
    if (!path || path.length === 0) {
      return '/';
    }
    return path.replace(/^([^/])/, '/$1');
  }

  private getEnv(envVarName: string): string {
    const envVar = process.env[envVarName] as unknown;
    if (typeof envVar !== 'string' || envVar.length === 0) {
      throw new Error(`${envVarName} environment variable is not set`);
    }
    return envVar;
  }

  private normalizeQueryParams(queryParams: URLSearchParams): string {
    return queryParams.size > 0 ? `?${queryParams.toString()}` : '';
  }
}
