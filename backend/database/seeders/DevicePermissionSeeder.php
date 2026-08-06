<?php

use think\migration\Seeder;

class DevicePermissionSeeder extends Seeder
{
    public function run()
    {
        $this->table('permissions')->insert([
            [
                'user_id' => 1,
                'module' => 'devices',
                'actions' => json_encode(['view', 'create', 'update', 'delete']),
                'created_at' => date('Y-m-d H:i:s'),
            ]
        ])->saveData();
    }
}
