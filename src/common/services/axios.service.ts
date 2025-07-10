import { Injectable } from '@nestjs/common';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import * as http from 'http';
import * as https from 'https';

@Injectable()
export class AxiosService {
  private readonly defaultConfig: AxiosRequestConfig = {
    timeout: 30000,
    validateStatus: () => true,
    headers: {
      'User-Agent': 'Chronycle-API/1.0.0',
    },
    // Performance optimizations
    maxRedirects: 5,
    maxContentLength: 50 * 1024 * 1024, // 50MB
    maxBodyLength: 50 * 1024 * 1024, // 50MB
    // Disable automatic decompression for better performance
    decompress: false,
    // Use keep-alive connections
    httpAgent: new http.Agent({
      keepAlive: true,
      maxFreeSockets: 10,
      keepAliveMsecs: 1000,
    }),
    httpsAgent: new https.Agent({
      keepAlive: true,
      maxFreeSockets: 10,
      keepAliveMsecs: 1000,
    }),
  };

  private warmedConnections = new Set<string>();

  async warmConnection(url: string) {
    const hostname = new URL(url).hostname;

    if (!this.warmedConnections.has(hostname)) {
      try {
        await this.head(url);
        this.warmedConnections.add(hostname);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        console.log(`Failed to warm connection for ${hostname}: ${message}`);
      }
    }
  }

  async request<T = any>(
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    try {
      const mergedConfig = this.mergeConfig(this.defaultConfig, config);
      return await axios(mergedConfig);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`HTTP request failed: ${error.message}`);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Request failed: ${message}`);
    }
  }

  async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }

  async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  async head<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'HEAD', url });
  }

  async options<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'OPTIONS', url });
  }

  /**
   * Replay a request with the given configuration
   */
  async replayRequest(
    method: string,
    url: string,
    headers?: Record<string, any>,
    queryParams?: Record<string, any>,
    body?: any,
  ): Promise<AxiosResponse> {
    await this.warmConnection(url);

    // Optimize for performance by avoiding unnecessary object creation
    const config: AxiosRequestConfig = {
      method: method.toLowerCase(),
      url,
      headers: this.sanitizeHeaders(headers),
    };

    // Only add params if they exist and have keys
    if (queryParams && Object.keys(queryParams).length > 0) {
      config.params = queryParams;
    }

    // Only add data if body exists
    if (body !== undefined && body !== null) {
      config.data = body;
    }

    const start = Date.now();
    const response = await this.request(config);
    console.log(`Test test: ${Date.now() - start}ms`);

    return response;
  }

  /**
   * Sanitize headers by removing sensitive information
   */
  private sanitizeHeaders(headers?: Record<string, any>): Record<string, any> {
    if (!headers || Object.keys(headers).length === 0) return {};

    const sanitized = { ...headers };
    // Use Set for O(1) lookup performance
    const sensitiveHeaders = new Set([
      'host',
      'content-length',
      'connection',
      'x-api-key',
    ]);

    Object.keys(sanitized).forEach((header) => {
      if (sensitiveHeaders.has(header.toLowerCase())) {
        delete sanitized[header];
      }
    });

    return sanitized;
  }

  /**
   * Merge configuration objects with proper deep merging
   */
  private mergeConfig(
    defaultConfig: AxiosRequestConfig,
    userConfig: AxiosRequestConfig,
  ): AxiosRequestConfig {
    // Optimize by avoiding unnecessary object spread when possible
    if (!userConfig.headers) {
      return { ...defaultConfig, ...userConfig };
    }

    return {
      ...defaultConfig,
      ...userConfig,
      headers: {
        ...defaultConfig.headers,
        ...userConfig.headers,
      },
    };
  }

  isAxiosError(error: any): error is AxiosError {
    return axios.isAxiosError(error);
  }
}
