<?php

namespace app\model;

use think\Model;

class KbChunk extends Model
{
    protected $table = 'kb_chunks';

    protected $json = [];

    protected $fillable = [
        'file_id', 'collection_id', 'chunk_index', 'content', 'char_count', 'milvus_id'
    ];

    public function file()
    {
        return $this->belongsTo(KbFile::class, 'file_id', 'id');
    }

    public function collection()
    {
        return $this->belongsTo(KbCollection::class, 'collection_id', 'id');
    }
}
