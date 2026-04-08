# Otaku Dex

Otaku Dex is a clean anime tracker built with Next.js.

I started this just for fun because:
- TV Time felt laggy.
- MyAnimeList felt too crowded with too many things.

So I wanted something faster, focused, and simple to use for daily tracking.

## Features

- Search anime from Jikan (MyAnimeList unofficial API).
- Browse seasonal lists (`Now Airing` and `Upcoming`).
- View anime details, characters, and recommendations.
- Track watch status (plan to watch, watching, completed, etc.).
- Update episode progress.
- Sign in with OAuth (Google and/or GitHub) using NextAuth.
- PWA support (installable app with offline page and service worker).

## Tech Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- NextAuth
- Drizzle ORM
- Neon/PostgreSQL
- Jikan API
- Serwist (PWA)

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Create environment variables

Create a `.env` file in the project root and add:

```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/postgres
AUTH_SECRET=your-random-secret

# Optional OAuth providers
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# Optional: set to 1 for auth debug logs
AUTH_DEBUG=0
```

At least one OAuth provider is recommended for login.

### 3) Run database setup

```bash
npm run db:generate
npm run db:push
```

### 4) Start development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint
- `npm run db:generate` - generate Drizzle migrations
- `npm run db:migrate` - run migrations
- `npm run db:push` - push schema to database
- `npm run pwa:icons` - generate PWA icons

## Why This Exists

This project is intentionally personal and lightweight.
It exists because I wanted:
- better performance than TV Time,
- less clutter than MyAnimeList,
- and a tracker that feels fun to open every day.

## Roadmap

- Add better stats/insights for watched time.
- Improve discover page filters.
- Add import/export support for list backups.

## License

No license file yet. Add one if you plan to open-source it publicly.
