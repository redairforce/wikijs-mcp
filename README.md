# @redairforce/wikijs-mcp

A comprehensive **Model Context Protocol (MCP) server** for Wiki.js integration with hierarchical documentation support and multi-level context management. This local package provides Claude Code with powerful Wiki.js management capabilities.

## 🚀 Quick Start

### Local Installation

```bash
# Install dependencies
npm install

# Build the package
npm run build
```

### Configuration

Create a `.env` file in your project directory:

```bash
# Copy the example configuration
cp .env.example .env

# Edit with your Wiki.js credentials
WIKIJS_API_URL=https://your-wiki.example.com
WIKIJS_TOKEN=your_jwt_token_here
```

### Usage with Claude Code

Add to your Claude Code MCP configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux**: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "wikijs": {
      "command": "wikijs-mcp",
      "args": ["server"]
    }
  }
}
```

## 🎯 Features

### 📝 **Core Page Management**
- **Create/Update/Delete** pages with full content support
- **Search** across all Wiki.js content
- **List** pages with pagination
- **Get** individual pages by ID or path

### 🏗️ **Hierarchical Documentation**
- **Nested page creation** with automatic path management
- **Repository structure** generation for organized documentation
- **Auto-categorization** by file type (components, API, utils, etc.)

### 🔧 **Advanced Features**
- **Bulk operations** for creating multiple pages
- **File-to-documentation sync** with code analysis
- **Automatic content generation** from source files
- **GraphQL integration** with comprehensive error handling

### 🔌 **Claude Integration**
- **22 MCP tools** available to Claude Code
- **Real-time documentation updates** during development
- **Code-aware content generation** with syntax highlighting
- **Project structure analysis** and documentation

## 📊 Available MCP Tools

### Connection & Status
1. **`wikijs_connection_status`** - Test Wiki.js connection
2. **`wikijs_get_site_info`** - Get detailed site information

### Core Page Management
3. **`wikijs_create_page`** - Create new pages
4. **`wikijs_update_page`** - Update existing pages
5. **`wikijs_get_page`** - Retrieve pages by ID/path
6. **`wikijs_delete_page`** - Delete pages
7. **`wikijs_list_pages`** - List pages with pagination
8. **`wikijs_search_pages`** - Search page content

### Hierarchical Documentation
9. **`wikijs_create_nested_page`** - Create pages with parent-child relationships
10. **`wikijs_create_repo_structure`** - Generate complete repository documentation

### Bulk Operations
11. **`wikijs_bulk_create_pages`** - Create multiple pages at once

### File Integration
12. **`wikijs_sync_file_docs`** - Sync source files with documentation
13. **`wikijs_generate_file_overview`** - Generate documentation from code files

### Multi-Level Context Management
14. **`wikijs_detect_context`** - Auto-detect repository and workspace context
15. **`wikijs_init_repository`** - Initialize repository documentation context
16. **`wikijs_init_workspace`** - Initialize multi-repository workspace
17. **`wikijs_set_context_mode`** - Switch between repository/workspace/architectural modes
18. **`wikijs_get_context`** - Get current context optimized for Claude consumption
19. **`wikijs_repository_status`** - Show current repository context and documentation status
20. **`wikijs_workspace_status`** - Show workspace with all repositories and status
21. **`wikijs_cross_repo_link`** - Create architectural mapping between repositories
22. **`wikijs_smart_sync_file`** - Intelligently sync files with context awareness

## 🛠️ Command Line Usage

The package also provides a CLI for direct Wiki.js management:

### Test Connection
```bash
wikijs-mcp test-connection
```

### Create a Page
```bash
wikijs-mcp create-page "My Page Title" "# Content here" "/docs/my-page"
```

### List Pages
```bash
wikijs-mcp list-pages --limit 20
```

### Search Pages
```bash
wikijs-mcp search "API documentation"
```

### Start MCP Server
```bash
wikijs-mcp server
# or simply
wikijs-mcp
```

## 📚 Usage Examples

### Creating Nested Documentation
```javascript
// Claude can execute this via MCP tools
await wikijs_create_nested_page({
  title: "Button Component",
  content: "# Button Component\n\nReusable button with multiple variants...",
  parentPath: "/frontend/components",
  description: "React button component documentation"
});
```

### Repository Structure Generation
```javascript
await wikijs_create_repo_structure({
  repoName: "My Frontend App",
  description: "Modern React application with TypeScript",
  sections: ["Overview", "Components", "API", "Testing", "Deployment"]
});
```

### File-to-Documentation Sync
```javascript
await wikijs_sync_file_docs({
  filePath: "./src/components/Button.tsx",
  wikiPath: "/frontend/components/button",
  extractContent: true,
  includeMetadata: true
});
```

## ⚙️ Configuration Options

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `WIKIJS_API_URL` | Wiki.js instance URL | - | ✅ |
| `WIKIJS_TOKEN` | JWT API token | - | ✅* |
| `WIKIJS_USERNAME` | Username (alternative auth) | - | ✅* |
| `WIKIJS_PASSWORD` | Password (alternative auth) | - | ✅* |
| `LOG_LEVEL` | Logging level | `INFO` | ❌ |
| `DEFAULT_SPACE_NAME` | Default documentation space | `Documentation` | ❌ |
| `REPOSITORY_ROOT` | Repository root path | `./` | ❌ |

*Either `WIKIJS_TOKEN` or both `WIKIJS_USERNAME` and `WIKIJS_PASSWORD` required.

## 🚀 Development

### Setup
```bash
git clone <repository>
cd custom-wikijs-mcp
npm install
```

### Build
```bash
npm run build
```

### Development Mode
```bash
npm run dev
```

### Testing
```bash
npm test
```

## 🧠 Multi-Level Context Architecture

### Overview

The WikiJS MCP server features a sophisticated **multi-level context system** that prevents token explosion while maintaining rich cross-repository intelligence. This enables seamless documentation workflows across multiple repositories and system architecture levels.

### 📊 Context Levels

| Level | Focus | Token Budget | Use Case | Wiki Spaces |
|-------|-------|--------------|----------|--------------|
| **📂 Repository** | Single repo documentation | ~200 tokens | "Document frontend applications" | `frontend-docs` |
| **🏢 Workspace** | Multi-repo coordination | ~800 tokens | "Coordinate frontend & backend repos" | `frontend-docs`, `backend-docs` |
| **🏗️ Architectural** | System-wide relationships | ~1200 tokens | "Document how services integrate with database layer" | `system-architecture` |

### 🔄 Documentation Workflow

#### **Phase 1: Individual Repository Documentation**

```bash
# Navigate to your first repository
cd /path/to/your/repo

