# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2025-01-04

### Added
- Initial release of @redairforce/wikijs-mcp
- Complete MCP server implementation for Wiki.js integration
- 14 MCP tools for comprehensive Wiki.js management
- TypeScript implementation with full type safety
- CLI interface for direct Wiki.js operations
- GraphQL client with verified authentication
- Hierarchical documentation support
- File-to-documentation synchronization
- Auto-categorization of code files
- Bulk operations for page management
- Real-time documentation updates during development

### Features
- **Core Page Management**: Create, update, delete, list, search pages
- **Hierarchical Documentation**: Nested page creation, repository structure generation
- **File Integration**: Sync source files with documentation, automatic content generation
- **Authentication**: JWT token and username/password support
- **CLI Tools**: Test connection, create pages, list pages, search functionality
- **MCP Integration**: Full Model Context Protocol server for Claude Code

### Technical Details
- Built with @modelcontextprotocol/sdk v0.4.0
- Axios for HTTP client with proper error handling
- Commander.js for CLI interface
- Zod for configuration validation
- TypeScript for type safety and better development experience

### Tested Features
- ✅ Connection to Wiki.js instance (docs.example.com)
- ✅ Page creation with markdown content
- ✅ Page listing and retrieval
- ✅ Search functionality across Wiki.js content
- ✅ Authentication with JWT tokens
- ✅ CLI interface operations
- ✅ GraphQL integration with proper error handling