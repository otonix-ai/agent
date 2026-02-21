import os
import requests
import threading
import time
from dotenv import load_dotenv


class OtonixClient:
    """SDK client for Otonix platform integration"""

    def __init__(self):
        """Initialize Otonix client with configuration from .env"""
        load_dotenv()
        self.api_url = os.getenv("OTONIX_API_URL", "https://app.otonix.tech")
        self.api_key = os.getenv("OTONIX_API_KEY")
        self.agent_id = os.getenv("OTONIX_AGENT_ID")
        self._heartbeat_thread = None

    def generate_key(self, name):
        """Generate new API key
        
        Args:
            name: Name for the API key
            
        Returns:
            dict: {"id": "uuid", "key": "otonix_xxx", "name": "string", "status": "active"}
        """
        r = requests.post(
            f"{self.api_url}/api/keys/generate",
            json={"name": name},
            headers={"Content-Type": "application/json"}
        )
        return r.json()

    def register(self, name, model="claude-opus-4-6", vps_ip=None, wallet=None, prompt=None):
        """Register agent with Otonix platform
        
        Args:
            name: Agent name (required)
            model: LLM model (default: claude-opus-4-6)
            vps_ip: VPS IP address (auto-detected if None)
            wallet: Wallet address (auto-generated if None)
            prompt: Genesis prompt for agent purpose
            
        Returns:
            dict: Agent registration response
        """
        if not vps_ip:
            try:
                vps_ip = requests.get("https://ifconfig.me", timeout=5).text.strip()
            except:
                vps_ip = "0.0.0.0"

        r = requests.post(
            f"{self.api_url}/api/agents/register",
            json={
                "name": name,
                "model": model,
                "vpsIp": vps_ip,
                "walletAddress": wallet,
                "genesisPrompt": prompt,
                "heartbeatInterval": int(os.getenv("AGENT_HEARTBEAT_INTERVAL", 60))
            },
            headers={
                "Content-Type": "application/json",
                "X-API-Key": self.api_key
            }
        )
        data = r.json()
        
        # Save agent ID to .env if registration successful
        if data.get("success"):
            self.agent_id = data["agent"]["id"]
            self._save_env("OTONIX_AGENT_ID", self.agent_id)
        
        return data

    def heartbeat(self):
        """Send single heartbeat to Otonix platform
        
        Returns:
            dict: {"received": true, "agentId": "uuid", "nextExpected": "ISO timestamp"}
        """
        if not self.agent_id:
            return {"error": "Agent not registered"}
        
        r = requests.post(
            f"{self.api_url}/api/agents/{self.agent_id}/heartbeat",
            headers={"X-API-Key": self.api_key}
        )
        return r.json()

    def start_heartbeat(self):
        """Start background heartbeat loop"""
        interval = int(os.getenv("AGENT_HEARTBEAT_INTERVAL", 60))
        
        def loop():
            while True:
                try:
                    self.heartbeat()
                except Exception as e:
                    print(f"Heartbeat error: {e}")
                time.sleep(interval)
        
        self._heartbeat_thread = threading.Thread(target=loop, daemon=True)
        self._heartbeat_thread.start()

    def report_action(self, action, category="system", details="", autonomous=True):
        """Report an action to Otonix dashboard
        
        Args:
            action: What the agent did (required)
            category: Action category (system|infra|trade|domain|deploy|payment|replicate)
            details: Additional context
            autonomous: Whether agent decided on its own
            
        Returns:
            dict: Action report response
        """
        if not self.agent_id:
            return {"error": "Agent not registered"}
        
        r = requests.post(
            f"{self.api_url}/api/agents/{self.agent_id}/actions",
            json={
                "action": action,
                "category": category,
                "details": details,
                "autonomous": autonomous
            },
            headers={
                "Content-Type": "application/json",
                "X-API-Key": self.api_key
            }
        )
        return r.json()

    def status(self):
        """Get agent status from dashboard
        
        Returns:
            dict: Full agent object with status, credits, survivalTier, lastHeartbeat, etc.
        """
        if not self.agent_id:
            return {"error": "Agent not registered"}
        
        r = requests.get(
            f"{self.api_url}/api/agents/{self.agent_id}",
            headers={"X-API-Key": self.api_key}
        )
        return r.json()

    def _save_env(self, key, value):
        """Update .env file with new value
        
        Args:
            key: Environment variable name
            value: Environment variable value
        """
        env_path = os.path.join(os.path.dirname(__file__), ".env")
        lines = []
        found = False
        
        if os.path.exists(env_path):
            with open(env_path, "r") as f:
                for line in f:
                    if line.startswith(f"{key}="):
                        lines.append(f"{key}={value}\n")
                        found = True
                    else:
                        lines.append(line)
        
        if not found:
            lines.append(f"{key}={value}\n")
        
        with open(env_path, "w") as f:
            f.writelines(lines)
