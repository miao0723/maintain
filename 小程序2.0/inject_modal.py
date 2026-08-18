#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""将 <confirm-modal id="confirmModal" /> 注入到所有页面的 WXML 末尾（顶层节点）。
如果页面已包含该组件则跳过。仅做一次性的静态注入，便于 wx.showModal 全局美化。"""
import json
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
APP_JSON = os.path.join(ROOT, "app.json")
TAG = '<confirm-modal id="confirmModal" />\n'
MARK = 'confirm-modal'  # 用于判断是否已注入

def collect_pages(app_cfg):
    pages = list(app_cfg.get("pages", []))
    for sp in app_cfg.get("subPackages", []) or app_cfg.get("subpackages", []):
        root = sp.get("root", "").rstrip("/")
        for p in sp.get("pages", []):
            p = p.rstrip("/")
            pages.append(f"{root}/{p}" if root else p)
    return pages

def main():
    with open(APP_JSON, "r", encoding="utf-8") as f:
        app_cfg = json.load(f)

    pages = collect_pages(app_cfg)
    injected, skipped, missing = [], [], []

    for p in pages:
        wxml = os.path.join(ROOT, p + ".wxml")
        if not os.path.exists(wxml):
            missing.append(p)
            continue
        with open(wxml, "r", encoding="utf-8") as f:
            content = f.read()
        if MARK in content:
            skipped.append(p)
            continue
        # 末尾追加组件标签（WXML 允许多个顶层节点，组件默认隐藏不渲染）
        if not content.endswith("\n"):
            content += "\n"
        content += TAG
        with open(wxml, "w", encoding="utf-8") as f:
            f.write(content)
        injected.append(p)

    print("已注入 (%d):" % len(injected))
    for p in injected:
        print("  +", p)
    print("\n已存在/跳过 (%d):" % len(skipped))
    for p in skipped:
        print("  =", p)
    if missing:
        print("\n文件缺失 (%d):" % len(missing))
        for p in missing:
            print("  ?", p)

if __name__ == "__main__":
    main()
