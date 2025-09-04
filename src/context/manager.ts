import { promises as fs } from 'fs';
import { join, basename } from 'path';
import crypto from 'crypto';
import { ContextMode, RepositoryContext, WorkspaceContext, ContextData, FileMapping, ArchitecturalLink, RepositoryContextData, WorkspaceContextData, ArchitecturalContextData } from './types.js';
import { ContextDetector } from './detection.js';
import { WikiJSClient } from '../client/wikijs-client.js';

export class ContextManager {
  private detector: ContextDetector;
  private wikijsClient: WikiJSClient;
  private currentMode: ContextMode = ContextMode.REPOSITORY;

  constructor(wikijsClient: WikiJSClient, currentDir?: string) {
    this.detector = new ContextDetector(currentDir);
    this.wikijsClient = wikijsClient;
  }

  /**
   * Initialize repository context
   */
  async initRepository(options: {
    repoRoot?: string;
    wikiSpace?: string;
    workspaceName?: string;
  } = {}): Promise<RepositoryContext> {
    const contextInfo = await this.detector.detectContext();
    const repoRoot = options.repoRoot || contextInfo.gitRoot || contextInfo.currentDir;
    const repoName = basename(repoRoot);
    const wikiSpace = options.wikiSpace || repoName;

    const repositoryContext: RepositoryContext = {
      repoRoot,
      repoName,
      wikiSpace,
      contextLevel: ContextMode.REPOSITORY,
      lastSync: new Date().toISOString(),
      parentWorkspace: options.workspaceName,
      quickContext: {
        totalFiles: 0,
        totalPages: 0,
        recentFiles: {},
        keyPages: []
      }
    };

    await this.saveRepositoryContext(repoRoot, repositoryContext);
    return repositoryContext;
  }

  /**
   * Initialize workspace context
   */
  async initWorkspace(options: {
    workspaceName?: string;
    workspaceRoot?: string;
    repositories?: Array<{ name: string; path: string; wikiSpace: string }>;
  } = {}): Promise<WorkspaceContext> {
    const contextInfo = await this.detector.detectContext();
    const workspaceRoot = options.workspaceRoot || contextInfo.workspaceRoot || contextInfo.currentDir;
    const workspaceName = options.workspaceName || basename(workspaceRoot);

    // Auto-detect repositories if not provided
    const repositories: Record<string, any> = {};
    
    if (options.repositories) {
      for (const repo of options.repositories) {
        repositories[repo.name] = {
          path: repo.path,
          wikiSpace: repo.wikiSpace,
          keyPages: []
        };
      }
    } else {
      // Auto-detect repositories in workspace
      const detectedRepoPaths = contextInfo.detectedRepos;
      for (const repoPath of detectedRepoPaths) {
        const repoName = basename(repoPath);
        repositories[repoName] = {
          path: repoPath,
          wikiSpace: repoName, // Default wiki space name
          keyPages: []
        };
      }
    }

    const workspaceContext: WorkspaceContext = {
      workspaceName,
      contextLevel: ContextMode.WORKSPACE,
      workspaceRoot,
      lastSync: new Date().toISOString(),
      repositories,
      systemArchitecture: {
        wikiSpace: `${workspaceName}-architecture`,
        networkDiagrams: [],
        crossRepoMappings: []
      }
    };

    await this.saveWorkspaceContext(workspaceRoot, workspaceContext);
    return workspaceContext;
  }

  /**
   * Load repository context
   */
  async loadRepositoryContext(repoRoot?: string): Promise<RepositoryContext | null> {
    const contextInfo = await this.detector.detectContext();
    const targetRoot = repoRoot || contextInfo.gitRoot || contextInfo.currentDir;

    try {
      const contextPath = join(targetRoot, '.wikijs-state.json');
      const contextData = await fs.readFile(contextPath, 'utf-8');
      return JSON.parse(contextData) as RepositoryContext;
    } catch {
      return null;
    }
  }

  /**
   * Load workspace context
   */
  async loadWorkspaceContext(workspaceRoot?: string): Promise<WorkspaceContext | null> {
    const contextInfo = await this.detector.detectContext();
    const targetRoot = workspaceRoot || contextInfo.workspaceRoot || contextInfo.currentDir;

    try {
      const contextPath = join(targetRoot, '.wikijs-workspace.json');
      const contextData = await fs.readFile(contextPath, 'utf-8');
      return JSON.parse(contextData) as WorkspaceContext;
    } catch {
      return null;
    }
  }

