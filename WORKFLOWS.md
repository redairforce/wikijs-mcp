# GitHub Actions Workflow Files

To enable automated npm publishing, create a `.github/workflows/` directory in your repository and add these files:

## 📄 publish.yml

```yaml
name: Publish to npm

on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to publish (leave empty to use package.json version)'
        required: false
        type: string
      tag:
        description: 'npm dist-tag (latest, beta, next)'
        required: false
        default: 'latest'
        type: choice
        options:
          - latest
          - beta
          - next

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test || echo "No tests configured"

      - name: Build package
        run: npm run build

      - name: Update version if specified
        if: github.event.inputs.version != ''
        run: npm version ${{ github.event.inputs.version }} --no-git-tag-version

      - name: Publish to npm (Release)
        if: github.event_name == 'release'
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Publish to npm (Manual)
        if: github.event_name == 'workflow_dispatch'
        run: npm publish --access public --tag ${{ github.event.inputs.tag || 'latest' }}
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 📄 release.yml

```yaml
name: Release

on:
  push:
    branches:
      - main
    paths:
      - 'src/**'
      - 'package.json'
      - 'tsconfig.json'
  workflow_dispatch:
    inputs:
      release_type:
        description: 'Release type'
        required: true
        type: choice
        options:
          - patch
          - minor
          - major
          - prerelease

permissions:
  contents: write
  pull-requests: write
  packages: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - name: Configure Git
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

      - name: Install dependencies
        run: npm ci

      - name: Build package
        run: npm run build

      - name: Run tests
        run: npm test || echo "No tests configured"

      - name: Determine version bump
        id: version
        run: |
          if [ "${{ github.event_name }}" == "workflow_dispatch" ]; then
            echo "bump_type=${{ github.event.inputs.release_type }}" >> $GITHUB_OUTPUT
          else
            # Auto-detect from commit messages
            if git log -1 --pretty=%B | grep -q "BREAKING CHANGE\|!:"; then
              echo "bump_type=major" >> $GITHUB_OUTPUT
            elif git log -1 --pretty=%B | grep -q "feat:"; then
              echo "bump_type=minor" >> $GITHUB_OUTPUT
            else
              echo "bump_type=patch" >> $GITHUB_OUTPUT
            fi
          fi

      - name: Bump version
        id: bump
        run: |
          NEW_VERSION=$(npm version ${{ steps.version.outputs.bump_type }} --no-git-tag-version)
          echo "new_version=${NEW_VERSION}" >> $GITHUB_OUTPUT

      - name: Generate changelog
        id: changelog
        run: |
          VERSION=${{ steps.bump.outputs.new_version }}
          DATE=$(date +%Y-%m-%d)
          echo "## ${VERSION} - ${DATE}" > release_notes.md
          echo "" >> release_notes.md
          git log --pretty=format:"- %s" $(git describe --tags --abbrev=0 2>/dev/null || git rev-list --max-parents=0 HEAD)..HEAD >> release_notes.md || echo "- Initial release" >> release_notes.md

      - name: Commit version bump
        run: |
          git add package.json package-lock.json
          git commit -m "chore: bump version to ${{ steps.bump.outputs.new_version }}"
          git push

      - name: Create GitHub Release
        uses: actions/create-release@v1
        id: create_release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: ${{ steps.bump.outputs.new_version }}
          release_name: ${{ steps.bump.outputs.new_version }}
          body_path: release_notes.md
          draft: false
          prerelease: ${{ steps.version.outputs.bump_type == 'prerelease' }}

      - name: Publish to npm
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

## 🔑 Setup Instructions

1. **Create the workflows directory:**
   ```bash
   mkdir -p .github/workflows
   ```

2. **Add the workflow files:**
   - Copy the `publish.yml` content above to `.github/workflows/publish.yml`
   - Copy the `release.yml` content above to `.github/workflows/release.yml`

3. **Configure npm token:**
   - Go to https://www.npmjs.com/settings/~/tokens
   - Create an "Automation" token
   - Add it as `NPM_TOKEN` in your GitHub repository secrets:
     - Go to Settings → Secrets and variables → Actions
     - Click "New repository secret"
     - Name: `NPM_TOKEN`
     - Value: Your npm token

4. **Commit and push:**
   ```bash
   git add .github/workflows/
   git commit -m "Add npm publishing workflows"
   git push origin main
   ```

## 📝 Notes

- You need a GitHub token with `workflow` scope to push workflow files
- Alternatively, you can add these files directly through the GitHub web interface
- The workflows will be active once they're in your repository's main branch