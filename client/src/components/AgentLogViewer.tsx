import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

export type AgentActionEvent = {
  id: string;
  agentId: string;
  category: "system" | "infra" | "domain" | "trading" | "compute";
  message: string;
  status: "completed" | "failed" | "pending";
  timestamp: string; // ISO
  details?: string;
  autonomous?: boolean;
};

interface ApiResponse {
  events: AgentActionEvent[];
  total: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  system: "#0070f3", // blue
  infra: "#ff6600", // orange
  domain: "#800080", // purple
  compute: "#ffc107", // amber
  trading: "#28a745", // green
};

export const AgentLogViewer: React.FC = () => {
  const [paused, setPaused] = useState(false);
  const [categories, setCategories] = useState<Record<string, boolean>>({
    system: true,
    infra: true,
    domain: true,
    trading: true,
    compute: true,
  });
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScroll = useRef(true);

  const fetchActions = async (): Promise<ApiResponse> => {
    const res = await fetch("/api/agent-actions");
    if (!res.ok) {
      throw new Error(`fetch failed: ${res.status}`);
    }
    return res.json();
  };

  const { data, isFetching } = useQuery<ApiResponse>({
    queryKey: ["agentActions"],
    queryFn: fetchActions,
    refetchInterval: paused ? false : 5000,
    placeholderData: (previousData) => previousData,
  });

  const events = data?.events ?? [];
  const total = data?.total ?? 0;

  const filtered = events
    .filter((e: AgentActionEvent) => categories[e.category])
    .filter((e: AgentActionEvent) => !agentFilter || e.agentId === agentFilter)
    .slice(0, 100);

  useEffect(() => {
    // auto-scroll to top when new events arrive if the user hasn't scrolled away
    if (autoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [filtered]);

  const onScroll = () => {
    if (!scrollRef.current) return;
    // consider we are "at top" if within 10px of scrollTop
    autoScroll.current = scrollRef.current.scrollTop <= 10;
  };

  const toggleExpanded = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    // if user clicked inside the details area, don't toggle
    if ((e.target as HTMLElement).closest("[data-log-details]")) {
      return;
    }
    setExpandedIds((prev: Set<string>) => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const handleCategoryChange = (cat: string) => {
    setCategories((prev: Record<string, boolean>) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const uniqueAgents: string[] = Array.from(
    new Set(events.map((e: AgentActionEvent) => e.agentId).filter(Boolean)),
  ) as string[];

  return (
    <div data-testid="agent-log-viewer" className="agent-log-viewer">
      <div className="log-header" data-testid="log-header">
        <span
          className={`live-indicator ${paused ? "paused" : "live"}`}
          data-testid="live-indicator"
        >
          ●
        </span>
        <span data-testid="live-status">{paused ? "PAUSED" : "LIVE"}</span>
        <button
          onClick={() => setPaused(!paused)}
          data-testid="pause-button"
          className="pause-button"
        >
          {paused ? "Resume" : "Pause"}
        </button>
        {isFetching && !paused && (
          <span className="fetching-indicator" data-testid="fetching">
            ⟳
          </span>
        )}
      </div>

      <div className="filters" data-testid="filters">
        <div className="category-filters" data-testid="category-filters">
          {Object.keys(categories).map((cat) => (
            <label key={cat} className="category-filter">
              <input
                type="checkbox"
                checked={categories[cat]}
                onChange={() => handleCategoryChange(cat)}
                data-testid={`filter-${cat}`}
              />
              {cat}
            </label>
          ))}
        </div>
        {uniqueAgents.length > 0 && (
          <select
            value={agentFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setAgentFilter(e.target.value)}
            data-testid="agent-filter"
          >
            <option value="">All agents</option>
            {uniqueAgents.map((id: string) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        )}
      </div>

      <div
        className="log-container"
        ref={scrollRef}
        onScroll={onScroll}
        data-testid="log-container"
        style={{ maxHeight: 400, overflowY: "auto" }}
      >
        {filtered.map((entry: AgentActionEvent) => (
          <div key={entry.id} className="log-entry" data-testid="log-entry">
            <div
              className="entry-summary"
              onClick={(e) => toggleExpanded(entry.id, e)}
              data-testid="entry-summary"
            >
              <span
                className={`category-icon ${entry.category}`}
                style={{ color: CATEGORY_COLORS[entry.category] }}
                data-testid="category-icon"
              >
                ●
              </span>
              <span className="message" data-testid="message">
                {entry.message}
              </span>
              <span
                className={`status-badge ${entry.status}`}
                data-testid="status-badge"
              >
                {entry.status}
              </span>
              {entry.autonomous && (
                <span
                  className="autonomous-badge"
                  data-testid="autonomous-badge"
                >
                  Autonomous
                </span>
              )}
              <span className="timestamp" data-testid="timestamp">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>
            </div>
            {expandedIds.has(entry.id) && (
              <div
                className="entry-details"
                data-log-details
                data-testid="entry-details"
              >
                <pre>{JSON.stringify(entry, null, 2)}</pre>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div data-testid="empty-state">No events to display</div>
        )}
      </div>

      <div className="log-footer" data-testid="log-footer">
        <span data-testid="entry-count">
          {filtered.length} of {total} events
        </span>
      </div>
      {/* basic styling for the viewer */}
      <style>{`
        .live-indicator.live {
          color: #28a745;
          animation: pulse 1.5s infinite;
        }
        .live-indicator.paused {
          color: #888;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        .category-icon {
          margin-right: 4px;
        }
        .status-badge.completed { color: green; }
        .status-badge.failed { color: red; }
        .status-badge.pending { color: orange; }
        .autonomous-badge { font-style: italic; margin-left: 4px; }
        .log-entry { padding: 4px; border-bottom: 1px solid #eee; }
        .entry-details { background: #f9f9f9; padding: 8px; }
      `}</style>
    </div>
  );
};

export default AgentLogViewer;
