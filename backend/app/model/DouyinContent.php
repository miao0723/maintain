<?php

namespace app\model;

use think\Model;

class DouyinContent extends Model
{
    protected $table = 'douyin_contents';

    protected $json = ['attachments', 'images'];

    protected $type = [
        'status' => 'integer',
        'publish_date' => 'datetime',
        'like_count' => 'integer',
        'comment_count' => 'integer',
        'share_count' => 'integer',
    ];

    public function author()
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
