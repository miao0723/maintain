// 在浏览器控制台执行此命令以清理无效的localStorage数据

console.log('🔧 开始清理localStorage...')

// 清理所有可能无效的数据
const itemsToRemove = ['token', 'userInfo', 'permissions']

itemsToRemove.forEach(key => {
  const value = localStorage.getItem(key)
  console.log(`检查 ${key}:`, value)

  if (value === 'undefined' || value === 'null' || value === null) {
    localStorage.removeItem(key)
    console.log(`✅ 已清理 ${key}`)
  }
})

// 验证清理结果
console.log('\n✨ 清理完成！当前localStorage状态:')
console.log('token:', localStorage.getItem('token'))
console.log('userInfo:', localStorage.getItem('userInfo'))
console.log('permissions:', localStorage.getItem('permissions'))

console.log('\n🔄 请刷新页面 (F5 或 Ctrl+R)')
