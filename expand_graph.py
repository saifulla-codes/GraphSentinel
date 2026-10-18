
from falkordb import FalkorDB

db = FalkorDB(host="localhost", port=6379)
graph = db.select_graph("GraphSentinel")

query = """
CREATE
  (u:User {id: 'U002', name: 'Jordan'}),
  (e:LoginEvent {id: 'L002', status: 'normal'}),
  (ip:IPAddress {address: '198.51.100.24'})

WITH u, e, ip
MATCH (d:Device {id: 'D001'})
CREATE
  (e)-[:LOGIN_FOR]->(u),
  (e)-[:USED_DEVICE]->(d),
  (e)-[:FROM_IP]->(ip),
  (u)-[:USES_DEVICE]->(d)
RETURN u.name, d.name, e.id, e.status
"""

result = graph.query(query)
print("Added second synthetic login event:")
print(result.result_set)
