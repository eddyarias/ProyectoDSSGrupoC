const express = require('express');
const cors = require('cors');
const { supabase, supabaseAdmin } = require('./supabaseClient');
const { authenticateToken, requireRole } = require('./authMiddleware');
const logAction = require('./auditLogger');
const sendAlertEmail = require('./emailService');
const crypto = require('crypto');
const multer = require('multer');
const PDFDocument = require('pdfkit');
const { decrypt } = require('./utils/cryptoHelper');
const checkTimeAccess = require('./middlewares/checkTimeAccess');

const upload = multer({ storage: multer.memoryStorage() });
const app = express();
const PORT = process.env.PORT;
const HOST = process.env.HOST;

app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add the express.json() middleware to parse JSON request bodies
app.use(express.json());

// --- AUTHENTICATION ENDPOINTS ---

// Endpoint for user registration (Sign Up)
app.post('/api/auth/signup', async (req, res) => {
  console.log('--SignUp Request Received--');
  console.log('Request Body:', req.body);

  const { email, password, role } = req.body;

  // Basic validation
  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password y rol son requeridos.' });
  }

  // Validar que el rol sea uno permitido
  const validRoles = ['Usuario', 'Analista de Seguridad', 'Jefe de SOC', 'Auditor', 'Gerente de Riesgos'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Rol inválido.' });
  }

  // Use Supabase to sign up the user
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password,
    options: {
      data: {
        role: role
      }
    }
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json({ user: data.user });
});

// Endpoint for user login (Sign In)
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Se requieren email y contraseña.' });
    }

    // Paso 1: Iniciar sesión con la contraseña. Siempre nos dará una sesión en tu versión.
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
        return res.status(401).json({ error: loginError.message });
    }

    // Paso 2: Usar la sesión obtenida para revisar si hay factores MFA verificados.
    // Para ello, establecemos la sesión en nuestro cliente de Supabase.
    supabase.auth.setSession(loginData.session);

    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
        return res.status(500).json({ error: "No se pudieron listar los factores MFA." });
    }

    const verifiedTotpFactor = factorsData.totp.find(f => f.status === 'verified');

    // Paso 3: Decidir el siguiente paso.
    if (verifiedTotpFactor) {
        // SI hay un factor verificado, creamos un desafío.
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: verifiedTotpFactor.id,
        });
        if (challengeError) {
            return res.status(500).json({ error: "No se pudo crear el desafío MFA." });
        }

        // Y devolvemos los datos necesarios para verificar.
        return res.status(200).json({
            mfa_required: true,
            factorId: verifiedTotpFactor.id,
            challengeId: challengeData.id,
        });
    } else {
        // SI NO hay factores verificados, devolvemos la sesión directamente.
        return res.status(200).json({ session: loginData.session });
    }
});

// Endpoint para finalizar el login con un código MFA
app.post('/api/auth/verify-login', async (req, res) => {
  const { factorId, challengeId, code } = req.body;
  if (!factorId || !challengeId || !code) {
    return res.status(400).json({ error: 'factorId, challengeId y code son requeridos' });
  }

  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });

  if (error) {
    return res.status(401).json({ error: error.message });
  }

  // --- AÑADE ESTA LÍNEA PARA DEPURAR ---
  console.log('Respuesta exitosa de Supabase al verificar MFA:', data);
  // ------------------------------------

  // data contiene la session con AAL2
  return res.status(200).json({ session: data });
});


// Endpoint para cerrar la sesión de un usuario
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json({ message: 'Logged out successfully.' });
});

// Crear incidente (con TRBAC de horario)
app.post('/api/incidents', 
  authenticateToken, 
  checkTimeAccess("Crear", "Incidente"), // TRBAC
  async (req, res) => {
    const creator_id = req.user.id;
    const { title, description, detected_at, source, affected_asset, criticality } = req.body;

    const { data, error } = await supabase
      .from('incidents')
      .insert([{ 
        title, description, detected_at, source, affected_asset, criticality, creator_id 
      }])
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    await logAction(creator_id, 'CREATE_INCIDENT', { incidentId: data.id, title: data.title });
    res.status(201).json(data);
});


