# Python 脚本：创建现代化的客服头像
import os

try:
    from PIL import Image, ImageDraw, ImageFont
    import math

    def create_service_avatar():
        """创建现代化的客服机器人头像"""
        size = 200
        img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # 定义颜色
        bg_gradient_start = (102, 126, 234)  # #667eea
        bg_gradient_end = (118, 75, 162)    # #764ba2
        white = (255, 255, 255)
        eye_color = (102, 126, 234)
        pink = (255, 107, 157)

        # 绘制圆形背景
        for i in range(size):
            # 创建径向渐变效果
            for j in range(size):
                distance = math.sqrt((i - size//2)**2 + (j - size//2)**2)
                if distance <= 90:
                    # 渐变背景
                    ratio = distance / 90
                    r = int(bg_gradient_start[0] * (1 - ratio) + bg_gradient_end[0] * ratio)
                    g = int(bg_gradient_start[1] * (1 - ratio) + bg_gradient_end[1] * ratio)
                    b = int(bg_gradient_start[2] * (1 - ratio) + bg_gradient_end[2] * ratio)
                    draw.point((i, j), (r, g, b))

        # 绘制光晕效果
        for i in range(size):
            for j in range(size):
                distance = math.sqrt((i - size//2)**2 + (j - size//2)**2)
                if distance <= 80 and distance > 70:
                    alpha = int(40 * (1 - (distance - 70) / 10))
                    draw.point((i, j), (102, 126, 234, alpha))

        # 绘制机器人头部（圆角矩形）
        head_rect = (45, 50, 155, 135)
        draw.rounded_rectangle(head_rect, radius=25, fill=white, outline=(240, 240, 255), width=2)

        # 绘制天线
        draw.line([(100, 50), (100, 30)], fill=(118, 75, 162), width=4)
        draw.ellipse([92, 22, 108, 38], fill=(118, 75, 162))

        # 绘制眼睛
        draw.ellipse([63, 73, 87, 97], fill=eye_color)
        draw.ellipse([113, 73, 137, 97], fill=eye_color)

        # 绘制眼睛高光
        draw.ellipse([70, 78, 78, 86], fill=(255, 255, 255, 204))
        draw.ellipse([120, 78, 128, 86], fill=(255, 255, 255, 204))

        # 绘制微笑
        draw.arc([70, 100, 130, 125], 0, 180, fill=(118, 75, 162), width=4)

        # 绘制腮红
       腮红绘制 = [(58, 103, 68, 113), (132, 103, 142, 113)]
        for left, top, right, bottom in 腮红绘制:
            for i in range(left, right):
                for j in range(top, bottom):
                    # 椭圆效果
                    x_center, y_center = (left + right) / 2, (top + bottom) / 2
                    a, b = (right - left) / 2, (bottom - top) / 2
                    if ((i - x_center) / a) ** 2 + ((j - y_center) / b) ** 2 <= 1:
                        draw.point((i, j), pink + (76,))  # 半透明粉色

        # 绘制身体
        body_rect = (70, 135, 130, 170)
        draw.rounded_rectangle(body_rect, radius=10, fill=white, outline=(240, 240, 255), width=2)

        # 绘制身体装饰
        draw.ellipse([92, 147, 108, 163], fill=eye_color)

        # 绘制手臂
        draw.rounded_rectangle([40, 145, 65, 153], radius=4, fill=eye_color)
        draw.rounded_rectangle([135, 145, 160, 153], radius=4, fill=eye_color)

        # 保存文件
        output_path = os.path.join(os.path.dirname(__file__), 'service-avatar-new.png')
        img.save(output_path, 'PNG')
        print(f"✅ 新客服头像已创建: {output_path}")
        print("🤖 这是一个现代化的客服机器人头像设计")

        return output_path

    if __name__ == '__main__':
        create_service_avatar()

except ImportError:
    print("⚠️  需要安装PIL/Pillow库")
    print("请运行: pip install Pillow")
    print("\n或者使用PowerShell脚本生成头像")