  /**
   * Save repository context
   */
  private async saveRepositoryContext(repoRoot: string, context: RepositoryContext): Promise<void> {
    const contextPath = join(repoRoot, '.wikijs-state.json');
    await fs.writeFile(contextPath, JSON.stringify(context, null, 2));
  }

  /**
   * Save workspace context
   */
  private async saveWorkspaceContext(workspaceRoot: string, context: WorkspaceContext): Promise<void> {
    const contextPath = join(workspaceRoot, '.wikijs-workspace.json');
    await fs.writeFile(contextPath, JSON.stringify(context, null, 2));
  }

  /**
   * Get context data optimized for Claude consumption
   */
  async getContextForClaude(mode?: ContextMode): Promise<ContextData> {
    const targetMode = mode || this.currentMode;
    
    switch (targetMode) {
      case ContextMode.REPOSITORY:
        return await this.getRepositoryContextData();
      case ContextMode.WORKSPACE:
        return await this.getWorkspaceContextData();
      case ContextMode.ARCHITECTURAL:
        return await this.getArchitecturalContextData();
    }
  }

  /**
   * Set current context mode
   */
  setContextMode(mode: ContextMode): void {
    this.currentMode = mode;
  }

  /**
   * Auto-detect and set appropriate context mode
   */
  async autoDetectContextMode(userRequest?: string): Promise<ContextMode> {
    const contextInfo = await this.detector.detectContext();
    
    // If user request provides hints, use those
    if (userRequest) {
      const inferredMode = ContextDetector.inferContextFromRequest(userRequest);
      if (inferredMode !== ContextMode.REPOSITORY) {
        this.currentMode = inferredMode;
        return inferredMode;
      }
    }

    // Use detected environment
    this.currentMode = contextInfo.suggestedLevel;
    return contextInfo.suggestedLevel;
  }

  /**
   * Add file mapping to repository context
   */
  async addFileMapping(filePath: string, pageId: number, hash?: string): Promise<void> {
    const repoContext = await this.loadRepositoryContext();
    if (!repoContext) throw new Error('No repository context found');

    const fileHash = hash || await this.calculateFileHash(filePath);
    const relativePath = filePath.replace(repoContext.repoRoot + '/', '');

    repoContext.quickContext.recentFiles[relativePath] = {
      pageId,
      hash: fileHash,
      lastUpdated: new Date().toISOString()
    };

    repoContext.quickContext.totalFiles = Object.keys(repoContext.quickContext.recentFiles).length;
    repoContext.quickContext.totalPages++;
    repoContext.lastSync = new Date().toISOString();

    await this.saveRepositoryContext(repoContext.repoRoot, repoContext);
  }

  /**
   * Add cross-repository architectural link
   */
  async addArchitecturalLink(link: Omit<ArchitecturalLink, 'id'>): Promise<void> {
    const workspaceContext = await this.loadWorkspaceContext();
    if (!workspaceContext) throw new Error('No workspace context found');

    const architecturalLink: ArchitecturalLink = {
      ...link,
      id: crypto.randomUUID()
    };

    workspaceContext.systemArchitecture.crossRepoMappings.push(architecturalLink);
    workspaceContext.lastSync = new Date().toISOString();

    await this.saveWorkspaceContext(workspaceContext.workspaceRoot, workspaceContext);
  }

  /**
   * Check if file has changed since last sync
   */
  async hasFileChanged(filePath: string): Promise<boolean> {
    const repoContext = await this.loadRepositoryContext();
    if (!repoContext) return true; // No context = assume changed

    const relativePath = filePath.replace(repoContext.repoRoot + '/', '');
    const storedMapping = repoContext.quickContext.recentFiles[relativePath];
    
    if (!storedMapping) return true; // Not tracked = assume changed

    const currentHash = await this.calculateFileHash(filePath);
    return currentHash !== storedMapping.hash;
  }

  /**
   * Get file mapping for a specific file
   */
  async getFileMapping(filePath: string): Promise<FileMapping | null> {
    const repoContext = await this.loadRepositoryContext();
    if (!repoContext) return null;

    const relativePath = filePath.replace(repoContext.repoRoot + '/', '');
    const storedMapping = repoContext.quickContext.recentFiles[relativePath];
    
    if (!storedMapping) return null;

    return {
      filePath: relativePath,
      pageId: storedMapping.pageId,
      hash: storedMapping.hash,
      lastUpdated: storedMapping.lastUpdated || '',
      relationship: 'documents'
    };
  }

