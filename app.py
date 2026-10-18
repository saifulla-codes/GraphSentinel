
from flask import Flask, jsonify
from flask_cors import CORS
from falkordb import FalkorDB

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5174",
            ]
        }
    },
)


def get_graph():
    """Connect to the GraphSentinel graph."""
    db = FalkorDB(host="localhost", port=6379)
    return db.select_graph("GraphSentinel")


def fetch_investigation(graph, event_id):
    """Fetch one login event and its required entities."""
    query = """
    MATCH (event:LoginEvent {id: $event_id})-[:LOGIN_FOR]->(user:User)
    MATCH (event)-[:USED_DEVICE]->(device:Device)
    MATCH (event)-[:FROM_IP]->(ip:IPAddress)
    RETURN event.id, user.name, device.name, ip.address, event.status
    """

    result = graph.query(query, {"event_id": event_id})

    if not result.result_set:
        return None

    row = result.result_set[0]

    return {
        "event_id": row[0],
        "user": row[1],
        "device": row[2],
        "source_ip": row[3],
        "status": row[4],
    }


def fetch_connections(graph, event_id):
    """Find other login events sharing the same device."""
    query = """
    MATCH (start:LoginEvent {id: $event_id})-[:USED_DEVICE]->(device:Device)
          <-[:USED_DEVICE]-(other:LoginEvent)
    MATCH (other)-[:LOGIN_FOR]->(user:User)
    WHERE other.id <> start.id
    RETURN start.id, device.name, other.id, other.status, user.name
    ORDER BY other.id
    """

    result = graph.query(query, {"event_id": event_id})

    return [
        {
            "starting_event": row[0],
            "shared_device": row[1],
            "connected_event": row[2],
            "connected_status": row[3],
            "connected_user": row[4],
            "relationship": "SHARED_DEVICE",
        }
        for row in result.result_set
    ]


def fetch_multi_hop_evidence(graph, event_id, max_hops=3):
    """
    Find distinct login events connected by shared users or devices.

    Each result includes a concrete event-to-event path. The query uses
    a bounded path length to avoid unbounded graph traversal.
    """
    query = """
    MATCH (start:LoginEvent {id: $event_id})
    MATCH path = (start)-[*1..3]-(other:LoginEvent)
    WHERE other.id <> start.id
      AND ALL(
          node IN nodes(path)
          WHERE node:LoginEvent OR node:User OR node:Device
      )
    WITH other, path,
         [node IN nodes(path) |
            CASE
              WHEN node:LoginEvent THEN 'LoginEvent:' + coalesce(node.id, '')
              WHEN node:User THEN 'User:' + coalesce(node.name, '')
              WHEN node:Device THEN 'Device:' + coalesce(node.name, '')
              ELSE labels(node)[0]
            END
         ] AS path_nodes,
         [rel IN relationships(path) | type(rel)] AS path_relationships
    RETURN DISTINCT
        other.id,
        other.status,
        path_nodes,
        path_relationships,
        length(path) AS hops
    ORDER BY hops, other.id
    """

    result = graph.query(query, {"event_id": event_id})

    evidence = []

    for row in result.result_set:
        evidence.append({
            "connected_event": row[0],
            "connected_status": row[1],
            "path": row[2],
            "relationships": row[3],
            "hops": row[4],
        })

    return evidence


