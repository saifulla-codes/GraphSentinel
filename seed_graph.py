
from falkordb import FalkorDB

db = FalkorDB(host="localhost", port=6379)
graph = db.select_graph("GraphSentinel")

# Clear the demo graph so reruns stay predictable
graph.query("MATCH (n) DETACH DELETE n")

# Create synthetic security entities and their relationships
query = """
CREATE
  (u:User {id: 'U001', name: 'Alex'}),
  (d:Device {id: 'D001', name: 'Finance-Laptop'}),
  (ip:IPAddress {address: '203.0.113.42'}),
  (e:LoginEvent {id: 'L001', status: 'suspicious'}),

  (e)-[:FROM_IP]->(ip),
  (e)-[:USED_DEVICE]->(d),
  (e)-[:LOGIN_FOR]->(u),
  (u)-[:USES_DEVICE]->(d)
RETURN u.name, d.name, ip.address, e.status
"""

result = graph.query(query)
print("Security graph created successfully!")
print(result.result_set)
