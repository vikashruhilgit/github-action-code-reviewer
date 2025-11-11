# Deployment Guide

This guide explains how to publish the AI Code Reviewer GitHub Action.

## Prerequisites

- GitHub account
- Git repository for the action
- Anthropic API key (for testing)

## Steps to Publish

### 1. Initialize Git Repository

```bash
cd /Users/vikashruhil/Documents/work/AI/ai-agent-manager/github-action-code-reviewer

# Initialize git (if not already)
git init

# Add all files
git add .

# Commit
git commit -m "feat: initial release of AI Code Reviewer GitHub Action

- Automated PR reviews using Claude AI
- Reads project-specific patterns from CLAUDE.md
- Categorizes issues by severity (BLOCKING, HIGH, MEDIUM, SUGGESTION)
- Provides detailed feedback with code examples
- Detects new patterns for documentation
- Security-first approach (secrets, injection, validation)
- Type safety enforcement
- Test coverage verification"
```

### 2. Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Repository name: `github-action-code-reviewer`
3. Description: "Automated code review using Claude AI with project-specific patterns"
4. Choose: Public (for GitHub Marketplace) or Private
5. Do NOT initialize with README (we already have one)
6. Click "Create repository"

### 3. Push to GitHub

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/github-action-code-reviewer.git

# Push
git branch -M main
git push -u origin main
```

### 4. Create a Release

```bash
# Create and push v1 tag
git tag -a v1.0.0 -m "v1.0.0 - Initial release"
git push origin v1.0.0

# Create major version tag (for users to pin to v1)
git tag -a v1 -m "v1 - Latest v1.x release"
git push origin v1 --force
```

On GitHub:
1. Go to repository → Releases → "Create a new release"
2. Tag: `v1.0.0`
3. Title: `v1.0.0 - Initial Release`
4. Description:
   ```markdown
   ## Features
   - Automated PR reviews using Claude AI
   - Project-specific patterns from CLAUDE.md
   - Severity-based issue categorization
   - Detailed feedback with code examples
   - Pattern detection
   - Security-first approach

   ## Installation
   See [README.md](README.md) for usage instructions.
   ```
5. Click "Publish release"

### 5. (Optional) Publish to GitHub Marketplace

1. Go to repository → Settings → scroll to "Marketplace listing"
2. Click "Draft a Marketplace listing"
3. Fill in:
   - **Category:** Code quality
   - **Icon:** check-circle (already in action.yml)
   - **Color:** blue (already in action.yml)
   - **Description:** Brief description
   - **Screenshots:** (optional) Add example PR comment screenshots
   - **Terms:** Accept terms of service
4. Click "Publish" or "Save draft"

## Using the Action

### For Testing (Before Publishing)

```yaml
# In your test repository's .github/workflows/test.yml
- uses: YOUR_USERNAME/github-action-code-reviewer@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

### After Publishing

Users can reference it as:
```yaml
- uses: vikashruhil/github-action-code-reviewer@v1
```

## Updating the Action

### For Bug Fixes (Patch Release)

```bash
# Make your changes
git add .
git commit -m "fix: description of fix"

# Tag new patch version
git tag -a v1.0.1 -m "v1.0.1 - Bug fixes"
git push origin v1.0.1

# Update v1 tag to point to latest
git tag -a v1 -m "v1 - Latest v1.x release" --force
git push origin v1 --force
```

### For New Features (Minor Release)

```bash
# Make your changes
git add .
git commit -m "feat: description of feature"

# Tag new minor version
git tag -a v1.1.0 -m "v1.1.0 - New features"
git push origin v1.1.0

# Update v1 tag to point to latest
git tag -a v1 -m "v1 - Latest v1.x release" --force
git push origin v1 --force
```

### For Breaking Changes (Major Release)

```bash
# Make your changes
git add .
git commit -m "feat!: breaking change description

BREAKING CHANGE: Detailed explanation"

# Tag new major version
git tag -a v2.0.0 -m "v2.0.0 - Breaking changes"
git push origin v2.0.0

# Create v2 tag
git tag -a v2 -m "v2 - Latest v2.x release"
git push origin v2
```

## Testing Before Release

### 1. Local Testing with Test Repository

Create a test repository:
1. Create new repository on GitHub
2. Add CLAUDE.md with test patterns
3. Add `.github/workflows/test.yml` pointing to your action
4. Create a test PR
5. Verify review comment is posted correctly

### 2. Verify Action Builds

```bash
npm run build
# Check that dist/index.js is created
# Check that prompts/code-reviewer.md is bundled
```

### 3. Test Edge Cases

- PR without CLAUDE.md
- PR with very large diff
- PR with no changes
- PR with only documentation changes
- PR with security issues (secrets in code)
- PR with type errors

## Maintenance

### Regular Updates

- **Monthly:** Update dependencies (`npm update`)
- **Quarterly:** Update to latest Claude model (if available)
- **As needed:** Sync `prompts/code-reviewer.md` with ai-agent-manager updates

### Monitoring

- Watch GitHub Issues for bug reports
- Monitor GitHub Actions usage (costs)
- Check Claude API rate limits

## Troubleshooting

### "dist/ not found" Error

**Solution:** Commit the `dist/` directory (it's required for GitHub Actions):
```bash
git add dist/
git commit -m "chore: add dist directory"
git push
```

### Action Not Triggering

**Check:**
1. Workflow file is in `.github/workflows/`
2. `on: pull_request:` events are correct
3. Repository has `ANTHROPIC_API_KEY` secret set

### Review Comment Not Posted

**Check:**
1. Workflow has `pull-requests: write` permission
2. `GITHUB_TOKEN` is passed correctly
3. Claude API key is valid
4. Check action logs for errors

## Security Best Practices

- Never commit `.env` files
- Never log API keys in action code
- Use GitHub Secrets for sensitive data
- Regularly rotate API keys
- Monitor API usage for anomalies

## Support

- Issues: [GitHub Issues](https://github.com/vikashruhil/github-action-code-reviewer/issues)
- Discussions: [GitHub Discussions](https://github.com/vikashruhil/github-action-code-reviewer/discussions)

---

**Ready to deploy!** Follow the steps above to publish your action.
