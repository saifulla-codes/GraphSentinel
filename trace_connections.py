
from falkordb import FalkorDB

db = FalkorDB(host="localhost", port=6379)
graph = db.select_graph("GraphSentinel")

query = """
MATCH (suspicious:LoginEvent {id: 'L001'})
      -[:USED_DEVICE]->(device:Device)
      <-[:USED_DEVICE]-(other:LoginEvent)
MATCH (other)-[:LOGIN_FOR]->(user:User)
WHERE other.id <> suspicious.id
RETURN
    suspicious.id AS starting_event,
    device.name AS shared_device,
    other.id AS connected_event,
    other.status AS connected_status,
    user.name AS connected_user
"""

result = graph.query(query)

print("=== Multi-Hop Investigation ===")

if result.result_set:
    for row in result.result_set:
        print(f"Starting event: {row[0]}")
        print(f"Shared device: {row[1]}")
        print(f"Connected event: {row[2]}")
        print(f"Connected event status: {row[3]}")
        print(f"Connected user: {row[4]}")
else:
    print("No connected login events found.")