  /**
   * Calculate SHA-256 hash of file
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(content).digest('hex');
    } catch {
      return '';
    }
  }

  /**
   * Get repository context data for Claude
   */
  private async getRepositoryContextData(): Promise<ContextData> {
    const repoContext = await this.loadRepositoryContext();
    
    if (!repoContext) {
      return {
        mode: ContextMode.REPOSITORY,
        tokenCount: 50,
        data: {
          repoName: 'unknown',
          wikiSpace: 'unknown',
          totalFiles: 0,
          totalPages: 0,
          recentFiles: [],
          keyPages: []
        } as RepositoryContextData
      };
    }

    const data: RepositoryContextData = {
      repoName: repoContext.repoName,
      wikiSpace: repoContext.wikiSpace,
      totalFiles: repoContext.quickContext.totalFiles,
      totalPages: repoContext.quickContext.totalPages,
      recentFiles: Object.entries(repoContext.quickContext.recentFiles)
        .slice(0, 5) // Limit to recent 5 files
        .map(([path, mapping]) => ({
          path,
          pageId: mapping.pageId,
          hash: mapping.hash
        })),
      keyPages: repoContext.quickContext.keyPages.slice(0, 5) // Limit to 5 key pages
    };

    return {
      mode: ContextMode.REPOSITORY,
      tokenCount: this.estimateTokenCount(data),
      data
    };
  }

  /**
   * Get workspace context data for Claude
   */
  private async getWorkspaceContextData(): Promise<ContextData> {
    const workspaceContext = await this.loadWorkspaceContext();
    
    if (!workspaceContext) {
      return {
        mode: ContextMode.WORKSPACE,
        tokenCount: 100,
        data: {
          workspaceName: 'unknown',
          repositoryCount: 0,
          repositories: []
        } as WorkspaceContextData
      };
    }

    const data: WorkspaceContextData = {
      workspaceName: workspaceContext.workspaceName,
      repositoryCount: Object.keys(workspaceContext.repositories).length,
      repositories: Object.entries(workspaceContext.repositories)
        .map(([name, repo]) => ({
          name,
          wikiSpace: repo.wikiSpace,
          keyPages: repo.keyPages.slice(0, 3), // Limit per repo
          path: repo.path
        }))
    };

    return {
      mode: ContextMode.WORKSPACE,
      tokenCount: this.estimateTokenCount(data),
      data
    };
  }

  /**
   * Get architectural context data for Claude
   */
  private async getArchitecturalContextData(): Promise<ContextData> {
    const workspaceContext = await this.loadWorkspaceContext();
    
    if (!workspaceContext) {
      return {
        mode: ContextMode.ARCHITECTURAL,
        tokenCount: 150,
        data: {
          workspaceName: 'unknown',
          repositoryCount: 0,
          repositories: [],
          systemArchitecture: {
            wikiSpace: 'unknown',
            networkDiagrams: [],
            crossRepoMappings: []
          }
        } as ArchitecturalContextData
      };
    }

    const baseData = await this.getWorkspaceContextData();
    const workspaceData = baseData.data as WorkspaceContextData;

    const data: ArchitecturalContextData = {
      ...workspaceData,
      systemArchitecture: {
        wikiSpace: workspaceContext.systemArchitecture.wikiSpace,
        networkDiagrams: workspaceContext.systemArchitecture.networkDiagrams,
        crossRepoMappings: workspaceContext.systemArchitecture.crossRepoMappings
          .slice(0, 5) // Limit to 5 key mappings
          .map(mapping => ({
            description: mapping.description,
            from: {
              repo: mapping.from.repo,
              component: mapping.from.component
            },
            to: {
              repo: mapping.to.repo,
              component: mapping.to.component
            },
            relationship: mapping.relationship
          }))
      }
    };

    return {
      mode: ContextMode.ARCHITECTURAL,
      tokenCount: this.estimateTokenCount(data),
      data
    };
  }

  /**
   * Estimate token count for context data
   */
  private estimateTokenCount(data: any): number {
    const jsonString = JSON.stringify(data);
    // Rough estimate: ~4 characters per token
    return Math.ceil(jsonString.length / 4);
  }
}