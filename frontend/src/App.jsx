
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
} from "@xyflow/react";
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  RefreshCw,
  Laptop,
  UserRound,
  Globe,
  Network,
  Search,
  AlertTriangle,
  CheckCircle2,
  Database,
  ArrowUpRight,
  Fingerprint,
  Sparkles,
  BrainCircuit,
  Clock,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  GitBranch,
  Route,
  Info,
} from "lucide-react";

import "@xyflow/react/dist/style.css";
import "./App.css";

const API_URL = "http://127.0.0.1:5050/api";

const panelStyle = {
  background: "#101827",
  border: "1px solid #263449",
  borderRadius: "12px",
  padding: "18px",
  marginTop: "18px",
  color: "#e5edf8",
};

const mutedStyle = {
  color: "#94a3b8",
  fontSize: "13px",
  lineHeight: 1.6,
};

function GraphNode({ data }) {
  const Icon = data.icon || Network;

  return (
    <div className={`graph-node ${data.tone || "blue"}`}>
      <Handle type="target" position={Position.Left} />

      <div className="graph-node-icon">
        <Icon size={20} />
      </div>

      <div className="graph-node-text">
        <strong>{data.label}</strong>
        <span>{data.subtitle}</span>
      </div>

      {data.status && (
        <span className={`node-status ${data.statusTone || ""}`}>
          {data.status}
        </span>
      )}

      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = { graphNode: GraphNode };

function StatCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={21} />
      </div>
      <div className="stat-content">
        <span className="stat-label">{label}</span>
        <strong>{value}</strong>
        <span className="stat-detail">{detail}</span>
      </div>
    </div>
  );
}

