import { readFileSync, statSync } from 'fs';
import { extname, basename } from 'path';

/**
 * Generate a URL-friendly slug from a title
 */
export function titleToSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple dashes with single dash
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
}

/**
 * Create a hierarchical path
 */
export function createHierarchicalPath(parentPath: string, pageName: string): string {
  const cleanParent = parentPath.replace(/\/$/, ''); // Remove trailing slash
  const cleanPageName = pageName.startsWith('/') ? pageName.slice(1) : pageName; // Remove leading slash
  
  return `${cleanParent}/${cleanPageName}`;
}

/**
 * Extract file metadata and content for documentation
 */
export interface FileAnalysis {
  fileName: string;
  fileType: string;
  sizeBytes: number;
  lastModified: string;
  content: string;
  lineCount: number;
  language: string;
}

export function analyzeFile(filePath: string): FileAnalysis {
  const stats = statSync(filePath);
  const content = readFileSync(filePath, 'utf-8');
  const ext = extname(filePath);
  const fileName = basename(filePath);
  
  // Determine language from file extension
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.js': 'javascript',
    '.tsx': 'typescript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.go': 'go',
    '.rs': 'rust',
    '.java': 'java',
    '.c': 'c',
    '.cpp': 'cpp',
    '.cs': 'csharp',
    '.php': 'php',
    '.rb': 'ruby',
    '.sh': 'bash',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.json': 'json',
    '.xml': 'xml',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.md': 'markdown',
  };

  return {
    fileName,
    fileType: ext,
    sizeBytes: stats.size,
    lastModified: stats.mtime.toISOString(),
    content,
    lineCount: content.split('\n').length,
    language: languageMap[ext] || 'text',
  };
}

/**
 * Generate markdown documentation for a code file
 */
export function generateFileDocumentation(
  analysis: FileAnalysis, 
  options: {
    includeCode?: boolean;
    includeMetadata?: boolean;
    analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
  } = {}
): string {
  const { includeCode = false, includeMetadata = true, analysisDepth = 'detailed' } = options;
  
  let markdown = `# ${analysis.fileName}\n\n`;

  if (includeMetadata) {
    markdown += `## File Information\n\n`;
    markdown += `- **File Type**: ${analysis.fileType}\n`;
    markdown += `- **Size**: ${formatBytes(analysis.sizeBytes)}\n`;
    markdown += `- **Lines**: ${analysis.lineCount}\n`;
    markdown += `- **Last Modified**: ${new Date(analysis.lastModified).toLocaleString()}\n`;
    markdown += `- **Language**: ${analysis.language}\n\n`;
  }

  if (analysisDepth === 'comprehensive') {
    markdown += `## Overview\n\n`;
    markdown += `This file contains implementation details for ${analysis.fileName}.\n\n`;
    
    // Add more detailed analysis based on file type
    if (analysis.language === 'typescript' || analysis.language === 'javascript') {
      markdown += extractJavaScriptStructure(analysis.content);
    }
  }

  if (includeCode) {
    markdown += `## Source Code\n\n`;
    markdown += '```' + analysis.language + '\n';
    markdown += analysis.content;
    markdown += '\n```\n\n';
  }

  markdown += `---\n*Documentation generated automatically*`;

  return markdown;
}

/**
 * Extract structure from JavaScript/TypeScript files
 */
function extractJavaScriptStructure(content: string): string {
  let structure = '## Code Structure\n\n';
  
  // Extract exports
  const exportMatches = content.match(/^export\s+(class|function|const|let|var|interface|type)\s+(\w+)/gm);
  if (exportMatches && exportMatches.length > 0) {
    structure += '### Exports\n\n';
    exportMatches.forEach(match => {
      const exportMatch = match.match(/^export\s+(class|function|const|let|var|interface|type)\s+(\w+)/);
      const [, type, name] = exportMatch || [];
      if (type && name) {
        structure += `- **${name}** (${type})\n`;
      }
    });
    structure += '\n';
  }

  // Extract imports
  const importMatches = content.match(/^import\s+.*from\s+['"](.*?)['"];?$/gm);
  if (importMatches && importMatches.length > 0) {
    structure += '### Dependencies\n\n';
    importMatches.forEach(match => {
      const [, module] = match.match(/from\s+['"](.*?)['"]/) || [];
      if (module) {
        structure += `- ${module}\n`;
      }
    });
    structure += '\n';
  }

  return structure;
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Categorize files by type for auto-organization
 */
export function categorizeFile(filePath: string): string {
  const fileName = basename(filePath).toLowerCase();
  const ext = extname(filePath).toLowerCase();
  const dir = filePath.toLowerCase();

  // Component files
  if (dir.includes('component') || fileName.includes('component') || 
      (ext === '.tsx' || ext === '.jsx') && fileName.length > 0 && fileName[0] === fileName[0]!.toUpperCase()) {
    return 'components';
  }

  // API files
  if (dir.includes('api') || dir.includes('controller') || dir.includes('route') || 
      fileName.includes('api') || fileName.includes('controller') || fileName.includes('route')) {
    return 'api';
  }

  // Utility files
  if (dir.includes('util') || dir.includes('helper') || fileName.includes('util') || fileName.includes('helper')) {
    return 'utils';
  }

  // Service files
  if (dir.includes('service') || fileName.includes('service')) {
    return 'services';
  }

  // Model/Type files
  if (dir.includes('model') || dir.includes('type') || fileName.includes('model') || fileName.includes('type') ||
      fileName.includes('schema') || fileName.includes('interface')) {
    return 'models';
  }

  // Test files
  if (fileName.includes('test') || fileName.includes('spec') || dir.includes('test')) {
    return 'tests';
  }

  // Config files
  if (fileName.includes('config') || ext === '.json' || ext === '.yaml' || ext === '.yml' || ext === '.env') {
    return 'config';
  }

  return 'misc';
}