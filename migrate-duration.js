/**
 * 一键迁移脚本：为已有视频补上时长久
 * 用法：
 *   1. 在 Docker 容器内运行：docker compose exec videoflow node migrate-duration.js
 *   2. 或直接在服务器上运行：node migrate-duration.js
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const dbPath = path.join(__dirname, 'data/db.json');
const uploadsDir = path.join(__dirname, 'uploads/videos');

// 读取数据库
function loadDB() {
  if (!fs.existsSync(dbPath)) {
    console.error('数据库文件不存在:', dbPath);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
}

// 用 ffprobe 获取视频时长（秒）
function getVideoDuration(filePath) {
  return new Promise((resolve) => {
    const proc = spawn('ffprobe', [
      '-v', 'quiet',
      '-print_format', 'json',
      '-show_format',
      filePath
    ]);

    let output = '';
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.on('close', (code) => {
      if (code !== 0) return resolve(0);
      try {
        const info = JSON.parse(output);
        const duration = Math.round(parseFloat(info.format.duration) || 0);
        resolve(duration);
      } catch (e) {
        resolve(0);
      }
    });
    proc.on('error', () => resolve(0));
  });
}

// 主函数
async function main() {
  console.log('========================================');
  console.log('  视频时长迁移脚本');
  console.log('========================================\n');

  const db = loadDB();
  const videos = db.videos || [];

  // 找出没有 duration 的视频
  const needUpdate = videos.filter(v => !v.duration || v.duration <= 0);

  if (needUpdate.length === 0) {
    console.log('✅ 所有视频已有时长数据，无需迁移。');
    return;
  }

  console.log(`发现 ${needUpdate.length} 个视频需要补上时长：\n`);

  let updated = 0;
  let failed = 0;

  for (const video of needUpdate) {
    const videoPath = path.join(__dirname, video.filePath || '');

    if (!fs.existsSync(videoPath)) {
      console.log(`  ⚠️  文件不存在，跳过: ${video.title} (${video.filePath})`);
      failed++;
      continue;
    }

    process.stdout.write(`  处理: ${video.title} ... `);

    const duration = await getVideoDuration(videoPath);

    if (duration > 0) {
      video.duration = duration;
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      console.log(`✅ ${mins}:${String(secs).padStart(2, '0')}`);
      updated++;
    } else {
      console.log(`❌ 无法读取时长`);
      failed++;
    }
  }

  // 保存数据库
  if (updated > 0) {
    saveDB(db);
    console.log(`\n========================================`);
    console.log(`  迁移完成！`);
    console.log(`  成功: ${updated} 个`);
    console.log(`  失败: ${failed} 个`);
    console.log(`========================================`);
  } else {
    console.log(`\n未成功更新任何视频。`);
  }
}

main().catch(console.error);
