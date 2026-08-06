<?php

namespace app\model;

use think\Model;

class KbChatMessage extends Model
{
    protected $table = 'kb_chat_messages';

    protected $json = ['source_refs'];

    protected $fillable = [
        'session_id', 'role', 'content', 'image_url', 'source_refs', 'model_used', 'token_count'
    ];

    public function session()
    {
        return $this->belongsTo(KbChatSession::class, 'session_id', 'id');
    }
}
