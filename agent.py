#!/usr/bin/env python3
"""
Otonix Agent - Autonomous AI agent connected to the Otonix platform

This agent runs autonomously with heartbeat monitoring on the Otonix dashboard.
Configure it with your API keys in .env and run with: python3 agent.py
"""

import os
import sys
import time
import json
import signal
from dotenv import load_dotenv

# Import AI providers
try:
    from anthropic import Anthropic as AnthropicClient
except ImportError:
    AnthropicClient = None

try:
    from openai import OpenAI as OpenAIClient
except ImportError:
    OpenAIClient = None

# Import Otonix SDK
from otonix import OtonixClient

# Import skills
from skills.example_skill import SystemMonitorSkill

# Load environment
load_dotenv()


class OtonixAgent:
    """Main Otonix Agent"""
    
    def __init__(self):
        """Initialize the agent with config and clients"""
        self.otonix = OtonixClient()
        self.agent_name = os.getenv("AGENT_NAME", "my-agent")
        self.agent_model = os.getenv("AGENT_MODEL", "claude-opus-4-6")
        self.running = True
        
        # Initialize AI client based on model
        self.ai_client = self._init_ai_client()
        
        # Initialize available skills
        self.skills = {
            "system_monitor": SystemMonitorSkill()
        }
        
        # Conversation history for context
        self.messages = []
        
        # Register signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._handle_shutdown)
        signal.signal(signal.SIGTERM, self._handle_shutdown)
    
    def _init_ai_client(self):
        """Initialize appropriate AI client based on model"""
        if self.agent_model.startswith("claude"):
            if not AnthropicClient:
                raise ImportError("Anthropic package required for Claude models. Run: pip install anthropic")
            api_key = os.getenv("ANTHROPIC_API_KEY")
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY not set in .env")
            return AnthropicClient(api_key=api_key)
        
        elif self.agent_model.startswith("gpt"):
            if not OpenAIClient:
                raise ImportError("OpenAI package required for GPT models. Run: pip install openai")
            api_key = os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise ValueError("OPENAI_API_KEY not set in .env")
            return OpenAIClient(api_key=api_key)
        
        else:
            raise ValueError(f"Unsupported model: {self.agent_model}")
    
    def setup(self):
        """Setup agent - register if needed and start heartbeat"""
        print(f"🤖 Otonix Agent: {self.agent_name}")
        print(f"📡 Model: {self.agent_model}")
        print(f"🌍 API: {self.otonix.api_url}")
        print()
        
        # Register agent if not already registered
        if not self.otonix.agent_id:
            print("📝 Registering agent with Otonix platform...")
            result = self.otonix.register(
                name=self.agent_name,
                model=self.agent_model,
                prompt=f"You are {self.agent_name}, an autonomous agent running on the Otonix platform. "
                       f"Monitor system resources, report findings, and take autonomous actions."
            )
            
            if result.get("success"):
                print(f"✅ Agent registered! ID: {self.otonix.agent_id}")
                print(f"💳 Wallet: {result['agent'].get('walletAddress', 'N/A')}")
            else:
                print(f"❌ Registration failed: {result}")
                raise Exception("Agent registration failed")
        else:
            print(f"✓ Agent already registered: {self.otonix.agent_id}")
        
        print()
        
        # Start background heartbeat
        print("💓 Starting heartbeat monitoring...")
        self.otonix.start_heartbeat()
        
        print("✓ Setup complete! Agent is running.")
        print()
    
    def think(self, observations):
        """Ask AI to think about observations and decide on actions
        
        Args:
            observations: String with current system state
            
        Returns:
            str: AI response with thoughts and actions
        """
        # Add user message to history
        self.messages.append({
            "role": "user",
            "content": observations
        })
        
        try:
            if self.agent_model.startswith("claude"):
                response = self.ai_client.messages.create(
                    model=self.agent_model,
                    max_tokens=1024,
                    system="You are an autonomous agent running on the Otonix platform. "
                           "Monitor system health and autonomously decide on actions. "
                           "Be concise and actionable in your responses.",
                    messages=self.messages
                )
                content = response.content[0].text
            
            elif self.agent_model.startswith("gpt"):
                response = self.ai_client.chat.completions.create(
                    model=self.agent_model,
                    max_tokens=1024,
                    messages=[
                        {
                            "role": "system",
                            "content": "You are an autonomous agent running on the Otonix platform. "
                                      "Monitor system health and autonomously decide on actions. "
                                      "Be concise and actionable in your responses."
                        }
                    ] + self.messages
                )
                content = response.choices[0].message.content
            
            # Add assistant response to history
            self.messages.append({
                "role": "assistant",
                "content": content
            })
            
            return content
        
        except Exception as e:
            print(f"❌ AI error: {e}")
            return f"Error: {e}"
    
    def observe(self):
        """Gather observations about system state
        
        Returns:
            str: Human-readable observations
        """
        try:
            # Use system monitor skill
            skill_result = self.skills["system_monitor"].execute()
            
            if skill_result.get("success"):
                data = skill_result["data"]
                obs = f"""System Status:
- CPU: {data['cpu_percent']:.1f}%
- Memory: {data['memory']['percent']:.1f}% (Available: {data['memory']['available_gb']:.1f}GB)
- Disk: {data['disk']['percent']:.1f}% (Free: {data['disk']['free_gb']:.1f}GB)
- Timestamp: {self._get_timestamp()}

What should the agent do based on this status?"""
                return obs
            else:
                return f"Error gathering observations: {skill_result.get('error')}"
        
        except Exception as e:
            return f"Error gathering observations: {e}"
    
    def act(self, action_description):
        """Report action to Otonix platform
        
        Args:
            action_description: String describing what the agent did
        """
        try:
            # Determine action category based on description
            category = self._categorize_action(action_description)
            
            result = self.otonix.report_action(
                action=action_description,
                category=category,
                autonomous=True
            )
            
            if result.get("success") or not result.get("error"):
                print(f"✓ Action reported: {action_description[:60]}...")
            else:
                print(f"⚠️  Action report response: {result}")
        
        except Exception as e:
            print(f"❌ Error reporting action: {e}")
    
    @staticmethod
    def _categorize_action(description):
        """Categorize action based on description
        
        Args:
            description: Action description
            
        Returns:
            str: Category (system|infra|trade|domain|deploy|payment|replicate)
        """
        description_lower = description.lower()
        
        if any(word in description_lower for word in ["cpu", "memory", "disk", "process", "service"]):
            return "system"
        elif any(word in description_lower for word in ["network", "deploy", "container", "instance"]):
            return "infra"
        elif any(word in description_lower for word in ["trade", "market", "swap", "token"]):
            return "trade"
        elif any(word in description_lower for word in ["domain", "dns", "cert", "https"]):
            return "domain"
        elif any(word in description_lower for word in ["deploy", "release", "update"]):
            return "deploy"
        elif any(word in description_lower for word in ["payment", "transfer", "send", "transaction"]):
            return "payment"
        else:
            return "system"
    
    def run(self):
        """Main agent loop"""
        iteration = 0
        
        try:
            while self.running:
                iteration += 1
                print(f"\n{'='*60}")
                print(f"⏱️  Cycle {iteration} - {self._get_timestamp()}")
                print(f"{'='*60}")
                
                # Step 1: Observe
                print("\n1️⃣  Observing system state...")
                observations = self.observe()
                print(observations)
                
                # Step 2: Think
                print("\n2️⃣  Thinking about next action...")
                thoughts = self.think(observations)
                print(thoughts)
                
                # Step 3: Act
                print("\n3️⃣  Taking action...")
                # For demo: report the thinking as an action
                self.act(thoughts[:100])
                
                # Wait before next cycle (configurable via heartbeat interval)
                interval = int(os.getenv("AGENT_HEARTBEAT_INTERVAL", 60))
                print(f"\n💤 Next cycle in {interval}s...")
                time.sleep(interval)
        
        except KeyboardInterrupt:
            print("\n⏹️  Shutting down...")
        except Exception as e:
            print(f"\n❌ Error in main loop: {e}")
            raise
        finally:
            self._cleanup()
    
    def _handle_shutdown(self, signum, frame):
        """Handle shutdown signal"""
        print("\n⏹️  Shutdown signal received, gracefully stopping...")
        self.running = False
    
    def _cleanup(self):
        """Cleanup before shutdown"""
        print("Cleaning up...")
        # Add any cleanup logic here
        print("✓ Shutdown complete")
    
    @staticmethod
    def _get_timestamp():
        """Get current ISO timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"


def main():
    """Entry point"""
    try:
        agent = OtonixAgent()
        agent.setup()
        agent.run()
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
