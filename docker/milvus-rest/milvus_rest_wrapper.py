#!/usr/bin/env python3
"""
Milvus REST API 包装器
使用pymilvus提供REST API接口，解决Milvus v2.3.10不提供REST API的问题
"""

import sys
import os
import json
import traceback
from flask import Flask, request, jsonify, g
from flask_cors import CORS

try:
    from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, utility
except ImportError:
    print("错误: pymilvus未安装", file=sys.stderr)
    print("请运行: pip install pymilvus flask flask-cors", file=sys.stderr)
    sys.exit(1)

app = Flask(__name__)
CORS(app)

# 连接配置
MILVUS_HOST = os.getenv('MILVUS_HOST', 'localhost')
MILVUS_PORT = os.getenv('MILVUS_PORT', '19530')

# 连接Milvus
def connect_milvus():
    """确保已连接到Milvus"""
    if not hasattr(g, 'connected'):
        try:
            connections.connect("default", host=MILVUS_HOST, port=MILVUS_PORT)
            g.connected = True
            print(f"成功连接到Milvus: {MILVUS_HOST}:{MILVUS_PORT}", file=sys.stderr)
        except Exception as e:
            print(f"连接Milvus失败: {e}", file=sys.stderr)
            raise

@app.before_request
def before_request():
    """请求前处理"""
    connect_milvus()

@app.teardown_appcontext
def teardown_appcontext(exception):
    """请求后清理"""
    if hasattr(g, 'connected') and g.connected:
        try:
            connections.disconnect("default")
        except Exception:
            pass

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({"status": "ok", "milvus_host": MILVUS_HOST, "milvus_port": MILVUS_PORT})

@app.route('/api/v1/collections/describe', methods=['POST'])
def describe_collection():
    """描述集合"""
    try:
        data = request.json
        collection_name = data.get('collectionName')

        if not collection_name:
            return jsonify({"code": 1, "message": "缺少collectionName参数"}), 400

        collections = utility.list_collections()
        if collection_name not in collections:
            return jsonify({"code": 1, "message": "集合不存在"}), 404

        collection = Collection(collection_name)
        # 加载集合以获取准确信息
        try:
            collection.load()
        except Exception:
            pass

        description = {
            "name": collection_name,
            "dimension": 1024,
            "count": collection.num_entities,
            "metricType": "COSINE",
            "indexType": "IVF_FLAT"
        }

        return jsonify({"code": 0, "data": description, "message": "success"})
    except Exception as e:
        error_msg = str(e)
        print(f"describe_collection错误: {error_msg}\n{traceback.format_exc()}", file=sys.stderr)
        return jsonify({"code": 1, "message": error_msg}), 500

@app.route('/api/v1/collections/create', methods=['POST'])
def create_collection():
    """创建集合"""
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
            # 集合已存在，返回成功
            return jsonify({"code": 0, "message": "集合已存在"})

        # 定义schema
        fields = [
            FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
            FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=dimension),
            FieldSchema(name="chunk_id", dtype=DataType.VARCHAR, max_length=255),
            FieldSchema(name="collection_id", dtype=DataType.INT64)
        ]

        schema = CollectionSchema(fields, description=collection_name)

        # 创建集合
        collection = Collection(name=collection_name, schema=schema)

        # 创建索引
        index_params = {
            "index_type": index_type,
            "metric_type": metric_type,
            "params": params
        }
        collection.create_index(field_name="vector", index_params=index_params)

        print(f"成功创建集合: {collection_name}", file=sys.stderr)
        return jsonify({"code": 0, "message": "success"})
    except Exception as e:
        error_msg = str(e)
        print(f"create_collection错误: {error_msg}\n{traceback.format_exc()}", file=sys.stderr)
        return jsonify({"code": 1, "message": error_msg}), 500

