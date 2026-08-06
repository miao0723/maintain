<?php

namespace app\model;

use think\Model;

class KbFile extends Model
{
    protected $table = 'kb_files';

    protected $json = [];

    protected $fillable = [
        'collection_id', 'original_name', 'stored_name', 'file_path', 'local_path',
        'file_type', 'file_size', 'mime_type', 'extracted_text',
        'text_char_count', 'chunk_count', 'chunk_status', 'chunk_error', 'uploaded_by'
    ];

    public function collection()
    {
        return $this->belongsTo(KbCollection::class, 'collection_id', 'id');
    }

    public function chunks()
    {
        return $this->hasMany(KbChunk::class, 'file_id', 'id');
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by', 'id');
    }
}
