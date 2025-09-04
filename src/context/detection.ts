import { promises as fs } from 'fs';
import { join, resolve, basename } from 'path';
import { ContextMode, ContextInfo, ContextInfoSchema } from './types.js';

export class ContextDetector {
  private currentDir: string;

  constructor(currentDir: string = process.cwd()) {
    this.currentDir = resolve(currentDir);
  }

  /**
   * Auto-detect context information for the current directory
   */
  async detectContext(): Promise<ContextInfo> {
    const gitRoot = await this.findGitRoot(this.currentDir);
    const workspaceRoot = await this.findWorkspaceRoot(this.currentDir);
    const isMonorepo = await this.detectMonorepo(gitRoot);
    const detectedRepos = await this.findAllRepositories(workspaceRoot || this.currentDir);
    
    const hasRepoContext = gitRoot ? await this.hasRepositoryContext(gitRoot) : false;
    const hasWorkspaceContext = workspaceRoot ? await this.hasWorkspaceContext(workspaceRoot) : false;

    const contextInfo = {
      currentDir: this.currentDir,
      gitRoot,
      workspaceRoot,
      isMonorepo,
      detectedRepos,
      suggestedLevel: this.inferContextLevel(gitRoot, workspaceRoot, isMonorepo, detectedRepos.length),
      hasRepoContext,
      hasWorkspaceContext
    };

    return ContextInfoSchema.parse(contextInfo);
  }

  /**
   * Find git repository root by walking up directory tree
   */
  private async findGitRoot(startPath: string): Promise<string | null> {
    let currentPath = resolve(startPath);
    const root = resolve('/');

    while (currentPath !== root) {
      try {
        const gitPath = join(currentPath, '.git');
        const stat = await fs.stat(gitPath);
        if (stat.isDirectory() || stat.isFile()) {
          return currentPath;
        }
      } catch {
        // .git doesn't exist, continue up
      }

      currentPath = resolve(currentPath, '..');
    }

    return null;
  }

  /**
   * Find workspace root by looking for workspace markers
   */
  private async findWorkspaceRoot(startPath: string): Promise<string | null> {
    let currentPath = resolve(startPath);
    const root = resolve('/');

    const workspaceMarkers = [
      '.wikijs-workspace.json',
      'package.json', // with workspaces
      'lerna.json',
      'nx.json',
      '.git' // Top-level git repo containing other repos
    ];

    while (currentPath !== root) {
      for (const marker of workspaceMarkers) {
        try {
          const markerPath = join(currentPath, marker);
          await fs.access(markerPath);
          
          // Special check for package.json with workspaces
          if (marker === 'package.json') {
            const packageJson = JSON.parse(await fs.readFile(markerPath, 'utf-8'));
            if (packageJson.workspaces) {
              return currentPath;
            }
          } else if (marker === '.wikijs-workspace.json') {
            // Our specific workspace marker - highest priority
            return currentPath;
          } else if (marker === '.git') {
            // Check if this git repo contains other repos
            const containsMultipleRepos = await this.containsMultipleRepositories(currentPath);
            if (containsMultipleRepos) {
              return currentPath;
            }
          } else {
            return currentPath;
          }
        } catch {
          // Marker doesn't exist, continue
        }
      }

      currentPath = resolve(currentPath, '..');
    }

    return null;
  }

