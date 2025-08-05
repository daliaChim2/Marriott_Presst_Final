const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// ==== LOGIN DE USUARIO ====
const login = async (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al buscar el usuario.' });
    if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const user = results[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Contraseña incorrecta.' });

    // CREAR JWT TOKEN
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // RESPONDER con token y datos
    return res.status(200).json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        username: user.username,
        correo: user.correo,
        role: user.role
      }
    });
  });
};

// ==== REGISTRO DE USUARIO ====
const register = async (req, res) => {
  const { nombre, username, correo, password, pregunta_seguridad, respuesta_seguridad, role, adminUser } = req.body;

  if (!nombre || !username || !correo || !password || !pregunta_seguridad || !respuesta_seguridad) {
    return res.status(400).json({ error: 'Faltan datos obligatorios.' });
  }

  // SOLO admin_D puede crear otros admin
  if (role === 'admin' && adminUser !== 'admin_D') {
    return res.status(403).json({ error: 'Solo admin_D puede crear administradores.' });
  }

  // VERIFICAR SI USUARIO o CORREO YA EXISTE
  db.query('SELECT * FROM users WHERE username = ? OR correo = ?', [username, correo], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al buscar el usuario.' });
    if (results.length > 0) return res.status(409).json({ error: 'Usuario o correo ya registrado.' });

    // HASH DE CONTRASEÑA Y RESPUESTA
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedRespuesta = await bcrypt.hash(respuesta_seguridad, 10);

    // INSERTAR NUEVO USUARIO
    db.query(
      'INSERT INTO users (nombre, username, correo, password, pregunta_seguridad, respuesta_seguridad, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, username, correo, hashedPassword, pregunta_seguridad, hashedRespuesta, role || 'user'],
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al registrar el usuario.' });
        return res.status(201).json({ message: 'Usuario registrado exitosamente.' });
      }
    );
  });
};

// ==== RECUPERAR CONTRASEÑA ====
const recuperarPassword = async (req, res) => {
  const { username, pregunta_seguridad, respuesta_seguridad, nuevaPassword } = req.body;
  if (!username || !pregunta_seguridad || !respuesta_seguridad || !nuevaPassword) {
    return res.status(400).json({ error: 'Faltan datos para recuperación.' });
  }

  db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al buscar el usuario.' });
    if (results.length === 0) return res.status(404).json({ error: 'Usuario no encontrado.' });

    const user = results[0];
    if (user.pregunta_seguridad !== pregunta_seguridad)
      return res.status(401).json({ error: 'Pregunta de seguridad incorrecta.' });

    // VALIDAR RESPUESTA (hash)
    const validRespuesta = await bcrypt.compare(respuesta_seguridad, user.respuesta_seguridad);
    if (!validRespuesta)
      return res.status(401).json({ error: 'Respuesta de seguridad incorrecta.' });

    // CAMBIAR CONTRASEÑA
    const hashedPassword = await bcrypt.hash(nuevaPassword, 10);
    db.query(
      'UPDATE users SET password = ? WHERE username = ?',
      [hashedPassword, username],
      (err) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar la contraseña.' });
        return res.status(200).json({ message: 'Contraseña actualizada correctamente.' });
      }
    );
  });
};

module.exports = {
  login,
  register,
  recuperarPassword,
};
