#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { WikiJSClient } from './client/wikijs-client.js';
import { createWikiJSTools } from './tools/index.js';
import { loadConfig } from './utils/config.js';
import { ContextManager, ContextMode, ContextDetector } from './context/index.js';
import { titleToSlug, createHierarchicalPath, analyzeFile, generateFileDocumentation, categorizeFile } from './utils/helpers.js';

class WikiJSMCPServer {
  private server: Server;
  private client: WikiJSClient;
  private contextManager: ContextManager;
  private detector: ContextDetector;
  private tools: ReturnType<typeof createWikiJSTools>;

  constructor() {
    this.server = new Server(
      {
        name: 'wikijs-mcp',
        version: '0.1.0',
      }
    );

    // Load configuration and create client
    const config = loadConfig();
    this.client = new WikiJSClient(config);
    this.detector = new ContextDetector();
    this.contextManager = new ContextManager(this.client);
    this.tools = createWikiJSTools(this.client, this.contextManager);

    this.setupToolHandlers();
  }

  private setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.tools,
      };
    });

    // Handle tool execution
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          // Context Management Tools
          case 'wikijs_detect_context':
            return await this.handleDetectContext(args);

          case 'wikijs_init_repository':
            return await this.handleInitRepository(args);

          case 'wikijs_init_workspace':
            return await this.handleInitWorkspace(args);

          case 'wikijs_set_context_mode':
            return await this.handleSetContextMode(args);

          case 'wikijs_get_context':
            return await this.handleGetContext(args);

          case 'wikijs_repository_status':
            return await this.handleRepositoryStatus();

          case 'wikijs_workspace_status':
            return await this.handleWorkspaceStatus();

          case 'wikijs_cross_repo_link':
            return await this.handleCrossRepoLink(args);

          case 'wikijs_smart_sync_file':
            return await this.handleSmartSyncFile(args);

          // Connection and Status Tools
          case 'wikijs_connection_status':
            return await this.handleConnectionStatus();

          case 'wikijs_get_site_info':
            return await this.handleGetSiteInfo();

          case 'wikijs_create_page':
            return await this.handleCreatePage(args);

          case 'wikijs_update_page':
            return await this.handleUpdatePage(args);

          case 'wikijs_get_page':
            return await this.handleGetPage(args);

          case 'wikijs_delete_page':
            return await this.handleDeletePage(args);

          case 'wikijs_list_pages':
            return await this.handleListPages(args);

          case 'wikijs_search_pages':
            return await this.handleSearchPages(args);

          case 'wikijs_create_nested_page':
            return await this.handleCreateNestedPage(args);

          case 'wikijs_create_repo_structure':
            return await this.handleCreateRepoStructure(args);

          case 'wikijs_bulk_create_pages':
            return await this.handleBulkCreatePages(args);

          case 'wikijs_sync_file_docs':
            return await this.handleSyncFileDocs(args);

          case 'wikijs_generate_file_overview':
            return await this.handleGenerateFileOverview(args);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async handleConnectionStatus() {
    const isConnected = await this.client.testConnection();
    
    return {
      content: [
        {
          type: 'text',
          text: `Wiki.js connection: ${isConnected ? '✅ Connected' : '❌ Failed'}`,
        },
      ],
    };
  }

  private async handleGetSiteInfo() {
    const siteInfo = await this.client.getSiteInfo();
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(siteInfo, null, 2),
        },
      ],
    };
  }

  private async handleCreatePage(args: any) {
    const result = await this.client.createPage(args);
    
    if (result.responseResult.succeeded) {
      return {
        content: [
          {
            type: 'text',
            text: `✅ Page created successfully!\n\nPage ID: ${result.page?.id}\nPath: ${result.page?.path}\nTitle: ${result.page?.title}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create page: ${result.responseResult.message || 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleUpdatePage(args: any) {
    const result = await this.client.updatePage(args);
    
    if (result.responseResult.succeeded) {
      return {
        content: [
          {
            type: 'text',
            text: `✅ Page updated successfully!\n\nPage ID: ${result.page?.id}\nPath: ${result.page?.path}\nTitle: ${result.page?.title}\nUpdated: ${result.page?.updatedAt}`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to update page: ${result.responseResult.message || 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleGetPage(args: any) {
    const { id, path } = args;
    const page = await this.client.getPage(id, path);
    
    if (page) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(page, null, 2),
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: 'Page not found',
          },
        ],
        isError: true,
      };
    }
  }

  private async handleDeletePage(args: any) {
    const { id } = args;
    const result = await this.client.deletePage(id);
    
    if (result.responseResult.succeeded) {
      return {
        content: [
          {
            type: 'text',
            text: `✅ Page deleted successfully!`,
          },
        ],
      };
    } else {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to delete page: ${result.responseResult.message || 'Unknown error'}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleListPages(args: any) {
    const { limit = 100, offset = 0 } = args;
    const pages = await this.client.listPages(limit, offset);
    
    return {
      content: [
        {
          type: 'text',
          text: `Found ${pages.length} pages:\n\n` + 
                pages.map(page => `- ${page.title} (${page.path}) [ID: ${page.id}]`).join('\n'),
        },
      ],
    };
  }

  private async handleSearchPages(args: any) {
    const { query, path, locale = 'en' } = args;
    const results = await this.client.searchPages(query, path, locale);
    
    return {
      content: [
        {
          type: 'text',
          text: `Found ${results.length} results:\n\n` +
                results.map(result => `- ${result.title} (${result.path}) [ID: ${result.id}]\n  ${result.description}`).join('\n\n'),
        },
      ],
    };
  }

  private async handleCreateNestedPage(args: any) {
    const { title, content, parentPath, pageName, ...otherArgs } = args;
    
    // Generate page name from title if not provided
    const finalPageName = pageName || titleToSlug(title);
    const fullPath = createHierarchicalPath(parentPath, finalPageName);
    
    const pageArgs = {
      title,
      content,
      path: fullPath,
      ...otherArgs,
    };
    
    return await this.handleCreatePage(pageArgs);
  }

  private async handleCreateRepoStructure(args: any) {
    const { repoName, description, sections, basePath = '/' } = args;
    const results: any[] = [];
    
    // Create main repository page
    const repoSlug = titleToSlug(repoName);
    const repoPath = createHierarchicalPath(basePath, repoSlug);
    
    const repoContent = `# ${repoName}\n\n${description}\n\n## Documentation Structure\n\n${sections.map((section: string) => `- [${section}](./${titleToSlug(section)})`).join('\n')}`;
    
    try {
      const repoResult = await this.client.createPage({
        title: repoName,
        content: repoContent,
        path: repoPath,
        description,
      });
      results.push({ section: 'Main', result: repoResult });
      
      // Create section pages
      for (const section of sections) {
        const sectionSlug = titleToSlug(section);
        const sectionPath = createHierarchicalPath(repoPath, sectionSlug);
        const sectionContent = `# ${section}\n\n${section} documentation for ${repoName}.`;
        
        try {
          const sectionResult = await this.client.createPage({
            title: section,
            content: sectionContent,
            path: sectionPath,
            description: `${section} documentation`,
          });
          results.push({ section, result: sectionResult });
        } catch (error) {
          results.push({ section, error: error instanceof Error ? error.message : String(error) });
        }
      }
    } catch (error) {
      results.push({ section: 'Main', error: error instanceof Error ? error.message : String(error) });
    }
    
    const successCount = results.filter(r => r.result?.responseResult?.succeeded).length;
    const errorCount = results.filter(r => r.error).length;
    
    return {
      content: [
        {
          type: 'text',
          text: `Repository structure creation completed!\n\n✅ Successfully created: ${successCount}\n❌ Failed: ${errorCount}\n\nDetails:\n${results.map(r => `- ${r.section}: ${r.result?.responseResult?.succeeded ? '✅' : (r.error ? `❌ ${r.error}` : '❓')}`).join('\n')}`,
        },
      ],
    };
  }

  private async handleBulkCreatePages(args: any) {
    const { pages } = args;
    const results: any[] = [];
    
    for (const page of pages) {
      try {
        const result = await this.client.createPage(page);
        results.push({ ...page, result });
      } catch (error) {
        results.push({ ...page, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    const successCount = results.filter(r => r.result?.responseResult?.succeeded).length;
    const errorCount = results.filter(r => r.error).length;
    
    return {
      content: [
        {
          type: 'text',
          text: `Bulk page creation completed!\n\n✅ Successfully created: ${successCount}\n❌ Failed: ${errorCount}`,
        },
      ],
    };
  }

  private async handleSyncFileDocs(args: any) {
    const { filePath, wikiPath, extractContent = true, includeMetadata = true } = args;
    
    try {
      const analysis = analyzeFile(filePath);
      const documentation = generateFileDocumentation(analysis, {
        includeCode: extractContent,
        includeMetadata,
        analysisDepth: 'detailed',
      });
      
      // Try to get existing page first
      const existingPage = await this.client.getPage(undefined, wikiPath);
      
      if (existingPage) {
        // Update existing page
        const result = await this.client.updatePage({
          id: existingPage.id,
          content: documentation,
          title: analysis.fileName,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: `✅ File documentation synced (updated existing page)\n\nFile: ${filePath}\nWiki Page: ${wikiPath}\nStatus: ${result.responseResult.succeeded ? 'Success' : 'Failed'}`,
            },
          ],
        };
      } else {
        // Create new page
        const result = await this.client.createPage({
          title: analysis.fileName,
          content: documentation,
          path: wikiPath,
          description: `Documentation for ${analysis.fileName}`,
        });
        
        return {
          content: [
            {
              type: 'text',
              text: `✅ File documentation synced (created new page)\n\nFile: ${filePath}\nWiki Page: ${wikiPath}\nStatus: ${result.responseResult.succeeded ? 'Success' : 'Failed'}`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to sync file documentation: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleGenerateFileOverview(args: any) {
    const { filePath, includeCode = false, analysisDepth = 'detailed' } = args;
    
    try {
      const analysis = analyzeFile(filePath);
      const documentation = generateFileDocumentation(analysis, {
        includeCode,
        includeMetadata: true,
        analysisDepth,
      });
      
      return {
        content: [
          {
            type: 'text',
            text: `File Overview Generated:\n\n${documentation}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to generate file overview: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleDetectContext(args: any) {
    const { directory } = args;
    
    // If directory specified, create a new detector for that path
    let contextInfo;
    if (directory) {
      const directoryDetector = new ContextDetector(directory);
      contextInfo = await directoryDetector.detectContext();
    } else {
      contextInfo = await this.detector.detectContext();
    }
    
    return {
      content: [
        {
          type: 'text',
          text: `Context Detection Results:
          
📂 Current Directory: ${contextInfo.currentDir}
🗂️ Git Root: ${contextInfo.gitRoot || 'None'}
🏢 Workspace Root: ${contextInfo.workspaceRoot || 'None'}
📦 Is Monorepo: ${contextInfo.isMonorepo ? 'Yes' : 'No'}
📊 Detected Repositories: ${contextInfo.detectedRepos.length}
🎯 Suggested Context Level: ${contextInfo.suggestedLevel}
⚙️ Has Repository Context: ${contextInfo.hasRepoContext ? 'Yes' : 'No'}
🔧 Has Workspace Context: ${contextInfo.hasWorkspaceContext ? 'Yes' : 'No'}

${contextInfo.detectedRepos.length > 0 ? 
  `\nDetected Repositories:\n${contextInfo.detectedRepos.map(repo => `- ${repo}`).join('\n')}` : 
  ''
}`,
        },
      ],
    };
  }

  private async handleInitRepository(args: any) {
    try {
      const repositoryContext = await this.contextManager.initRepository(args);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Repository context initialized successfully!

📂 Repository: ${repositoryContext.repoName}
📍 Root Path: ${repositoryContext.repoRoot}
🏷️ Wiki Space: ${repositoryContext.wikiSpace}
📊 Context Level: ${repositoryContext.contextLevel}
🔧 Parent Workspace: ${repositoryContext.parentWorkspace || 'None'}
📅 Last Sync: ${repositoryContext.lastSync}

Context file created at: ${repositoryContext.repoRoot}/.wikijs-state.json`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to initialize repository context: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleInitWorkspace(args: any) {
    try {
      const workspaceContext = await this.contextManager.initWorkspace(args);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Workspace context initialized successfully!

🏢 Workspace: ${workspaceContext.workspaceName}
📍 Root Path: ${workspaceContext.workspaceRoot}
📊 Context Level: ${workspaceContext.contextLevel}
🗂️ Repositories: ${Object.keys(workspaceContext.repositories).length}
🏗️ Architecture Wiki Space: ${workspaceContext.systemArchitecture.wikiSpace}
📅 Last Sync: ${workspaceContext.lastSync}

Repositories:
${Object.entries(workspaceContext.repositories).map(([name, repo]) => 
  `- ${name} (${repo.wikiSpace})`
).join('\n')}

Context file created at: ${workspaceContext.workspaceRoot}/.wikijs-workspace.json`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to initialize workspace context: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleSetContextMode(args: any) {
    const { mode } = args;
    this.contextManager.setContextMode(mode);
    
    return {
      content: [
        {
          type: 'text',
          text: `✅ Context mode switched to: ${mode.toUpperCase()}

${mode === 'repository' ? '📂 Repository Mode: Focus on single repository documentation' :
  mode === 'workspace' ? '🏢 Workspace Mode: Coordinate multiple repositories' :
  '🏗️ Architectural Mode: Cross-repository system architecture'
}`,
        },
      ],
    };
  }

  private async handleGetContext(args: any) {
    try {
      const { mode } = args;
      const contextData = await this.contextManager.getContextForClaude(mode);
      
      return {
        content: [
          {
            type: 'text',
            text: `Current Context (${contextData.mode.toUpperCase()}):
Token Budget: ${contextData.tokenCount} tokens

${JSON.stringify(contextData.data, null, 2)}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to get context: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleRepositoryStatus() {
    try {
      const repoContext = await this.contextManager.loadRepositoryContext();
      
      if (!repoContext) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ No repository context found

Initialize repository context with: wikijs_init_repository`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `Repository Status:

📂 Repository: ${repoContext.repoName}
📍 Root Path: ${repoContext.repoRoot}
🏷️ Wiki Space: ${repoContext.wikiSpace}
🔧 Parent Workspace: ${repoContext.parentWorkspace || 'None'}
📅 Last Sync: ${repoContext.lastSync}

📊 Quick Stats:
- Total Files Tracked: ${repoContext.quickContext.totalFiles}
- Total Pages Created: ${repoContext.quickContext.totalPages}
- Key Pages: ${repoContext.quickContext.keyPages.length}

Recent Files:
${Object.entries(repoContext.quickContext.recentFiles).slice(0, 5).map(
  ([path, mapping]) => `- ${path} → Page ${mapping.pageId}`
).join('\n') || 'None tracked yet'}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to get repository status: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleWorkspaceStatus() {
    try {
      const workspaceContext = await this.contextManager.loadWorkspaceContext();
      
      if (!workspaceContext) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ No workspace context found

Initialize workspace context with: wikijs_init_workspace`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `Workspace Status:

🏢 Workspace: ${workspaceContext.workspaceName}
📍 Root Path: ${workspaceContext.workspaceRoot}
📅 Last Sync: ${workspaceContext.lastSync}

🗂️ Repositories (${Object.keys(workspaceContext.repositories).length}):
${Object.entries(workspaceContext.repositories).map(([name, repo]) => 
  `- ${name}
    Wiki Space: ${repo.wikiSpace}
    Path: ${repo.path}
    Key Pages: ${repo.keyPages.length}`
).join('\n')}

🏗️ System Architecture:
- Wiki Space: ${workspaceContext.systemArchitecture.wikiSpace}
- Network Diagrams: ${workspaceContext.systemArchitecture.networkDiagrams.length}
- Cross-Repo Mappings: ${workspaceContext.systemArchitecture.crossRepoMappings.length}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to get workspace status: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleCrossRepoLink(args: any) {
    try {
      const { description, fromRepo, fromComponent, toRepo, toComponent, relationship } = args;
      
      const architecturalLink = {
        description,
        from: { repo: fromRepo, component: fromComponent },
        to: { repo: toRepo, component: toComponent },
        relationship
      };

      await this.contextManager.addArchitecturalLink(architecturalLink);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Cross-repository architectural link created!

🔗 Relationship: ${relationship}
📄 Description: ${description}

From: ${fromRepo}/${fromComponent}
To: ${toRepo}/${toComponent}

This mapping has been added to the workspace architectural context.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to create cross-repo link: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  private async handleSmartSyncFile(args: any) {
    try {
      const { filePath, forceUpdate = false, autoPath = true } = args;
      
      // Check if file has changed
      const hasChanged = forceUpdate || await this.contextManager.hasFileChanged(filePath);
      
      if (!hasChanged) {
        return {
          content: [
            {
              type: 'text',
              text: `📄 File ${filePath} has not changed since last sync - skipping update

Use forceUpdate: true to override this behavior.`,
            },
          ],
        };
      }

      // Get current context to determine wiki path
      const contextData = await this.contextManager.getContextForClaude();
      let wikiPath: string;
      
      if (autoPath) {
        // Auto-generate wiki path based on context
        if (contextData.mode === 'repository') {
          const repoData = contextData.data as any;
          const relativePath = filePath.replace(process.cwd() + '/', '');
          wikiPath = `/${repoData.wikiSpace}/${relativePath.replace(/\//g, '-')}`;
        } else {
          // Workspace mode - include repo name in path
          const relativePath = filePath.replace(process.cwd() + '/', '');
          wikiPath = `/${relativePath.replace(/\//g, '-')}`;
        }
      } else {
        wikiPath = `/docs/${filePath.split('/').pop()?.replace(/\.[^/.]+$/, "")}`;
      }

      // Perform the sync using existing sync functionality
      const syncResult = await this.handleSyncFileDocs({ filePath, wikiPath });
      
      // Update file mapping if successful
      if (!syncResult.isError) {
        // Extract page ID from sync result (this would need to be implemented)
        // For now, we'll use a placeholder
        const pageId = 1; // This should be extracted from the actual sync result
        await this.contextManager.addFileMapping(filePath, pageId);
      }

      return syncResult;
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Failed to smart sync file: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Graceful shutdown
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new WikiJSMCPServer();
  server.run().catch((error) => {
    console.error('Failed to start WikiJS MCP Server:', error);
    process.exit(1);
  });
}

export { WikiJSMCPServer };