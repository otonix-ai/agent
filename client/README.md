# Otonix Agent Dashboard Client

Real-time monitoring dashboard for autonomous agent actions, built with **Next.js** and **TanStack Query**.

## Setup

### Prerequisites
- Node.js v18+ 
- npm or yarn

### Installation

```bash
cd client
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build & Production

Build for production:

```bash
npm run build
npm start
```

## Configuration

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your backend URLs:
- `NEXT_PUBLIC_GRAPHQL_URL` — Apollo GraphQL endpoint
- `NEXT_PUBLIC_API_URL` — REST API base URL

## Features

### Real-time Agent Log Viewer (v1.4.0)

The **Agents** page displays a live feed of all autonomous agent actions:

- **Live Feed**: Auto-refreshes every 5 seconds
- **Filtering**: Filter by category (system, infra, domain, trading, compute) or specific agent
- **Pause/Resume**: Toggle live polling without leaving the page
- **Expandable Details**: Click any entry to reveal full JSON, action ID, and timestamp
- **Smart Auto-Scroll**: New events appear at top; scroll position preserved when reading older entries
- **Status Badges**: Visual indicators for completed (green), failed (red), pending (amber)
- **Autonomous Badge**: Highlights autonomic engine-triggered actions

### Technical Details

- **TanStack Query**: Handles polling and caching with `refetchInterval`
- **Apollo Client**: GraphQL client for autonomic status queries
- **TypeScript**: Full type safety for React components
- **Next.js**: Server-side rendering, API routes, and file-based routing

## Project Structure

```
client/
├── src/
│   ├── components/
│   │   └── AgentLogViewer.tsx       # Real-time log viewer component
│   │   └── ...
│   └── pages/
│       ├── _app.tsx                 # Apollo Client provider setup
│       ├── agents.tsx              # Agents dashboard page
│       └── ...
├── package.json
├── tsconfig.json                   # TypeScript configuration
├── next.config.js                  # Next.js configuration
├── .eslintrc.json                  # ESLint configuration
└── .env.example                    # Environment variables template
```

## Testing

Run type checking:

```bash
npm run type-check
```

Run linter:

```bash
npm run lint
```

All components include comprehensive `data-testid` attributes for end-to-end testing.

## License

Proprietary — Part of the Otonix Agent Platform
