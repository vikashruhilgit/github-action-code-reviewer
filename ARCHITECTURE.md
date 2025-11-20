# Architecture Documentation

This document explains how the Ruhil AI Code Reviewer  GitHub Action works internally.

## Overview

The action integrates the code-reviewer agent from [ai-agent-manager](https://github.com/vikashruhil/ai-agent-manager) with GitHub's PR workflow, enabling automated code reviews using Claude AI.

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   PR Event (opened/updated)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              GitHub Actions Workflow Triggers                │
│         (.github/workflows/code-reviewer.yml)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Action Initialization                      │
│  - Load inputs (API keys, config)                           │
│  - Initialize GitHub client                                  │
│  - Initialize Claude client                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Load Code-Reviewer Agent Prompt                 │
│  - Read prompts/code-reviewer.md (bundled)                  │
│  - This defines HOW to review code                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Fetch Project Context                        │
│  - Read CLAUDE.md from PR branch (if exists)                │
│  - This defines WHAT patterns to check                      │
│  - Fallback to default patterns if not found                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Get PR Information                         │
│  - PR metadata (title, description, files changed)          │
│  - PR diff (changed files with patches)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Call Claude API for Review                   │
│  System Prompt: code-reviewer.md (agent logic)              │
│  User Prompt:                                                │
│    - Project context (CLAUDE.md)                            │
│    - PR metadata                                             │
│    - Code diff                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Parse Review Response                         │
│  - Extract issue counts (BLOCKING, HIGH, MEDIUM)            │
│  - Format as structured output                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Post Review Comment on PR                     │
│  - Summary section with issue counts                        │
│  - Full review body (strengths, issues, fixes)              │
│  - Footer with attribution                                   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Set Action Outputs                         │
│  - review_posted: true/false                                │
│  - issues_found: total count                                │
│  - blocking_issues: blocking count                          │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Main Entry Point (`src/main.js`)

**Responsibilities:**
- Parse action inputs
- Coordinate workflow between GitHub and Claude clients
- Handle errors and set outputs
- Load agent prompt from bundled file
- Orchestrate the review process

**Key Functions:**
- `run()` - Main execution function

### 2. Claude Client (`src/claude-client.js`)

**Responsibilities:**
- Communicate with Anthropic API
- Construct review prompts
- Parse review responses
- Extract metrics (issue counts)
- Handle API errors and rate limits

**Key Functions:**
- `reviewCode({ agentPrompt, projectContext, prDiff, prMetadata })` - Main review function
- `constructReviewPrompt()` - Build user prompt with context
- `parseReviewMetrics(reviewText)` - Extract issue counts

**API Usage:**
- Model: `claude-sonnet-4-5-20250929` (default, configurable)
- Temperature: `0.2` (low for consistency)
- Max tokens: `8000`
- System prompt: code-reviewer.md (agent logic)
- User prompt: Project context + PR diff

### 3. GitHub Client (`src/github-client.js`)

**Responsibilities:**
- Interact with GitHub API
- Fetch PR metadata
- Get PR diff
- Read files from PR branch (CLAUDE.md)
- Post review comments

**Key Functions:**
- `getPRMetadata()` - Get PR details (title, description, files changed)
- `getPRDiff()` - Get file changes with patches
- `getFileFromPR(filePath)` - Read specific file from PR branch
- `postReviewComment(reviewBody, metrics)` - Post formatted comment
- `formatReviewComment()` - Add header/footer/summary

**GitHub API Usage:**
- `pulls.get` - Get PR metadata
- `pulls.listFiles` - Get changed files with patches
- `repos.getContent` - Read CLAUDE.md from PR branch
- `issues.createComment` - Post review comment

### 4. Agent Prompt (`prompts/code-reviewer.md`)

**Purpose:** Defines the agent's behavior and review logic

**Copied from:** `ai-agent-manager-plugin/agents/code-reviewer.md`

**Contains:**
- Role definition (Code Reviewer)
- Review checklist (security, type safety, patterns, tests)
- Output format (Context Read → Strengths → Issues → Fixes → Proposals)
- Severity levels (BLOCKING, HIGH, MEDIUM, SUGGESTION)
- Quality standards

**Bundled:** Included in `dist/` during build, loaded at runtime

## Data Flow

### Input Data

1. **From GitHub Action Inputs:**
   - `anthropic_api_key` (required)
   - `github_token` (required)
   - `model` (optional, default: claude-sonnet-4-5-20250929)
   - `review_on` (optional, default: opened,synchronize)

2. **From GitHub Context:**
   - Repository owner/name
   - PR number
   - PR head/base SHA

3. **From PR Branch:**
   - CLAUDE.md (project patterns)
   - Changed files (diff)

### Output Data

1. **To PR Comment:**
   - Formatted review (summary + full review body)

2. **Action Outputs:**
   - `review_posted` (boolean)
   - `issues_found` (number)
   - `blocking_issues` (number)

## Build Process

The action uses `@vercel/ncc` to bundle all dependencies into a single `dist/index.js` file:

```bash
ncc build src/main.js -o dist --source-map --license licenses.txt
```

**What gets bundled:**
- `src/main.js`, `src/claude-client.js`, `src/github-client.js`
- All `node_modules/` dependencies
- `prompts/code-reviewer.md` (copied to dist/)

**Output:**
- `dist/index.js` - Bundled action code
- `dist/code-reviewer.md` - Agent prompt
- `dist/licenses.txt` - License information
- `dist/index.js.map` - Source map

## Error Handling

### Claude API Errors

| Error | Handling |
|-------|----------|
| 401 (Invalid API Key) | Fail action with clear message |
| 429 (Rate Limit) | Retry with exponential backoff (not yet implemented) |
| Other errors | Log and fail with error message |

### GitHub API Errors

| Error | Handling |
|-------|----------|
| 404 (CLAUDE.md not found) | Use default patterns, continue |
| 404 (PR not found) | Fail action |
| Permission errors | Fail with permission guidance |
| Other errors | Log and fail with error message |

### Edge Cases

| Case | Handling |
|------|----------|
| Very large PR diff (>100KB) | Warning logged, may truncate (future) |
| No changed files | Skip review |
| Draft PR | Review anyway (configurable in workflow) |
| Empty CLAUDE.md | Use default patterns |

## Security Considerations

### Secrets Handling
- API keys passed via GitHub Secrets
- Never logged or exposed in outputs
- Used only for API calls

### Input Validation
- API keys validated by Claude API (401 on invalid)
- File paths validated (prevent path traversal)
- PR data from trusted GitHub API

### Permissions
- `contents: read` - Read repository files
- `pull-requests: write` - Post PR comments

### Rate Limiting
- Claude API has rate limits (plan-dependent)
- Action respects limits (TODO: implement backoff)
- Recommended: Limit to important branches

## Performance

### Typical PR Review Times

- Small PR (<10 files, <500 lines): ~10-20 seconds
- Medium PR (10-30 files, 500-2000 lines): ~20-40 seconds
- Large PR (>30 files, >2000 lines): ~40-60 seconds

**Factors:**
- Claude API latency (~5-15 seconds)
- GitHub API calls (~2-5 seconds)
- Network conditions

### Cost Estimates

**Claude API:**
- Input tokens: ~1000-5000 per PR (agent prompt + context + diff)
- Output tokens: ~2000-4000 per PR (review response)
- Cost: ~$0.10-$0.50 per PR review (model-dependent)

**GitHub Actions:**
- Free for public repositories
- Included minutes for private repositories (plan-dependent)
- ~1-2 minutes per review

## Future Enhancements

### Planned Features
1. **Inline comments** - Post comments on specific lines (not just summary)
2. **Incremental reviews** - Only review new commits (not entire PR)
3. **Custom severity thresholds** - Configurable blocking criteria
4. **Multi-file batching** - Review files in batches for large PRs
5. **Retry with backoff** - Handle rate limits gracefully
6. **Review caching** - Skip re-reviewing unchanged files

### Extensibility
- Support for custom agent prompts (not just code-reviewer.md)
- Plugin system for additional checks (e.g., license compliance)
- Integration with other CI tools (e.g., test results)

## Testing

### Unit Tests (TODO)
- Test Claude client prompt construction
- Test GitHub client API calls (mocked)
- Test metrics parsing

### Integration Tests (TODO)
- Test with real PR in test repository
- Test error handling (invalid keys, missing files)
- Test edge cases (large PRs, no CLAUDE.md)

### Manual Testing
1. Create test repository
2. Add CLAUDE.md with patterns
3. Create PR with known issues
4. Verify review catches issues
5. Verify comment formatting

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Maintenance

### Keeping Agent Prompt Updated

When `ai-agent-manager-plugin/agents/code-reviewer.md` is updated:

1. Copy new version to `prompts/code-reviewer.md`
2. Test locally
3. Build: `npm run build`
4. Commit and tag new version
5. Push to GitHub

### Dependency Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Test
npm test

# Build
npm run build

# Commit and release
```

## Troubleshooting

See README.md "Troubleshooting" section for common issues.

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [ai-agent-manager](https://github.com/vikashruhil/ai-agent-manager)
- [GitHub REST API](https://docs.github.com/en/rest)

---

**Version:** 1.0.0
**Last Updated:** November 2025
