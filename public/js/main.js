// ========== 全局变量 ==========
let currentUser = null;
let allVideos = [];
let selectedVideos = new Set();
let isSelectMode = false;

// ========== 初始化 ==========
document.addEventListener('DOMContentLoaded', () => {
  loadSiteConfig();
  checkLoginStatus();
  loadVideos();
  loadArchiveList();
  
  // 搜索框回车事件
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchVideos();
  });
});

// ========== 网站配置 ==========
async function loadSiteConfig() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    document.title = config.title || 'Videoflow';
    document.getElementById('siteName').textContent = config.name || 'Videoflow';
  } catch (e) {
    console.error('加载网站配置失败:', e);
  }
}

// ========== 登录状态 ==========
async function checkLoginStatus() {
  const token = localStorage.getItem('token');
  const navLinks = document.getElementById('navLinks');

  if (token) {
    try {
      const res = await fetch('/api/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        currentUser = await res.json();
        renderLoggedInNav();
        return;
      }
    } catch (e) {}
  }
  renderLoggedOutNav();
}

function renderLoggedOutNav() {
  document.getElementById('navLinks').innerHTML = `
    <a href="/login.html">登录</a>
    <a href="/register.html">注册</a>
  `;
}

function renderLoggedInNav() {
  let html = `
    <span class="navbar-user">
      <span class="username">${currentUser.username}</span>
      ${currentUser.isAdmin ? '<a href="/admin.html" class="btn btn-outline btn-sm">管理后台</a>' : ''}
      <a href="/upload.html" class="btn btn-primary btn-sm">上传视频</a>
      <button class="btn btn-outline btn-sm" onclick="toggleSelectMode()">${isSelectMode ? '取消选择' : '管理'}</button>
      <button class="btn btn-outline btn-sm" onclick="logout()">退出</button>
    </span>
  `;
  document.getElementById('navLinks').innerHTML = html;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  currentUser = null;
  renderLoggedOutNav();
  showToast('已退出登录', 'info');
  setTimeout(() => location.reload(), 500);
}

function toggleSelectMode() {
  isSelectMode = !isSelectMode;
  document.getElementById('selectActions').style.display = isSelectMode ? 'flex' : 'none';
  renderVideos(allVideos);
  renderLoggedInNav();
}

// ========== 加载视频 ==========
async function loadVideos() {
  try {
    const res = await fetch('/api/videos');
    allVideos = await res.json();
    renderVideos(allVideos);
  } catch (e) {
    console.error('加载视频失败:', e);
    showToast('加载视频失败', 'error');
  }
}

function renderVideos(videos) {
  const container = document.getElementById('videoList');
  const emptyState = document.getElementById('emptyState');

  if (videos.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  container.innerHTML = videos.map(video => `
    <div class="video-card" onclick="handleVideoClick('${video.id}')">
      ${isSelectMode ? `
        <div style="padding: 0.5rem;">
          <input type="checkbox" ${selectedVideos.has(video.id) ? 'checked' : ''} 
                 onchange="toggleVideoSelect('${video.id}')" 
                 onclick="event.stopPropagation()">
        </div>
      ` : ''}
      <div class="video-thumbnail">
        <img src="${video.thumbnail || '/default-thumbnail.jpg'}" alt="${video.title}"
             onerror="this.onerror=null; this.src='/default-thumbnail.jpg';">
        ${video.hasPassword ? '<div class="video-lock">🔒</div>' : ''}
      </div>
      <div class="video-info">
        <div class="video-title">${escapeHtml(video.title)}</div>
        <div class="video-meta">
          <span>@${escapeHtml(video.username)}</span>
          <span>${formatDate(video.createdAt)}</span>
        </div>
        ${video.tags ? `
          <div class="video-tags">
            ${video.tags.split(',').map(tag => `<span class="tag">${escapeHtml(tag.trim())}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  `).join('');
}

// ========== 视频点击处理 ==========
async function handleVideoClick(videoId) {
  if (isSelectMode) {
    toggleVideoSelect(videoId);
    return;
  }

  const video = allVideos.find(v => v.id === videoId);
  if (!video) return;

  if (video.hasPassword) {
    // 显示密码输入框
    document.getElementById('passwordModal').style.display = 'flex';
    document.getElementById('passwordVideoTitle').textContent = video.title;
    window.pendingVideoId = videoId;
    document.getElementById('videoPassword').focus();
  } else {
    window.location.href = `/video.html?id=${videoId}`;
  }
}

async function verifyPassword() {
  const videoId = window.pendingVideoId;
  const password = document.getElementById('videoPassword').value;

  try {
    const res = await fetch(`/api/videos/${videoId}/verify-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });

    const data = await res.json();
    if (data.verified) {
      window.location.href = `/video.html?id=${videoId}`;
    } else {
      showToast(data.error || '密码错误', 'error');
    }
  } catch (e) {
    showToast('验证失败', 'error');
  }
}

function closePasswordModal() {
  document.getElementById('passwordModal').style.display = 'none';
  document.getElementById('videoPassword').value = '';
  window.pendingVideoId = null;
}

// ========== 多选操作 ==========
function toggleVideoSelect(videoId) {
  if (selectedVideos.has(videoId)) {
    selectedVideos.delete(videoId);
  } else {
    selectedVideos.add(videoId);
  }
  updateSelectActions();
}

function toggleSelectAll() {
  if (selectedVideos.size === allVideos.length) {
    selectedVideos.clear();
  } else {
    allVideos.forEach(v => selectedVideos.add(v.id));
  }
  renderVideos(allVideos);
  updateSelectActions();
}

function updateSelectActions() {
  const btn = document.querySelector('[onclick="toggleSelectAll()"]');
  if (btn) {
    btn.textContent = selectedVideos.size === allVideos.length ? '取消全选' : '全选';
  }
}

async function deleteSelected() {
  if (selectedVideos.size === 0) {
    showToast('请先选择视频', 'info');
    return;
  }

  if (!confirm(`确定要删除选中的 ${selectedVideos.size} 个视频吗？`)) return;

  const token = localStorage.getItem('token');
  try {
    const res = await fetch('/api/videos/batch-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ ids: Array.from(selectedVideos) })
    });

    const data = await res.json();
    if (res.ok) {
      showToast(data.message, 'success');
      selectedVideos.clear();
      loadVideos();
    } else {
      showToast(data.error, 'error');
    }
  } catch (e) {
    showToast('删除失败', 'error');
  }
}

// ========== 搜索和筛选 ==========
function searchVideos() {
  const search = document.getElementById('searchInput').value;
  filterVideos();
}

async function filterVideos() {
  const search = document.getElementById('searchInput').value;
  const year = document.getElementById('yearFilter').value;
  const month = document.getElementById('monthFilter').value;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (year) params.append('year', year);
  if (month) params.append('month', month);

  try {
    const res = await fetch(`/api/videos?${params.toString()}`);
    allVideos = await res.json();
    selectedVideos.clear();
    renderVideos(allVideos);
  } catch (e) {
    showToast('筛选失败', 'error');
  }
}

async function loadArchiveList() {
  try {
    const res = await fetch('/api/videos/archive/list');
    const archives = await res.json();
    const yearSelect = document.getElementById('yearFilter');
    
    const years = [...new Set(archives.map(a => a.split('-')[0]))];
    years.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year + '年';
      yearSelect.appendChild(option);
    });
  } catch (e) {
    console.error('加载归档列表失败:', e);
  }
}

// ========== 工具函数 ==========
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// ========== 密码框回车事件 ==========
document.getElementById('videoPassword')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') verifyPassword();
});
