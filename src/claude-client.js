const Anthropic = require('@anthropic-ai/sdk');
const core = require('@actions/core');

class ClaudeClient {
  constructor(apiKey, model = 'claude-sonnet-4-5-20250929') {
    this.client = new Anthropic({
      apiKey: apiKey,
    });
    this.model = model;
  }

  /**
   * Review code using Claude AI with the code-reviewer agent prompt
   * @param {Object} params
   * @param {string} params.agentPrompt - The code-reviewer.md prompt (HOW to review)
   * @param {string} params.projectContext - The project's CLAUDE.md (WHAT patterns to check)
   * @param {string} params.prDiff - The PR diff to review
   * @param {Object} params.prMetadata - PR metadata (title, description, files changed)
   * @returns {Promise<string>} The review response from Claude
   */
  async reviewCode({ agentPrompt, projectContext, prDiff, prMetadata }) {
    try {
      core.info('Sending code review request to Claude API...');

      // Construct the full prompt
      const userPrompt = this.constructReviewPrompt({
        projectContext,
        prDiff,
        prMetadata,
      });

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 8000,
        temperature: 0.2, // Lower temperature for more consistent reviews
        system: agentPrompt, // Use code-reviewer.md as system prompt
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const reviewText = response.content[0].text;
      core.info('Review completed successfully');

      return reviewText;
    } catch (error) {
      if (error.status === 429) {
        core.error('Rate limit exceeded. Please try again later.');
        throw new Error('Claude API rate limit exceeded');
      } else if (error.status === 401) {
        core.error('Invalid Anthropic API key');
        throw new Error('Invalid Anthropic API key');
      } else {
        core.error(`Claude API error: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Construct the user prompt with project context and PR diff
   * @private
   */
  constructReviewPrompt({ projectContext, prDiff, prMetadata }) {
    return `## Code Review Request

**PR Title:** ${prMetadata.title}
**PR Description:** ${prMetadata.description || 'No description provided'}
**Files Changed:** ${prMetadata.filesChanged}

## Project Context (CLAUDE.md)

${projectContext}

## Code Changes to Review

${prDiff}

---

Please review this PR following the code-reviewer agent guidelines. Provide:
1. **Context Read** - What patterns you understand from CLAUDE.md
2. **Current State** - Assessment of the code changes
3. **Strengths** - What's good about this PR
4. **Issues Found** - Categorized by severity (BLOCKING, HIGH, MEDIUM, SUGGESTION)
5. **Suggested Fixes** - Specific code examples for each issue
6. **Pattern Proposals** - Any new patterns detected for CLAUDE.md
7. **Next Steps** - What should be done before merge

Format the output in clear, structured Markdown suitable for posting as a GitHub PR comment.`;
  }

  /**
   * Parse the review response to extract key metrics
   * @param {string} reviewText - The review response from Claude
   * @returns {Object} Parsed metrics { blockingCount, highCount, mediumCount, totalIssues }
   */
  parseReviewMetrics(reviewText) {
    const blockingCount = (reviewText.match(/#### BLOCKING/gi) || []).length;
    const highCount = (reviewText.match(/#### HIGH/gi) || []).length;
    const mediumCount = (reviewText.match(/#### MEDIUM/gi) || []).length;

    return {
      blockingCount,
      highCount,
      mediumCount,
      totalIssues: blockingCount + highCount + mediumCount,
    };
  }
}

module.exports = ClaudeClient;