# Claude automatically detects repository context
# - Creates .wikijs-state.json for persistent tracking
# - Maps to wiki space: your-project-docs
# - Tracks individual files → wiki pages with hash tracking
# - Documents components, configurations, and setup guides
```

**Example Interaction:**
```
You: "Document all the components in this repository"
Claude: [Repository Level - 200 tokens]
- Auto-detects current directory as git repository
- Creates comprehensive component catalog
- Maps files to wiki pages with change tracking
- Documents all modules, services, and dependencies
```

#### **Phase 2: Multi-Repository Coordination**

```bash
# Navigate to workspace root to coordinate repositories
cd /workspace

# Initialize workspace context (ties repositories together)
# - Creates .wikijs-workspace.json for multi-repo state
# - Detects all repositories in workspace (frontend/, backend/, etc.)
# - Enables cross-repository page linking and references
# - Coordinates documentation structure across repos
```

**Example Interaction:**
```
You: "Now tie the frontend and backend repositories together in the wiki"
Claude: [Workspace Level - 800 tokens]
- Loads context from both frontend and backend repositories
- Creates cross-references between wiki spaces
- Documents how repositories relate to each other
- Builds unified navigation across different spaces
```

#### **Phase 3: Architectural Documentation**

```bash
# Still at workspace root - switch to architectural focus
# - Documents system-wide architecture and relationships
# - Creates cross-repository dependency mapping
# - Maintains architectural decision records (ADRs)
# - Shows network flows and component interactions
```

**Example Interaction:**
```
You: "Document the system architecture showing how frontend and backend integrate"
Claude: [Architectural Level - 1200 tokens]
- Creates architectural relationship: "Frontend API calls depend on backend authentication service"
- Documents network topology and data flows
- Shows dependencies between different repositories
- Creates system-wide architectural diagrams and explanations
```

### 🎯 Context Switching

#### **Automatic Detection** (Recommended)
Claude automatically selects appropriate context based on:
- **Current Directory**: Repository root vs workspace root
- **Request Keywords**: "architecture", "cross-repo", "system design"
- **Existing Context**: Detects existing .wikijs-state.json or .wikijs-workspace.json files

#### **Manual Control** (When Needed)
```bash
# Explicit context switching
"Switch to workspace level to coordinate between repositories"
"Move to architectural context to document system design" 
"Focus on repository level for just this application"
```

### 📋 Iterative Documentation Refinement

#### **Initial Documentation → Review → Corrections**

```bash
# After Claude creates initial documentation
You: "I reviewed the API documentation at https://docs.example.com/en/api 
     and need corrections. The authentication endpoint actually uses OAuth2."

