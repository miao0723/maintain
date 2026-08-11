<?php

namespace app\model;

use think\Model;

class Attachment extends Model
{
    protected $table = 'attachments';

    protected $pk = 'id';

    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';

    protected $fillable = [
        'target_type', 'target_id', 'category',
        'file_name', 'file_path', 'file_size',
        'folder_id', 'tags', 'remark',
        'is_active',
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    /**
     * 是否激活（软删除查询范围）
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }
}
