#!/usr/bin/env node

import { Command } from 'commander';
import { WikiJSMCPServer } from './index.js';

const program = new Command();

program
  .name('wikijs-mcp')
  .description('Wiki.js MCP Server - A Model Context Protocol server for Wiki.js integration')
  .version('0.1.0');

program
  .command('server')
  .description('Start the MCP server')
  .action(async () => {
    try {
      console.error('Starting Wiki.js MCP Server...');
      const server = new WikiJSMCPServer();
      await server.run();
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  });

program
  .command('test-connection')
  .description('Test connection to Wiki.js instance')
  .option('-u, --url <url>', 'Wiki.js API URL')
  .option('-t, --token <token>', 'API token')
  .action(async (options) => {
    try {
      const { loadConfig } = await import('./utils/config.js');
      const { WikiJSClient } = await import('./client/wikijs-client.js');
      
      // Override config with CLI options
      const config = loadConfig();
      if (options.url) config.wikijs_api_url = options.url;
      if (options.token) config.wikijs_token = options.token;
      
      const client = new WikiJSClient(config);
      const isConnected = await client.testConnection();
      
      if (isConnected) {
        console.log('✅ Connection successful!');
        
        // Get site info
        const siteInfo = await client.getSiteInfo();
        console.log('\nSite Information:');
        console.log(`- Title: ${siteInfo.site?.config?.title || 'N/A'}`);
        console.log(`- Host: ${siteInfo.site?.config?.host || 'N/A'}`);
        console.log(`- Version: ${siteInfo.system?.info?.currentVersion || 'N/A'}`);
        console.log(`- Platform: ${siteInfo.system?.info?.platform || 'N/A'}`);
      } else {
        console.log('❌ Connection failed!');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Connection test failed:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('create-page <title> <content> <path>')
  .description('Create a new page')
  .option('-d, --description <description>', 'Page description')
  .option('--private', 'Make page private', false)
  .option('--unpublished', 'Create as unpublished', false)
  .option('-t, --tags <tags>', 'Comma-separated tags')
  .action(async (title, content, path, options) => {
    try {
      const { loadConfig } = await import('./utils/config.js');
      const { WikiJSClient } = await import('./client/wikijs-client.js');
      
      const config = loadConfig();
      const client = new WikiJSClient(config);
      
      const result = await client.createPage({
        title,
        content,
        path,
        description: options.description,
        isPrivate: options.private,
        isPublished: !options.unpublished,
        tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [],
      });
      
      if (result.responseResult.succeeded) {
        console.log('✅ Page created successfully!');
        console.log(`- ID: ${result.page?.id}`);
        console.log(`- Path: ${result.page?.path}`);
        console.log(`- Title: ${result.page?.title}`);
      } else {
        console.error('❌ Failed to create page:', result.responseResult.message);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error creating page:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('list-pages')
  .description('List pages')
  .option('-l, --limit <limit>', 'Maximum number of pages to return', '10')
  .option('-o, --offset <offset>', 'Number of pages to skip', '0')
  .action(async (options) => {
    try {
      const { loadConfig } = await import('./utils/config.js');
      const { WikiJSClient } = await import('./client/wikijs-client.js');
      
      const config = loadConfig();
      const client = new WikiJSClient(config);
      
      const pages = await client.listPages(parseInt(options.limit), parseInt(options.offset));
      
      console.log(`Found ${pages.length} pages:\n`);
      pages.forEach(page => {
        console.log(`📄 ${page.title}`);
        console.log(`   Path: ${page.path}`);
        console.log(`   ID: ${page.id}`);
        console.log(`   Published: ${page.isPublished ? '✅' : '❌'}`);
        console.log(`   Private: ${page.isPrivate ? '🔒' : '🔓'}`);
        if (page.tags.length > 0) {
          console.log(`   Tags: ${page.tags.join(', ')}`);
        }
        console.log(`   Updated: ${new Date(page.updatedAt).toLocaleString()}`);
        console.log('');
      });
    } catch (error) {
      console.error('❌ Error listing pages:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program
  .command('search <query>')
  .description('Search pages')
  .option('-p, --path <path>', 'Path to search within')
  .option('-l, --locale <locale>', 'Search locale', 'en')
  .action(async (query, options) => {
    try {
      const { loadConfig } = await import('./utils/config.js');
      const { WikiJSClient } = await import('./client/wikijs-client.js');
      
      const config = loadConfig();
      const client = new WikiJSClient(config);
      
      const results = await client.searchPages(query, options.path, options.locale);
      
      console.log(`Found ${results.length} results for "${query}":\n`);
      results.forEach(result => {
        console.log(`🔍 ${result.title}`);
        console.log(`   Path: ${result.path}`);
        console.log(`   ID: ${result.id}`);
        console.log(`   Description: ${result.description}`);
        console.log('');
      });
    } catch (error) {
      console.error('❌ Error searching pages:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Default action - start server
program.action(async () => {
  program.help();
});

program.parse();