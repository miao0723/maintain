FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

ENV PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
ENV PIP_TRUSTED_HOST=pypi.tuna.tsinghua.edu.cn
# =======================================

COPY agent-service/requirements.txt /tmp/requirements.txt

# 安装依赖（带超时保护）
# 使用中科大镜像源，并配置超时和重试
RUN pip config set global.index-url https://mirrors.ustc.edu.cn/pypi/web/simple/ \
    && pip config set global.trusted-host mirrors.ustc.edu.cn \
    && pip install --upgrade pip \
    && pip install --no-cache-dir -r /tmp/requirements.txt --default-timeout=300 --retries=5


COPY agent-service /app

EXPOSE 8001

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8001"]
