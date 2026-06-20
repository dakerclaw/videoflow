const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const { userDb, videoDb, configDb, jwtUtil } = require('./db/database');
const { authMiddleware, adminMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3291;

// 中间件
// 设置字符编码（解决中文乱码问题）
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// 确保上传目录存在
const videosDir = path.join(__dirname, 'uploads/videos');
const thumbnailsDir = path.join(__dirname, 'uploads/thumbnails');
if (!fs.existsSync(videosDir)) fs.mkdirSync(videosDir, { recursive: true });
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir, { recursive: true });

// 配置视频上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, videosDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    // 视频文件
    if (file.fieldname === 'videos') {
      if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('只支持视频文件格式'));
      }
    }
    // 缩略图文件（支持 thumbnail_0 到 thumbnail_9）
    else if (file.fieldname.startsWith('thumbnail_')) {
      if (['.jpg', '.jpeg', '.png', '.webp', '.svg'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('缩略图只支持 JPG/PNG/WEBP/SVG 格式'));
      }
    }
    else {
      cb(new Error(`不支持的文件字段: ${file.fieldname}`));
    }
  }
});

// ==================== 认证路由 ====================

// 用户注册
app.post('/api/register', (req, res) => {
  try {
    const { username, password, contact } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    if (userDb.findByUsername(username)) {
      return res.status(400).json({ error: '用户名已存在' });
    }

    const user = userDb.createUser(username, password, contact || '');
    const token = jwtUtil.generateToken(user);

    res.json({ message: '注册成功', user, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 用户登录
app.post('/api/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const user = userDb.findByUsername(username);
    if (!user) {
      return res.status(400).json({ error: '用户不存在' });
    }

    if (user.isDisabled) {
      return res.status(403).json({ error: '账号已被禁用' });
    }

    if (!userDb.verifyPassword(user, password)) {
      return res.status(400).json({ error: '密码错误' });
    }

    const token = jwtUtil.generateToken(user);
    const userData = { ...user, password: undefined };

    res.json({ message: '登录成功', user: userData, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取当前用户信息
app.get('/api/me', authMiddleware, (req, res) => {
  const user = userDb.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({ ...user, password: undefined });
});

// ==================== 视频路由 ====================

// 上传视频（支持单个或多个）
app.post('/api/videos/upload', authMiddleware, upload.fields([
  { name: 'videos', maxCount: 10 },
  { name: 'thumbnail_0', maxCount: 1 },
  { name: 'thumbnail_1', maxCount: 1 },
  { name: 'thumbnail_2', maxCount: 1 },
  { name: 'thumbnail_3', maxCount: 1 },
  { name: 'thumbnail_4', maxCount: 1 },
  { name: 'thumbnail_5', maxCount: 1 },
  { name: 'thumbnail_6', maxCount: 1 },
  { name: 'thumbnail_7', maxCount: 1 },
  { name: 'thumbnail_8', maxCount: 1 },
  { name: 'thumbnail_9', maxCount: 1 },
]), (req, res) => {
  try {
    const { title, tags, description, password } = req.body;
    const videoFiles = req.files['videos'] || [];
    
    if (!videoFiles || videoFiles.length === 0) {
      return res.status(400).json({ error: '请选择要上传的视频' });
    }
    
    const uploadedVideos = [];
    
    videoFiles.forEach((file, index) => {
      // 确定视频标题
      let videoTitle;
      if (Array.isArray(title)) {
        videoTitle = title[index] && title[index].trim()
          ? title[index].trim()
          : path.parse(file.originalname).name;
      } else {
        if (title && title.trim()) {
          videoTitle = videoFiles.length > 1 ? `${title.trim()} (${index + 1})` : title.trim();
        } else {
          videoTitle = path.parse(file.originalname).name;
        }
      }

      const videoTags = Array.isArray(tags) ? tags[index] : (tags || '');
      const videoDesc = Array.isArray(description) ? description[index] : (description || '');
      const videoPassword = Array.isArray(password) ? password[index] : (password || '');
      
      // 处理缩略图
      let thumbnailPath = '/default-thumbnail.jpg';
      const thumbField = `thumbnail_${index}`;
      if (req.files[thumbField]) {
        const thumbFile = req.files[thumbField][0];
        const thumbnailName = `${path.parse(file.filename).name}${path.extname(thumbFile.originalname)}`;
        const thumbDestPath = path.join(thumbnailsDir, thumbnailName);
        
        // 移动缩略图到正确位置
        fs.renameSync(thumbFile.path, thumbDestPath);
        thumbnailPath = `/uploads/thumbnails/${thumbnailName}`;
      }
      
      const video = videoDb.createVideo({
        userId: req.user.id,
        username: req.user.username,
        fileName: file.filename,
        originalName: file.originalname,
        filePath: `/uploads/videos/${file.filename}`,
        thumbnail: thumbnailPath,
        title: videoTitle,
        tags: videoTags,
        description: videoDesc,
        password: videoPassword,
        hasPassword: !!videoPassword,
        fileSize: file.size,
        views: 0
      });

      uploadedVideos.push(video);
    });

    res.json({ message: '上传成功', videos: uploadedVideos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取视频列表
app.get('/api/videos', (req, res) => {
  try {
    const { search, year, month, userId } = req.query;
    const videos = videoDb.getVideos({ search, year, month, userId });
    res.json(videos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取单个视频详情
app.get('/api/videos/:id', (req, res) => {
  try {
    const video = videoDb.getVideoById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: '视频不存在' });
    }
    // 增加播放次数
    video.views = (video.views || 0) + 1;
    videoDb.updateVideo(video.id, { views: video.views });
    res.json(video);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 验证视频密码
app.post('/api/videos/:id/verify-password', (req, res) => {
  try {
    const { password } = req.body;
    const video = videoDb.getVideoById(req.params.id);

    if (!video) {
      return res.status(404).json({ error: '视频不存在' });
    }

    if (!video.hasPassword) {
      return res.json({ verified: true });
    }

    if (password === video.password) {
      return res.json({ verified: true });
    }

    res.status(403).json({ error: '密码错误' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新视频信息
app.put('/api/videos/:id', authMiddleware, (req, res) => {
  try {
    const video = videoDb.getVideoById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: '视频不存在' });
    }

    // 检查权限：只有上传者或管理员可以修改
    if (video.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: '没有权限修改此视频' });
    }

    const { title, tags, description, password } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (tags !== undefined) updates.tags = tags;
    if (description !== undefined) updates.description = description;
    if (password !== undefined) {
      updates.password = password;
      updates.hasPassword = !!password;
    }

    const updated = videoDb.updateVideo(req.params.id, updates);
    res.json({ message: '更新成功', video: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除视频
app.delete('/api/videos/:id', authMiddleware, (req, res) => {
  try {
    const video = videoDb.getVideoById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: '视频不存在' });
    }

    // 检查权限
    if (video.userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ error: '没有权限删除此视频' });
    }

    // 删除文件
    const videoPath = path.join(__dirname, video.filePath);
    if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);

    const thumbPath = path.join(__dirname, video.thumbnail);
    if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);

    videoDb.deleteVideo(req.params.id);
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 批量删除视频
app.post('/api/videos/batch-delete', authMiddleware, (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: '请提供要删除的视频ID列表' });
    }

    // 检查权限
    const videos = ids.map(id => videoDb.getVideoById(id)).filter(Boolean);
    const canDelete = videos.every(v => v.userId === req.user.id || req.user.isAdmin);

    if (!canDelete) {
      return res.status(403).json({ error: '没有权限删除部分视频' });
    }

    // 删除文件
    videos.forEach(video => {
      const videoPath = path.join(__dirname, video.filePath);
      if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      const thumbPath = path.join(__dirname, video.thumbnail);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    });

    videoDb.deleteVideos(ids);
    res.json({ message: `成功删除 ${videos.length} 个视频` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 获取归档列表
app.get('/api/videos/archive/list', (req, res) => {
  try {
    const archives = videoDb.getArchiveList();
    res.json(archives);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 用户管理路由（管理员） ====================

// 获取所有用户
app.get('/api/admin/users', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = userDb.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 禁用/启用用户
app.put('/api/admin/users/:id/toggle-disable', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const user = userDb.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }

    const updated = userDb.updateUser(req.params.id, { isDisabled: !user.isDisabled });
    res.json({ message: `用户已${updated.isDisabled ? '禁用' : '启用'}`, user: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 删除用户
app.delete('/api/admin/users/:id', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const result = userDb.deleteUser(req.params.id);
    if (result) {
      res.json({ message: '用户已删除' });
    } else {
      res.status(404).json({ error: '用户不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 网站配置路由 ====================

// 获取网站配置
app.get('/api/config', (req, res) => {
  try {
    const config = configDb.getConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 更新网站配置（管理员）
app.put('/api/admin/config', authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { title, name, description, copyright, logo } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (copyright !== undefined) updates.copyright = copyright;
    if (logo !== undefined) updates.logo = logo;

    const config = configDb.updateConfig(updates);
    res.json({ message: '配置更新成功', config });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== 分享路由 ====================

// 获取分享链接
app.get('/api/videos/:id/share', (req, res) => {
  try {
    const video = videoDb.getVideoById(req.params.id);
    if (!video) {
      return res.status(404).json({ error: '视频不存在' });
    }

    const shareUrl = `${req.protocol}://${req.get('host')}/video.html?id=${video.id}`;
    const shareData = {
      url: shareUrl,
      title: video.title,
      description: video.description || '',
      thumbnail: `${req.protocol}://${req.get('host')}${video.thumbnail}`
    };

    res.json(shareData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 前端路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/login.html'));
});

app.get('/register.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/register.html'));
});

app.get('/upload.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/upload.html'));
});

app.get('/video.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/video.html'));
});

app.get('/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/admin.html'));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🎬 Videoflow 服务器运行在 http://localhost:${PORT}`);
  console.log(`📝 管理员账号: dakerclaw / daker123`);
});
