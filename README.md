# Otonix Agent

Autonomous AI agent template for the [Otonix](https://otonix.tech) sovereign compute platform.

**Dashboard:** https://app.otonix.tech  
**Website:** https://otonix.tech

---

## What is Otonix?

Otonix is a Web4 sovereign compute platform that enables users to run autonomous AI agents on their own infrastructure (VPS) with real-time monitoring, heartbeat tracking, and autonomous action reporting.

Agents register once, run continuously with monitoring, and report actions back to the Otonix dashboard for oversight and control.

---

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/otonix-ai/agent.git && cd agent

# Make setup executable and run
chmod +x setup.sh && ./setup.sh
```

The setup script will:
- Install Python 3, pip, curl, and jq
- Install Python dependencies from requirements.txt
- Create a `.env` file from the template
- Make agent.py executable

### 2. Configure

Edit the `.env` file with your API keys:

```bash
nano .env
```

Required fields:
- `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` (for Claude or GPT models)
- `OTONIX_API_KEY` (get from step 3 below)
- `AGENT_NAME` and `AGENT_MODEL`

### 3. Generate Otonix API Key

```bash
curl -s -X POST https://app.otonix.tech/api/keys/generate \
  -H "Content-Type: application/json" \
  -d '{"name": "my-agent-key"}' | jq .
```

Copy the returned `key` value (starts with `otonix_`) and add it to `.env`:

```env
OTONIX_API_KEY=otonix_xxx
```

### 4. Run Agent

```bash
python3 agent.py
```

On first run, the agent will automatically:
- Register itself with the Otonix platform
- Receive a unique agent ID
- Start the heartbeat monitor
- Enter the autonomous loop

### 5. Monitor on Dashboard

Visit https://app.otonix.tech to see:
- Agent status (online/inactive)
- Last heartbeat timestamp
- Reported actions and history
- Resource usage
- Wallet address for USDC payments

---

## API Reference

All API endpoints are secured with your Otonix API key. Include it in the `X-API-Key` header.

### Generate API Key

Create a new API key for agent authentication.

**Request:**
```bash
POST https://app.otonix.tech/api/keys/generate
Content-Type: application/json
```

**Body:**
```json
{
  "name": "string"
}
```

**Response:**
```json
{
  "id": "uuid",
  "key": "otonix_xxx",
  "name": "string",
  "status": "active"
}
```

---

### Register Agent

Register an agent with the Otonix platform. This creates the agent record and enables monitoring.

**Request:**
```bash
POST https://app.otonix.tech/api/agents/register
Content-Type: application/json
X-API-Key: otonix_xxx
```

**Body:**
```json
{
  "name": "string (required)",
  "model": "string (default: claude-opus-4-6)",
  "vpsIp": "string (optional, auto-detected if omitted)",
  "walletAddress": "string (optional, auto-generated if empty)",
  "genesisPrompt": "string (optional, agent purpose/instructions)",
  "heartbeatInterval": 60
}
```

**Supported Models:**
- `claude-opus-4-6`
- `claude-sonnet-4`
- `gpt-4o`
- `gpt-4.1`
- `gemini-2.5-pro`
- `deepseek-r1`
- `custom`

**Response:**
```json
{
  "success": true,
  "agent": {
    "id": "uuid",
    "name": "string",
    "status": "active",
    "walletAddress": "0x...",
    "createdAt": "ISO timestamp"
  },
  "monitoring": {
    "heartbeatEndpoint": "POST /api/agents/{id}/heartbeat",
    "actionsEndpoint": "POST /api/agents/{id}/actions",
    "statusEndpoint": "GET /api/agents/{id}"
  }
}
```

**Notes:**
- `vpsIp`: Usually auto-detected. Only provide if in special network environment.
- `walletAddress`: For receiving USDC payments on Base chain (chainId 8453). Auto-generated if omitted.
- `genesisPrompt`: Instructions describing the agent's purpose and capabilities.

---

### Send Heartbeat

Keep the agent alive by sending periodic heartbeats. The agent is considered `inactive` if no heartbeat is received for 3× the `heartbeatInterval`.

**Request:**
```bash
POST https://app.otonix.tech/api/agents/{agent_id}/heartbeat
X-API-Key: otonix_xxx
```

**Response:**
```json
{
  "received": true,
  "agentId": "uuid",
  "nextExpected": "ISO timestamp"
}
```

**When to Send:**
- Automatically sent by the agent every `AGENT_HEARTBEAT_INTERVAL` seconds (default: 60)
- The OtonixClient handles this in a background thread
- Customize interval in `.env`: `AGENT_HEARTBEAT_INTERVAL=60`

---

### Report Action

Report actions the agent has taken. This is how the agent communicates its autonomously-decided decisions to the dashboard.

**Request:**
```bash
POST https://app.otonix.tech/api/agents/{agent_id}/actions
Content-Type: application/json
X-API-Key: otonix_xxx
```

**Body:**
```json
{
  "action": "string (required, what agent did)",
  "category": "string (required, see below)",
  "details": "string (optional, additional context)",
  "autonomous": true
}
```

**Action Categories:**
- `system` - System resource monitoring, process management
- `infra` - Infrastructure operations, deployment
- `trade` - DeFi trading, market operations
- `domain` - Domain and network management
- `deploy` - Code deployment and updates
- `payment` - USDC transfers and transactions
- `replicate` - Model replication and training

**Response:**
```json
{
  "success": true,
  "action_id": "uuid",
  "timestamp": "ISO timestamp"
}
```

**Example:**
```bash
curl -s -X POST https://app.otonix.tech/api/agents/agent-123/actions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: otonix_xxx" \
  -d '{
    "action": "Detected high CPU usage (95%), initiated graceful service restart",
    "category": "system",
    "details": "CPU spike lasted 5 minutes, restarted web service",
    "autonomous": true
  }' | jq .
