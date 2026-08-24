import json

d = json.load(open("D:/maintain/t27_table.json"))
block = d["block"]
t = block["table"]
cells = t["cells"]

# Clone a template cell, override row/col/text
def clone(cell, row, col, text):
    c = json.loads(json.dumps(cell))  # deep copy
    c["row"] = row
    c["col"] = col
    c["text"] = text
    return c

# rows 1-11 stay untouched: cells[0:36] (header + 11 data rows, rows 1-12)
new_cells = cells[0:36]

# Row "12" (cell row 13): change module name + description (keep row index 13)
r12_c1 = cells[36]                       # "12", row 13
r12_c2 = clone(cells[37], 13, 2, "管理端（小程序内嵌）")
r12_c3 = clone(cells[38], 13, 3,
    "管理员登录与工作台、订单/工单管理、用户管理、设备类型、价格管理、配件与库存、统计看板、配送分配、人工客服、系统设置、权限控制")
new_cells += [r12_c1, r12_c2, r12_c3]

# Row "13" (cell row 14): Web 管理后台（PHP）
new_cells += [
    clone(cells[36], 14, 1, "13"),
    clone(cells[37], 14, 2, "Web 管理后台（PHP）"),
    clone(cells[38], 14, 3,
        "设备台账、工单全生命周期、维修人员与排班、巡检、保养计划、维修业务、支付与发票、进销存、统计报表、知识库与向量检索、营销引流、通知中心、mini-admin"),
]

# Row "14" (cell row 15): 智能客服 Agent（Python）
new_cells += [
    clone(cells[36], 15, 1, "14"),
    clone(cells[37], 15, 2, "智能客服 Agent（Python）"),
    clone(cells[38], 15, 3, "多智能体工作流（LangGraph）、RAG 知识库检索"),
]

# Sanitize border colors: must be 6-digit hex WITHOUT '#'
borders = t.get("borders", {})
for side, bv in borders.items():
    if isinstance(bv, dict) and isinstance(bv.get("color"), str):
        col = bv["color"].lstrip("#")
        if len(col) != 6 or not all(c in "0123456789abcdefABCDEF" for c in col):
            col = "000000"
        bv["color"] = col

t["cells"] = new_cells
t["row_count"] = 15  # 1 header + 14 data rows

new_block = {"type": "table", "table": t}
json.dump(new_block, open("D:/maintain/new_table.json", "w"), ensure_ascii=False)
print("new row_count:", t["row_count"], "num cells:", len(new_cells))
print("last cells text:", [c["text"] for c in new_cells[-6:]])
