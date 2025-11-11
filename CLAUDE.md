# GitHub Action Code Reviewer

  ## Tech Stack
  - Node.js 20
  - @actions/core, @actions/github
  - @anthropic-ai/sdk
  - @vercel/ncc

  ## Key Patterns

  ### Error Handling
  - All API calls must have try/catch blocks
  - Use core.setFailed() for fatal errors
  - Use core.warning() for non-fatal issues

  ### Security
  - Never log API keys or tokens
  - Validate all inputs
  - Use GitHub Secrets for sensitive data

  ### Code Style
  - ESLint rules enforced
  - Async/await (no callbacks)
  - JSDoc comments for public functions

  ## Quality Standards
  - Type safety: Use JSDoc for type hints
  - Testing: ≥80% coverage
  - Security: No secrets in code
  - Performance: Keep action runtime <2 minutes