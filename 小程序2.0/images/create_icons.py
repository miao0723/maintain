"""
生成底部导航栏图标文件
使用 Python PIL 库创建简单的图标
"""

from PIL import Image, ImageDraw
import os

def create_simple_icon(color, size=81):
    """创建纯色图标"""
    img = Image.new('RGB', (size, size), color)
    return img

def create_icon_with_circle(emoji, bg_color, size=81):
    """创建带圆形背景的图标"""
    img = Image.new('RGBA', (size, size), (255, 255, 255, 0))
    draw = ImageDraw.Draw(img)

    # 绘制圆形背景
    padding = 5
    draw.ellipse([padding, padding, size-padding, size-padding], fill=bg_color)

    return img

# 确保目录存在
os.makedirs('images', exist_ok=True)

# 颜色配置
gray = (153, 153, 153)      # 未选中颜色
purple = (102, 126, 234)    # 选中颜色

print('正在生成底部导航栏图标...\n')

icons = [
    ('home', gray, purple, '🏠'),
    ('repair', gray, purple, '🔧'),
    ('service', gray, purple, '💬'),
    ('mine', gray, purple, '👤')
]

for name, normal_color, active_color, emoji in icons:
    # 创建未选中状态的图标
    icon_normal = create_icon_with_circle(emoji, normal_color)
    icon_normal.save(f'images/{name}.png')
    print(f'✓ 创建: images/{name}.png')

    # 创建选中状态的图标
    icon_active = create_icon_with_circle(emoji, active_color)
    icon_active.save(f'images/{name}-active.png')
    print(f'✓ 创建: images/{name}-active.png')

print('\n✅ 所有图标创建完成！')
print('现在可以使用底部导航栏了。')
