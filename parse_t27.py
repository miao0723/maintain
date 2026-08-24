import json
d = json.load(open("D:/maintain/t27_table.json"))
print("keys:", list(d.keys()))
print("table_start_index:", d.get("table_start_index"))
print("table_end_index:", d.get("table_end_index"))
blk = d.get("block", {})
t = blk.get("table", {})
print("row_count:", t.get("row_count"), "col_count:", t.get("col_count"))
cells = t.get("cells", [])
print("num cells:", len(cells))
for i, c in enumerate(cells):
    if "text" in c:
        txt = c.get("text", "")
        print(i, "row", c.get("row"), "col", c.get("col"), "text=", repr(txt)[:70])
