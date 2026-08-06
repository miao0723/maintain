<?php

use think\migration\Migrator;

class AddImageToSpareParts extends Migrator
{
    public function change()
    {
        $table = $this->table('spare_parts');

        // 添加图片字段（如果是新字段）
        if (!$table->hasColumn('image_url')) {
            $table
                ->addColumn('image_url', 'string', [
                    'limit' => 500,
                    'null' => true,
                    'default' => null,
                    'after' => 'description',
                    'comment' => '配件图片URL',
                ])
                ->update();
        }
    }

    public function down()
    {
        $table = $this->table('spare_parts');
        if ($table->hasColumn('image_url')) {
            $table->removeColumn('image_url')->update();
        }
    }
}
