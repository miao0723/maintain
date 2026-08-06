<?php

namespace app\model;

use think\Model;

class KbCollection extends Model
{
    protected $table = 'kb_collections';

    protected $json = [];

    protected $fillable = ['name', 'description', 'milvus_collection_name', 'icon', 'status', 'created_by'];

    public function files()
    {
        return $this->hasMany(KbFile::class, 'collection_id', 'id');
    }

    public function chatSessions()
    {
        return $this->hasMany(KbChatSession::class, 'collection_id', 'id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }
}
