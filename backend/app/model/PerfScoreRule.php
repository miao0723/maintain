<?php

namespace app\model;

use think\Model;

/**
 * 绩效评分规则模型
 */
class PerfScoreRule extends Model
{
    protected $table = 'perf_score_rules';

    protected $fillable = [
        'indicator_key',
        'indicator_name',
        'weight',
        'direction',
        'target_value',
        'pass_value',
        'unit',
        'enabled',
        'sort',
    ];

    protected $guarded = ['id', 'created_at', 'updated_at'];

    protected $type = [
        'weight'      => 'float',
        'target_value' => 'float',
        'enabled'     => 'integer',
        'sort'        => 'integer',
    ];
}
