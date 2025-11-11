const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const path = require('path');
const ClaudeClient = require('./claude-client');
const GitHubClient = require('./github-client');

async function run() {
  try {
    // Get inputs
    const anthropicApiKey = core.getInput('anthropic_api_key', { required: true });
    const githubToken = core.getInput('github_token', { required: true });
    const model = core.getInput('model') || 'claude-sonnet-4-5-20250929';
    const reviewOn = core.getInput('review_on') || 'opened,synchronize';

    // Check if this event should trigger a review
    const eventAction = github.context.payload.action;
    const shouldReview = reviewOn.split(',').map(s => s.trim()).includes(eventAction);

    if (!shouldReview) {
      core.info(`Skipping review for action: ${eventAction} (only reviewing on: ${reviewOn})`);
      return;
    }

    core.info('Starting AI Code Review...');
    core.info(`Using model: ${model}`);

    // Initialize clients
    const githubClient = new GitHubClient(githubToken);
    const claudeClient = new ClaudeClient(anthropicApiKey, model);

    // 1. Load the agent prompt (bundled code-reviewer.md)
    core.info('Loading code-reviewer agent prompt...');
    const agentPromptPath = path.join(__dirname, '../prompts/code-reviewer.md');

    if (!fs.existsSync(agentPromptPath)) {
      throw new Error(`Agent prompt not found at: ${agentPromptPath}`);
    }

    const agentPrompt = fs.readFileSync(agentPromptPath, 'utf-8');
    core.info('Agent prompt loaded successfully');

    // 2. Get PR metadata
    core.info('Fetching PR metadata...');
    const prMetadata = await githubClient.getPRMetadata();
    core.info(`Reviewing PR #${prMetadata.number}: ${prMetadata.title}`);
    core.info(`Files changed: ${prMetadata.filesChanged}, +${prMetadata.additions} -${prMetadata.deletions}`);

    // 3. Read project's CLAUDE.md from PR branch (if exists)
    core.info('Looking for CLAUDE.md in PR branch...');
    let projectContext = await githubClient.getFileFromPR('CLAUDE.md');

    if (!projectContext) {
      core.warning('CLAUDE.md not found in PR branch, using default patterns');
      projectContext = `# Default Code Review Patterns

No CLAUDE.md found in this repository. The reviewer will use general best practices:

## Quality Standards
- Type safety: Strict type checking
- Testing: ≥80% code coverage
- Security: No secrets in code, validate all inputs
- Performance: Profile before/after for performance-critical changes
- Error handling: Comprehensive error handling with meaningful messages

## Code Style
- Follow language-specific conventions (PEP 8 for Python, ESLint for JavaScript, etc.)
- Clear naming conventions
- DRY principles
- Single responsibility principle

To get project-specific reviews, add a CLAUDE.md file to your repository root with your patterns and conventions.`;
    } else {
      core.info('CLAUDE.md found and loaded');
    }

    // 4. Get PR diff
    core.info('Fetching PR diff...');
    const prDiff = await githubClient.getPRDiff();

    // Check if diff is too large (Claude has context limits)
    const MAX_DIFF_SIZE = 100000; // ~100KB
    if (prDiff.length > MAX_DIFF_SIZE) {
      core.warning(`PR diff is very large (${prDiff.length} chars). Review may be truncated.`);
      // Optionally truncate or handle large diffs
    }

    // 5. Call Claude API to review the code
    core.info('Sending code to Claude for review...');
    const reviewText = await claudeClient.reviewCode({
      agentPrompt,
      projectContext,
      prDiff,
      prMetadata,
    });

    // 6. Parse review metrics
    const metrics = claudeClient.parseReviewMetrics(reviewText);
    core.info(`Review complete: ${metrics.totalIssues} issues found (${metrics.blockingCount} blocking, ${metrics.highCount} high, ${metrics.mediumCount} medium)`);

    // 7. Post review comment on PR
    core.info('Posting review comment on PR...');
    await githubClient.postReviewComment(reviewText, metrics);
    core.info('Review comment posted successfully!');

    // Set outputs
    core.setOutput('review_posted', 'true');
    core.setOutput('issues_found', metrics.totalIssues.toString());
    core.setOutput('blocking_issues', metrics.blockingCount.toString());

    // Fail the action if blocking issues found (optional, can be configured)
    if (metrics.blockingCount > 0) {
      core.warning(`Found ${metrics.blockingCount} BLOCKING issues. Please address before merging.`);
      // Uncomment to fail the action:
      // core.setFailed(`Found ${metrics.blockingCount} BLOCKING issues`);
    }

  } catch (error) {
    core.setFailed(`Action failed: ${error.message}`);
    core.error(error.stack);

    // Set outputs even on failure
    core.setOutput('review_posted', 'false');
    core.setOutput('issues_found', '0');
    core.setOutput('blocking_issues', '0');
  }
}

// Run the action
run();
