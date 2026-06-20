const { jwtUtil } = require('../db/database');

// 验证 token 中间件
function authMiddleware(req, res, next) {
  const token = req.headers['authorization'] || req.headers['Authorization'];
  if (!token) {
    return res.status(401).json({ error: '请先登录' });
  }

  const tokenStr = token.startsWith('Bearer ') ? token.slice(7) : token;
  const decoded = jwtUtil.verifyToken(tokenStr);
  if (!decoded) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }

  req.user = decoded;
  next();
}

// 验证管理员权限中间件
function adminMiddleware(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}

module.exports = { authMiddleware, adminMiddleware };