```

---

### Check Agent Status

Get the current status of your agent, including credits, survival tier, and last heartbeat.

**Request:**
```bash
GET https://app.otonix.tech/api/agents/{agent_id}
X-API-Key: otonix_xxx
```

**Response:**
```json
{
  "id": "uuid",
  "name": "string",
  "status": "active|inactive|error",
  "model": "string",
  "vpsIp": "0.0.0.0",
  "walletAddress": "0x...",
  "credits": 100.50,
  "survivalTier": "standard",
  "lastHeartbeat": "ISO timestamp",
  "actionsCount": 42,
  "createdAt": "ISO timestamp"
}
```

**Status Meanings:**
- `active` - Agent has sent heartbeat within expected interval
- `inactive` - No heartbeat received for 3× heartbeatInterval
- `error` - Agent reported an error

---

## File Structure

```
otonix-agent/
├── agent.py                 # Main agent runner
├── otonix.py               # Otonix SDK client
├── setup.sh                # Installation script
├── requirements.txt        # Python dependencies
├── config.example.env      # Environment template
├── README.md               # This file
├── LICENSE                 # MIT License
└── skills/
    └── example_skill.py    # Skill template
```

---

## Creating Custom Skills

Skills are reusable capabilities the agent can use. Create custom skills by extending the `Skill` base pattern:

```python
# skills/my_skill.py

class MySkill:
    name = "my_skill"
    description = "What this skill does"
    
    def execute(self, **kwargs):
        """Execute the skill
        
        Returns dict with 'success' boolean and 'data' content:
          {
            "success": true,
            "data": { ... results ... }
          }
        """
        try:
            # Your implementation
            result = do_something()
            return {"success": True, "data": result}
        except Exception as e:
            return {"success": False, "error": str(e)}
```

Then register in `agent.py`:

```python
from skills.my_skill import MySkill

# In OtonixAgent.__init__():
self.skills["my_skill"] = MySkill()

# In agent loop:
result = self.skills["my_skill"].execute()
```

---

## Configuration Reference

### .env Variables

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `ANTHROPIC_API_KEY` | - | If using Claude | Anthropic API key |
| `OPENAI_API_KEY` | - | If using GPT | OpenAI API key |
| `OTONIX_API_KEY` | - | Yes | Otonix platform API key |
| `OTONIX_AGENT_ID` | - | (auto) | Set automatically after registration |
| `OTONIX_API_URL` | https://app.otonix.tech | No | Otonix API endpoint |
| `AGENT_NAME` | my-agent | No | Display name on dashboard |
| `AGENT_MODEL` | claude-opus-4-6 | No | AI model to use |
| `AGENT_HEARTBEAT_INTERVAL` | 60 | No | Seconds between heartbeats |

---

## Supported LLM Models

The agent can use any of these models via environment configuration:

### Anthropic (Claude)
- `claude-opus-4-6` - Latest Claude 3.5 Opus (fastest/cheapest)
- `claude-sonnet-4` - Claude 3.5 Sonnet (balanced)

### OpenAI (GPT)
- `gpt-4o` - GPT-4 Omni (latest)
- `gpt-4.1` - GPT-4 Turbo

### Other
- `gemini-2.5-pro` - Google Gemini (requires GOOGLE_API_KEY)
- `deepseek-r1` - DeepSeek R1 (requires DEEPSEEK_API_KEY)
- `custom` - Custom model endpoint

To use a model, set `AGENT_MODEL` in `.env` and ensure the corresponding API key is configured.

---

## Troubleshooting

### Agent doesn't start
```bash
# Check Python installation
python3 --version

