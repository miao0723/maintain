#!/usr/bin/env python3
"""
Milvus REST API 包装器
使用pymilvus提供REST API接口
"""

import sys
import json
from flask import Flask, request, jsonify

try:
    from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, utility
except ImportError:
    print("错误: pymilvus未安装", file=sys.stderr)
    print("请运行: pip install pymilvus flask", file=sys.stderr)
    sys.exit(1)

app = Flask(__name__)

# 连接Milvus
try:
    connections.connect("default", host="localhost", port="19530")
    print("成功连接到Milvus", file=sys.stderr)
except Exception as e:
    print(f"连接Milvus失败: {e}", file=sys.stderr)
    sys.exit(1)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/collections/describe', methods=['POST'])
def describe_collection():
    try:
        data = request.json
        collection_name = data.get('collectionName')

        if not collection_name:
            return jsonify({"code": 1, "message": "缺少collectionName参数"}), 400

        collections = utility.list_collections()
        if collection_name not in collections:
            return jsonify({"code": 1, "message": "集合不存在"}), 404

        collection = Collection(collection_name)
        description = {
            "name": collection_name,
            "dimension": 1024,
            "count": collection.num_entities
        }

        return jsonify({"code": 0, "data": description, "message": "success"})
    except Exception as e:
        return jsonify({"code": 1, "message": str(e)}), 500

@app.route('/collections/create', methods=['POST'])
def create_collection():
    try:
        data = request.json
        collection_name = data.get('collectionName')
        dimension = data.get('dimension', 1024)
        metric_type = data.get('metricType', 'COSINE')
        index_type = data.get('indexType', 'IVF_FLAT')
        params = data.get('params', {})

        if not collection_name:
            return jsonify({"code": 1, "message": "缺少collectionName参数"}), 400

        # 检查是否已存在
        collections = utility.list_collections()
        if collection_name in collections:
            return jsonify({"code": 1, "message": "集合已存在"}), 400

        # 定义schema
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=dimension),
            FieldSchema(name="chunk_id", dtype=DataType.VARCHAR, max_length=255),
            FieldSchema(name="collection_id", dtype=DataType.INT64)
        ]

        schema = CollectionSchema(fields, description=collection_name)

        # 创建集合
        collection = Collection(name, schema)

        # 创建索引
        index_params = {
            "index_type": index_type,
            "metric_type": metric_type,
            "params": params
        }
        collection.create_index(field_name="vector", index_params=index_params)

        return jsonify({"code": 0, "message": "success"})
    except Exception as e:
        return jsonify({"code": 1, "message": str(e)}), 500

@app.route('/collections/drop', methods=['POST'])
def drop_collection():
    try:
        data = request.json
        collection_name = data.get('collectionName')

        if not collection_name:
            return jsonify({"code": 1, "message": "缺少collectionName参数"}), 400

        utility.drop_collection(collection_name)

        return jsonify({"code": 0, "message": "success"})
    except Exception as e:
        return jsonify({"code": 1, "message": str(e)}), 500

@app.route('/collections/insert', methods=['POST'])
def insert_data():
    try:
        data = request.json
        collection_name = data.get('collectionName')
        vectors_data = data.get('data', [])

        if not collection_name:
            return jsonify({"code": 1, "message": "缺少collectionName参数"}), 400

        collection = Collection(collection_name)

        # 准备数据
        vectors = []
        chunk_ids = []
        collection_ids = []

        for item in vectors_data:
            vectors.append(item['vector'])
            chunk_ids.append(item['chunk_id'])
            collection_ids.append(item['collection_id'])

        # 插入数据
        collection.insert([
            vectors,
            chunk_ids,
            collection_ids
        ])

        return jsonify({"code": 0, "data": [], "message": "success"})
    except Exception as e:
        return jsonify({"code": 1, "message": str(e)}), 500

@app.route('/collections/delete', methods=['POST'])
def delete_data():
    try:
        data = request.json
        collection_name = data.get('collectionName')
        filter_expr = data.get('filter')

        if not collection_name:
            return jsonify({"code": 1, "message": "缺少collectionName参数"}), 400

        collection = Collection(collection_name)
        collection.delete(filter_expr)

        return jsonify({"code": 0, "message": "success"})
    except Exception as e:
        return jsonify({"code": 1, "message": str(e)}), 500

@app.route('/collections/search', methods=['POST'])
def search_data():
    try:
        data = request.json
        collection_name = data.get('collectionName')
        query_vectors = data.get('data', [])
        limit = data.get('limit', 5)
        filter_expr = data.get('filter', '')
        output_fields = data.get('outputFields', ['chunk_id', 'collection_id'])

        if not collection_name:
            return jsonify({"code": 1, "message": "缺少collectionName参数"}), 400

        if not query_vectors:
            return jsonify({"code": 1, "message": "缺少查询向量"}), 400

        collection = Collection(collection_name)

        # 执行搜索
        search_params = {
            "metric_type": "COSINE",
            "params": {"nprobe": 10}
        }

        results = collection.search(
            data=query_vectors,
            anns_field="vector",
            param=search_params,
            limit=limit,
            output_fields=output_fields
        )

        # 格式化结果
        formatted_results = []
        for hits in results:
            for hit in hits:
                result = {
                    'distance': hit.distance,
                    'chunk_id': hit.entity.get('chunk_id'),
                    'collection_id': hit.entity.get('collection_id')
                }
                formatted_results.append(result)

        return jsonify({"code": 0, "data": [formatted_results], "message": "success"})
    except Exception as e:
        return jsonify({"code": 1, "message": str(e)}), 500

if __name__ == '__main__':
    print("启动Milvus REST API包装服务...", file=sys.stderr)
    print("监听端口: 8080", file=sys.stderr)
    app.run(host='0.0.0.0', port=8080)
