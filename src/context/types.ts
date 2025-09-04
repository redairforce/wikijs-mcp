import { z } from 'zod';

// Context levels
export enum ContextMode {
  REPOSITORY = 'repository',
  WORKSPACE = 'workspace', 
  ARCHITECTURAL = 'architectural'
}

// Repository context schema
export const RepositoryContextSchema = z.object({
  repoRoot: z.string(),
  repoName: z.string(),
  wikiSpace: z.string(),
  contextLevel: z.literal(ContextMode.REPOSITORY),
  lastSync: z.string().optional(),
  parentWorkspace: z.string().optional(),
  quickContext: z.object({
    totalFiles: z.number(),
    totalPages: z.number(),
    recentFiles: z.record(z.object({
      pageId: z.number(),
      hash: z.string(),
      lastUpdated: z.string().optional()
    })),
    keyPages: z.array(z.object({
      path: z.string(),
      pageId: z.number(),
      importance: z.enum(['high', 'medium', 'low']).default('medium')
    })).default([])
  })
});

// Workspace context schema
export const WorkspaceContextSchema = z.object({
  workspaceName: z.string(),
  contextLevel: z.literal(ContextMode.WORKSPACE),
  workspaceRoot: z.string(),
  lastSync: z.string().optional(),
  repositories: z.record(z.object({
    path: z.string(),
    wikiSpace: z.string(),
    lastSync: z.string().optional(),
    keyPages: z.array(z.object({
      path: z.string(),
      pageId: z.number(),
      importance: z.enum(['high', 'medium', 'low']).default('medium')
    })).default([])
  })),
  systemArchitecture: z.object({
    wikiSpace: z.string(),
    networkDiagrams: z.array(z.object({
      path: z.string(),
      pageId: z.number()
    })).default([]),
    crossRepoMappings: z.array(z.object({
      id: z.string(),
      description: z.string(),
      from: z.object({
        repo: z.string(),
        component: z.string(),
        pageId: z.number().optional()
      }),
      to: z.object({
        repo: z.string(),
        component: z.string(),
        pageId: z.number().optional()
      }),
      wikiPageId: z.number().optional(),
      relationship: z.string() // 'validates', 'calls', 'depends-on', etc.
    })).default([])
  })
});

// Context info for detection
export const ContextInfoSchema = z.object({
  currentDir: z.string(),
  gitRoot: z.string().nullable(),
  workspaceRoot: z.string().nullable(),
  isMonorepo: z.boolean(),
  detectedRepos: z.array(z.string()),
  suggestedLevel: z.nativeEnum(ContextMode),
  hasRepoContext: z.boolean(),
  hasWorkspaceContext: z.boolean()
});

// Exported types
export type RepositoryContext = z.infer<typeof RepositoryContextSchema>;
export type WorkspaceContext = z.infer<typeof WorkspaceContextSchema>;
export type ContextInfo = z.infer<typeof ContextInfoSchema>;

// Context data for Claude
export interface ContextData {
  mode: ContextMode;
  tokenCount: number;
  data: RepositoryContextData | WorkspaceContextData | ArchitecturalContextData;
}

export interface RepositoryContextData {
  repoName: string;
  wikiSpace: string;
  totalFiles: number;
  totalPages: number;
  recentFiles: Array<{
    path: string;
    pageId: number;
    hash: string;
  }>;
  keyPages: Array<{
    path: string;
    pageId: number;
    importance: string;
  }>;
}

export interface WorkspaceContextData {
  workspaceName: string;
  repositoryCount: number;
  repositories: Array<{
    name: string;
    wikiSpace: string;
    keyPages: Array<{
      path: string;
      pageId: number;
    }>;
    path: string;
  }>;
}

export interface ArchitecturalContextData extends WorkspaceContextData {
  systemArchitecture: {
    wikiSpace: string;
    networkDiagrams: Array<{
      path: string;
      pageId: number;
    }>;
    crossRepoMappings: Array<{
      description: string;
      from: { repo: string; component: string };
      to: { repo: string; component: string };
      relationship: string;
    }>;
  };
}

// File mapping for individual files
export interface FileMapping {
  filePath: string;
  pageId: number;
  hash: string;
  lastUpdated: string;
  relationship: 'documents' | 'references' | 'implements';
}

// Cross-repository architectural link
export interface ArchitecturalLink {
  id: string;
  description: string;
  from: {
    repo: string;
    component: string;
    pageId?: number;
  };
  to: {
    repo: string;
    component: string;
    pageId?: number;
  };
  wikiPageId?: number;
  relationship: string;
}