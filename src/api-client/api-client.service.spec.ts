import { Test, TestingModule } from '@nestjs/testing';
import { ApiAuthType, ApiClient } from './api-client.class.js';
import {
  ApiClientService,
  CreateApiClientOptions,
} from './api-client.service.js';

describe('ApiClientService', () => {
  let service: ApiClientService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiClientService],
    }).compile();

    service = module.get<ApiClientService>(ApiClientService);
  });

  it('should create an ApiClient instance', () => {
    const options: CreateApiClientOptions = {
      baseUrl: 'https://api.example.com',
      authentication: {
        type: ApiAuthType.QUERY_PARAM,
        paramName: 'apikey',
        paramValueEnvKey: 'TEST_KEY',
      },
    };

    const client = service.createApiClient(options);

    expect(client).toBeInstanceOf(ApiClient);
    expect(client.baseUrl).toBe(options.baseUrl);
    expect(client.authentication).toEqual(options.authentication);
  });
});
