<?php

use think\migration\Seeder;

class AdminSeeder extends Seeder
{
    public function run()
    {
        $password = password_hash('admin123', PASSWORD_BCRYPT);

        $this->table('users')->insert([
            [
                'id' => 1,
                'username' => 'admin',
                'password' => $password,
                'real_name' => '系统管理员',
                'phone' => '13800138000',
                'email' => 'admin@cmms.com',
                'role_type' => 1,
                'department_id' => null,
                'status' => 1,
                'last_login_at' => null,
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]
        ])->saveData();
    }
}
