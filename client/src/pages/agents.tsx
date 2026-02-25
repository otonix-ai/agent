import React from 'react';
import { gql, useQuery } from '@apollo/client';

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

  return (
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
    </div>
  );
};

export default AgentsPage;
