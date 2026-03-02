import { Injectable, Logger } from '@nestjs/common';
import { ApiAuthMethods, ApiClient } from './api-client.class.js';

export interface CreateApiClientOptions {
  baseUrl: string;
  authentication: ApiAuthMethods;
}

@Injectable()
export class ApiClientService {
  public createApiClient(options: CreateApiClientOptions): ApiClient {
    return new ApiClient(
      new Logger(`ApiClient(${options.baseUrl})`),
      options.baseUrl,
      options.authentication,
      fetch,
    );
  }
}
