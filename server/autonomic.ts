// This is a simplified implementation of the Autonomic Engine's domain auto-renewal
// feature. In the real project these functions would interact with the database and
// other modules; here we provide stubs to satisfy the requested interface.

import * as vercelDomains from "./vercel-domains";

// configuration constants
export const RENEWAL_WINDOW_DAYS = 30;
export const RENEWAL_COST_DEFAULT = 15;

// counters exposed via GET /api/autonomic/status
let totalRenewalAttempts = 0;
let totalRenewalSuccesses = 0;

// internal helpers (stubs for demonstration)
async function fetchDomains(): Promise<Array<any>> {
  // placeholder: should return all domains
  return [];
}

async function fetchAgent(agentId: string): Promise<any | null> {
  // placeholder: lookup agent by id
  return null;
}

async function updateDomain(domain: any): Promise<void> {
  // placeholder: persist domain changes
}

async function deductAgentCredits(agent: any, amount: number): Promise<void> {
  // placeholder: deduct credits
  if (agent) {
    agent.credits = (agent.credits || 0) - amount;
  }
}

async function createAgentAction(agentId: string, details: any): Promise<void> {
  // placeholder: log an action
  console.log("agent action", agentId, details);
}

async function createTransaction(agentId: string, tx: any): Promise<void> {
  // placeholder: record transaction
  console.log("transaction", agentId, tx);
}

// runDomainAutoRenewal will be invoked once per cycle (every 60 seconds)
export async function runDomainAutoRenewal(): Promise<void> {
  const domains = await fetchDomains();

  const now = new Date();
  const windowMs = RENEWAL_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  for (const domain of domains) {
    if (!domain.autoRenew) continue;
    if (domain.status !== "active") continue;
    if (!domain.expiresAt) continue;

    const expires = new Date(domain.expiresAt);
    const age = expires.getTime() - now.getTime();

    // skip domains that expire in more than the window or already expired
    if (age > windowMs || expires < now) continue;

    // only count eligible attempts
    totalRenewalAttempts += 1;

    if (!domain.agentId) {
      console.warn(`domain ${domain.name} has autoRenew but no agentId`);
      continue;
    }

    const agent = await fetchAgent(domain.agentId);
    if (!agent) {
      console.warn(`agent ${domain.agentId} not found for domain ${domain.name}`);
      continue;
    }

    if ((agent.credits || 0) < RENEWAL_COST_DEFAULT) {
      await createAgentAction(agent.id, {
        category: "domain",
        status: "failed",
        message: "insufficient credits for renewal",
      });
      continue;
    }

    if (!vercelDomains.isConfigured()) {
      await createAgentAction(agent.id, {
        category: "domain",
        status: "failed",
        message: "vercel api not configured",
      });
      continue;
    }

    try {
      await vercelDomains.renewDomain(domain.name);
      // success
      domain.expiresAt = new Date(expires.setFullYear(expires.getFullYear() + 1)).toISOString();
      await updateDomain(domain);
      await deductAgentCredits(agent, RENEWAL_COST_DEFAULT);
      await createAgentAction(agent.id, {
        category: "domain",
        status: "completed",
        message: "domain auto-renewed",
      });
      await createTransaction(agent.id, {
        type: "debit",
        amount: RENEWAL_COST_DEFAULT,
        metadata: {
          protocol: "autonomic",
          type: "domain-renewal",
        },
      });
      totalRenewalSuccesses += 1;
    } catch (err: any) {
      await createAgentAction(agent.id, {
        category: "domain",
        status: "failed",
        message: err.message || "renewal failed",
      });
    }
  }
}

// existing cycle functions (stubs)
export async function runSurvivalTierAutomation(): Promise<void> {
  // stub
}
export async function runSelfHealingCheck(): Promise<void> {
  // stub
}

export async function runAutonomicCycle(): Promise<void> {
  await runSurvivalTierAutomation();
  await runSelfHealingCheck();
  await runDomainAutoRenewal();
}

export function getAutonomicStatus(): any {
  return {
    totalRenewalAttempts,
    totalRenewalSuccesses,
    vercelDomainsConfigured: vercelDomains.isConfigured(),
    renewalWindowDays: RENEWAL_WINDOW_DAYS,
    renewalCostDefault: RENEWAL_COST_DEFAULT,
    // other counters could be added here
  };
}
