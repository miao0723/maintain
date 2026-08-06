#!/usr/bin/env python3
"""
测试使用pymilvus连接Milvus
"""

import sys

try:
    from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, utility
except ImportError:
    print("pymilvus未安装，正在安装...")
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "pymilvus"])
    from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType, utility

print("=== 测试Milvus连接 (使用pymilvus) ===\n")

# 连接Milvus
try:
    connections.connect("default", host="localhost", port="19530")
    print("✅ 成功连接到Milvus")
except Exception as e:
    print(f"❌ 连接失败: {e}")
    sys.exit(1)

# 检查现有集合
try:
    collections = utility.list_collections()
    print(f"\n现有集合数量: {len(collections)}")
    if collections:
        print("集合列表:")
        for coll_name in collections:
            print(f"  - {coll_name}")
            try:
                coll = Collection(coll_name)
                coll.load()
                print(f"    实体数量: {coll.num_entities}")
            except Exception as e:
                print(f"    错误: {e}")
except Exception as e:
    print(f"获取集合失败: {e}")

# 测试创建集合
try:
    collection_name = "test_python_kb"

    # 如果集合已存在，删除它
    if collection_name in collections:
        utility.drop_collection(collection_name)
        print(f"\n删除已存在的测试集合: {collection_name}")

    # 定义schema
    fields = [
        FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
        FieldSchema(name="vector", dtype=DataType.FLOAT_VECTOR, dim=1024),
        FieldSchema(name="chunk_id", dtype=DataType.VARCHAR, max_length=255),
        FieldSchema(name="collection_id", dtype=DataType.INT64)
    ]

    schema = CollectionSchema(fields, description="测试知识库集合")

    # 创建集合
    collection = Collection(collection_name, schema)
    print(f"✅ 成功创建集合: {collection_name}")

    # 创建索引
    index_params = {
        "index_type": "IVF_FLAT",
        "metric_type": "COSINE",
        "params": {"nlist": 128}
    }
    collection.create_index(field_name="vector", index_params=index_params)
    print("✅ 成功创建索引")

    # 加载集合
    collection.load()
    print("✅ 成功加载集合")

except Exception as e:
    print(f"创建集合失败: {e}")

# 测试插入数据
try:
    import random
    # 生成随机向量
    vectors = [[random.random() for _ in range(1024)] for _ in range(3)]
    data = [
        vectors,
        ["chunk_1", "chunk_2", "chunk_3"],
        [1, 2, 3]
    ]

    collection.insert(data)
    print("✅ 成功插入测试数据")
except Exception as e:
    print(f"插入数据失败: {e}")

# 测试搜索
try:
    search_params = {
        "metric_type": "COSINE",
        "params": {"nprobe": 10}
    }
    results = collection.search(
        data=[[random.random() for _ in range(1024)]],
        anns_field="vector",
        param=search_params,
        limit=3,
        output_fields=["chunk_id", "collection_id"]
    )
    print(f"✅ 成功执行搜索，返回 {len(results[0])} 条结果")
except Exception as e:
    print(f"搜索失败: {e}")

# 断开连接
connections.disconnect("default")
print("\n✅ 断开连接")
print("\n=== 测试完成 ===")
