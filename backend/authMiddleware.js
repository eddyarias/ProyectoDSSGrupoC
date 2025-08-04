const { supabase } = require('./supabaseClient');

// Middleware para verificar token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  // Verificar token en Supabase
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    return res.status(403).json({ error: "Token inválido o expirado" });
  }

  // Guardamos el usuario en la request
  req.user = data.user;

  next();
};

// Middleware para verificar rol
const requireRole = (role) => {
  return (req, res, next) => {
    const userRole = req.user?.user_metadata?.role;
    
    if (!userRole) {
      return res.status(403).json({ error: "Rol no definido en el usuario" });
    }

    if (userRole !== role) {
      console.error(`❌ Rol insuficiente: ${userRole} (se requiere ${role})`);
      return res.status(403).json({ error: "Acceso denegado: rol insuficiente" });
    }

    next();
  };
};

module.exports = { authenticateToken, requireRole };