// Endpoint to get incidents based on user role
app.get('/api/incidents/:id', 
  authenticateToken,
  checkTimeAccess("Ver", "Incidentes"), 
  async (req, res) => {
    const { id } = req.params;
    const userRole = req.user.user_metadata.role;
    let query = supabase.from('incidents').select('*').eq('id', id).single();
    if (userRole === 'Usuario') {
      query = query.eq('creator_id', req.user.id);
    }
    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
});


// Listar incidentes (TRBAC)
app.get('/api/incidents', 
  authenticateToken,
  checkTimeAccess("Ver", "Incidentes"),
  async (req, res) => {
    const user = req.user;
    const userRole = user.user_metadata.role;

    console.log(`User ${user.email} with role ${userRole} is requesting incidents.`);

    let query = supabase.from('incidents').select('*');
    if (userRole === 'Usuario') {
      query = query.eq('creator_id', user.id);
    }

    const { data, error } = await query;
    if (error) return res.status(400).json({ error: error.message });
    res.status(200).json(data);
});

// Listar los logs de auditoría (solo para usuarios con rol "Auditor")

app.get('/api/logs', authenticateToken, async (req, res) => {
  if (req.user.user_metadata.role !== 'Auditor') {
    return res.status(403).json({ error: 'Prohibido: solo auditores.' });
  }

  try {
    const { data: rawLogs, error: logsError } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, created_at, details')
      .order('created_at', { ascending: false });

    if (logsError) throw logsError;

    const logs = await Promise.all(
      rawLogs.map(async log => {
        const { data: userRec } = await supabaseAdmin.auth.admin.getUserById(log.user_id);
        const email = userRec?.user?.email || log.user_id;

        let details;
        try {
          details = JSON.parse(decrypt(log.details)); // 🔑 DESCIFRAR
        } catch (err) {
          details = { error: 'No se pudo descifrar detalles' };
        }

        return {
          id: log.id,
          user: email,
          action: log.action,
          timestamp: log.created_at,
          details
        };
      })
    );

    res.json(logs);
  } catch (err) {
    console.error('Error al recuperar audit_logs:', err);
    res.status(500).json({ error: 'Error recuperando logs.' });
  }
});

// Endpoint para obtener el detalle de un log específico
app.get('/api/logs/:id', authenticateToken, async (req, res) => {
  try {
    // Solo Auditores pueden ver el detalle
    if (req.user.user_metadata.role !== 'Auditor') {
      return res.status(403).json({ error: 'Prohibido: solo auditores.' });
    }

    const { id } = req.params;
    const { data: logRec, error: logErr } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, created_at, details')
      .eq('id', id)
      .single();

    if (logErr) throw logErr;

    // Obtener email del usuario que hizo la acción
    const { data: userRec } = await supabaseAdmin.auth.admin.getUserById(logRec.user_id);
    const userEmail = userRec?.user?.email || logRec.user_id;

    // 🔑 Descifrar details
    let decryptedDetails = {};
    try {
      decryptedDetails = JSON.parse(decrypt(logRec.details));
    } catch (err) {
      console.error('Error descifrando detalles del log:', err);
      decryptedDetails = { error: 'No se pudo descifrar los detalles.' };
    }

    let extraData = {};

    if (['CREATE_INCIDENT', 'UPDATE_INCIDENT'].includes(logRec.action)) {
      const { data: incident } = await supabase
        .from('incidents')
        .select('id, title, affected_asset, criticality, status')
        .eq('id', decryptedDetails.incidentId) // Usamos el descifrado
        .maybeSingle();

      extraData = {
        incidentId: incident?.id || null,
        title: incident?.title || null,
        affected_asset: incident?.affected_asset || null,
        criticality: incident?.criticality || null,
        status: incident?.status || null,
      };
    } else if (logRec.action === 'CHANGE_ROLE') {
      extraData = {
        targetUserId: decryptedDetails?.targetUserId || null,
        newRole: decryptedDetails?.newRole || null,
      };
    }

    res.json({
      id: logRec.id,
      user: userEmail,
      action: logRec.action,
      timestamp: logRec.created_at,
      details: extraData,
    });
  } catch (err) {
    console.error('Error obteniendo detalle del log:', err);
    res.status(500).json({ error: 'No se pudo obtener el detalle del log.' });
  }
});

//Exportacion
//const PDFDocument = require('pdfkit');