@app.route('/api/v1/collections/drop', methods=['POST'])
def drop_collection():
    """删除集合"""
    try:
        data = request.json
        collection_name = data.get('collectionName')

        if not collection_name:
            return jsonify({"code": 1, "message": "缺少collectionName参数"}), 400

        utility.drop_collection(collection_name)
        print(f"成功删除集合: {collection_name}", file=sys.stderr)
        return jsonify({"code": 0, "message": "success"})
    except Exception as e:
        error_msg = str(e)
        print(f"drop_collection错误: {error_msg}\n{traceback.format_exc()}", file=sys.stderr)
        return jsonify({"code": 1, "message": error_msg}), 500

@app.route('/api/v1/collections/insert', methods=['POST'])
def insert_data():
    """插入数据"""
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
            chunk_ids.append(item.get('chunk_id', ''))
            collection_ids.append(item.get('collection_id', 0))

        if not vectors:
            return jsonify({"code": 1, "message": "没有数据"}), 400

        # 插入数据
        collection.insert([
            vectors,
            chunk_ids,
            collection_ids
        ])

        print(f"成功插入 {len(vectors)} 条数据到 {collection_name}", file=sys.stderr)
        return jsonify({"code": 0, "data": [], "message": "success"})
    except Exception as e:
        error_msg = str(e)
        print(f"insert_data错误: {error_msg}\n{traceback.format_exc()}", file=sys.stderr)
        return jsonify({"code": 1, "message": error_msg}), 500

@app.route('/api/v1/collections/delete', methods=['POST'])
def delete_data():
    """删除数据"""
    try:
        data = request.json
        collection_name = data.get('collectionName')
        filter_expr = data.get('filter', '')

        if not collection_name:
            return jsonify({"code": 1, "message": "缺少collectionName参数"}), 400

        if not filter_expr:
            return jsonify({"code": 1, "message": "缺少filter参数"}), 400

        collection = Collection(collection_name)
        collection.delete(expr=filter_expr)

        print(f"成功删除数据 from {collection_name}, filter: {filter_expr}", file=sys.stderr)
        return jsonify({"code": 0, "message": "success"})
    except Exception as e:
        error_msg = str(e)
        print(f"delete_data错误: {error_msg}\n{traceback.format_exc()}", file=sys.stderr)
        return jsonify({"code": 1, "message": error_msg}), 500

@app.route('/api/v1/collections/search', methods=['POST'])
def search_data():
    """搜索数据"""
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

        # 确保集合已加载
        try:
            collection.load()
        except Exception:
            pass

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
        if results and len(results) > 0:
            for hit in results[0]:
                result = {
                    'distance': hit.distance,
                    'chunk_id': hit.entity.get('chunk_id', ''),
                    'collection_id': hit.entity.get('collection_id', 0)
                }
                formatted_results.append(result)

        print(f"成功搜索，返回 {len(formatted_results)} 条结果", file=sys.stderr)
        return jsonify({"code": 0, "data": [formatted_results], "message": "success"})
    except Exception as e:
        error_msg = str(e)
        print(f"search_data错误: {error_msg}\n{traceback.format_exc()}", file=sys.stderr)
        return jsonify({"code": 1, "message": error_msg}), 500

@app.route('/api/v1/collections', methods=['GET'])
def list_collections():
    """列出所有集合"""
    try:
        collections = utility.list_collections()
        collection_info = []

        for coll_name in collections:
            try:
                collection = Collection(coll_name)
                collection.load()
                info = {
                    "name": coll_name,
                    "dimension": 1024,
                    "count": collection.num_entities
                }
                collection_info.append(info)
            except Exception as e:
                print(f"获取集合 {coll_name} 信息失败: {e}", file=sys.stderr)

        return jsonify({"code": 0, "data": collection_info, "message": "success"})
    except Exception as e:
        error_msg = str(e)
        print(f"list_collections错误: {error_msg}\n{traceback.format_exc()}", file=sys.stderr)
        return jsonify({"code": 1, "message": error_msg}), 500

if __name__ == '__main__':
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', '8080'))

    print(f"启动Milvus REST API包装服务...", file=sys.stderr)
    print(f"连接Milvus: {MILVUS_HOST}:{MILVUS_PORT}", file=sys.stderr)
    print(f"监听端口: {host}:{port}", file=sys.stderr)
    app.run(host=host, port=port, threaded=True)