function SeverityBadge({ severity }) {
  const value = String(severity || "info").toLowerCase();

  const colors = {
    high: { color: "#fda4af", background: "#451b29" },
    medium: { color: "#fcd34d", background: "#422d14" },
    low: { color: "#86efac", background: "#123528" },
    info: { color: "#93c5fd", background: "#172e4b" },
  };

  const style = colors[value] || colors.info;

  return (
    <span
      style={{
        ...style,
        display: "inline-block",
        padding: "4px 9px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {value}
    </span>
  );
}

function formatNodeLabel(value) {
  if (typeof value !== "string") return String(value ?? "Unknown");

  const separator = value.indexOf(":");
  return separator >= 0 ? value.slice(separator + 1) : value;
}

function getNodeKind(value) {
  if (typeof value !== "string") return "Entity";

  const separator = value.indexOf(":");
  return separator >= 0 ? value.slice(0, separator) : "Entity";
}

function EvidencePaths({ evidence, eventId }) {
  const [showAll, setShowAll] = useState(false);

  const paths = Array.isArray(evidence) ? evidence : [];

  const uniqueEvents = [
    ...new Set(
      paths
        .map((item) => item.connected_event)
        .filter(Boolean)
    ),
  ];

  const visiblePaths = showAll ? paths : paths.slice(0, 4);

  if (!paths.length) {
    return (
      <div
        style={{
          padding: "16px",
          border: "1px dashed #344258",
          borderRadius: "9px",
          color: "#94a3b8",
          fontSize: "13px",
        }}
      >
        No multi-hop evidence paths were returned for this event.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "14px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: "10px",
        }}
      >
        <div
          style={{
            background: "#151f31",
            border: "1px solid #29364b",
            borderRadius: "9px",
            padding: "13px",
          }}
        >
          <div style={{ ...mutedStyle, fontSize: "11px" }}>
            UNIQUE CONNECTED EVENTS
          </div>
          <strong style={{ display: "block", fontSize: "25px", marginTop: "4px" }}>
            {uniqueEvents.length}
          </strong>
        </div>

        <div
          style={{
            background: "#151f31",
            border: "1px solid #29364b",
            borderRadius: "9px",
            padding: "13px",
          }}
        >
          <div style={{ ...mutedStyle, fontSize: "11px" }}>
            EVIDENCE PATHS
          </div>
          <strong style={{ display: "block", fontSize: "25px", marginTop: "4px" }}>
            {paths.length}
          </strong>
        </div>
      </div>

      <div style={{ ...mutedStyle, display: "flex", gap: "7px", alignItems: "flex-start" }}>
        <Info size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
        Multiple paths can lead to the same event. Each path below shows
        a separate relationship chain, not a separate incident.
      </div>

      {visiblePaths.map((item, index) => {
        const pathNodes = Array.isArray(item.path) ? item.path : [];
        const relationships = Array.isArray(item.relationships)
          ? item.relationships
          : [];

        return (
          <div
            key={`${item.connected_event || "event"}-${index}-${pathNodes.join("|")}`}
            style={{
              padding: "14px",
              border: "1px solid #29364b",
              borderRadius: "10px",
              background: "#131d2c",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              <strong style={{ fontSize: "13px" }}>
                Path {index + 1}
              </strong>

              <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
                <span
                  style={{
                    color: "#a5b4fc",
                    background: "#20234a",
                    padding: "4px 8px",
                    borderRadius: "20px",
                    fontSize: "11px",
                  }}
                >
                  {item.hops ?? relationships.length} hops
                </span>

                <SeverityBadge
                  severity={
                    item.connected_status === "suspicious" ? "high" : "info"
                  }
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "7px",
                marginBottom: "12px",
              }}
            >
              {pathNodes.map((node, nodeIndex) => {
                const kind = getNodeKind(node);
                const label = formatNodeLabel(node);

                const tone =
                  kind === "LoginEvent"
                    ? "#5b2535"
                    : kind === "Device"
                      ? "#173653"
                      : kind === "User"
                        ? "#302653"
                        : "#5a3b1b";

                const color =
                  kind === "LoginEvent"
                    ? "#fda4af"
                    : kind === "Device"
                      ? "#93c5fd"
                      : kind === "User"
                        ? "#c4b5fd"
                        : "#fcd34d";

                return (
                  <div
                    key={`${node}-${nodeIndex}`}
                    style={{
                      display: "contents",
                    }}
                  >
                    <span
                      title={node}
                      style={{
                        background: tone,
                        color,
                        border: "1px solid #3a475d",
                        padding: "7px 9px",
                        borderRadius: "7px",
                        fontSize: "12px",
                        fontWeight: 650,
                        overflowWrap: "anywhere",
                        maxWidth: "100%",
                      }}
                    >
                      <span style={{ display: "block", fontSize: "9px", opacity: 0.8, marginBottom: "2px" }}>
                        {kind}
                      </span>
                      {label}
                    </span>

                    {nodeIndex < pathNodes.length - 1 && (
                      <ArrowUpRight
                        size={15}
                        color="#64748b"
                        style={{ flexShrink: 0 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ borderTop: "1px solid #29364b", paddingTop: "10px" }}>
              <div style={{ ...mutedStyle, fontSize: "11px", marginBottom: "7px" }}>
                RELATIONSHIPS TRAVERSED
              </div>

              {relationships.length ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {relationships.map((relationship, relationshipIndex) => (
                    <span
                      key={`${relationship}-${relationshipIndex}`}
                      style={{
                        background: "#202b3c",
                        color: "#cbd5e1",
                        border: "1px solid #354258",
                        padding: "5px 7px",
                        borderRadius: "5px",
                        fontSize: "10px",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {relationship}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={mutedStyle}>Relationship labels unavailable.</span>
              )}
            </div>

            <div style={{ ...mutedStyle, marginTop: "10px" }}>
              Starting event: {eventId} · Connected event:{" "}
              <strong style={{ color: "#e5edf8" }}>
                {item.connected_event || "Unknown"}
              </strong>
            </div>
          </div>
        );
      })}

      {paths.length > 4 && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          style={{
            padding: "10px",
            border: "1px solid #354258",
            borderRadius: "8px",
            background: "#151f31",
            color: "#cbd5e1",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          {showAll
            ? "Show fewer paths"
            : `Show all ${paths.length} evidence paths`}
        </button>
      )}
    </div>
  );
}

function AgentPanel({ result, loading, error, onInvestigate, eventId }) {
  const [showLimitations, setShowLimitations] = useState(false);

  return (
    <section style={panelStyle}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          flexWrap: "wrap",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "#20234a",
              display: "grid",
              placeItems: "center",
              color: "#a5b4fc",
            }}
          >
            <BrainCircuit size={22} />
          </div>

          <div>
            <h3 style={{ margin: 0, fontSize: "16px" }}>
              GraphSentinel Investigation Agent
            </h3>
            <p style={{ ...mutedStyle, margin: "4px 0 0" }}>
              Explainable, connected-data analysis
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onInvestigate}
          disabled={loading || !eventId}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "10px 14px",
            border: "1px solid #6366f1",
            borderRadius: "9px",
            background: loading ? "#303451" : "#4f46e5",
            color: "#ffffff",
            fontWeight: 700,
            cursor: loading ? "wait" : "pointer",
            opacity: loading || !eventId ? 0.7 : 1,
          }}
        >
          {loading ? (
            <RefreshCw size={16} className="spinning" />
          ) : (
            <Sparkles size={16} />
          )}
          {loading ? "Investigating..." : "Investigate with AI"}
        </button>
      </div>

      <div style={{ ...mutedStyle, marginBottom: "14px" }}>
        Selected event:{" "}
        <strong style={{ color: "#e5edf8" }}>{eventId || "None"}</strong>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            padding: "12px",
            border: "1px solid #7f1d1d",
            borderRadius: "8px",
            color: "#fecaca",
            background: "#351820",
            marginBottom: "12px",
            fontSize: "13px",
          }}
        >
          <AlertTriangle
            size={16}
            style={{ verticalAlign: "middle", marginRight: "7px" }}
          />
          {error}
        </div>
      )}

      {loading && !result && (
        <div style={{ ...mutedStyle, padding: "18px 4px" }}>
          Analyzing the selected event and retrieving connected graph evidence...
        </div>
      )}

      {!result && !loading && !error && (
        <div
          style={{
            border: "1px dashed #344258",
            borderRadius: "9px",
            padding: "20px 12px",
            textAlign: "center",
          }}
        >
          <Search size={23} color="#94a3b8" />
          <p style={{ margin: "9px 0 4px", fontWeight: 600 }}>
            Ready to investigate
          </p>
          <p style={{ ...mutedStyle, margin: 0 }}>
            Run the agent to view its risk assessment, evidence paths, and recommendations.
          </p>
        </div>
      )}

      {result && (
        <div style={{ display: "grid", gap: "18px", marginTop: "14px" }}>
          <div
            style={{
              border: "1px solid #334155",
              background: "#151f31",
              borderRadius: "9px",
              padding: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "9px",
              }}
            >
              <strong style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldAlert size={18} color="#fbbf24" />
                Risk assessment
              </strong>

              <span
                style={{
                  padding: "5px 10px",
                  borderRadius: "20px",
                  background: "#3b2c16",
                  color: "#fcd34d",
                  fontSize: "12px",
                  fontWeight: 700,
                }}
              >
                {result.risk_assessment || "Review context"}
              </span>
            </div>

            <p style={{ ...mutedStyle, margin: 0 }}>{result.summary}</p>
          </div>

          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: "14px" }}>
              <Activity
                size={16}
                style={{ verticalAlign: "middle", marginRight: "7px" }}
              />
              Investigation findings ({result.findings?.length || 0})
            </h4>

            {result.findings?.length ? (
              <div style={{ display: "grid", gap: "9px" }}>
                {result.findings.map((finding, index) => (
                  <div
                    key={`${finding.title}-${index}`}
                    style={{
                      display: "grid",
                      gap: "7px",
                      padding: "12px",
                      border: "1px solid #29364b",
                      borderRadius: "8px",
                      background: "#131d2c",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong style={{ fontSize: "13px" }}>
                        {finding.title}
                      </strong>
                      <SeverityBadge severity={finding.severity} />
                    </div>

                    <p style={{ ...mutedStyle, margin: 0 }}>{finding.evidence}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={mutedStyle}>No findings were returned.</p>
            )}
          </div>

          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: "14px" }}>
              <Route
                size={16}
                style={{ verticalAlign: "middle", marginRight: "7px" }}
              />
              Graph Evidence Paths
            </h4>
            <p style={{ ...mutedStyle, marginTop: 0 }}>
              Trace the actual relationship chains returned by FalkorDB.
            </p>

            <EvidencePaths
              evidence={result.multi_hop_evidence}
              eventId={result.event?.event_id || eventId}
            />
          </div>

          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: "14px" }}>
              <Network
                size={16}
                style={{ verticalAlign: "middle", marginRight: "7px" }}
              />
              Direct connected events ({result.connections?.length || 0})
            </h4>

            {result.connections?.length ? (
              <div style={{ display: "grid", gap: "8px" }}>
                {result.connections.map((connection, index) => (
                  <div
                    key={`${connection.connected_event}-${index}`}
                    style={{
                      padding: "12px",
                      border: "1px solid #29364b",
                      borderRadius: "8px",
                      background: "#131d2c",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong>{connection.connected_event}</strong>
                      <SeverityBadge
                        severity={
                          connection.connected_status === "suspicious"
                            ? "high"
                            : "info"
                        }
                      />
                    </div>

                    <p style={{ ...mutedStyle, margin: "7px 0 0" }}>
                      Account: {connection.connected_user || "Unknown"}
                    </p>
                    <p style={{ ...mutedStyle, margin: "3px 0 0" }}>
                      Shared device: {connection.shared_device || "Unknown"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={mutedStyle}>No direct connected events were returned.</p>
            )}
          </div>

          <div>
            <h4 style={{ margin: "0 0 10px", fontSize: "14px" }}>
              <Lightbulb
                size={16}
                style={{ verticalAlign: "middle", marginRight: "7px" }}
              />
              Recommended next steps
            </h4>

            {result.recommendations?.length ? (
              <ol style={{ paddingLeft: "21px", margin: 0 }}>
                {result.recommendations.map((recommendation, index) => (
                  <li
                    key={`${index}-${recommendation}`}
                    style={{
                      ...mutedStyle,
                      paddingLeft: "3px",
                      marginBottom: "8px",
                    }}
                  >
                    {recommendation}
                  </li>
                ))}
              </ol>
            ) : (
              <p style={mutedStyle}>No recommendations were returned.</p>
            )}
          </div>

          <div style={{ borderTop: "1px solid #29364b", paddingTop: "12px" }}>
            <button
              type="button"
              onClick={() => setShowLimitations((value) => !value)}
              style={{
                display: "flex",
                width: "100%",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "8px",
                padding: "5px 0",
                border: 0,
                background: "transparent",
                color: "#cbd5e1",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ShieldCheck size={17} />
                Analysis limitations
              </span>
              {showLimitations ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </button>

            {showLimitations && (
              <ul style={{ paddingLeft: "20px", marginBottom: 0 }}>
                {(result.limitations || [
                  "Validate the evidence before taking security action.",
                ]).map((limitation, index) => (
                  <li
                    key={`${index}-${limitation}`}
                    style={{ ...mutedStyle, marginTop: "7px" }}
                  >
                    {limitation}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p style={{ ...mutedStyle, margin: 0, fontSize: "11px" }}>
            Mode: {result.mode || "Graph analysis"}
            {" · "}
            {result.agent || "GraphSentinel Agent"}
          </p>
        </div>
      )}
    </section>
  );
}

function App() {
  const [health, setHealth] = useState("checking");
  const [investigations, setInvestigations] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("L001");
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const [agentResult, setAgentResult] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [healthResponse, investigationResponse] = await Promise.all([
        fetch(`${API_URL}/health`),
        fetch(`${API_URL}/investigate`),
      ]);

      if (!healthResponse.ok || !investigationResponse.ok) {
        throw new Error("The investigation API returned an error.");
      }

      const healthData = await healthResponse.json();
      const investigationData = await investigationResponse.json();

      setHealth(healthData.status || "unavailable");

      const records = investigationData.investigations || [];
      setInvestigations(records);

      setSelectedEvent((current) =>
        records.some((item) => item.event_id === current)
          ? current
          : records[0]?.event_id || ""
      );

      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard loading error:", err);
      setHealth("unavailable");
      setError(
        "Unable to connect to Flask on port 5050. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    let cancelled = false;

    async function loadConnections() {
      if (!selectedEvent || health !== "healthy") {
        setConnections([]);
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/investigate/${encodeURIComponent(selectedEvent)}/connections`
        );

        if (!response.ok) {
          throw new Error("Could not load connected events.");
        }

        const data = await response.json();

        if (!cancelled) {
          setConnections(data.connections || []);
        }
      } catch (err) {
        console.error("Connection loading error:", err);
        if (!cancelled) setConnections([]);
      }
    }

    loadConnections();

    return () => {
      cancelled = true;
    };
  }, [selectedEvent, health]);

  useEffect(() => {
    setAgentResult(null);
    setAgentError("");
  }, [selectedEvent]);

  const runAgent = useCallback(async () => {
    if (!selectedEvent) {
      setAgentError("Select an event before starting an investigation.");
      return;
    }

    setAgentLoading(true);
    setAgentError("");
    setAgentResult(null);

    try {
      const response = await fetch(
        `${API_URL}/agent/investigate/${encodeURIComponent(selectedEvent)}`
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data.error || `Agent request failed with status ${response.status}.`
        );
      }

      setAgentResult(data);
    } catch (err) {
      console.error("Agent investigation error:", err);
      setAgentError(
        `${err.message || "Could not reach the investigation agent."} Check that Flask is running on port 5050.`
      );
    } finally {
      setAgentLoading(false);
    }
  }, [selectedEvent]);

  const selectedInvestigation = investigations.find(
    (item) => item.event_id === selectedEvent
  );

  const graph = useMemo(() => {
    if (!selectedInvestigation) {
      return { nodes: [], edges: [] };
    }

    const record = selectedInvestigation;

    const nodes = [
      {
        id: "selected-user",
        type: "graphNode",
        position: { x: 0, y: 30 },
        data: {
          label: record.user,
          subtitle: "Account owner",
          icon: UserRound,
          tone: "purple",
        },
      },
      {
        id: "selected-ip",
        type: "graphNode",
        position: { x: 0, y: 280 },
        data: {
          label: record.source_ip,
          subtitle: "Source IP address",
          icon: Globe,
          tone: "orange",
        },
      },
      {
        id: "selected-event",
        type: "graphNode",
        position: { x: 340, y: 155 },
        data: {
          label: record.event_id,
          subtitle: "Flagged login event",
          icon: Fingerprint,
          tone: "red",
          status: record.status || "suspicious",
          statusTone: "danger",
        },
      },
      {
        id: "shared-device",
        type: "graphNode",
        position: { x: 680, y: 155 },
        data: {
          label: record.device,
          subtitle: "Connected device",
          icon: Laptop,
          tone: "blue",
        },
      },
    ];

    const edges = [
      {
        id: "event-user",
        source: "selected-event",
        target: "selected-user",
        label: "LOGIN_FOR",
        type: "smoothstep",
        animated: true,
      },
      {
        id: "event-ip",
        source: "selected-event",
        target: "selected-ip",
        label: "FROM_IP",
        type: "smoothstep",
        animated: true,
      },
      {
        id: "event-device",
        source: "selected-event",
        target: "shared-device",
        label: "USED_DEVICE",
        type: "smoothstep",
        animated: true,
      },
    ];

    connections.forEach((connection, index) => {
      const eventId = `connected-event-${index}`;
      const userId = `connected-user-${index}`;
      const y = 365 + index * 170;

      nodes.push(
        {
          id: eventId,
          type: "graphNode",
          position: { x: 680, y },
          data: {
            label: connection.connected_event,
            subtitle: "Related login event",
            icon: Fingerprint,
            tone:
              connection.connected_status === "suspicious" ? "red" : "green",
            status: connection.connected_status,
            statusTone:
              connection.connected_status === "suspicious" ? "danger" : "safe",
          },
        },
        {
          id: userId,
          type: "graphNode",
          position: { x: 340, y },
          data: {
            label: connection.connected_user,
            subtitle: "Related account",
            icon: UserRound,
            tone: "purple",
          },
        }
      );

      edges.push(
        {
          id: `device-${eventId}`,
          source: "shared-device",
          target: eventId,
          label: "SAME DEVICE",
          type: "smoothstep",
          animated: true,
        },
        {
          id: `${eventId}-${userId}`,
          source: eventId,
          target: userId,
          label: "LOGIN_FOR",
          type: "smoothstep",
        }
      );
    });

    return { nodes, edges };
  }, [selectedInvestigation, connections]);

  const connectedAccountCount = new Set(
    connections.map((connection) => connection.connected_user)
  ).size;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <ShieldCheck size={25} />
          </div>
          <div>
            <h1>GraphSentinel</h1>
            <span>THREAT INVESTIGATION</span>
          </div>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <button className="nav-item active" type="button">
          <Network size={18} />
          <span>Investigation graph</span>
        </button>

        <button className="nav-item" type="button" onClick={loadDashboard}>
          <Activity size={18} />
          <span>Threat overview</span>
        </button>

        <div className="sidebar-bottom">
          <div className="database-indicator">
            <span
              className={`pulse-dot ${
                health === "healthy" ? "online" : "offline"
              }`}
            />
            <div>
              <strong>FalkorDB</strong>
              <span>
                {health === "healthy" ? "Connected" : "Not connected"}
              </span>
            </div>
          </div>

          <div className="sidebar-version">
            <span>GraphSentinel</span>
            <span>Local development</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="breadcrumb">Security / Investigations</div>
            <h2>Threat Investigation Center</h2>
            <p>Explore connected entities and investigate suspicious logins.</p>
          </div>

          <button
            className="refresh-button"
            onClick={loadDashboard}
            disabled={loading}
            type="button"
          >
            <RefreshCw size={16} className={loading ? "spinning" : ""} />
            {loading ? "Refreshing..." : "Refresh data"}
          </button>
        </header>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={19} />
            <span>{error}</span>
            <button type="button" onClick={loadDashboard}>
              Retry
            </button>
          </div>
        )}

        <section className="stats-grid">
          <StatCard
            icon={health === "healthy" ? CheckCircle2 : Database}
            label="DATABASE STATUS"
            value={health === "healthy" ? "Connected" : "Unavailable"}
            detail="FalkorDB graph database"
            tone={health === "healthy" ? "green" : "red"}
          />

          <StatCard
            icon={ShieldAlert}
            label="SUSPICIOUS EVENTS"
            value={String(investigations.length).padStart(2, "0")}
            detail="Flagged login records"
            tone="red"
          />

          <StatCard
            icon={Network}
            label="RELATED ACCOUNTS"
            value={String(connectedAccountCount).padStart(2, "0")}
            detail="Found through shared devices"
            tone="blue"
          />

          <StatCard
            icon={Activity}
            label="INVESTIGATION STATUS"
            value={loading ? "Loading" : error ? "Check API" : "Ready"}
            detail="Live API connection"
            tone="purple"
          />
        </section>

        <section className="investigation-layout">
          <div className="graph-panel">
            <div className="panel-header">
              <div>
                <div className="panel-title-row">
                  <Network size={19} />
                  <h3>Entity relationship graph</h3>
                </div>
                <p>Trace login activity through connected entities.</p>
              </div>

              <span className="live-label">
                <span className="pulse-dot online" />
                LIVE GRAPH
              </span>
            </div>

            <div className="graph-legend">
              <span><i className="legend-dot red" /> Suspicious event</span>
              <span><i className="legend-dot blue" /> Device</span>
              <span><i className="legend-dot purple" /> User</span>
              <span><i className="legend-dot orange" /> IP address</span>
            </div>

            <div className="graph-canvas">
              {loading && investigations.length === 0 ? (
                <div className="graph-message">
                  <RefreshCw className="spinning" size={24} />
                  <span>Loading investigation graph...</span>
                </div>
              ) : graph.nodes.length === 0 ? (
                <div className="graph-message">
                  <Search size={27} />
                  <strong>No investigation data available</strong>
                  <span>
                    Check that your backend and graph database are running.
                  </span>
                </div>
              ) : (
                <ReactFlow
                  key={selectedEvent}
                  nodes={graph.nodes}
                  edges={graph.edges}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{
                    padding: 0.12,
                    maxZoom: 0.85,
                    minZoom: 0.3,
                  }}
                  minZoom={0.2}
                  maxZoom={1.5}
                  nodesDraggable
                  nodesConnectable={false}
                  elementsSelectable
                  proOptions={{ hideAttribution: true }}
                >
                  <Background color="#26334a" gap={22} size={1} />
                  <Controls />
                  <MiniMap
                    nodeColor={(node) => {
                      if (node.data?.tone === "red") return "#f05265";
                      if (node.data?.tone === "purple") return "#a78bfa";
                      if (node.data?.tone === "orange") return "#f59e0b";
                      if (node.data?.tone === "green") return "#34d399";
                      return "#60a5fa";
                    }}
                    maskColor="rgba(7, 12, 24, 0.7)"
                  />
                </ReactFlow>
              )}
            </div>

            <div className="graph-footer">
              <span>
                <span className="pulse-dot online" />
                Graph data from FalkorDB
              </span>
              <span>
                {graph.nodes.length} entities · {graph.edges.length} relationships
              </span>
            </div>
          </div>

          <aside className="details-panel">
            <div className="details-heading">
              <div className="details-heading-icon">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3>Investigation details</h3>
                <p>Review a login event and its evidence</p>
              </div>
            </div>

            <label className="field-label" htmlFor="event-select">
              SELECT EVENT
            </label>

            <select
              id="event-select"
              value={selectedEvent}
              onChange={(event) => setSelectedEvent(event.target.value)}
              disabled={investigations.length === 0}
            >
              {investigations.map((item) => (
                <option key={item.event_id} value={item.event_id}>
                  {item.event_id} — {item.user}
                </option>
              ))}
            </select>

            {selectedInvestigation ? (
              <>
                <div className="risk-banner">
                  <div className="risk-banner-icon">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <strong>Login event: {selectedInvestigation.status}</strong>
                    <span>Review the evidence and surrounding context</span>
                  </div>
                </div>

                <div className="evidence-list">
                  <div className="evidence-item">
                    <span className="evidence-icon red">
                      <Fingerprint size={17} />
                    </span>
                    <div>
                      <span>Event ID</span>
                      <strong>{selectedInvestigation.event_id}</strong>
                    </div>
                    <ArrowUpRight size={15} className="evidence-arrow" />
                  </div>

                  <div className="evidence-item">
                    <span className="evidence-icon purple">
                      <UserRound size={17} />
                    </span>
                    <div>
                      <span>Account</span>
                      <strong>{selectedInvestigation.user}</strong>
                    </div>
                  </div>

                  <div className="evidence-item">
                    <span className="evidence-icon blue">
                      <Laptop size={17} />
                    </span>
                    <div>
                      <span>Device</span>
                      <strong>{selectedInvestigation.device}</strong>
                    </div>
                  </div>

                  <div className="evidence-item">
                    <span className="evidence-icon orange">
                      <Globe size={17} />
                    </span>
                    <div>
                      <span>Source IP</span>
                      <strong>{selectedInvestigation.source_ip}</strong>
                    </div>
                  </div>
                </div>

                <div className="connection-summary">
                  <div className="connection-summary-heading">
                    <Network size={17} />
                    <strong>Connected activity</strong>
                  </div>

                  {connections.length > 0 ? (
                    <>
                      <p>
                        {connections.length} related login event
                        {connections.length === 1 ? "" : "s"} found through a
                        shared device.
                      </p>

                      {connections.map((connection) => (
                        <div
                          className="related-event"
                          key={connection.connected_event}
                        >
                          <div className="related-event-top">
                            <strong>{connection.connected_event}</strong>
                            <span
                              className={
                                connection.connected_status === "suspicious"
                                  ? "status-danger"
                                  : "status-normal"
                              }
                            >
                              {connection.connected_status}
                            </span>
                          </div>
                          <span>Account: {connection.connected_user}</span>
                          <span>Shared device: {connection.shared_device}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p>
                      No other connected login events were returned for this
                      event.
                    </p>
                  )}
                </div>

                <div className="analyst-note">
                  <strong>
                    <ShieldCheck size={16} /> Analyst note
                  </strong>
                  <p>
                    A shared device is an investigative lead, not proof of
                    malicious activity. Verify the login context before drawing
                    conclusions.
                  </p>
                </div>
              </>
            ) : (
              <div className="empty-details">
                <Search size={24} />
                <strong>No event selected</strong>
                <span>Load investigation data to view evidence.</span>
              </div>
            )}
          </aside>
        </section>

        <AgentPanel
          result={agentResult}
          loading={agentLoading}
          error={agentError}
          onInvestigate={runAgent}
          eventId={selectedEvent}
        />

        <footer className="page-footer">
          <span>GraphSentinel · Connected-data threat investigation</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
            <Clock size={13} />
            {lastUpdated
              ? `Last updated ${lastUpdated.toLocaleTimeString()}`
              : "Waiting for first data refresh"}
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;
