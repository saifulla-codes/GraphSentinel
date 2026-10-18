# GraphSentinel

**Explainable graph-based security investigation using FalkorDB, Flask, and React.**

GraphSentinel is a hackathon prototype that explores suspicious login events and connected entities in a graph. It helps investigators inspect shared devices, IP addresses, users, and multi-hop evidence paths through an interactive dashboard.

## Features

- Interactive graph visualization using React Flow
- Flask REST API connected to FalkorDB
- Suspicious login event investigation
- Shared-device connection analysis
- Multi-hop evidence paths and relationship labels
- Rule-based investigation summaries and recommendations
- API and database health checks

## Technology Stack

- **Frontend:** React, Vite, React Flow, Lucide
- **Backend:** Python, Flask, Flask-CORS
- **Graph database:** FalkorDB

## Architecture

React dashboard → Flask REST API → FalkorDB graph database

## Prerequisites

- Python 3.11 or later
- Node.js and npm
- Docker Desktop
- FalkorDB accessible at `localhost:6379`

## Setup

### 1. Start FalkorDB

Start Docker Desktop. If your existing container is named `graphsentinel-falkordb`, run:

```bash
docker start graphsentinel-falkordb
```

If that container does not exist, create a FalkorDB container using the official FalkorDB documentation.

### 2. Install backend dependencies

From the project root:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Start the API:

```bash
python app.py
```

The backend uses `http://127.0.0.1:5050`.

### 3. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

## API Endpoints

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Check API and database health |
| `GET /api/investigate` | Retrieve suspicious login events |
| `GET /api/investigate/<event_id>/connections` | Inspect direct connected events |
| `GET /api/investigate/<event_id>/evidence` | Retrieve multi-hop evidence paths |
| `GET /api/agent/investigate/<event_id>` | Get an explainable investigation report |

Example:

```bash
curl http://127.0.0.1:5050/api/health
```

## Investigation Method

The current investigation agent uses deterministic, rule-based logic to organize graph evidence, summarize relationships, and suggest next steps. It is not an LLM and does not independently block accounts or devices.

The demonstration dataset contains synthetic users, devices, login events, and IP addresses. A shared device or graph connection is an investigative lead, not proof of malicious activity.

## Limitations

- Demonstration data is synthetic.
- Findings depend on the available graph data.
- Graph relationships alone cannot establish intent or causation.
- Production use would require authentication, authorization, audit logging, and additional security testing.

## Project Structure

```text
GraphSentinel/
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
├── seed_graph.py
├── test_falkordb.py
├── investigate.py
├── expand_graph.py
├── trace_connections.py
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx
        ├── App.css
        ├── index.css
        └── main.jsx
```

## Disclaimer

GraphSentinel is a hackathon prototype for demonstrating graph-based investigation concepts. It is not a production-ready security monitoring or incident-response platform.
