const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = (roles = []) => (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (roles.length && !roles.includes(payload.role))
      return res.status(403).json({ message: 'Prohibido' });

    req.user = payload; // { id, role }
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token inválido' });
  }
};
