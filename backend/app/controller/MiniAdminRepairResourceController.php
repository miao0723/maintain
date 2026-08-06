<?php

namespace app\controller;

use app\common\Result;
use think\facade\Db;

class MiniAdminRepairResourceController extends MiniAdminBaseController
{
    protected string $table = '';
    protected array $fillable = [];
    protected array $searchable = [];
    protected array $likeFields = [];
    protected array $readonlyFields = ['id', 'created_at', 'updated_at'];
    protected bool $allowCreate = true;
    protected bool $allowDelete = true;

    public function index()
    {
        $page = (int) request()->get('page', 1);
        $pageSize = (int) request()->get('pageSize', 20);
        $keyword = trim((string) request()->get('keyword', ''));

        $query = Db::connect('repair')->name($this->table);
        if ($keyword !== '' && !empty($this->searchable)) {
            $query->where(function ($subQuery) use ($keyword) {
                foreach ($this->searchable as $index => $field) {
                    if ($index === 0) {
                        $subQuery->whereLike($field, '%' . $keyword . '%');
                    } else {
                        $subQuery->whereOrLike($field, '%' . $keyword . '%');
                    }
                }
            });
        }

        foreach ($this->searchable as $field) {
            $value = request()->get($field, null);
            if ($value === null || $value === '') {
                continue;
            }

            if (in_array($field, $this->likeFields, true)) {
                $query->whereLike($field, '%' . trim((string) $value) . '%');
            } else {
                $query->where($field, $value);
            }
        }

        $total = (clone $query)->count();
        $items = $query->order('id', 'desc')->page($page, $pageSize)->select()->toArray();

        return Result::success([
            'items' => $items,
            'total' => $total,
            'page' => $page,
            'pageSize' => $pageSize,
        ]);
    }

    public function read($id)
    {
        $item = Db::connect('repair')->name($this->table)->where('id', $id)->find();
        if (!$item) {
            return Result::error('记录不存在', 404);
        }

        return Result::success($item);
    }

    public function save()
    {
        if (!$this->allowCreate) {
            return Result::error('当前资源不支持创建', 405);
        }

        $data = $this->filterData($this->getRequestData());
        if (in_array('created_at', $this->fillable, true)) {
            $data['created_at'] = date('Y-m-d H:i:s');
        }
        if (in_array('updated_at', $this->fillable, true)) {
            $data['updated_at'] = date('Y-m-d H:i:s');
        }

        $id = Db::connect('repair')->name($this->table)->insertGetId($data);

        return Result::success(['id' => $id], '创建成功', 201);
    }

    public function update($id)
    {
        $item = Db::connect('repair')->name($this->table)->where('id', $id)->find();
        if (!$item) {
            return Result::error('记录不存在', 404);
        }

        $data = $this->filterData($this->getRequestData());
        if (in_array('updated_at', $this->fillable, true)) {
            $data['updated_at'] = date('Y-m-d H:i:s');
        }

        if (empty($data)) {
            return Result::success(null, '无变更');
        }

        Db::connect('repair')->name($this->table)->where('id', $id)->update($data);

        return Result::success(null, '更新成功');
    }

    public function delete($id)
    {
        if (!$this->allowDelete) {
            return Result::error('当前资源不支持删除', 405);
        }

        $item = Db::connect('repair')->name($this->table)->where('id', $id)->find();
        if (!$item) {
            return Result::error('记录不存在', 404);
        }

        Db::connect('repair')->name($this->table)->where('id', $id)->delete();

        return Result::success(null, '删除成功');
    }

    protected function filterData(array $data): array
    {
        $filtered = [];
        foreach ($this->fillable as $field) {
            if (in_array($field, $this->readonlyFields, true)) {
                continue;
            }
            if (array_key_exists($field, $data)) {
                $filtered[$field] = $data[$field];
            }
        }

        return $filtered;
    }
}