  /**
   * Detect if current repository is a monorepo
   */
  private async detectMonorepo(gitRoot: string | null): Promise<boolean> {
    if (!gitRoot) return false;

    try {
      // Check for common monorepo indicators
      const monorepoMarkers = [
        'lerna.json',
        'nx.json',
        'rush.json',
        'pnpm-workspace.yaml'
      ];

      for (const marker of monorepoMarkers) {
        try {
          await fs.access(join(gitRoot, marker));
          return true;
        } catch {
          // Continue checking
        }
      }

      // Check for package.json with workspaces
      try {
        const packageJsonPath = join(gitRoot, 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        if (packageJson.workspaces) {
          return true;
        }
      } catch {
        // No package.json or can't parse
      }

      // Check for multiple package.json files (heuristic)
      const packageJsonFiles = await this.findFiles(gitRoot, 'package.json', 2);
      return packageJsonFiles.length > 1;

    } catch {
      return false;
    }
  }

  /**
   * Find all git repositories under a directory
   */
  private async findAllRepositories(searchRoot: string, maxDepth: number = 3): Promise<string[]> {
    const repos: string[] = [];
    
    try {
      await this.findRepositoriesRecursive(searchRoot, repos, 0, maxDepth);
    } catch (error) {
      // If we can't search, return empty array
      console.warn(`Could not search for repositories in ${searchRoot}:`, error);
    }

    return repos;
  }

  private async findRepositoriesRecursive(
    dir: string,
    repos: string[],
    currentDepth: number,
    maxDepth: number
  ): Promise<void> {
    if (currentDepth > maxDepth) return;

    try {
      // Check if current directory is a git repo
      const gitPath = join(dir, '.git');
      try {
        await fs.access(gitPath);
        repos.push(dir);
      } catch {
        // Not a git repo, continue searching subdirectories
      }

      // Search subdirectories
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subDir = join(dir, entry.name);
          await this.findRepositoriesRecursive(subDir, repos, currentDepth + 1, maxDepth);
        }
      }
    } catch {
      // Can't read directory, skip
    }
  }

  /**
   * Check if directory contains multiple git repositories
   */
  private async containsMultipleRepositories(dir: string): Promise<boolean> {
    const repos = await this.findAllRepositories(dir, 2);
    return repos.length > 1;
  }

  /**
   * Find files with specific name recursively
   */
  private async findFiles(dir: string, fileName: string, maxDepth: number): Promise<string[]> {
    const found: string[] = [];
    
    const search = async (currentDir: string, depth: number) => {
      if (depth > maxDepth) return;

      try {
        const entries = await fs.readdir(currentDir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = join(currentDir, entry.name);
          
          if (entry.isFile() && entry.name === fileName) {
            found.push(fullPath);
          } else if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await search(fullPath, depth + 1);
          }
        }
      } catch {
        // Skip inaccessible directories
      }
    };

    await search(dir, 0);
    return found;
  }

  /**
   * Check if repository context exists
   */
  private async hasRepositoryContext(gitRoot: string): Promise<boolean> {
    try {
      const contextPath = join(gitRoot, '.wikijs-state.json');
      await fs.access(contextPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if workspace context exists
   */
  private async hasWorkspaceContext(workspaceRoot: string): Promise<boolean> {
    try {
      const contextPath = join(workspaceRoot, '.wikijs-workspace.json');
      await fs.access(contextPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Infer the appropriate context level based on detected environment
   */
  private inferContextLevel(
    gitRoot: string | null,
    workspaceRoot: string | null,
    isMonorepo: boolean,
    repoCount: number
  ): ContextMode {
    // If we have a workspace with multiple repos, suggest workspace level
    if (workspaceRoot && repoCount > 1) {
      return ContextMode.WORKSPACE;
    }

    // If we're in a monorepo, suggest workspace level
    if (isMonorepo) {
      return ContextMode.WORKSPACE;
    }

    // If we're just in a single git repo, suggest repository level
    if (gitRoot) {
      return ContextMode.REPOSITORY;
    }

    // Default to repository level
    return ContextMode.REPOSITORY;
  }

  /**
   * Infer context level from user request text
   */
  static inferContextFromRequest(requestText: string): ContextMode {
    const lowercaseRequest = requestText.toLowerCase();
    
    // Architectural keywords
    const architecturalKeywords = [
      'architecture', 'network', 'system', 'cross-repo', 'cross repo',
      'service communication', 'microservice', 'diagram', 'relationship',
      'integration', 'system design', 'overview'
    ];

    // Workspace keywords  
    const workspaceKeywords = [
      'workspace', 'multi-repo', 'multiple repo', 'all repos', 
      'across repos', 'coordinate', 'project'
    ];

    if (architecturalKeywords.some(keyword => lowercaseRequest.includes(keyword))) {
      return ContextMode.ARCHITECTURAL;
    }

    if (workspaceKeywords.some(keyword => lowercaseRequest.includes(keyword))) {
      return ContextMode.WORKSPACE;
    }

    return ContextMode.REPOSITORY;
  }
}