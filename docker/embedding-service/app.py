#!/usr/bin/env python3
"""
本地文本嵌入服务
使用 sentence-transformers 提供嵌入API
支持中文和英文文本
"""

import os
import logging
from typing import List, Union
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 全局模型变量
model = None
model_name = os.getenv('EMBEDDING_MODEL', 'BAAI/bge-large-zh-v1.5')

def load_model():
    """加载嵌入模型"""
    global model
    try:
        from sentence_transformers import SentenceTransformer
        logger.info(f"正在加载嵌入模型: {model_name}")
        model = SentenceTransformer(model_name)
        logger.info(f"嵌入模型加载成功, 维度: {model.get_sentence_embedding_dimension()}")
        return True
    except Exception as e:
        logger.error(f"模型加载失败: {e}")
        return False

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'model': model_name,
        'loaded': model is not None
    })

@app.route('/embed', methods=['POST'])
def embed():
    """文本嵌入接口"""
    if model is None:
        return jsonify({
            'error': 'Model not loaded',
            'message': '嵌入模型未加载'
        }), 500

    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Invalid request'}), 400

        inputs = data.get('inputs', [])

        if not inputs:
            return jsonify({'error': 'No inputs provided'}), 400

        # 确保inputs是列表
        if isinstance(inputs, str):
            inputs = [inputs]

        logger.info(f"处理 {len(inputs)} 个文本的嵌入请求")

        # 批量生成嵌入
        embeddings = model.encode(
            inputs,
            normalize_embeddings=True,  # 归一化，便于余弦相似度计算
            show_progress_bar=False
        )

        # 转换为列表格式
        if isinstance(embeddings, np.ndarray):
            embeddings = embeddings.tolist()

        # 返回格式兼容原有TEI服务
        response = {
            'data': embeddings
        }

        return jsonify(response)

    except Exception as e:
        logger.error(f"嵌入处理失败: {e}")
        return jsonify({
            'error': str(e),
            'message': '嵌入处理失败'
        }), 500

@app.route('/dimensions', methods=['GET'])
def dimensions():
    """获取嵌入维度"""
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500

    return jsonify({
        'dimensions': model.get_sentence_embedding_dimension()
    })

@app.route('/models', methods=['GET'])
def get_models():
    """获取支持的模型列表"""
    models = [
        'BAAI/bge-large-zh-v1.5',      # 中文优化，1024维
        'BAAI/bge-small-zh-v1.5',      # 中文优化，512维
        'shibing624/text2vec-base-chinese',  # 中文优化，768维
        'sentence-transformers/all-MiniLM-L6-v2',  # 英文优化，384维
        'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'  # 多语言，384维
    ]
    return jsonify({'models': models, 'current': model_name})

if __name__ == '__main__':
    # 启动时加载模型
    if load_model():
        port = int(os.getenv('PORT', '8080'))
        host = os.getenv('HOST', '0.0.0.0')
        logger.info(f"启动嵌入服务, 监听 {host}:{port}")
        app.run(host=host, port=port, threaded=True)
    else:
        logger.error("无法启动服务：模型加载失败")
        exit(1)
