"""
生成底部导航栏占位图标
需要安装 Pillow 库: pip install Pillow
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(color, size=81):
    """创建纯色图标"""
    img = Image.new('RGBA', (size, size), color)
    return img

def create_icon_with_text(text, bg_color, text_color, size=81):
    """创建带文字的图标"""
    img = Image.new('RGBA', (size, size), bg_color)
    draw = ImageDraw.Draw(img)

    # 使用默认字体
    try:
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        font = ImageFont.load_default()

    # 获取文字边界框
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]

    # 计算居中位置
    x = (size - text_width) // 2
    y = (size - text_height) // 2 - 3

    draw.text((x, y), text, fill=text_color, font=font)
    return img

# 确保目录存在
os.makedirs('images', exist_ok=True)

# 图标配置
icons = [
    ('home', '🏠'),
    ('repair', '🔧'),
    ('service', '💬'),
    ('mine', '👤')
]

# 颜色配置
normal_color = (153, 153, 153, 255)  # #999999 灰色
active_color = (102, 126, 234, 255)  # #667eea 紫色

print('正在生成图标文件...')

# 生成图标
for name, emoji in icons:
    # 正常状态（灰色背景+白色emoji）
    icon_normal = create_icon_with_text(emoji, normal_color, (255, 255, 255, 255))
    icon_normal.save(f'images/{name}.png')
    print(f'✓ 已生成: images/{name}.png')

    # 选中状态（紫色背景+白色emoji）
    icon_active = create_icon_with_text(emoji, active_color, (255, 255, 255, 255))
    icon_active.save(f'images/{name}-active.png')
    print(f'✓ 已生成: images/{name}-active.png')

print('\n✅ 所有图标生成完成！')
print('图标文件已保存到 images 文件夹')
