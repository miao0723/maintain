# 简化版本：创建客服头像
try:
    from PIL import Image, ImageDraw

    size = 200
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 圆形背景
    draw.ellipse([10, 10, 190, 190], fill=(102, 126, 234))

    # 机器人头部
    draw.ellipse([45, 45, 155, 155], fill=(255, 255, 255))

    # 眼睛
    draw.ellipse([60, 70, 90, 100], fill=(102, 126, 234))
    draw.ellipse([110, 70, 140, 100], fill=(102, 126, 234))

    # 眼睛高光
    draw.ellipse([68, 75, 78, 85], fill=(255, 255, 255))
    draw.ellipse([118, 75, 128, 85], fill=(255, 255, 255))

    # 微笑
    draw.arc([70, 95, 130, 125], 0, 180, fill=(118, 75, 162), width=4)

    # 天线
    draw.line([(100, 45), (100, 20)], fill=(118, 75, 162), width=4)
    draw.ellipse([92, 12, 108, 28], fill=(118, 75, 162))

    # 身体
    draw.ellipse([75, 145, 125, 185], fill=(255, 255, 255))
    draw.ellipse([92, 155, 108, 175], fill=(102, 126, 234))

    img.save('service-avatar-new.png', 'PNG')
    print("✅ 客服头像创建成功！")

except Exception as e:
    print(f"创建失败: {e}")
    print("请确保安装了Pillow库: pip install Pillow")
