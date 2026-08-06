FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3-dev \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements并安装Python依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY app.py .

# 创建模型缓存目录
RUN mkdir -p /root/.cache/torch /root/.cache/huggingface

# 暴露端口
EXPOSE 8080

# 启动命令
CMD ["python", "app.py"]
