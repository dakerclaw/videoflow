/**
 * 重新创建数据库文件（解决中文乱码问题）
 * 使用方法：node reset-db.js
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data/db.json');

// 备份旧数据库
if (fs.existsSync(dbPath)) {
  const backupPath = path.join(__dirname, `data/db.backup.${Date.now()}.json`);
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ 已备份旧数据库到: ${backupPath}`);
}

// 创建新的数据库文件（UTF-8 编码）
const defaultData = {
  users: [
    {
      id: require('uuid').v4(),
      username: 'dakerclaw',
      password: require('bcryptjs').hashSync('daker123', 10),
      contact: '',
      isAdmin: true,
      isDisabled: false,
      createdAt: new Date().toISOString()
    }
  ],
  videos: [],
  siteConfig: {
    id: 'site',
    title: 'Videoflow',
    name: 'Videoflow',
    description: '分享精彩视频瞬间',
    copyright: '© 2024 Videoflow. All rights reserved.',
    logo: ''
  }
};

fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
console.log('✅ 已重新创建数据库文件（UTF-8 编码）');
console.log('⚠️  注意：所有视频数据已清空，但视频文件仍保留在 uploads/ 目录');
console.log('⚠️  如需恢复数据，请使用备份文件：', dbPath.replace('.json', '.backup.*.json'));
