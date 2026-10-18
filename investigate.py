
from falkordb import FalkorDB

db = FalkorDB(host="localhost", port=6379)
graph = db.select_graph("GraphSentinel")

query = """
MATCH (event:LoginEvent)-[:LOGIN_FOR]->(user:User)
MATCH (event)-[:USED_DEVICE]->(device:Device)
MATCH (event)-[:FROM_IP]->(ip:IPAddress)
WHERE event.status = 'suspicious'
RETURN
    event.id AS event_id,
    user.name AS user,
    device.name AS device,
    ip.address AS source_ip,
    event.status AS status
"""

result = graph.query(query)

print("=== GraphSentinel Investigation ===")

if result.result_set:
    for row in result.result_set:
        print(f"Event: {row[0]}")
        print(f"User: {row[1]}")
        print(f"Device: {row[2]}")
        print(f"Source IP: {row[3]}")
        print(f"Status: {row[4]}")
else:
    print("No matching suspicious events found.")
