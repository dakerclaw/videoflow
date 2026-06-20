const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../data/db.json');
const JWT_SECRET = 'videoflow_secret_key_2024';

// 确保数据目录存在
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 使用 fs 直接读写 JSON 文件（更简单的方案）
class Database {
  constructor() {
    this.dbPath = dbPath;
    this.loadData();
  }

  loadData() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const data = fs.readFileSync(this.dbPath, 'utf8');
        this.data = JSON.parse(data);
      } else {
        this.data = this.getDefaultData();
        this.saveData();
      }
    } catch (e) {
      console.error('加载数据库失败:', e);
      this.data = this.getDefaultData();
    }
  }

  saveData() {
    try {
      fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('保存数据库失败:', e);
    }
  }

  getDefaultData() {
    return {
      users: [],
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
  }
}

const db = new Database();

// 用户数据库操作
const userDb = {
  findByUsername(username) {
    return db.data.users.find(u => u.username === username);
  },

  findById(id) {
    return db.data.users.find(u => u.id === id);
  },

  createUser(username, password, contact) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    
    const user = {
      id: uuidv4(),
      username,
      password: passwordHash,
      contact: contact || '',
      isAdmin: false,
      isDisabled: false,
      createdAt: new Date().toISOString()
    };

    db.data.users.push(user);
    db.saveData();

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  verifyPassword(user, password) {
    return bcrypt.compareSync(password, user.password);
  },

  getAllUsers() {
    return db.data.users.map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
  },

  updateUser(id, updates) {
    const index = db.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;

    // 如果更新密码，需要加密
    if (updates.password) {
      const salt = bcrypt.genSaltSync(10);
      updates.password = bcrypt.hashSync(updates.password, salt);
    }

    db.data.users[index] = { ...db.data.users[index], ...updates };
    db.saveData();

    const { password, ...userWithoutPassword } = db.data.users[index];
    return userWithoutPassword;
  },

  deleteUser(id) {
    const index = db.data.users.findIndex(u => u.id === id);
    if (index === -1) return false;

    db.data.users.splice(index, 1);
    db.saveData();
    return true;
  }
};

// 视频数据库操作
const videoDb = {
  createVideo(videoData) {
    const video = {
      id: uuidv4(),
      ...videoData,
      createdAt: new Date().toISOString()
    };

    db.data.videos.push(video);
    db.saveData();
    return video;
  },

  getVideos({ search, year, month, userId } = {}) {
    let videos = [...db.data.videos];

    // 搜索过滤
    if (search) {
      const searchLower = search.toLowerCase();
      videos = videos.filter(v => 
        v.title.toLowerCase().includes(searchLower) ||
        (v.tags && v.tags.toLowerCase().includes(searchLower)) ||
        v.username.toLowerCase().includes(searchLower)
      );
    }

    // 用户过滤
    if (userId) {
      videos = videos.filter(v => v.userId === userId);
    }

    // 时间筛选
    if (year) {
      videos = videos.filter(v => {
        const videoYear = new Date(v.createdAt).getFullYear().toString();
        return videoYear === year;
      });
    }

    if (month) {
      videos = videos.filter(v => {
        const videoMonth = (new Date(v.createdAt).getMonth() + 1).toString().padStart(2, '0');
        return videoMonth === month;
      });
    }

    // 按时间倒序
    videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return videos;
  },

  getVideoById(id) {
    return db.data.videos.find(v => v.id === id);
  },

  updateVideo(id, updates) {
    const index = db.data.videos.findIndex(v => v.id === id);
    if (index === -1) return null;

    db.data.videos[index] = { ...db.data.videos[index], ...updates };
    db.saveData();
    return db.data.videos[index];
  },

  deleteVideo(id) {
    const index = db.data.videos.findIndex(v => v.id === id);
    if (index === -1) return false;

    db.data.videos.splice(index, 1);
    db.saveData();
    return true;
  },

  deleteVideos(ids) {
    db.data.videos = db.data.videos.filter(v => !ids.includes(v.id));
    db.saveData();
    return true;
  },

  getArchiveList() {
    const archives = {};
    
    db.data.videos.forEach(video => {
      const date = new Date(video.createdAt);
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      if (!archives[year]) {
        archives[year] = [];
      }
      
      if (!archives[year].includes(month)) {
        archives[year].push(month);
      }
    });

    // 排序
    const sortedArchives = {};
    Object.keys(archives).sort((a, b) => b - a).forEach(year => {
      sortedArchives[year] = archives[year].sort((a, b) => b - a);
    });

    return sortedArchives;
  }
};

// 网站配置操作
const configDb = {
  getConfig() {
    return db.data.siteConfig;
  },

  updateConfig(updates) {
    db.data.siteConfig = { ...db.data.siteConfig, ...updates };
    db.saveData();
    return db.data.siteConfig;
  }
};

// JWT 工具
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

// 初始化管理员账号
const adminExists = db.data.users.find(u => u.username === 'dakerclaw');
if (!adminExists) {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('daker123', salt);
  db.data.users.push({
    id: uuidv4(),
    username: 'dakerclaw',
    password: passwordHash,
    contact: '',
    isAdmin: true,
    isDisabled: false,
    createdAt: new Date().toISOString()
  });
  db.saveData();
  console.log('✅ 管理员账号已创建: dakerclaw / daker123');
}

module.exports = { userDb, videoDb, configDb, jwtUtil };
