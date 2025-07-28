const { supabase } = require('./supabaseClient');

const authenticateToken = async (req, res, next) => {
  // Get the token from the Authorization header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format is "Bearer TOKEN"

  if (!token) {
    return res.sendStatus(401); // Unauthorized if no token is provided
  }

  // Use Supabase to verify the token
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.sendStatus(403); // Forbidden if token is invalid
  }

  // If the token is valid, attach the user to the request object
  req.user = user;
  
  // Move on to the next function in the chain
  next();
};

module.exports = authenticateToken;