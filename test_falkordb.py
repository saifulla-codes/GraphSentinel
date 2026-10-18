
from falkordb import FalkorDB

# Connect to FalkorDB running locally
db = FalkorDB(
    host="localhost",
    port=6379,
)

# Select a graph for our project
graph = db.select_graph("GraphSentinel")

# Run a simple query
result = graph.query("RETURN 'GraphSentinel connected!' AS message")

print(result.result_set)
