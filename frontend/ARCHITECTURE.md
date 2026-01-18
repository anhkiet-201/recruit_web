# Architecture Documentation

## Overview

This project is a Next.js 16 web application built with TypeScript, Tailwind CSS, and `next-intl` for internationalization.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **I18n:** next-intl
- **State Management:** React Context / Hooks
- **Icons:** Lucide React

## Project Structure

### `frontend`

The frontend application logic.

- **`app/`**: Next.js App Router directory.
  - **`[locale]/`**: Dynamic route segment for internationalization. All pages reside here.
  - **`layout.tsx`**: Root layout (defines `<html>`, `<body>`, and global providers).
  - **`not-found.tsx`**: Global 404 handler.
- **`components/`**: Reusable UI components.
  - **`ui/`**: Basic UI primitives (Button, Input, etc.).
- **`proxy.ts`**: Middleware (Proxy) configuration. Handles locale routing and path rewrites. **Must remain named `proxy.ts` for Next.js 16.**
- **`messages/`**: Locale JSON files (`vi.json`, `en.json`, `zh.json`).
- **`models/`**: TypeScript interfaces and types.
- **`services/`**: API interaction logic.
- **`utils/`**: Helper functions.

## Key Conventions

### Routing & I18n

- All pages must be within `app/[locale]/` to support internationalization.
- `proxy.ts` handles the rewriting of URLs (e.g., `/` -> `/vi`).
- Do not use `middleware.ts`; use `proxy.ts`.

### 404 Handling

- **Global 404**: `app/not-found.tsx` handles 404s that occur before locale routing or when no locale matches.
- **Locale 404**: `app/[locale]/not-found.tsx` can be used for 404s within a valid locale context, though `app/not-found.tsx` often serves as a fallback.

### Component Design

- Use `lucide-react` for icons.
- Prefer server components where possible.
- Client components must ensure hydration safety (avoid random IDs in render).

## Data Flow

- **Services**: Encapsulate API calls.
- **Components**: Consume services via `useEffect` (client) or direct async calls (server).

## Building & Deploying

- Standard Next.js build: `npm run build` / `npm start`.
