#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
为配件生成图片的脚本
执行方式：python database/generate_spare_part_images.py
"""

import os
import time
import mysql.connector
from pathlib import Path

# 配置数据库连接
DB_CONFIG = {
    'host': 'localhost',
    'database': 'cmms_db',
    'user': 'root',
    'password': ''
}

# 根据分类ID选择不同颜色
COLORS = {
    101: '#4CAF50',  # 绿色 - 滤芯类
    102: '#2196F3',  # 蓝色 - 电子元件
    103: '#FF9800',  # 橙色 - 机械零件
}

def adjust_brightness(hex_color, percent):
    """调整颜色亮度"""
    hex_color = hex_color.lstrip('#')
    r = int(hex_color[0:2], 16)
    g = int(hex_color[2:4], 16)
    b = int(hex_color[4:6], 16)

    r = min(255, max(0, int(r + r * percent / 100)))
    g = min(255, max(0, int(g + g * percent / 100)))
    b = min(255, max(0, int(b + b * percent / 100)))

    return f'#{r:02X}{g:02X}{b:02X}'

def generate_svg(part_id, part_name, part_code, category_id, upload_dir):
    """生成配件SVG图片"""
    color = COLORS.get(category_id, '#607D8B')
    light_color = adjust_brightness(color, 40)

    # 生成唯一文件名
    filename = f'part_{part_id}_{int(time.time())}.svg'
    file_path = os.path.join(upload_dir, filename)
    relative_path = f'/uploads/parts/{filename}'

    # 截取配件名称用于显示
    display_name = part_name[:8] + '...' if len(part_name) > 8 else part_name
    initials = part_name[:2] if len(part_name) >= 2 else part_name

    # 创建SVG内容
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{light_color};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{color};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="200" height="200" rx="16" fill="url(#bg-gradient)" />
  <rect width="200" height="200" rx="16" fill="{color}" opacity="0.1" />
  <circle cx="100" cy="80" r="35" fill="white" opacity="0.9" />
  <text x="100" y="90" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="{color}">{initials}</text>
  <rect x="20" y="130" width="160" height="40" rx="8" fill="white" opacity="0.95" />
  <text x="100" y="155" text-anchor="middle" font-family="Microsoft YaHei, Arial, sans-serif" font-size="12" fill="#333">{display_name}</text>
  <text x="100" y="175" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#666">{part_code}</text>
</svg>'''

    # 保存文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)

    return relative_path

def main():
    """主函数"""
    try:
        # 连接数据库
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        # 查询所有没有图片的配件
        cursor.execute("SELECT id, part_name, part_code, category_id FROM spare_parts WHERE image_url IS NULL OR image_url = ''")
        parts = cursor.fetchall()

        if not parts:
            print("没有需要生成图片的配件")
            return

        print(f"找到 {len(parts)} 个需要生成图片的配件")

        # 确保上传目录存在
        script_dir = Path(__file__).parent
        upload_dir = os.path.join(script_dir, 'public', 'uploads', 'parts')
        os.makedirs(upload_dir, exist_ok=True)
        print(f"上传目录: {upload_dir}")

        # 为每个配件生成图片
        for part in parts:
            try:
                image_url = generate_svg(
                    part['id'],
                    part['part_name'],
                    part['part_code'],
                    part['category_id'],
                    upload_dir
                )

                # 更新数据库
                cursor.execute(
                    "UPDATE spare_parts SET image_url = %s, updated_at = NOW() WHERE id = %s",
                    (image_url, part['id'])
                )
                conn.commit()
                print(f"已生成图片: {part['part_name']} -> {image_url}")

            except Exception as e:
                print(f"生成图片失败: {part['part_name']} - {str(e)}")
                conn.rollback()

        print("\n完成！")

    except mysql.connector.Error as e:
        print(f"数据库连接失败: {str(e)}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    main()
