const { LowSync } = require('lowdb');
const { JSONFileSync } = require('lowdb/node');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/db.json');
const JWT_SECRET = 'videoflow_secret_key_2024';

// 确保数据目录存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 初始化数据库
const defaultData = {
  users: [],
  videos: [],
  siteConfig: [{
    id: 'site',
    title: 'Videoflow',
    name: 'Videoflow',
    description: '分享精彩视频瞬间',
    copyright: '© 2024 Videoflow. All rights reserved.',
    logo: ''
  }]
};

// 如果数据库文件不存在，创建默认数据
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
}

const adapter = new JSONFileSync(dbPath);
const db = new LowSync(adapter, defaultData);
db.read();

// 确保数据存在
if (!db.data) {
  db.data = defaultData;
  db.write();
} else {
  // 确保必要的字段存在
  if (!db.data.users) db.data.users = defaultData.users;
  if (!db.data.videos) db.data.videos = defaultData.videos;
  if (!db.data.siteConfig) db.data.siteConfig = defaultData.siteConfig;
  db.write();
}

// 如果管理员账号不存在，创建它
const adminExists = db.data.users.find(u => u.username === 'dackerclaw');
if (!adminExists) {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('daker123', salt);
  db.data.users.push({
    id: uuid.v4(),
    username: 'dackerclaw',
    password: passwordHash,
    contact: '',
    isAdmin: true,
    isDisabled: false,
    createdAt: new Date().toISOString()
  });
  db.write();
}

// ========== 用户相关操作 ==========
const userDb = {
  // 创建用户
  createUser(username, password, contact = '') {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const user = {
      id: uuid.v4(),
      username,
      password: passwordHash,
      contact,
      isAdmin: false,
      isDisabled: false,
      createdAt: new Date().toISOString()
    };
    db.data.users.push(user);
    db.write();
    return { ...user, password: undefined };
  },

  // 根据用户名查找用户
  findByUsername(username) {
    return db.data.users.find(u => u.username === username);
  },

  // 根据ID查找用户
  findById(id) {
    return db.data.users.find(u => u.id === id);
  },

  // 获取所有用户
  getAllUsers() {
    return db.data.users.map(u => ({ ...u, password: undefined }));
  },

  // 更新用户
  updateUser(id, updates) {
    const user = db.data.users.find(u => u.id === id);
    if (user) {
      Object.assign(user, updates);
      db.write();
      return { ...user, password: undefined };
    }
    return null;
  },

  // 删除用户
  deleteUser(id) {
    const index = db.data.users.findIndex(u => u.id === id);
    if (index !== -1) {
      db.data.users.splice(index, 1);
      // 同时删除该用户的视频
      db.data.videos = db.data.videos.filter(v => v.userId !== id);
      db.write();
      return true;
    }
    return false;
  },

  // 验证密码
  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password);
  }
};

// ========== 视频相关操作 ==========
const videoDb = {
  // 创建视频记录
  createVideo(videoData) {
    const video = {
      id: uuid.v4(),
      ...videoData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.data.videos.push(video);
    db.write();
    return video;
  },

  // 获取所有视频（支持筛选和搜索）
  getVideos({ search, year, month, userId } = {}) {
    let videos = db.data.videos;

    // 搜索筛选
    if (search) {
      const searchLower = search.toLowerCase();
      videos = videos.filter(v =>
        v.title.toLowerCase().includes(searchLower) ||
        (v.tags && v.tags.toLowerCase().includes(searchLower)) ||
        v.username.toLowerCase().includes(searchLower)
      );
    }

    // 按上传用户筛选
    if (userId) {
      videos = videos.filter(v => v.userId === userId);
    }

    // 按年月筛选
    if (year) {
      videos = videos.filter(v => {
        const date = new Date(v.createdAt);
        return date.getFullYear().toString() === year;
      });
    }
    if (month) {
      videos = videos.filter(v => {
        const date = new Date(v.createdAt);
        return (date.getMonth() + 1).toString() === month;
      });
    }

    // 按上传时间倒序
    videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return videos;
  },

  // 根据ID获取视频
  getVideoById(id) {
    return db.data.videos.find(v => v.id === id);
  },

  // 更新视频
  updateVideo(id, updates) {
    const video = db.data.videos.find(v => v.id === id);
    if (video) {
      Object.assign(video, updates, { updatedAt: new Date().toISOString() });
      db.write();
      return video;
    }
    return null;
  },

  // 删除视频
  deleteVideo(id) {
    const index = db.data.videos.findIndex(v => v.id === id);
    if (index !== -1) {
      const video = db.data.videos[index];
      db.data.videos.splice(index, 1);
      db.write();
      return video;
    }
    return null;
  },

  // 批量删除视频
  deleteVideos(ids) {
    let deleted = [];
    ids.forEach(id => {
      const index = db.data.videos.findIndex(v => v.id === id);
      if (index !== -1) {
        deleted.push(db.data.videos[index]);
        db.data.videos.splice(index, 1);
      }
    });
    db.write();
    return deleted;
  },

  // 获取视频归档年月列表
  getArchiveList() {
    const archives = new Set();
    db.data.videos.forEach(v => {
      const date = new Date(v.createdAt);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      archives.add(`${year}-${month}`);
    });
    return Array.from(archives).sort().reverse();
  }
};

// ========== 网站配置操作 ==========
const configDb = {
  getConfig() {
    return db.data.siteConfig[0] || defaultData.siteConfig[0];
  },

  updateConfig(updates) {
    if (db.data.siteConfig[0]) {
      Object.assign(db.data.siteConfig[0], updates);
    } else {
      db.data.siteConfig[0] = { id: 'site', ...updates };
    }
    db.write();
    return db.data.siteConfig[0];
  }
};

// ========== JWT 操作 ==========
const jwtUtil = {
  generateToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username, isAdmin: user.isAdmin },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  },

  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (e) {
      return null;
    }
  }
};

module.exports = { db, userDb, videoDb, configDb, jwtUtil, JWT_SECRET };
