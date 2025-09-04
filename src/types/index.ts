import { z } from 'zod';

// Configuration schema
export const ConfigSchema = z.object({
  wikijs_api_url: z.string().url(),
  wikijs_token: z.string().optional(),
  wikijs_username: z.string().optional(),
  wikijs_password: z.string().optional(),
  log_level: z.enum(['DEBUG', 'INFO', 'WARN', 'ERROR']).default('INFO'),
  default_space_name: z.string().default('Documentation'),
  repository_root: z.string().default('./'),
});

export type Config = z.infer<typeof ConfigSchema>;

// Wiki.js GraphQL response types
export interface WikiJSResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: any;
  }>;
}

export interface PageInfo {
  id: number;
  path: string;
  title: string;
  description?: string;
  isPublished: boolean;
  isPrivate: boolean;
  locale: string;
  editor: string;
  content?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageInput {
  content: string;
  title: string;
  path: string;
  description?: string;
  isPublished?: boolean;
  isPrivate?: boolean;
  locale?: string;
  tags?: string[];
  editor?: string;
  publishStartDate?: string;
  publishEndDate?: string;
  scriptCss?: string;
  scriptJs?: string;
}

export interface UpdatePageInput {
  id: number;
  content?: string;
  title?: string;
  description?: string;
  isPublished?: boolean;
  isPrivate?: boolean;
  tags?: string[];
  scriptCss?: string;
  scriptJs?: string;
}

export interface SearchResult {
  id: number;
  title: string;
  path: string;
  description: string;
  locale: string;
}

export interface ResponseResult {
  responseResult: {
    succeeded: boolean;
    errorCode: number;
    slug?: string;
    message?: string;
  };
}

export interface CreatePageResponse extends ResponseResult {
  page?: {
    id: number;
    path: string;
    title: string;
  };
}

export interface UpdatePageResponse extends ResponseResult {
  page?: {
    id: number;
    path: string;
    title: string;
    updatedAt: string;
  };
}

export interface DeletePageResponse extends ResponseResult {}

// MCP Tool parameter schemas
export const CreatePageSchema = z.object({
  title: z.string().describe('Page title'),
  content: z.string().describe('Page content in markdown format'),
  path: z.string().describe('Page path (e.g., /docs/getting-started)'),
  description: z.string().optional().describe('Page description'),
  isPublished: z.boolean().default(true).describe('Whether the page is published'),
  isPrivate: z.boolean().default(false).describe('Whether the page is private'),
  locale: z.string().default('en').describe('Page locale'),
  tags: z.array(z.string()).default([]).describe('Page tags'),
  editor: z.string().default('markdown').describe('Editor type'),
});

export const UpdatePageSchema = z.object({
  id: z.number().describe('Page ID to update'),
  title: z.string().optional().describe('New page title'),
  content: z.string().optional().describe('New page content'),
  description: z.string().optional().describe('New page description'),
  isPublished: z.boolean().optional().describe('Whether the page is published'),
  isPrivate: z.boolean().optional().describe('Whether the page is private'),
  tags: z.array(z.string()).optional().describe('Page tags'),
});

export const SearchPagesSchema = z.object({
  query: z.string().describe('Search query'),
  path: z.string().optional().describe('Path to search within'),
  locale: z.string().default('en').describe('Search locale'),
});

export const GetPageSchema = z.object({
  id: z.number().optional().describe('Page ID'),
  path: z.string().optional().describe('Page path'),
});

export const DeletePageSchema = z.object({
  id: z.number().describe('Page ID to delete'),
});