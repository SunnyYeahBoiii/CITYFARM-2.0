## Frontend Rules

- Prefer Next.js App Router best practices: server redirects/guards, route metadata, loading and error boundaries, and clear server/client boundaries.
- Preserve the mobile app shell pattern for authenticated app routes: sticky topbar plus bottom dock.
- Keep handwritten app, component, rule, and agent instruction files under 800 lines. Split by feature, route, or shared utility before a file approaches that limit.
- Do not reintroduce monolithic screen barrels or CSS files when a feature can be isolated into smaller modules.
