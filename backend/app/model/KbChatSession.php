<?php

namespace app\model;

use think\Model;

class KbChatSession extends Model
{
    protected $table = 'kb_chat_sessions';

    protected $json = [];

    protected $fillable = [
        'collection_id', 'user_id', 'title', 'message_count', 'last_message_at'
    ];

    public function collection()
    {
        return $this->belongsTo(KbCollection::class, 'collection_id', 'id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }

    public function messages()
    {
        return $this->hasMany(KbChatMessage::class, 'session_id', 'id');
    }
}
