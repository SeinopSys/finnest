import { Logger } from '@nestjs/common';
import { Mock } from 'vitest';
import { ApiClient, ApiAuthType } from './api-client.class.js';
import { ApiHttpException } from './api-http-exception.class.js';

describe('ApiClient', () => {
  let logger: Logger;
  let fetchMock: Mock;
  const baseUrl = 'https://api.example.com';

  beforeEach(() => {
    logger = {
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
      log: vi.fn(),
      verbose: vi.fn(),
    } as unknown as Logger;
    // Mock fetch
    fetchMock = vi.fn();
    process.env.TEST_API_KEY = 'test-key';
    process.env.TEST_TOKEN = 'test-token';
  });

  afterEach(() => {
    delete process.env.TEST_API_KEY;
    delete process.env.TEST_TOKEN;
    vi.clearAllMocks();
  });

  describe('request', () => {
    it('should successfully make a GET request with query param auth', async () => {
      const client = new ApiClient(
        logger,
        baseUrl,
        {
          type: ApiAuthType.QUERY_PARAM,
          paramName: 'apikey',
          paramValueEnvKey: 'TEST_API_KEY',
        },
        fetchMock as unknown as typeof fetch,
      );

      const mockResponse = { data: 'ok' };
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(JSON.stringify(mockResponse)),
      });

      const validator = vi.fn().mockReturnValue({ success: true });

      const result = await client.request({
        path: '/test',
        query: { foo: 'bar' },
        validator,
      });

      expect(result.response).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledWith(
        new URL('https://api.example.com/test?apikey=test-key&foo=bar'),
        expect.objectContaining({
          method: 'GET',
          headers: { Accept: 'application/json' },
        }),
      );
    });

    it('should successfully make a POST request with bearer auth', async () => {
      const client = new ApiClient(
        logger,
        baseUrl,
        {
          type: ApiAuthType.AUTHORIZATION_HEADER,
          tokenEnvKey: 'TEST_TOKEN',
        },
        fetchMock as unknown as typeof fetch,
      );

      const mockResponse = { success: true };
      fetchMock.mockResolvedValue({
        ok: true,
        status: 201,
        text: vi.fn().mockResolvedValue(JSON.stringify(mockResponse)),
      });

      const validator = vi.fn().mockReturnValue({ success: true });

      const result = await client.request({
        path: 'test',
        method: 'POST',
        body: { key: 'value' },
        validator,
      });

      expect(result.response).toEqual(mockResponse);
      expect(fetchMock).toHaveBeenCalledWith(
        new URL('https://api.example.com/test'),
        expect.objectContaining({
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          },
          body: JSON.stringify({ key: 'value' }),
        }),
      );
    });

    it('should throw ApiHttpException when fetch fails', async () => {
      const client = new ApiClient(
        logger,
        baseUrl,
        {
          type: ApiAuthType.QUERY_PARAM,
          paramName: 'apikey',
          paramValueEnvKey: 'TEST_API_KEY',
        },
        fetchMock as unknown as typeof fetch,
      );

      fetchMock.mockRejectedValue(new Error('Network error'));

      // noinspection ES6RedundantAwait
      await expect(
        client.request({
          path: '/test',
          validator: vi.fn(),
        }),
      ).rejects.toThrow(ApiHttpException);
    });

    it('should throw ApiHttpException when response is not ok', async () => {
      const client = new ApiClient(
        logger,
        baseUrl,
        {
          type: ApiAuthType.QUERY_PARAM,
          paramName: 'apikey',
          paramValueEnvKey: 'TEST_API_KEY',
        },
        fetchMock as unknown as typeof fetch,
      );

      fetchMock.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: vi.fn().mockResolvedValue('Not Found Body'),
      });

      // noinspection ES6RedundantAwait
      await expect(
        client.request({
          path: '/test',
          validator: vi.fn(),
        }),
      ).rejects.toThrow('API request failed with HTTP status 404 Not Found');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(logger.error).toHaveBeenCalled();
    });

    it('should throw ApiHttpException when JSON parsing fails', async () => {
      const client = new ApiClient(
        logger,
        baseUrl,
        {
          type: ApiAuthType.QUERY_PARAM,
          paramName: 'apikey',
          paramValueEnvKey: 'TEST_API_KEY',
        },
        fetchMock as unknown as typeof fetch,
      );

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('invalid json'),
      });

      // noinspection ES6RedundantAwait
      await expect(
        client.request({
          path: '/test',
          validator: vi.fn(),
        }),
      ).rejects.toThrow('Failed to parse response as JSON');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(logger.error).toHaveBeenCalled();
    });

    it('should throw ApiHttpException when validation fails and failOnInvalidResponse is true', async () => {
      const client = new ApiClient(
        logger,
        baseUrl,
        {
          type: ApiAuthType.QUERY_PARAM,
          paramName: 'apikey',
          paramValueEnvKey: 'TEST_API_KEY',
        },
        fetchMock as unknown as typeof fetch,
      );

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('{}'),
      });

      const validator = vi
        .fn()
        .mockReturnValue({ success: false, errors: [{ message: 'error' }] });

      // noinspection ES6RedundantAwait
      await expect(
        client.request({
          path: '/test',
          validator,
        }),
      ).rejects.toThrow('Response validation failed');
    });

    it('should NOT throw ApiHttpException when validation fails and failOnInvalidResponse is false', async () => {
      const client = new ApiClient(
        logger,
        baseUrl,
        {
          type: ApiAuthType.QUERY_PARAM,
          paramName: 'apikey',
          paramValueEnvKey: 'TEST_API_KEY',
        },
        fetchMock as unknown as typeof fetch,
      );

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('{}'),
      });

      const validator = vi
        .fn()
        .mockReturnValue({ success: false, errors: [{ message: 'error' }] });

      const result = await client.request({
        path: '/test',
        validator,
        failOnInvalidResponse: false,
      });

      expect(result.validation.success).toBe(false);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(logger.warn).toHaveBeenCalled();
    });

    it('should throw Error if environment variable is not set', async () => {
      const client = new ApiClient(
        logger,
        baseUrl,
        {
          type: ApiAuthType.QUERY_PARAM,
          paramName: 'apikey',
          paramValueEnvKey: 'NON_EXISTENT_KEY',
        },
        fetchMock as unknown as typeof fetch,
      );

      // noinspection ES6RedundantAwait
      await expect(
        client.request({
          path: '/test',
          validator: vi.fn(),
        }),
      ).rejects.toThrow('NON_EXISTENT_KEY environment variable is not set');
    });

    it('should handle null values in query record', async () => {
      const client = new ApiClient(
        logger,
        baseUrl,
        {
          type: ApiAuthType.QUERY_PARAM,
          paramName: 'apikey',
          paramValueEnvKey: 'TEST_API_KEY',
        },
        fetchMock as unknown as typeof fetch,
      );

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue('{}'),
      });

      await client.request({
        path: '/test',
        query: { foo: '' },
        validator: vi.fn().mockReturnValue({ success: true }),
      });

      expect(fetchMock).toHaveBeenCalledWith(
        new URL('https://api.example.com/test?apikey=test-key&foo='),
        expect.anything(),
      );
    });

    it('should handle empty response text gracefully', async () => {
      const client = new ApiClient(
        logger,
        baseUrl,
        {
          type: ApiAuthType.QUERY_PARAM,
          paramName: 'apikey',
          paramValueEnvKey: 'TEST_API_KEY',
        },
        fetchMock as unknown as typeof fetch,
      );

      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        text: vi.fn().mockResolvedValue(''),
      });

      const result = await client.request({
        path: '/test',
        validator: vi.fn().mockReturnValue({ success: true }),
      });

      expect(result.responseText).toBe('');
      expect(result.response).toBeUndefined();
    });
  });

  describe('normalizePath', () => {
    it('should return / if path is undefined', () => {
      const client = new ApiClient(logger, baseUrl, {
        type: ApiAuthType.QUERY_PARAM,
        paramName: 'a',
        paramValueEnvKey: 'b',
      });
      expect(client.normalizePath(undefined)).toBe('/');
    });

    it('should return / if path is empty string', () => {
      const client = new ApiClient(logger, baseUrl, {
        type: ApiAuthType.QUERY_PARAM,
        paramName: 'a',
        paramValueEnvKey: 'b',
      });
      expect(client.normalizePath('')).toBe('/');
    });

    it('should add leading slash if missing', () => {
      const client = new ApiClient(logger, baseUrl, {
        type: ApiAuthType.QUERY_PARAM,
        paramName: 'a',
        paramValueEnvKey: 'b',
      });
      expect(client.normalizePath('test')).toBe('/test');
    });

    it('should NOT add leading slash if already present', () => {
      const client = new ApiClient(logger, baseUrl, {
        type: ApiAuthType.QUERY_PARAM,
        paramName: 'a',
        paramValueEnvKey: 'b',
      });
      expect(client.normalizePath('/test')).toBe('/test');
    });
  });

  describe('getEnv', () => {
    it('should return environment variable value if set', () => {
      const client = new ApiClient(logger, baseUrl, {
        type: ApiAuthType.QUERY_PARAM,
        paramName: 'a',
        paramValueEnvKey: 'b',
      });
      process.env.EXISTING_VAR = 'some-value';
      expect(client.getEnv('EXISTING_VAR')).toBe('some-value');
      delete process.env.EXISTING_VAR;
    });

    it('should throw Error if environment variable is not set', () => {
      const client = new ApiClient(logger, baseUrl, {
        type: ApiAuthType.QUERY_PARAM,
        paramName: 'a',
        paramValueEnvKey: 'b',
      });
      expect(() => client.getEnv('NON_EXISTENT_VAR')).toThrow(
        'NON_EXISTENT_VAR environment variable is not set',
      );
    });

    it('should throw Error if environment variable is empty string', () => {
      const client = new ApiClient(logger, baseUrl, {
        type: ApiAuthType.QUERY_PARAM,
        paramName: 'a',
        paramValueEnvKey: 'b',
      });
      process.env.EMPTY_VAR = '';
      expect(() => client.getEnv('EMPTY_VAR')).toThrow(
        'EMPTY_VAR environment variable is not set',
      );
      delete process.env.EMPTY_VAR;
    });
  });

  describe('normalizeQueryParams', () => {
    it('should return empty string if URLSearchParams is empty', () => {
      const client = new ApiClient(logger, baseUrl, {
        type: ApiAuthType.QUERY_PARAM,
        paramName: 'a',
        paramValueEnvKey: 'b',
      });
      const params = new URLSearchParams();
      expect(client.normalizeQueryParams(params)).toBe('');
    });

    it('should return query string starting with ? if URLSearchParams is NOT empty', () => {
      const client = new ApiClient(logger, baseUrl, {
        type: ApiAuthType.QUERY_PARAM,
        paramName: 'a',
        paramValueEnvKey: 'b',
      });
      const params = new URLSearchParams({ foo: 'bar', baz: '123' });
      expect(client.normalizeQueryParams(params)).toBe('?foo=bar&baz=123');
    });
  });
});
