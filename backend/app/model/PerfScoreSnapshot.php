<?php

namespace app\model;

use think\Model;

/**
 * 绩效得分快照模型（历史成绩可追溯）
 */
class PerfScoreSnapshot extends Model
{
    protected $table = 'perf_score_snapshots';

    protected $fillable = [
        'period_label',
        'dimension',
        'ref_id',
        'ref_name',
        'team',
        'on_time_rate',
        'avg_duration',
        'completed_count',
        'rework_rate',
        'first_fix_rate',
        'avg_review',
        'qualified_rate',
        'score',
        'is_standard',
        'rank',
    ];

    protected $guarded = ['id', 'created_at'];

    protected $type = [
        'ref_id'         => 'integer',
        'completed_count' => 'integer',
        'on_time_rate'   => 'float',
        'avg_duration'   => 'float',
        'rework_rate'    => 'float',
        'first_fix_rate' => 'float',
        'avg_review'     => 'float',
        'qualified_rate' => 'float',
        'score'          => 'float',
        'rank'           => 'integer',
    ];
}
