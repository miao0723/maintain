<?php

namespace app\model;

use think\Model;

class Partner extends Model
{
    protected $table = 'partners';

    protected $json = ['attachments', 'images'];

    protected $type = [
        'status' => 'integer',
        'cooperation_date' => 'date',
    ];

    public function externalRepairs()
    {
        return $this->hasMany(ExternalRepair::class, 'partner_id');
    }
}