Claude: [Repository Level - loads existing context]
- Accesses current .wikijs-state.json context (~200 tokens)
- Loads existing wiki page content for reference
- Makes targeted updates based on your corrections
- Updates wiki.js page with accurate information
- Maintains file change tracking for future updates
```

#### **Loading Documentation for Interrogation**

```bash
# Later session - return to work on repository
cd /path/to/your/repo

You: "Load the API documentation so I can ask about the authentication flow"

Claude: [Auto-loads repository context]
- Reads .wikijs-state.json (persistent repository state)  
- Loads existing wiki page mappings and content
- Tracks recent file changes since last sync
- Ready to answer questions about documented configuration
```

#### **Cross-Repository Questions**

```bash
# Working at workspace level
cd /workspace

You: "How does the frontend application connect to backend services?"

Claude: [Workspace Level - cross-repository intelligence]  
- Loads frontend-docs documentation context
- Loads backend-docs documentation context  
- References architectural relationship mappings
- Provides comprehensive answer spanning both repositories
```

### 🔧 Smart Features

#### **Change Detection & Incremental Updates**
```bash
# When returning to a repository later
Claude: [Automatically detects]
"I notice 3 files have changed since last documentation sync"
"The wiki page was last updated 5 days ago - should we review for updates?"
"New package.json dependencies detected - documentation may need updates"
```

#### **Documentation-Driven Development**
```bash
You: "I'm updating the API service - what documentation needs updates?"

Claude: [Repository context with file mappings]
"Based on tracked file mappings, updating the API service will require updates to:
- /api/endpoints page (version numbers)
- API configuration guide (if parameters change)  
- Architecture page (if networking changes)
Would you like me to prepare these updates?"
```

### 🗂️ Generated Wiki Structure

```
Wiki.js Organization:
├── frontend-docs/                  (Repository Level)
│   ├── components/                 ← Your component documentation
│   ├── deployment-guide/
│   ├── configuration/
│   └── troubleshooting/
│
├── backend-docs/                   (Repository Level)
│   ├── api-services/
│   ├── authentication/
│   ├── database-schemas/
│   └── middleware/
│
└── system-architecture/            (Architectural Level)
    ├── system-overview/
    ├── frontend-backend-integration/
    ├── network-topology/
    ├── dependency-mapping/
    └── architectural-decisions/
```

### 💡 Key Benefits

1. **Token Efficiency**: 200-1200 tokens vs 25,000+ token explosion
2. **Persistent Intelligence**: Context survives between sessions via JSON files
3. **Cross-Repository Relationships**: Documents dependencies and integrations
4. **Iterative Refinement**: Easy corrections and updates to existing documentation
5. **Documentation Interrogation**: Query your documentation like a knowledge base
6. **Automatic Organization**: Smart categorization and wiki space management
7. **Change Tracking**: File hash system prevents unnecessary wiki updates

This creates a **living documentation system** where your wiki becomes an intelligent, queryable knowledge base that grows and evolves with your codebase.

## 📖 Advanced Usage

### Custom File Analysis
The package automatically categorizes files for documentation:
- **Components**: React/Vue components, UI elements
- **API**: Endpoints, controllers, routes  
- **Utils**: Helper functions, utilities
- **Services**: Business logic, external integrations
- **Models**: Data models, types, schemas
- **Tests**: Unit tests, integration tests
- **Config**: Configuration files, environment setup

### GraphQL Integration
Built on the verified GraphQL mutations that work with Wiki.js:
- Proper authentication handling
- Comprehensive error reporting
- Retry logic with exponential backoff
- Full type safety with TypeScript

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- **Wiki.js Team** - For the excellent documentation platform
- **MCP Protocol** - For standardized AI integration
- **@modelcontextprotocol/sdk** - For the TypeScript MCP implementation

---

**Ready to enhance your documentation workflow?** 🚀 Install `@redairforce/wikijs-mcp` and let Claude manage your Wiki.js content seamlessly!