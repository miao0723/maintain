# 自动发布服务：Python + FastAPI + Playwright
# 使用官方 Playwright 镜像（Chromium 内核与系统依赖已预装，
# 避免构建时再从 CDN 下载浏览器）。pip 安装的 playwright 版本
# 必须与镜像 tag 一致，否则会找不到浏览器内核。
FROM mcr.microsoft.com/playwright/python:v1.49.0-noble

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Shanghai

WORKDIR /app

# =======================================
# 国内镜像源加速（apt 用阿里云、pip 用中科大）
# =======================================
RUN sed -i 's|http://archive.ubuntu.com|https://mirrors.aliyun.com|g; s|http://security.ubuntu.com|https://mirrors.aliyun.com|g' /etc/apt/sources.list.d/ubuntu.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends fonts-noto-cjk tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && ln -fs /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

COPY requirements.txt /tmp/requirements.txt

RUN pip config set global.index-url https://mirrors.ustc.edu.cn/pypi/web/simple/ \
    && pip config set global.trusted-host mirrors.ustc.edu.cn \
    && pip install --no-cache-dir --default-timeout=300 --retries=5 \
        "playwright==1.49.0" -r /tmp/requirements.txt

COPY main.py /app/main.py
COPY app /app/app

# 数据目录（SQLite、浏览器用户数据、截图、日志）单独挂卷持久化
ENV PUBLISHER_DATA_DIR=/app/data
RUN mkdir -p /app/data

EXPOSE 8899

CMD ["python", "main.py"]
