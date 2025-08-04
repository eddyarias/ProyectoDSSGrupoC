const { supabase } = require('./supabaseClient');
const crypto = require('crypto');
const { encrypt } = require('./utils/cryptoHelper');

/**
 * Registra una acción en el log de auditoría con cifrado AES y cadena de hashes.
 * @param {string} userId - El ID del usuario que realiza la acción.
 * @param {string} action - El tipo de acción (ej. 'CREATE_INCIDENT', 'CHANGE_ROLE').
 * @param {object} details - Detalles del evento (se cifran).
 */
async function logAction(userId, action, details) {
  try {
    // 1. Obtener el último hash
    const { data: lastLog, error: lastLogError } = await supabase
      .from('audit_logs')
      .select('current_hash')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastLogError && lastLogError.code !== 'PGRST116') {
      throw lastLogError;
    }

    const previousHash = lastLog ? lastLog.current_hash : '0';

    // 2. Cifrar los detalles sensibles
    const encryptedDetails = encrypt(JSON.stringify(details));

    const logEntryData = {
      user_id: userId,
      action,
      details: encryptedDetails, // Guardamos el JSON cifrado
      previous_hash: previousHash,
    };

    // 3. Crear hash de integridad
    const dataToHash = JSON.stringify(logEntryData);
    const currentHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    // 4. Insertar en la base de datos
    const { error: insertError } = await supabase
      .from('audit_logs')
      .insert([{ ...logEntryData, current_hash: currentHash }]);

    if (insertError) throw insertError;

  } catch (error) {
    console.error('❌ Failed to create audit log:', error);
  }
}

module.exports = logAction;
