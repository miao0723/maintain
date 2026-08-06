#!/usr/bin/env python3
"""
简单的嵌入测试脚本
在本地测试嵌入功能
"""
import os
import sys

try:
    from sentence_transformers import SentenceTransformer
    print("sentence-transformers已安装")

    print("正在加载模型...")
    model = SentenceTransformer('BAAI/bge-large-zh-v1.5')
    print(f"模型加载成功，维度: {model.get_sentence_embedding_dimension()}")

    # 测试嵌入
    test_text = "这是一个测试文本"
    embedding = model.encode([test_text], normalize_embeddings=True)
    print(f"嵌入向量维度: {len(embedding[0])}")
    print(f"前5个值: {embedding[0][:5]}")

    print("\n模型安装成功，可以启动嵌入服务")

except ImportError as e:
    print(f"缺少依赖: {e}")
    print("\n请安装依赖:")
    print("pip install sentence-transformers torch numpy flask flask-cors")
    sys.exit(1)
except Exception as e:
    print(f"错误: {e}")
    sys.exit(1)