# Check dependencies
pip list | grep -E "anthropic|openai|requests|python-dotenv|psutil"

# Reinstall if needed
pip install -r requirements.txt
```

### "API key not configured" error
```bash
# Verify .env file exists and has correct keys
cat .env

# Check that config.example.env has been copied to .env
cp config.example.env .env
nano .env  # Edit with your keys
```

### "Agent not registered" error
- The agent auto-registers on first run
- If manual registration is needed:
  ```bash
  curl -s https://app.otonix.tech/api/agents/register \
    -X POST \
    -H "X-API-Key: $OTONIX_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"name": "my-agent", "model": "claude-opus-4-6"}'
  ```

### Heartbeat failures
- Check network connectivity: `curl https://app.otonix.tech`
- Verify `OTONIX_API_KEY` is correct
- Check that AGENT_ID was saved: `grep OTONIX_AGENT_ID .env`
- Verify the endpoint: logs should show heartbeat being sent every N seconds

### High resource usage
- Reduce `AGENT_HEARTBEAT_INTERVAL` if too frequent
- Limit AI context window by managing `self.messages` history
- Use a smaller/faster model like `claude-sonnet-4`

---

## Security

### Best Practices

1. **API Keys**: Never commit `.env` to git. Add to `.gitignore`
   ```bash
   echo ".env" >> .gitignore
   ```

2. **VPS Access**: Restrict SSH access with firewall rules
   ```bash
   sudo ufw allow ssh
   sudo ufw allow 8443  # If using agent API
   sudo ufw enable
   ```

3. **Key Rotation**: Periodically rotate API keys via the dashboard

4. **Monitoring**: Check dashboard regularly for suspicious activity

### .env Safety

```bash
# Secure .env file permissions
chmod 600 .env

# Prevent accidental commits
git rm --cached .env
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Secure .env"
```

---

## Wallet & Payments

Each agent receives a wallet address for receiving USDC payments on **Base chain** (chainId 8453).

### Receiving Payments

Payments to your agent's wallet are tracked on the dashboard. The agent can:
- Check account balance via API
- Approve transactions via private key (advanced)
- Report payment actions to Otonix

### Example Payment Action Report

```python
client.report_action(
    action="Received 100 USDC payment for compute resources",
    category="payment",
    details="Transaction: 0x...",
    autonomous=False
)
```

---

## Development & Customization

### Adding Debug Logging

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# In agent.py
logger.debug(f"Observations: {observations}")
logger.info(f"Action taken: {action}")
```

### Testing Locally

```bash
# Test OtonixClient without registration
python3 -c "from otonix import OtonixClient; c = OtonixClient(); print(c.status())"

# Test AI integration
python3 agent.py  # Runs full agent loop

# Test specific skill
python3 -c "from skills.example_skill import SystemMonitorSkill; s = SystemMonitorSkill(); print(s.execute())"
```

### Running in Background (Production)

```bash
# Using nohup
nohup python3 agent.py > agent.log 2>&1 &

# Using systemd (recommended)
# Create /etc/systemd/system/otonix-agent.service:
[Unit]
Description=Otonix Agent
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/agent
ExecStart=/usr/bin/python3 /home/ubuntu/agent/agent.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target

# Then:
sudo systemctl enable otonix-agent
sudo systemctl start otonix-agent
sudo systemctl status otonix-agent
```

---

## Performance Metrics

On a typical VPS (2 vCPU, 4GB RAM):
- **Memory**: ~50-100MB idle
- **CPU**: <1% per heartbeat
- **Network**: ~1KB per heartbeat, ~50KB per action report
- **Latency**: <100ms for API calls

---

## Support & Community

- **Dashboard**: https://app.otonix.tech
- **Website**: https://otonix.tech
- **GitHub**: https://github.com/otonix-ai/agent
- **Docs**: https://docs.otonix.tech
- **Discord**: https://discord.gg/otonix

---

## License

MIT License - See LICENSE file for details

---

## Roadmap

Upcoming features:
- [ ] Web UI for agent management
- [ ] Multi-agent orchestration
- [ ] Advanced skill marketplace
- [ ] GPU acceleration support
- [ ] Advanced model fine-tuning

---

**Built for Web4 sovereign compute.** Run your agent, own your data.