def build_agent_result(event, connections, multi_hop):
    """Create an explainable, rule-based investigation result."""
    findings = []
    recommendations = []

    suspicious_related = [
        item for item in multi_hop
        if item["connected_status"] == "suspicious"
    ]

    if event["status"] == "suspicious":
        findings.append({
            "title": "Event is flagged suspicious",
            "severity": "high",
            "evidence": (
                f"GraphSentinel records {event['event_id']} with status "
                f"'{event['status']}'."
            ),
        })
        recommendations.append(
            "Review the original alert and validate why this login was flagged."
        )
    else:
        findings.append({
            "title": "Event is not marked suspicious",
            "severity": "info",
            "evidence": (
                f"The graph records this event with status "
                f"'{event['status']}'. This does not independently prove "
                "that the activity is safe."
            ),
        })

    if connections:
        related_names = sorted({
            item["connected_user"] for item in connections
            if item.get("connected_user")
        })

        findings.append({
            "title": "Shared-device relationship found",
            "severity": "medium",
            "evidence": (
                f"{len(connections)} other login event(s) use device "
                f"'{connections[0]['shared_device']}'. Related accounts: "
                f"{', '.join(related_names) if related_names else 'not available'}."
            ),
        })

        recommendations.append(
            "Verify device ownership and whether the connected accounts "
            "are expected to use the same device."
        )
    else:
        findings.append({
            "title": "No direct shared-device login found",
            "severity": "info",
            "evidence": (
                "The current query did not find another login event "
                "using the same device."
            ),
        })

    if multi_hop:
        findings.append({
            "title": "Multi-hop graph relationships discovered",
            "severity": "medium" if suspicious_related else "info",
            "evidence": (
                f"Found {len(multi_hop)} distinct connected login event(s) "
                "within the configured graph traversal depth. Review the "
                "returned paths to understand how each event is connected."
            ),
        })

    if suspicious_related:
        findings.append({
            "title": "Connected suspicious event found",
            "severity": "high",
            "evidence": (
                f"{len(suspicious_related)} connected event(s) are marked "
                "suspicious. This is a reason to review the shared path, "
                "not proof that the events share a cause."
            ),
        })

        recommendations.append(
            "Compare the evidence paths for connected suspicious events "
            "and validate each event independently."
        )

    recommendations.append(
        "Check source IP context, account activity, and any available "
        "authentication logs before taking containment action."
    )

    return {
        "agent": "GraphSentinel Explainable Investigation Agent",
        "mode": "rule-based multi-hop graph analysis",
        "event": event,
        "risk_assessment": (
            "Needs investigation"
            if event["status"] == "suspicious"
            else "Review context"
        ),
        "summary": (
            f"Event {event['event_id']} belongs to {event['user']}, uses "
            f"device {event['device']}, and originates from "
            f"{event['source_ip']}. Found {len(connections)} direct "
            f"shared-device connection(s) and {len(multi_hop)} distinct "
            "multi-hop connected login event(s)."
        ),
        "findings": findings,
        "connections": connections,
        "multi_hop_evidence": multi_hop,
        "recommendations": recommendations,
        "limitations": [
            "This is rule-based analysis, not an LLM-generated conclusion.",
            "The graph currently contains no login timestamps or authentication details.",
            "A shared user, device, or graph path does not prove an attack.",
            "Only paths of up to three relationships are searched.",
            "Graph findings should be validated before taking security action.",
        ],
    }


@app.get("/api/health")
def health():
    try:
        graph = get_graph()
        graph.query("RETURN 1 AS ok")

        return jsonify({
            "application": "GraphSentinel",
            "status": "healthy",
            "database": "connected",
        })
    except Exception:
        app.logger.exception("Health check failed")
        return jsonify({
            "application": "GraphSentinel",
            "status": "unavailable",
            "database": "disconnected",
        }), 503


@app.get("/api/investigate")
def investigate():
    try:
        graph = get_graph()

        query = """
        MATCH (event:LoginEvent)-[:LOGIN_FOR]->(user:User)
        MATCH (event)-[:USED_DEVICE]->(device:Device)
        MATCH (event)-[:FROM_IP]->(ip:IPAddress)
        WHERE event.status = 'suspicious'
        RETURN event.id, user.name, device.name, ip.address, event.status
        ORDER BY event.id
        """

        result = graph.query(query)

        records = [
            {
                "event_id": row[0],
                "user": row[1],
                "device": row[2],
                "source_ip": row[3],
                "status": row[4],
            }
            for row in result.result_set
        ]

        return jsonify({
            "count": len(records),
            "investigations": records,
        })
    except Exception:
        app.logger.exception("Investigation query failed")
        return jsonify({"error": "Investigation query failed"}), 500


@app.get("/api/investigate/<event_id>/connections")
def investigate_connections(event_id):
    try:
        graph = get_graph()
        event = fetch_investigation(graph, event_id)

        if event is None:
            return jsonify({"error": "Login event not found", "event_id": event_id}), 404

        connections = fetch_connections(graph, event_id)

        return jsonify({
            "event_id": event_id,
            "connection_count": len(connections),
            "connections": connections,
        })
    except Exception:
        app.logger.exception("Connection investigation failed")
        return jsonify({"error": "Connection investigation failed"}), 500


@app.get("/api/investigate/<event_id>/evidence")
def investigate_evidence(event_id):
    try:
        graph = get_graph()
        event = fetch_investigation(graph, event_id)

        if event is None:
            return jsonify({"error": "Login event not found", "event_id": event_id}), 404

        evidence = fetch_multi_hop_evidence(graph, event_id)

        return jsonify({
            "event_id": event_id,
            "max_hops": 3,
            "count": len(evidence),
            "evidence": evidence,
        })
    except Exception:
        app.logger.exception("Multi-hop evidence query failed")
        return jsonify({"error": "Multi-hop evidence query failed"}), 500


@app.get("/api/agent/investigate/<event_id>")
def agent_investigate(event_id):
    try:
        graph = get_graph()
        event = fetch_investigation(graph, event_id)

        if event is None:
            return jsonify({
                "error": (
                    "Login event not found or missing required graph relationships."
                ),
                "event_id": event_id,
            }), 404

        connections = fetch_connections(graph, event_id)
        multi_hop = fetch_multi_hop_evidence(graph, event_id)

        result = build_agent_result(event, connections, multi_hop)
        return jsonify(result)

    except Exception:
        app.logger.exception("Agent investigation failed")
        return jsonify({
            "error": "Agent investigation failed. Check the Flask logs."
        }), 500


if __name__ == "__main__":
    app.run(
        host="127.0.0.1",
        port=5050,
        debug=True,
    )
