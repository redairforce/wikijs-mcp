import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { WikiJSClient } from '../client/wikijs-client.js';
import { ContextManager } from '../context/manager.js';
import { CreatePageSchema, UpdatePageSchema, SearchPagesSchema, GetPageSchema, DeletePageSchema } from '../types/index.js';

export function createWikiJSTools(client: WikiJSClient, contextManager?: ContextManager): Tool[] {
  return [
    // Context Management Tools
    {
      name: 'wikijs_detect_context',
      description: 'Auto-detect repository and workspace context for current directory',
      inputSchema: {
        type: 'object',
        properties: {
          directory: { type: 'string', description: 'Directory to analyze (optional, defaults to current)' },
        },
        required: [],
      },
    },

    {
      name: 'wikijs_init_repository',
      description: 'Initialize repository context for Wiki.js documentation',
      inputSchema: {
        type: 'object',
        properties: {
          wikiSpace: { type: 'string', description: 'Wiki.js space name (optional, defaults to repo name)' },
          workspaceName: { type: 'string', description: 'Parent workspace name (optional)' },
          repoRoot: { type: 'string', description: 'Repository root path (optional, auto-detected)' },
        },
        required: [],
      },
    },

    {
      name: 'wikijs_init_workspace',
      description: 'Initialize workspace context for multi-repository documentation',
      inputSchema: {
        type: 'object',
        properties: {
          workspaceName: { type: 'string', description: 'Workspace name (optional, defaults to directory name)' },
          workspaceRoot: { type: 'string', description: 'Workspace root path (optional, auto-detected)' },
          repositories: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string', description: 'Repository name' },
                path: { type: 'string', description: 'Repository path' },
                wikiSpace: { type: 'string', description: 'Wiki.js space name' },
              },
              required: ['name', 'path', 'wikiSpace'],
            },
            description: 'Repository configurations (optional, auto-detected)',
          },
        },
        required: [],
      },
    },

    {
      name: 'wikijs_set_context_mode',
      description: 'Switch context mode (repository/workspace/architectural)',
      inputSchema: {
        type: 'object',
        properties: {
          mode: { 
            type: 'string', 
            enum: ['repository', 'workspace', 'architectural'], 
            description: 'Context mode to switch to' 
          },
        },
        required: ['mode'],
      },
    },

    {
      name: 'wikijs_get_context',
      description: 'Get current context information optimized for Claude consumption',
      inputSchema: {
        type: 'object',
        properties: {
          mode: { 
            type: 'string', 
            enum: ['repository', 'workspace', 'architectural'], 
            description: 'Context mode (optional, uses current mode)' 
          },
        },
        required: [],
      },
    },

    {
      name: 'wikijs_repository_status',
      description: 'Show current repository context and documentation status',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },

    {
      name: 'wikijs_workspace_status',
      description: 'Show workspace context with all repositories and their status',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },

    {
      name: 'wikijs_cross_repo_link',
      description: 'Create architectural mapping between repositories',
      inputSchema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Description of the relationship' },
          fromRepo: { type: 'string', description: 'Source repository name' },
          fromComponent: { type: 'string', description: 'Source component/file' },
          toRepo: { type: 'string', description: 'Target repository name' },
          toComponent: { type: 'string', description: 'Target component/file' },
          relationship: { type: 'string', description: 'Type of relationship (validates, calls, depends-on, etc.)' },
        },
        required: ['description', 'fromRepo', 'fromComponent', 'toRepo', 'toComponent', 'relationship'],
      },
    },

    {
      name: 'wikijs_smart_sync_file',
      description: 'Intelligently sync file with Wiki.js using context awareness',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to file to sync' },
          forceUpdate: { type: 'boolean', description: 'Force update even if file unchanged', default: false },
          autoPath: { type: 'boolean', description: 'Auto-generate Wiki.js path based on context', default: true },
        },
        required: ['filePath'],
      },
    },

    // Connection and Status Tools
    {
      name: 'wikijs_connection_status',
      description: 'Test the connection to Wiki.js and get basic site information',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },

    {
      name: 'wikijs_get_site_info',
      description: 'Get detailed information about the Wiki.js instance',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
    },

    // Core Page Management Tools
    {
      name: 'wikijs_create_page',
      description: 'Create a new page in Wiki.js with markdown content',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Page title' },
          content: { type: 'string', description: 'Page content in markdown format' },
          path: { type: 'string', description: 'Page path (e.g., /docs/getting-started)' },
          description: { type: 'string', description: 'Page description (optional)' },
          isPublished: { type: 'boolean', description: 'Whether the page is published', default: true },
          isPrivate: { type: 'boolean', description: 'Whether the page is private', default: false },
          locale: { type: 'string', description: 'Page locale', default: 'en' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Page tags', default: [] },
          editor: { type: 'string', description: 'Editor type', default: 'markdown' },
        },
        required: ['title', 'content', 'path'],
      },
    },

    {
      name: 'wikijs_update_page',
      description: 'Update an existing page in Wiki.js',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Page ID to update' },
          title: { type: 'string', description: 'New page title (optional)' },
          content: { type: 'string', description: 'New page content (optional)' },
          description: { type: 'string', description: 'New page description (optional)' },
          isPublished: { type: 'boolean', description: 'Whether the page is published (optional)' },
          isPrivate: { type: 'boolean', description: 'Whether the page is private (optional)' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Page tags (optional)' },
        },
        required: ['id'],
      },
    },

    {
      name: 'wikijs_get_page',
      description: 'Retrieve a page by ID or path',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Page ID (optional if path is provided)' },
          path: { type: 'string', description: 'Page path (optional if id is provided)' },
        },
        required: [],
      },
    },

    {
      name: 'wikijs_delete_page',
      description: 'Delete a page by ID',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'number', description: 'Page ID to delete' },
        },
        required: ['id'],
      },
    },

    {
      name: 'wikijs_list_pages',
      description: 'List pages with pagination',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Maximum number of pages to return', default: 100 },
          offset: { type: 'number', description: 'Number of pages to skip', default: 0 },
        },
        required: [],
      },
    },

    // Search Tool
    {
      name: 'wikijs_search_pages',
      description: 'Search for pages by text content',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          path: { type: 'string', description: 'Path to search within (optional)' },
          locale: { type: 'string', description: 'Search locale', default: 'en' },
        },
        required: ['query'],
      },
    },

    // Hierarchical Documentation Tools
    {
      name: 'wikijs_create_nested_page',
      description: 'Create a page with hierarchical path structure',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Page title' },
          content: { type: 'string', description: 'Page content in markdown format' },
          parentPath: { type: 'string', description: 'Parent page path (e.g., /docs/frontend)' },
          pageName: { type: 'string', description: 'Page name for URL (optional, derived from title if not provided)' },
          description: { type: 'string', description: 'Page description (optional)' },
          isPublished: { type: 'boolean', description: 'Whether the page is published', default: true },
          isPrivate: { type: 'boolean', description: 'Whether the page is private', default: false },
          locale: { type: 'string', description: 'Page locale', default: 'en' },
          tags: { type: 'array', items: { type: 'string' }, description: 'Page tags', default: [] },
        },
        required: ['title', 'content', 'parentPath'],
      },
    },

    {
      name: 'wikijs_create_repo_structure',
      description: 'Create a complete repository documentation structure',
      inputSchema: {
        type: 'object',
        properties: {
          repoName: { type: 'string', description: 'Repository name' },
          description: { type: 'string', description: 'Repository description' },
          sections: { 
            type: 'array', 
            items: { type: 'string' }, 
            description: 'Main sections to create (e.g., Overview, Components, API)',
            default: ['Overview', 'Getting Started', 'Architecture', 'API Reference']
          },
          basePath: { type: 'string', description: 'Base path for the repository docs', default: '/' },
        },
        required: ['repoName', 'description'],
      },
    },

    // Bulk Operations
    {
      name: 'wikijs_bulk_create_pages',
      description: 'Create multiple pages in bulk',
      inputSchema: {
        type: 'object',
        properties: {
          pages: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string', description: 'Page title' },
                content: { type: 'string', description: 'Page content in markdown format' },
                path: { type: 'string', description: 'Page path' },
                description: { type: 'string', description: 'Page description (optional)' },
                isPublished: { type: 'boolean', description: 'Whether the page is published', default: true },
                isPrivate: { type: 'boolean', description: 'Whether the page is private', default: false },
                tags: { type: 'array', items: { type: 'string' }, description: 'Page tags', default: [] },
              },
              required: ['title', 'content', 'path'],
            },
            description: 'Array of pages to create',
          },
        },
        required: ['pages'],
      },
    },

    // File Integration Tools
    {
      name: 'wikijs_sync_file_docs',
      description: 'Synchronize file content with Wiki.js documentation',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to the file to sync' },
          wikiPath: { type: 'string', description: 'Corresponding Wiki.js page path' },
          extractContent: { type: 'boolean', description: 'Whether to extract and format code content', default: true },
          includeMetadata: { type: 'boolean', description: 'Whether to include file metadata', default: true },
        },
        required: ['filePath', 'wikiPath'],
      },
    },

    {
      name: 'wikijs_generate_file_overview',
      description: 'Generate documentation overview for a code file',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string', description: 'Path to the code file' },
          includeCode: { type: 'boolean', description: 'Whether to include code snippets', default: false },
          analysisDepth: { type: 'string', enum: ['basic', 'detailed', 'comprehensive'], description: 'Level of analysis', default: 'detailed' },
        },
        required: ['filePath'],
      },
    },
  ];
}