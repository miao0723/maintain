import json, subprocess, sys

EDSDK = "D:/工具/WorkBuddy/resources/app.asar.unpacked/resources/builtin-skills/tencent-local-office-edit/edsdk.py"
FID = "e1402dcd-ed0a-4e3f-a70c-ecf856a4ef4c"

def call(tool, **kw):
    args = ["python3", EDSDK, "call", tool, f"file_id={FID}"]
    for k, v in kw.items():
        args.append(f"{k}={v}")
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0:
        print("ERR", tool, r.stderr[:300], file=sys.stderr)
        return {}
    try:
        return json.loads(r.stdout)
    except Exception as e:
        print("PARSE ERR", e, r.stdout[:200], file=sys.stderr)
        return {}

# get total regions from first call
first = call("doc_get_content_region")
total = first.get("total_regions", 1)
print(f"total_regions={total}", file=sys.stderr)

regions = []
for i in range(total):
    d = call("doc_get_content_region", region_index=i)
    regions.append(d)

json.dump(regions, open("D:/maintain/doc_all_regions.json", "w"), ensure_ascii=False)
print(f"collected {len(regions)} regions", file=sys.stderr)

# extract text
out_lines = []
for ri, d in enumerate(regions):
    blocks = d.get("content", {}).get("blocks", [])
    for b in blocks:
        btype = b.get("type")
        if btype == "paragraph":
            t = b.get("text", "")
            out_lines.append(t)
        elif btype == "table":
            # table cells
            tbl = b.get("table", {})
            for row in tbl.get("cells", []):
                # row may be list of cells
                if isinstance(row, list):
                    cells = row
                else:
                    cells = [row]
                rowtext = []
                for c in cells:
                    rowtext.append(c.get("text", ""))
                out_lines.append(" | ".join(rowtext))
            out_lines.append("")  # table separator
    out_lines.append("")  # region separator

open("D:/maintain/doc_text.txt", "w", encoding="utf-8").write("\n".join(out_lines))
print("written doc_text.txt lines:", len(out_lines), file=sys.stderr)