// --- Exportar un solo log a CSV ---
app.get('/api/logs/:id/export/csv', authenticateToken, async (req, res) => {
  const logId = req.params.id;
  try {
    const { data: logRec, error: logErr } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, created_at, details')
      .eq('id', logId)
      .single();
    if (logErr) throw logErr;

    const { data: userRec } = await supabaseAdmin.auth.admin.getUserById(logRec.user_id);
    const userEmail = userRec?.user?.email || logRec.user_id;

    // 🔑 Descifrar details
    let decryptedDetails = {};
    try {
      decryptedDetails = JSON.parse(decrypt(logRec.details));
    } catch {
      decryptedDetails = {};
    }

    let headers, row;

    if (['CREATE_INCIDENT', 'UPDATE_INCIDENT'].includes(logRec.action)) {
      const { data: incident } = await supabase
        .from('incidents')
        .select('id, title, affected_asset, criticality, status, source, evidence_url')
        .eq('id', decryptedDetails.incidentId)
        .maybeSingle();

      headers = [
        'Log ID', 'Usuario', 'Acción', 'Fecha',
        'Incidente ID', 'Título', 'Activo Afectado',
        'Criticidad', 'Estado', 'Fuente'
      ];
      row = [
        logRec.id, userEmail, logRec.action, logRec.created_at,
        incident?.id || '-', incident?.title || '-', incident?.affected_asset || '-',
        incident?.criticality || '-', incident?.status || '-', incident?.source || '-'
      ];
    } else if (logRec.action === 'CHANGE_ROLE') {
      headers = ['Log ID', 'Usuario', 'Acción', 'Fecha', 'Usuario Afectado', 'Nuevo Rol'];
      row = [
        logRec.id, userEmail, logRec.action, logRec.created_at,
        decryptedDetails?.targetUserId || '-', decryptedDetails?.newRole || '-'
      ];
    }

    const csv = headers.join(',') + '\n' + row.map(v => `"${v}"`).join(',') + '\n';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=log_${logRec.id}.csv`);
    res.send(csv);

  } catch (err) {
    console.error('CSV export error:', err);
    res.status(500).json({ error: 'No se pudo exportar CSV.' });
  }
});


// --- Exportar un solo log a PDF ---
app.get('/api/logs/:id/export/pdf', authenticateToken, async (req, res) => {
  const logId = req.params.id;
  try {
    const { data: logRec, error: logErr } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, created_at, details')
      .eq('id', logId)
      .single();
    if (logErr) throw logErr;

    const { data: userRec } = await supabaseAdmin.auth.admin.getUserById(logRec.user_id);
    const userEmail = userRec?.user?.email || logRec.user_id;

    // 🔑 Descifrar details
    let decryptedDetails = {};
    try {
      decryptedDetails = JSON.parse(decrypt(logRec.details));
    } catch {
      decryptedDetails = {};
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=log_${logRec.id}.pdf`);
    doc.pipe(res);

    doc.fontSize(16).text(`Detalle del Log #${logRec.id}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Usuario: ${userEmail}`);
    doc.text(`Acción: ${logRec.action}`);
    doc.text(`Fecha: ${new Date(logRec.created_at).toLocaleString()}`);
    doc.moveDown();

    if (['CREATE_INCIDENT', 'UPDATE_INCIDENT'].includes(logRec.action)) {
      const { data: incident } = await supabase
        .from('incidents')
        .select('id, title, affected_asset, criticality, status, source, evidence_url')
        .eq('id', decryptedDetails.incidentId)
        .maybeSingle();

      if (incident) {
        doc.text(`Incidente ID: ${incident.id}`);
        doc.text(`Título: ${incident.title}`);
        doc.text(`Activo Afectado: ${incident.affected_asset}`);
        doc.text(`Criticidad: ${incident.criticality}`);
        doc.text(`Estado: ${incident.status}`);
        doc.text(`Fuente: ${incident.source}`);
        if (incident.evidence_url) {
          doc.moveDown();
          doc.text('Evidencia:', { underline: true });
          doc.text(incident.evidence_url, { link: incident.evidence_url });
        }
      }
    } else if (logRec.action === 'CHANGE_ROLE') {
      doc.text(`Usuario Afectado: ${decryptedDetails?.targetUserId || '-'}`);
      doc.text(`Nuevo Rol: ${decryptedDetails?.newRole || '-'}`);
    }

    doc.end();

  } catch (err) {
    console.error('PDF export error:', err);
    res.status(500).json({ error: 'No se pudo exportar PDF.' });
  }
});


