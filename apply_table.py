import json, subprocess

FID = "e1402dcd-ed0a-4e3f-a70c-ecf856a4ef4c"
IDX = 4351

block = json.load(open("D:/maintain/new_table.json"))
inner = json.dumps(block, ensure_ascii=False)  # the table block as a JSON string

arg = json.dumps({
    "file_id": FID,
    "idx": IDX,
    "table_block_json": inner,
})

r = subprocess.run(
    ["python3",
     "D:/工具/WorkBuddy/resources/app.asar.unpacked/resources/builtin-skills/tencent-local-office-edit/edsdk.py",
     "call", "doc_modify_table_region", "--json", arg],
    capture_output=True, text=True,
)
print("returncode:", r.returncode)
print("STDOUT:", r.stdout[:1500])
print("STDERR:", r.stderr[:800])
