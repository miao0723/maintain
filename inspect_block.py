import json

d = json.load(open("D:/maintain/t27_table.json"))
block = d["block"]
print("block keys:", list(block.keys()))
print("block.type:", block.get("type"))
t = block["table"]
print("table keys:", list(t.keys()))
# dump a single data cell to see formatting fields
cells = t["cells"]
print("sample cell[3]:", json.dumps(cells[3], ensure_ascii=False)[:400])