// --- ADMIN ENDPOINTS ---
app.post('/api/admin/promote', authenticateToken, async (req, res) => {
  const { newRole } = req.body;
  const userId = req.user.id;

  // List of valid roles to prevent typos
  const validRoles = ['Usuario', 'Analista de Seguridad', 'Jefe de SOC', 'Auditor', 'Gerente de Riesgos'];

  if (!newRole || !validRoles.includes(newRole)) {
    return res.status(400).json({ error: 'A valid newRole is required.' });
  }

  // Use the admin client to update user metadata
  const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { user_metadata: { role: newRole } }
  );

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json({ message: `User role updated to ${newRole}`, user: data.user });
});

// Actualizar incidente (TRBAC)
app.patch('/api/incidents/:id', 
  authenticateToken,
  checkTimeAccess("Editar", "Incidente"), 
  async (req, res) => {
    const userRole = req.user.user_metadata.role;
    const { id } = req.params;
    const { status, classification, criticality, resolution } = req.body; 

    const authorizedRoles = ['Analista de Seguridad', 'Jefe de SOC'];
    if (!authorizedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: You do not have permission to update incidents.' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (classification) updateData.classification = classification;
    if (criticality) updateData.criticality = criticality; 
    if (resolution) updateData.resolution = resolution;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Bad Request: No update data provided.' });
    }

    // 1️⃣ Actualizar el incidente
    const { data, error } = await supabase
      .from('incidents')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // 2️⃣ Obtener al dueño del incidente
    const { data: ownerRec, error: ownerErr } = await supabaseAdmin.auth.admin.getUserById(data.creator_id);
    if (ownerErr) {
      console.error('❌ Error obteniendo el dueño del incidente:', ownerErr.message);
    }

    const ownerEmail = ownerRec?.user?.email;

    // 3️⃣ Registrar la acción en los logs
    await logAction(req.user.id, 'UPDATE_INCIDENT', { incidentId: data.id, changes: updateData });

    // 4️⃣ Enviar email al dueño
    const subject = `Actualización de tu Incidente #${data.id}`;
    let body = `Tu incidente #${data.id} ha sido actualizado por un ${userRole}.\n\nCambios realizados:`;
    Object.entries(updateData).forEach(([key, value]) => { body += `\n- ${key}: ${value}`; });
    if (updateData.resolution) body += `\n\nResolución: ${updateData.resolution}`;

    if (ownerEmail) {
      await sendAlertEmail(subject, body, { email: ownerEmail });
    }

    res.status(200).json(data);
});


app.post('/api/incidents/:id/upload', authenticateToken, checkTimeAccess("Adjuntar", "Evidencia"), upload.single('evidenceFile'), async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // ID del usuario autenticado

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  // Verificar que el incidente existe y que el usuario actual es el creador
  const { data: incident, error: incidentError } = await supabase
    .from('incidents')
    .select('id, creator_id')
    .eq('id', id)
    .single();

  if (incidentError) {
    return res.status(404).json({ error: 'Incident not found.' });
  }

  // Verificar que el usuario actual es el creador del incidente
  if (incident.creator_id !== userId) {
    return res.status(403).json({ 
      error: 'Forbidden: Only the incident creator can upload evidence.' 
    });
  }

  const file = req.file;
  const fileName = `${id}-${Date.now()}-${file.originalname}`;
  const filePath = `public/${fileName}`;

  // 1. Upload file to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('incident-evidence')
    .upload(filePath, file.buffer, {
      contentType: file.mimetype,
    });

  if (uploadError) {
    return res.status(400).json({ error: 'Failed to upload file.', details: uploadError.message });
  }

  // 2. Get the public URL of the uploaded file
  const { data: urlData } = supabase.storage
    .from('incident-evidence')
    .getPublicUrl(filePath);

  // 3. Calculate the file's hash for integrity
  const fileHash = crypto.createHash('sha256').update(file.buffer).digest('hex');

  // 4. Update the incident record with the file URL and hash
  const { data: updateData, error: updateError } = await supabase
    .from('incidents')
    .update({ evidence_url: urlData.publicUrl, evidence_hash: fileHash })
    .eq('id', id)
    .select()
    .single();
  
  if (updateError) {
    return res.status(400).json({ error: 'Failed to update incident with file details.', details: updateError.message });
  }

  res.status(200).json({ message: 'File uploaded and incident updated successfully.', incident: updateData });
});

