const express = require('express');
const cors = require('cors');
const { supabase, supabaseAdmin } = require('./supabaseClient');
const authenticateToken = require('./authMiddleware');
const logAction = require('./auditLogger');
const sendAlertEmail = require('./emailService');
const crypto = require('crypto');
const multer = require('multer');
const PDFDocument = require('pdfkit');

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

app.post('/api/incidents', authenticateToken, async (req, res) => {
  // The user's ID comes from the middleware, not the request body
  const creator_id = req.user.id;

  // Get incident details from the request body
  const { title, description, detected_at, source, affected_asset, criticality } = req.body;

  // Insert the new incident into the database
  const { data, error } = await supabase
    .from('incidents')
    .insert([{ 
      title, 
      description, 
      detected_at, 
      source, 
      affected_asset, 
      criticality, 
      creator_id // Assign the logged-in user as the creator
    }])
    .select() // .select() returns the newly created row
    .single(); // .single() returns it as an object instead of an array

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!error) {
    // Añade el registro de auditoría
    await logAction(creator_id, 'CREATE_INCIDENT', { incidentId: data.id, title: data.title });
  }

  res.status(201).json(data);
});

// Endpoint to get incidents based on user role
app.get('/api/incidents/:id', authenticateToken, async (req, res) => {
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

app.get('/api/incidents', authenticateToken, async (req, res) => {
  const user = req.user;
  const userRole = user.user_metadata.role; // Get role from token metadata

  console.log(`User ${user.email} with role ${userRole} is requesting incidents.`);

  let query = supabase.from('incidents').select('*');

  // If the user has the 'Usuario' role, filter to show only their incidents.
  if (userRole === 'Usuario') {
    query = query.eq('creator_id', user.id);
  }

  // For any other role, the original query (select all) will be used.
  
  const { data, error } = await query;

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json(data);
});

// Listar los logs de auditoría (solo para usuarios con rol "Auditor")

app.get('/api/logs', authenticateToken, async (req, res) => {
  // 1) Sólo auditores pueden ver estos logs
  if (req.user.user_metadata.role !== 'Auditor') {
    return res.status(403).json({ error: 'Prohibido: solo auditores.' });
  }

  try {
    // 2) Traemos los logs puros (user_id, action, created_at)
    const { data: rawLogs, error: logsError } = await supabase
      .from('audit_logs')
      .select('user_id, action, created_at')
      .select('user_id, action, created_at, details')
      .select('id, user_id, action, created_at, details')
      .order('created_at', { ascending: false });

    if (logsError) throw logsError;


    // 3) Para cada log, buscamos el email con el Admin client
    const logs = await Promise.all(
      rawLogs.map(async log => {
        const { data: userRec, error: userErr } =
          await supabaseAdmin.auth.admin.getUserById(log.user_id);

        const email = userRec?.user?.email || log.user_id;
        return {
          id:        log.id,
          user:      email,           // ahora sí enviamos el correo
          action:    log.action,
          timestamp: log.created_at,
          details:   log.details
        };
      })
    );

    // 4) Respondemos el array enriquecido
    res.json(logs);

  } catch (err) {
    console.error('Error al recuperar audit_logs:', err);
    res.status(500).json({ error: 'Error recuperando logs.' });
  }
});

//Exportacion
//const PDFDocument = require('pdfkit');

// --- Exportar un solo log a CSV ---
app.get('/api/logs/:id/export/csv', authenticateToken, async (req, res) => {
  const logId = req.params.id;
  try {
    // 1) Traer el registro de audit_logs
    const { data: logRec, error: logErr } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, created_at, details')
      .eq('id', logId)
      .single();
    if (logErr) throw logErr;

    // 2) Obtener el email del usuario
    const { data: userRec } = await supabaseAdmin.auth.admin.getUserById(logRec.user_id);
    const userEmail = userRec?.user?.email || logRec.user_id;

    // 3) Traer datos completos del incidente
    const { data: incident, error: incErr } = await supabase
      .from('incidents')
      .select('id, title, affected_asset, criticality, status, source, evidence_url')
      .eq('id', logRec.details.incidentId)
      .single();
    if (incErr) throw incErr;

    // 4) Generar CSV a vuelo
    const headers = [
      'Log ID','Usuario','Acción','Fecha',
      'Incidente ID','Título','Activo Afectado',
      'Criticidad','Estado','Fuente'
    ];
    const row = [
      logRec.id,
      userEmail,
      logRec.action,
      logRec.created_at,
      incident.id,
      incident.title,
      incident.affected_asset,
      incident.criticality,
      incident.status,
      incident.source
    ];

    const csv =
      headers.join(',') + '\n' +
      row.map(v => `"${v}"`).join(',') + '\n';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=log_${logRec.id}.csv`);
    return res.send(csv);

  } catch (err) {
    console.error('CSV export error:', err);
    return res.status(500).json({ error: 'No se pudo exportar CSV.' });
  }
});


// --- Exportar un solo log a PDF ---
app.get('/api/logs/:id/export/pdf', authenticateToken, async (req, res) => {
  const logId = req.params.id;
  try {
    // 1) Log
    const { data: logRec, error: logErr } = await supabase
      .from('audit_logs')
      .select('id, user_id, action, created_at, details')
      .eq('id', logId)
      .single();
    if (logErr) throw logErr;

    // 2) Email
    const { data: userRec } = await supabaseAdmin.auth.admin.getUserById(logRec.user_id);
    const userEmail = userRec?.user?.email || logRec.user_id;

    // 3) Incidente
    const { data: incident, error: incErr } = await supabase
      .from('incidents')
      .select('id, title, affected_asset, criticality, status, source, evidence_url')
      .eq('id', logRec.details.incidentId)
      .single();
    if (incErr) throw incErr;

    // 4) PDF
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=log_${logRec.id}.pdf`);
    doc.pipe(res);

    doc.fontSize(16).text(`Log #${logRec.id}`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Usuario: ${userEmail}`);
    doc.text(`Acción: ${logRec.action}`);
    doc.text(`Fecha: ${new Date(logRec.created_at).toLocaleString()}`);
    doc.moveDown();
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
    doc.end();

  } catch (err) {
    console.error('PDF export error:', err);
    return res.status(500).json({ error: 'No se pudo exportar PDF.' });
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

// Endpoint to update an incident's status or classification
app.patch('/api/incidents/:id', authenticateToken, async (req, res) => {
  const userRole = req.user.user_metadata.role;
  const { id } = req.params;
  // Ahora también se permite actualizar la resolución
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

  // ... the rest of the function is the same
  const { data, error } = await supabase
    .from('incidents')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (!error) {
    await logAction(req.user.id, 'UPDATE_INCIDENT', { incidentId: data.id, changes: updateData });

    // Notificar por email cada vez que se actualiza la incidencia
    const subject = `Actualización de Incidente #${data.id}`;
    let body = `El incidente #${data.id} ha sido actualizado.\n\nCambios realizados:`;
    Object.entries(updateData).forEach(([key, value]) => {
      body += `\n- ${key}: ${value}`;
    });
    if (updateData.resolution) {
      body += `\n\nResolución: ${updateData.resolution}`;
    }
    await sendAlertEmail(subject, body);
  }

  res.status(200).json(data);
});

app.post('/api/incidents/:id/upload', authenticateToken, upload.single('evidenceFile'), async (req, res) => {
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

app.get('/api/reports/monthly', authenticateToken, async (req, res) => {
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


app.listen(PORT, HOST, () => {
  console.log(`Server is listening on http://${HOST}:${PORT}`);
});