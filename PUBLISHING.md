# Publishing Guide for @redairforce/wikijs-mcp

## 🚀 Automated Publishing via GitHub Actions

This package uses GitHub Actions for automated npm publishing. There are two workflows:

### 1. Manual/Release Publishing (`publish.yml`)
Triggered by:
- Creating a GitHub Release
- Manual workflow dispatch

### 2. Automated Release (`release.yml`)
Triggered by:
- Pushing to main branch (auto-detects version bump from commit messages)
- Manual workflow dispatch with specific version bump

## 📋 Prerequisites

### Required GitHub Secrets
Before publishing works, you need to set up these secrets in your GitHub repository:

1. **NPM_TOKEN**: Your npm authentication token
   - Get it from: https://www.npmjs.com/settings/[username]/tokens
   - Create a token with "Automation" type
   - Add to GitHub: Settings → Secrets and variables → Actions → New repository secret

## 🔄 Publishing Workflows

### Option 1: Automated via Commit Messages
```bash
# Patch release (1.0.0 -> 1.0.1)
git commit -m "fix: corrected bug in context loading"

# Minor release (1.0.1 -> 1.1.0)
git commit -m "feat: added new bulk operations"

# Major release (1.1.0 -> 2.0.0)
git commit -m "feat!: breaking change in API structure"
# or
git commit -m "feat: new feature

BREAKING CHANGE: removed deprecated methods"

git push origin main
```

### Option 2: Manual Release via GitHub UI
1. Go to Actions tab in GitHub
2. Select "Release" workflow
3. Click "Run workflow"
4. Choose release type: patch, minor, major, or prerelease
5. Click "Run workflow"

### Option 3: Create GitHub Release
1. Go to Releases page in GitHub
2. Click "Create a new release"
3. Create a new tag (e.g., v1.0.1)
4. Write release notes
5. Publish release
6. Workflow automatically publishes to npm

## 📦 What Gets Published

The following files are included in the npm package:
- `dist/` - Compiled JavaScript files
- `README.md` - Package documentation
- `LICENSE` - MIT license file
- `CHANGELOG.md` - Version history
- `package.json` - Package metadata

Files excluded (via .npmignore):
- Source TypeScript files (`src/`)
- Configuration files (`.env`, `.env.example`)
- GitHub workflows (`.github/`)
- Development files (`test-*.md`, `PUBLISHING.md`)
- TypeScript config (`tsconfig.json`)

## 🏷️ Version Tags

### npm dist-tags
- `latest` - Stable releases (default)
- `beta` - Beta releases for testing
- `next` - Next version preview

Example:
```bash
# Install stable version
npm install @redairforce/wikijs-mcp

# Install beta version
npm install @redairforce/wikijs-mcp@beta
```

## 🔍 Manual Publishing (Local)

If you need to publish manually from your local machine:

```bash
# Build the package
npm run build

# Test the package locally
npm link
wikijs-mcp test-connection

# Login to npm
npm login

# Publish to npm
npm publish --access public

# Publish with specific tag
npm publish --access public --tag beta
```

## 📊 Publishing Checklist

Before publishing a new version:

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` with version notes
- [ ] Ensure all tests pass: `npm test`
- [ ] Build successfully: `npm run build`
- [ ] Review included files: `npm pack --dry-run`
- [ ] Commit all changes
- [ ] Push to main branch or create release

## 🐛 Troubleshooting

### NPM_TOKEN not working
1. Ensure token has "Automation" type
2. Check token hasn't expired
3. Verify token is added as GitHub secret correctly

### Workflow fails at publish step
1. Check npm account has proper permissions
2. Verify package name is available/owned by you
3. Check `publishConfig` in package.json

### Version conflicts
1. Pull latest changes: `git pull origin main`
2. Check current npm version: `npm view @redairforce/wikijs-mcp version`
3. Ensure local version is higher than published version

## 📈 Post-Publishing

After successful publishing:
1. Verify on npm: https://www.npmjs.com/package/@redairforce/wikijs-mcp
2. Test installation: `npm install @redairforce/wikijs-mcp`
3. Update any dependent projects
4. Announce release if needed

## 🔗 Useful Links

- npm Package: https://www.npmjs.com/package/@redairforce/wikijs-mcp
- GitHub Repository: https://github.com/redairforce/wikijs-mcp
- GitHub Actions: https://github.com/redairforce/wikijs-mcp/actions
- npm Tokens: https://www.npmjs.com/settings/~/tokens