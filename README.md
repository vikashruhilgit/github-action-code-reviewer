# AI Code Reviewer - GitHub Action

Automated code review using Claude AI with project-specific patterns from CLAUDE.md. This action uses the same code-reviewer agent logic from the [ai-agent-manager](https://github.com/vikashruhil/ai-agent-manager) project.

## Features

- ✅ **Automated PR Reviews** - Triggers on PR creation and updates
- ✅ **Project-Specific Patterns** - Reads your CLAUDE.md for context-aware reviews
- ✅ **Severity-Based Issues** - Categorizes findings (BLOCKING, HIGH, MEDIUM, SUGGESTION)
- ✅ **Detailed Feedback** - Provides specific fixes with code examples
- ✅ **Pattern Detection** - Identifies new patterns worth documenting
- ✅ **Security-First** - Flags secrets, injection vulnerabilities, input validation issues
- ✅ **Type Safety** - Enforces strict type checking
- ✅ **Test Coverage** - Verifies testing thresholds

## Quick Start

### 1. Add Workflow to Your Repository

Create `.github/workflows/code-reviewer.yml`:

```yaml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: AI Code Review
        uses: vikashruhil/github-action-code-reviewer@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Add Anthropic API Key

1. Get your API key from [Anthropic Console](https://console.anthropic.com/)
2. Add it to GitHub Secrets:
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your API key

### 3. (Optional) Add CLAUDE.md

Add a `CLAUDE.md` file to your repository root with your project patterns:

```markdown
# My Project

## Structure
- src/ — Application code
- test/ — Test files

## Tech Stack
- Node.js, Express, PostgreSQL
- Jest for testing

## Key Patterns
- Use async/await (not callbacks)
- Type all functions with JSDoc
- Testing threshold: ≥80% coverage
- API endpoints: RESTful design
- Database: Use prepared statements

## Quick Commands
- Build: npm run build
- Test: npm test
- Lint: npm run lint
```

If no CLAUDE.md is found, the reviewer uses general best practices.

## Configuration

### Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `anthropic_api_key` | Yes | - | Anthropic API key for Claude AI |
| `github_token` | Yes | `${{ github.token }}` | GitHub token for posting comments |
| `model` | No | `claude-sonnet-4-5-20250929` | Claude model to use |
| `review_on` | No | `opened,synchronize` | PR events to review (comma-separated) |

### Outputs

| Output | Description |
|--------|-------------|
| `review_posted` | Whether a review comment was posted (`true`/`false`) |
| `issues_found` | Total number of issues found (BLOCKING + HIGH + MEDIUM) |
| `blocking_issues` | Number of blocking issues found |

### Example with Custom Configuration

```yaml
- name: AI Code Review
  uses: vikashruhil/github-action-code-reviewer@v1
  with:
    anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    model: 'claude-sonnet-4-5-20250929'
    review_on: 'opened,synchronize,reopened'
```

## Review Output

The action posts a comment on your PR with:

### 1. Summary
Quick overview of issues found:
```
🔴 2 BLOCKING issues - Must fix before merge
🟡 3 HIGH priority issues - Should fix before merge
🟢 1 MEDIUM priority issue - Consider fixing
```

### 2. Context Read
What patterns the reviewer understood from your CLAUDE.md

### 3. Strengths
Positive aspects of your code

### 4. Issues Found
Organized by severity with:
- File and line numbers
- Problem description
- Impact assessment
- Suggested fix with code examples

### 5. Pattern Proposals
New patterns detected that might be worth adding to CLAUDE.md

### 6. Next Steps
Clear action items for the developer

## Issue Severity Levels

| Severity | When Used | Action Required |
|----------|-----------|-----------------|
| **BLOCKING** | Security vulnerabilities, type errors that break compilation, logic errors causing crashes | Must fix before merge |
| **HIGH** | Type safety issues, missing input validation, test coverage below threshold, performance regressions | Should fix before merge |
| **MEDIUM** | Pattern inconsistencies, unclear naming, inefficient algorithms, missing error handling | Consider fixing |
| **SUGGESTION** | Code style improvements, refactoring opportunities, helpful comments | Nice to have |

## How It Works

```
PR Event (opened/updated)
    ↓
GitHub Action Triggers
    ↓
1. Loads code-reviewer.md agent prompt (HOW to review)
2. Reads project's CLAUDE.md (WHAT patterns to check)
3. Gets PR diff (changed files)
4. Sends to Claude API for review
5. Parses response (metrics, issues, suggestions)
6. Posts formatted comment on PR
```

## Cost Considerations

- Uses Claude API (pay-per-token model)
- Typical PR review: ~$0.10-$0.50 depending on size
- GitHub Actions: Free for public repos, included minutes for private repos
- Recommended: Enable only for important branches or limit to `opened` event only

### Cost Optimization

```yaml
# Only review when PR is opened (not on every push)
on:
  pull_request:
    types: [opened]

# Or only for specific branches
on:
  pull_request:
    branches:
      - main
      - develop
```

## Limitations

- **Context Window**: Large PRs (>100KB diff) may be truncated
- **Rate Limits**: Claude API has rate limits (retries with backoff implemented)
- **Language Support**: Works with all languages, but type safety checks optimized for TypeScript, Python, Go, Rust, Java
- **Comment Format**: Currently posts summary comments (inline comments coming in future version)

## Troubleshooting

### Review Not Posted

**Check:**
1. `ANTHROPIC_API_KEY` is set in repository secrets
2. Workflow has `pull-requests: write` permission
3. Action logs for error messages

### Invalid API Key Error

**Solution:**
- Verify API key is correct in repository secrets
- Check API key is active in Anthropic Console

### Rate Limit Exceeded

**Solution:**
- Wait a few minutes and retry
- Consider reducing review frequency (only on `opened` events)

### No CLAUDE.md Warning

**This is okay!** The reviewer will use general best practices. To get project-specific reviews:
1. Create `CLAUDE.md` in repository root
2. Document your patterns and conventions
3. Commit and push to your branch

## Development

### Local Testing

```bash
# Install dependencies
npm install

# Build the action
npm run build

# Run tests
npm test

# Lint
npm run lint
```

### Testing with `act`

```bash
# Install act: https://github.com/nektos/act
brew install act

# Run action locally
act pull_request -e test/fixtures/pr-event.json
```

## Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT - See LICENSE file

## Related Projects

- [ai-agent-manager](https://github.com/vikashruhil/ai-agent-manager) - Claude Code plugin with 4 specialized agents
- [mcps](https://github.com/vikashruhil/mcps) - MCP servers for Claude Desktop

## Support

- Issues: [GitHub Issues](https://github.com/vikashruhil/github-action-code-reviewer/issues)
- Documentation: [ai-agent-manager docs](https://github.com/vikashruhil/ai-agent-manager)

---

**Generated with the code-reviewer agent from [ai-agent-manager](https://github.com/vikashruhil/ai-agent-manager)**
