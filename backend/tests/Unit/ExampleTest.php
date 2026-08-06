<?php

namespace Tests\Unit;

use Tests\BaseTestCase;

class ExampleTest extends BaseTestCase
{
    public function test_true_is_true()
    {
        $this->assertTrue(true);
    }

    public function test_array_equals()
    {
        $expected = ['foo' => 'bar'];
        $actual = ['foo' => 'bar'];
        $this->assertEquals($expected, $actual);
    }
}
