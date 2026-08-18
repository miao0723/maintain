import os, glob

OLD_135 = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
OLD_90  = "linear-gradient(90deg, #667eea 0%, #764ba2 100%)"
NEW_135 = "linear-gradient(135deg, #436f95 0%, #6a9abb 100%)"
NEW_90  = "linear-gradient(90deg, #436f95 0%, #6a9abb 100%)"

files = glob.glob("pages/**/*.wxss", recursive=True)
changed = []
for f in files:
    try:
        with open(f, encoding="utf-8") as fh:
            txt = fh.read()
    except Exception:
        continue
    if OLD_135 in txt or OLD_90 in txt:
        n1 = txt.count(OLD_135)
        n2 = txt.count(OLD_90)
        txt = txt.replace(OLD_135, NEW_135).replace(OLD_90, NEW_90)
        with open(f, "w", encoding="utf-8") as fh:
            fh.write(txt)
        changed.append((f, n1 + n2))

print(f"扫描文件: {len(files)}")
print(f"修改文件: {len(changed)}")
for f, n in changed:
    print(f"  {n:>2} 处  {f}")
