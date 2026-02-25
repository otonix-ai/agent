// stubbed vercel domains module

export function isConfigured(): boolean {
  // in real code would check for VERCEL_TOKEN or similar env var
  return !!process.env.VERCEL_API_TOKEN;
}

export async function renewDomain(name: string): Promise<void> {
  if (!isConfigured()) {
    throw new Error("Vercel API not configured");
  }
  // placeholder: perform HTTP call to Vercel registrar renew endpoint
  console.log(`renewing domain ${name} via vercel`);
}
