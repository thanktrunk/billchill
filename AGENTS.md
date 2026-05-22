<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# After implementing any change
Run the build to ensure everything is good

Review `tests/e2e/` and create or update E2E test cases to cover the changed or added behaviour. Every user-facing feature must have a corresponding Playwright test.