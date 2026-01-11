# Project Instructions

This file provides context and rules for AI coding assistants working on this project.

## Project Overview

Stellar Security Tokens - A blockchain-based security token platform with:
- **Backend**: Node.js/Express API with Prisma ORM, Stellar SDK integration
- **Frontend**: React/TypeScript with Vite, TailwindCSS

---

## Auto-Invoked Skills

### Frontend Design Skill (Auto-Detect)

**When working on any files in `frontend/src/` involving UI components, pages, or styling, automatically apply the `/frontend-design` workflow principles:**

1. **Design Thinking**: Before coding, consider purpose, tone, and what makes it unforgettable
2. **Typography**: Never use generic fonts (Inter, Roboto, Arial). Choose distinctive, characterful fonts
3. **Color**: Cohesive palettes with CSS custom properties. Avoid cliché purple-to-pink gradients
4. **Motion**: High-impact animations at key moments (page load, hover states, transitions)
5. **Spatial Composition**: Embrace asymmetry, overlap, unexpected layouts
6. **Visual Details**: Create atmosphere with gradients, textures, shadows - never solid colors

**Anti-patterns to avoid:**
- Generic Bootstrap/Tailwind default aesthetics
- Cookie-cutter card grids
- Predictable component patterns
- Lack of distinctive character

See `.agent/workflows/frontend-design.md` for full guidelines.

---

## Code Style

### Backend (JavaScript)
- Use ES modules (`import`/`export`)
- Async/await for all async operations
- JSDoc comments for public functions
- Error handling with try/catch and proper logging

### Frontend (TypeScript/React)
- Functional components with hooks
- Type all props and state
- Use React Query for server state
- Tailwind for styling (but make it distinctive, not generic)

---

## Testing

- Backend: Jest with `*.test.js` naming
- Mocked integration tests: `*.mocked.test.js` (for CI)
- Real integration tests: `*.integration.test.js` (for local Stellar testnet)

---

## Key Directories

```
backend/
├── src/
│   ├── routes/       # Express route handlers
│   ├── services/     # Business logic
│   ├── middleware/   # Auth, rate limiting, etc.
│   └── utils/        # Helpers
frontend/
├── src/
│   ├── pages/        # Route pages
│   ├── components/   # Reusable components
│   ├── lib/          # API clients, utilities
│   └── hooks/        # Custom React hooks
```