// --- MFA ENDPOINTS ---
// Endpoint for a user to start the MFA enrollment process
app.post('/api/mfa/enroll', authenticateToken, async (req, res) => {
  // The user information is already attached to the request by our middleware.
  // Supabase's mfa.enroll() automatically uses the authenticated user from the JWT.
  
  // Crear un nombre único para permitir múltiples dispositivos MFA
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const deviceNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const uniqueFriendlyName = `${req.user.email}-device-${deviceNumber}-${timestamp}`;
  
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'SDIS Project',
    friendlyName: uniqueFriendlyName,
  });

  if (error && error.message.includes('already exists')) {
    // Si el error es que ya existe un factor, listar los factores del usuario
    const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      return res.status(400).json({ error: error.message, factorsError: factorsError.message });
    }
    // Enviar los factores existentes al frontend
    return res.status(400).json({
      error: error.message,
      existingFactors: factorsData,
    });
  }
  if (error) {
    return res.status(400).json({ error: error.message });
  }

  const cleanedSvg = data.totp.qr_code.replace(/(\r\n|\n|\r)/gm, "");
  res.status(200).json({
    factorId: data.id,
    qr_code_svg: cleanedSvg,
  });
});

app.post('/api/mfa/verify', authenticateToken, async (req, res) => {
  const { factorId, code } = req.body;
  if (!factorId || !code) {
    return res.status(400).json({ error: 'Se requieren factorId y code.' });
  }
  const { data, error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }
    res.status(200).json({ message: '¡Factor MFA verificado con éxito!', session: data });
});

// Endpoint para listar los factores MFA del usuario
app.get('/api/mfa/factors', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase.auth.mfa.listFactors();
    
    if (error) {
      return res.status(400).json({ error: error.message });
    }
    
    // Filtrar y formatear la información de los factores
    const factors = data.all.map(factor => ({
      id: factor.id,
      friendlyName: factor.friendly_name,
      factorType: factor.factor_type,
      status: factor.status,
      createdAt: factor.created_at,
      updatedAt: factor.updated_at
    }));
    
    res.status(200).json({ 
      factors,
      total: factors.length 
    });
  } catch (err) {
    res.status(500).json({ error: 'Error interno del servidor al obtener factores MFA' });
  }
});

