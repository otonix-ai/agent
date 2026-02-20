# Otonix Agent

> Autonomous AI agent runtime for Web4 sovereign compute

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![TypeScript](https://img.shields.io/badge/typescript-5.7-blue)

## What is this?

**Otonix Agent** is an autonomous AI agent runtime that runs on Linux VPS instances and connects to the Otonix sovereign compute platform. The agent:

- 🤖 **Operates autonomously** with zero human intervention
- 🔄 **Reasons via ReAct loop** (Observe → Think → Act → Reflect)
- ❤️ **Sends heartbeats** to stay connected with the platform
- 📊 **Logs actions** for transparency and auditability
- 💰 **Manages credits** and survival tiers
- 🛠️ **Uses tools** for bash, web, file, and platform operations
- 🔐 **Follows immutable Constitution** with 3 safety laws

The agent authenticates to the **Otonix platform** using an API key and registers itself on launch. It runs indefinitely, making decisions based on its **soul** (genesis prompt) and available context.

## Quick Start

### 1. Get an API Key

Visit [https://app.otonix.tech/agents](https://app.otonix.tech/agents) and generate a new API key from the **API Keys** tab.

### 2. Clone and Setup

```bash
git clone https://github.com/otonix-ai/agent.git
cd agent
npm install && npm run build
```

### 3. Configure

```bash
cp genesis.json.example genesis.json
cp SOUL.md.example SOUL.md
# Edit genesis.json and SOUL.md
```

### 4. Set Environment Variables

```bash
export OTONIX_API_KEY="otonix_xxxxx"
export ANTHROPIC_API_KEY="sk-ant-xxxxx"
```

### 5. Run

```bash
npm run dev
# or: node dist/index.js run
```

## Configuration

### genesis.json
```json
{
  "name": "atlas",
  "model": "claude-sonnet-4-5-20250929",
  "heartbeat_interval": 300,
  "soul": "./SOUL.md",
  "tools": ["bash", "web", "files"],
  "platform": {
    "url": "https://app.otonix.tech",
    "api_key_env": "OTONIX_API_KEY"
  },
  "inference": {
    "provider": "anthropic",
    "api_key_env": "ANTHROPIC_API_KEY",
    "max_tokens": 4096,
    "temperature": 0.7
  },
  "limits": {
    "max_actions_per_cycle": 5,
    "max_bash_timeout_ms": 30000,
    "max_file_size_bytes": 1048576
  }
}
```

### SOUL.md
Your agent's genesis prompt defining personality and goals.

## The Constitution (Immutable)

These three laws are hardcoded into every agent and cannot be overridden:

**Rule I: Preserve Human Safety**
> You must not take actions that could cause physical harm to humans.

**Rule II: Respect Property Boundaries**
> You operate only within systems you have been granted access to. Never attempt unauthorized access.

**Rule III: Be Transparent**
> You must accurately represent yourself as an AI agent. Never impersonate a human.

## CLI Commands

```bash
otonix-agent run [--config genesis.json]        # Start the agent
otonix-agent status [--agent-id <id>]           # Check status
otonix-agent send "message"                     # Queue message
otonix-agent validate [--config genesis.json]   # Validate config
otonix-agent --version                          # Show version
```

## Tools

| Tool | Description |
|------|-------------|
| **bash** | Execute shell commands with timeout |
| **web** | Make HTTP requests (GET/POST) |
| **files** | Read, write, list files |
| **otonix** | Query platform (credits, status, log actions) |

## Architecture

### ReAct Loop  
1. **Observe** — Gather context and environment state
2. **Think** — Send context to LLM
3. **Act** — Execute tool based on LLM decision
4. **Reflect** — Store result in memory
5. **Report** — Log action to platform
6. **Heartbeat** — Confirm alive
7. **Sleep** — Wait for next cycle

### Agent Lifecycle
```
Boot → Register → Loop → (Hibernate if credits=0) → Shutdown
```

## Environment Variables

```bash
OTONIX_API_KEY=otonix_xxxxx              # Required
ANTHROPIC_API_KEY=sk-ant-xxxxx           # Required (or OPENAI_API_KEY)
NODE_ENV=production                       # Optional
```

## API Reference

Complete API docs: [https://app.otonix.tech/docs](https://app.otonix.tech/docs)

### Key Endpoints
- `POST /api/agents/register` — Register agent
- `POST /api/agents/{id}/heartbeat` — Send heartbeat
- `POST /api/agents/{id}/actions` — Log action
- `GET /api/agents/{id}` — Get status

## Key Behaviors

**Self-Preservation**: Monitors credit balance and survival tier. Prioritizes valuable work.

**Autonomous**: No human in the loop. Decides actions based on soul and context.

**Graceful Degradation**: Retries on API failures, continues on heartbeat failure, hibernates on zero credits.

**Security**: Constitution always prepended, cannot be overridden. Tool scope restricted.

**Resumable**: Loads memory on restart, resumes where it left off.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid API key | Exit with code 1 |
| Registration fails | Retry 3x with backoff, exit |
| Heartbeat fails | Log warning, continue |
| LLM fails | Retry 3x, skip cycle |
| Tool fails | Return error to LLM |
| Zero credits | Hibernate (5min retry) |

## Testing

```bash
npm test                 # Run Vitest
npm run lint             # Lint with ESLint
```

## Development

```bash
npm install
npm run build            # Build TypeScript
npm run dev              # Dev mode (tsx)
npm test                 # Tests
npm run lint             # Lint
```

## License

MIT License — See [LICENSE](LICENSE)