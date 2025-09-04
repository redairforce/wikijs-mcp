import axios, { AxiosInstance } from 'axios';
import { Config, WikiJSResponse, PageInfo, CreatePageInput, UpdatePageInput, SearchResult, CreatePageResponse, UpdatePageResponse, DeletePageResponse } from '../types';

export class WikiJSClient {
  private httpClient: AxiosInstance;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.wikijs_token) {
      headers['Authorization'] = `Bearer ${config.wikijs_token}`;
    }

    this.httpClient = axios.create({
      baseURL: `${config.wikijs_api_url}/graphql`,
      headers,
      timeout: 30000,
    });
  }

  private async executeGraphQL<T = any>(query: string, variables?: any): Promise<WikiJSResponse<T>> {
    try {
      const response = await this.httpClient.post('', {
        query,
        variables,
      });

      return response.data as WikiJSResponse<T>;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`GraphQL request failed: ${error.message}`);
      }
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    const query = `
      query {
        site {
          config {
            title
            host
          }
        }
        system {
          info {
            currentVersion
            platform
          }
        }
      }
    `;

    try {
      const response = await this.executeGraphQL(query);
      return !response.errors && !!response.data;
    } catch {
      return false;
    }
  }

  async getSiteInfo(): Promise<any> {
    const query = `
      query {
        site {
          config {
            title
            host
            description
          }
        }
        system {
          info {
            currentVersion
            platform
            nodeVersion
          }
        }
      }
    `;

    const response = await this.executeGraphQL(query);
    if (response.errors) {
      throw new Error(`Failed to get site info: ${response.errors.map(e => e.message).join(', ')}`);
    }

    return response.data;
  }

  async createPage(input: CreatePageInput): Promise<CreatePageResponse> {
    const mutation = `
      mutation($content: String!, $description: String!, $editor: String!, $isPublished: Boolean!, $isPrivate: Boolean!, $locale: String!, $path: String!, $publishEndDate: Date, $publishStartDate: Date, $scriptCss: String, $scriptJs: String, $tags: [String]!, $title: String!) {
        pages {
          create(
            content: $content,
            description: $description,
            editor: $editor,
            isPublished: $isPublished,
            isPrivate: $isPrivate,
            locale: $locale,
            path: $path,
            publishEndDate: $publishEndDate,
            publishStartDate: $publishStartDate,
            scriptCss: $scriptCss,
            scriptJs: $scriptJs,
            tags: $tags,
            title: $title
          ) {
            responseResult {
              succeeded
              errorCode
              slug
              message
            }
            page {
              id
              path
              title
            }
          }
        }
      }
    `;

    const variables = {
      content: input.content,
      title: input.title,
      path: input.path,
      description: input.description || '',
      isPublished: input.isPublished ?? true,
      isPrivate: input.isPrivate ?? false,
      locale: input.locale || 'en',
      tags: input.tags || [],
      editor: input.editor || 'markdown',
      publishStartDate: input.publishStartDate || null,
      publishEndDate: input.publishEndDate || null,
      scriptCss: input.scriptCss || '',
      scriptJs: input.scriptJs || '',
    };

    const response = await this.executeGraphQL<{ pages: { create: CreatePageResponse } }>(mutation, variables);
    
    if (response.errors) {
      throw new Error(`Failed to create page: ${response.errors.map(e => e.message).join(', ')}`);
    }

    return response.data!.pages.create;
  }

  async updatePage(input: UpdatePageInput): Promise<UpdatePageResponse> {
    const mutation = `
      mutation($id: Int!, $content: String, $description: String, $isPrivate: Boolean, $isPublished: Boolean, $scriptCss: String, $scriptJs: String, $tags: [String], $title: String) {
        pages {
          update(
            id: $id,
            content: $content,
            description: $description,
            isPrivate: $isPrivate,
            isPublished: $isPublished,
            scriptCss: $scriptCss,
            scriptJs: $scriptJs,
            tags: $tags,
            title: $title
          ) {
            responseResult {
              succeeded
              errorCode
              slug
              message
            }
            page {
              id
              path
              title
              updatedAt
            }
          }
        }
      }
    `;

    const response = await this.executeGraphQL<{ pages: { update: UpdatePageResponse } }>(mutation, input);
    
    if (response.errors) {
      throw new Error(`Failed to update page: ${response.errors.map(e => e.message).join(', ')}`);
    }

    return response.data!.pages.update;
  }

  async getPage(id?: number, path?: string): Promise<PageInfo | null> {
    if (!id && !path) {
      throw new Error('Either id or path must be provided');
    }

    const query = `
      query($id: Int, $path: String) {
        pages {
          single(id: $id, path: $path) {
            id
            path
            title
            description
            isPublished
            isPrivate
            locale
            editor
            content
            tags {
              tag
            }
            createdAt
            updatedAt
          }
        }
      }
    `;

    const variables = { id, path };
    const response = await this.executeGraphQL<{ pages: { single: any } }>(query, variables);
    
    if (response.errors) {
      throw new Error(`Failed to get page: ${response.errors.map(e => e.message).join(', ')}`);
    }

    const page = response.data?.pages?.single;
    if (!page) return null;

    return {
      id: page.id,
      path: page.path,
      title: page.title,
      description: page.description,
      isPublished: page.isPublished,
      isPrivate: page.isPrivate,
      locale: page.locale,
      editor: page.editor,
      content: page.content,
      tags: page.tags?.map((t: any) => t.tag) || [],
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }

  async searchPages(query: string, path?: string, locale: string = 'en'): Promise<SearchResult[]> {
    const searchQuery = `
      query($query: String!, $path: String, $locale: String!) {
        pages {
          search(query: $query, path: $path, locale: $locale) {
            results {
              id
              title
              path
              description
              locale
            }
            totalHits
          }
        }
      }
    `;

    const variables = { query, path, locale };
    const response = await this.executeGraphQL<{ pages: { search: { results: SearchResult[] } } }>(searchQuery, variables);
    
    if (response.errors) {
      throw new Error(`Failed to search pages: ${response.errors.map(e => e.message).join(', ')}`);
    }

    return response.data?.pages?.search?.results || [];
  }

  async deletePage(id: number): Promise<DeletePageResponse> {
    const mutation = `
      mutation($id: Int!) {
        pages {
          delete(id: $id) {
            responseResult {
              succeeded
              errorCode
              message
            }
          }
        }
      }
    `;

    const response = await this.executeGraphQL<{ pages: { delete: DeletePageResponse } }>(mutation, { id });
    
    if (response.errors) {
      throw new Error(`Failed to delete page: ${response.errors.map(e => e.message).join(', ')}`);
    }

    return response.data!.pages.delete;
  }

  async listPages(limit: number = 100, offset: number = 0): Promise<PageInfo[]> {
    const query = `
      query {
        pages {
          list {
            id
            path
            title
          }
        }
      }
    `;

    const response = await this.executeGraphQL<{ pages: { list: any[] } }>(query);
    
    if (response.errors) {
      throw new Error(`Failed to list pages: ${response.errors.map(e => e.message).join(', ')}`);
    }

    const pages = response.data?.pages?.list || [];
    
    return pages.map(page => ({
      id: page.id,
      path: page.path,
      title: page.title,
      description: '',
      isPublished: true,
      isPrivate: false,
      locale: 'en',
      editor: 'markdown',
      content: '',
      tags: [],
      createdAt: '',
      updatedAt: '',
    }));
  }
}