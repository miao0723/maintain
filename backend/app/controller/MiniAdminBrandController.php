<?php

namespace app\controller;

class MiniAdminBrandController extends MiniAdminRepairResourceController
{
    protected string $table = 'brands';
    protected array $fillable = ['name', 'created_at'];
    protected array $searchable = ['name'];
    protected array $likeFields = ['name'];
}
