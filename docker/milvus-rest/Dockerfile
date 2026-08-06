FROM python:3.10-slim

WORKDIR /app

# 安装依赖
RUN pip install --no-cache-dir pymilvus flask flask-cors

# 复制应用代码
COPY milvus_rest_wrapper.py /app/

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["python", "milvus_rest_wrapper.py"]
