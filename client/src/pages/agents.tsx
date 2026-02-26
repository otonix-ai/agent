import React, { useMemo } from 'react';
import { gql, useQuery } from '@apollo/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AgentLogViewer from '../components/AgentLogViewer';

// GraphQL query for autonomic status including the new renewal fields
const AUTONOMIC_STATUS_QUERY = gql`
  query AutonomicStatus {
    vercelDomainsConfigured
    renewalWindowDays
    renewalCostDefault
    totalRenewalAttempts
    totalRenewalSuccesses
    # other fields may be returned by the server
  }
`;

interface AutonomicStatus {
  vercelDomainsConfigured: boolean;
  renewalWindowDays: number;
  renewalCostDefault: number;
  totalRenewalAttempts: number;
  totalRenewalSuccesses: number;
}

export const AgentsPage: React.FC = () => {
  const { data, loading, error } = useQuery<{ autonomicStatus: AutonomicStatus }>(
    AUTONOMIC_STATUS_QUERY,
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const status = data?.autonomicStatus;

  // query client for log viewer; memoize to avoid recreation on every render
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <div>
        <h1>Agents</h1>
        {status && (
          <div className="autonomic-status-panel">
            <p>Tiers + Self-healing + Domain renewal</p>
            <p>
              Renewals: {status.totalRenewalSuccesses}/{status.totalRenewalAttempts}
            </p>
            <p>Domains: Live/Sim</p>
          </div>
        )}

        {/* real-time log viewer component */}
        <AgentLogViewer />
      </div>
    </QueryClientProvider>
  );
};

export default AgentsPage;