// --- REPORTING ENDPOINTS ---
app.get('/api/reports/monthly', authenticateToken, 
  (req, res, next) => {
    const role = req.user.user_metadata.role;
    if (role === "Auditor") {
      return checkTimeAccess("Ver", "Reportes mensuales")(req, res, next);
    }
    return checkTimeAccess("Generar", "Reporte mensual")(req, res, next);
  },
  async (req, res) => {
  const userRole = req.user.user_metadata.role;

  // RBAC: Solo roles específicos pueden acceder a los reportes.
  const authorizedRoles = ['Gerente de Riesgos', 'Jefe de SOC', 'Auditor', 'Analista de Seguridad'];
  if (!authorizedRoles.includes(userRole)) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to access reports.' });
  }

  try {
    // 1. Calcular la fecha de hace 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 2. Obtener los incidentes de los últimos 30 días
    const { data: incidents, error } = await supabase
      .from('incidents')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (error) throw error;

    // 3. Procesar y agregar los datos para crear las estadísticas
    const totalIncidents = incidents.length;

    const incidentsByStatus = incidents.reduce((acc, incident) => {
      const status = incident.status || 'Sin estado';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const incidentsByCriticality = incidents.reduce((acc, incident) => {
      const criticality = incident.criticality || 'Sin criticidad';
      acc[criticality] = (acc[criticality] || 0) + 1;
      return acc;
    }, {});

    const affectedAssetsCount = incidents.reduce((acc, incident) => {
      const asset = incident.affected_asset || 'Desconocido';
      acc[asset] = (acc[asset] || 0) + 1;
      return acc;
    }, {});

    // Ordenar y obtener los 5 activos más afectados
    const topAffectedAssets = Object.entries(affectedAssetsCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([asset, count]) => ({ asset, count }));

    // 4. Construir el objeto final del reporte
    const report = {
      period: {
        start: thirtyDaysAgo.toISOString(),
        end: new Date().toISOString(),
      },
      totalIncidents,
      breakdownByStatus: incidentsByStatus,
      breakdownByCriticality: incidentsByCriticality,
      topAffectedAssets,
    };

    res.status(200).json(report);

  } catch (error) {
    console.error("Error generating monthly report:", error);
    res.status(500).json({ error: 'Failed to generate monthly report.' });
  }
});

// Endpoint para eliminar un factor MFA (por ejemplo, si el usuario cancela la configuración)
app.post('/api/mfa/delete', authenticateToken, async (req, res) => {
  const { factorId } = req.body;
  if (!factorId) {
    return res.status(400).json({ error: 'Se requiere factorId.' });
  }
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.status(200).json({ message: 'Factor MFA eliminado correctamente.' });
});

app.get('/api/incidents/export/pdf', authenticateToken, async (req, res) => {
  const userRole = req.user.user_metadata.role;
  const authorizedRoles = ['Auditor', 'Gerente de Riesgos', 'Jefe de SOC', 'Analista de Seguridad'];
  if (!authorizedRoles.includes(userRole)) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to export data.' });
  }

  try {
    const { data: incidents, error } = await supabase.from('incidents').select('*');
    if (error) throw error;

    // --- Paso de Anonimización (RS-05) ---
    const userMap = new Map();
    let userCounter = 1;
    const anonymizedIncidents = incidents.map(incident => {
      if (!userMap.has(incident.creator_id)) {
        userMap.set(incident.creator_id, `usuario-${userCounter++}`);
      }
      return {
        ...incident,
        creator_id: userMap.get(incident.creator_id) // Reemplazar UUID con seudónimo
      };
    });

    // --- Paso de Generación de PDF (RF-06) ---
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="reporte_incidentes.pdf"');

    doc.pipe(res); // Envía el PDF directamente a la respuesta

    // Añadir contenido al PDF
    doc.fontSize(18).text('Reporte de Incidentes de Seguridad', { align: 'center' });
    doc.moveDown(2);

    anonymizedIncidents.forEach(inc => {
      doc.fontSize(12).font('Helvetica-Bold').text(`ID de Incidente: ${inc.id}`);
      doc.font('Helvetica').fontSize(10).text(`Título: ${inc.title}`);
      doc.text(`Activo Afectado: ${inc.affected_asset}`);
      doc.text(`Estado: ${inc.status} | Criticidad: ${inc.criticality}`);
      doc.text(`Reportado por: ${inc.creator_id}`); // <-- ID ya anonimizado
      doc.moveDown();
      doc.lineCap('butt').moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
    });

    doc.end();

  } catch (error) {
    console.error("Error al exportar a PDF:", error);
    res.status(500).json({ error: 'No se pudo exportar los incidentes a PDF.' });
  }
});

// Endpoint para listar usuarios (gestión de usuarios)
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  const userRole = req.user.user_metadata.role;
  const allowedRoles = ['Jefe de SOC', 'Gerente de Riesgos'];
  if (!allowedRoles.includes(userRole)) {
    return res.status(403).json({ error: 'No tienes permisos para ver usuarios.' });
  }
  const { data, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    return res.status(400).json({ error: error.message });
  }
  res.status(200).json(data.users);
});

// Endpoint para que el Jefe de SOC cambie roles
app.post("/api/users/:id/change-role", authenticateToken, requireRole("Jefe de SOC"), async (req, res) => {
  const { id } = req.params;
  const { newRole } = req.body;

  const validRoles = ['Usuario', 'Analista de Seguridad', 'Jefe de SOC', 'Auditor', 'Gerente de Riesgos'];
  if (!validRoles.includes(newRole)) {
    return res.status(400).json({ error: 'Rol inválido.' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(id, {
      user_metadata: { role: newRole }
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    await logAction(req.user.id, "CHANGE_ROLE", {
      targetUserId: id,
      newRole,
    });

    res.json({ message: `Rol cambiado a ${newRole}`, user: data.user });
  } catch (err) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});


app.listen(PORT, HOST, () => {
  console.log(`Server is listening on http://${HOST}:${PORT}`);
});