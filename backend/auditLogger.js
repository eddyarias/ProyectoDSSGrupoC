const { supabase } = require('./supabaseClient');
const crypto = require('crypto');

/**
 * Registra una acción en el log de auditoría con una cadena de hashes.
 * @param {string} userId - El ID del usuario que realiza la acción.
 * @param {string} action - El tipo de acción (ej. 'CREATE_INCIDENT').
 * @param {object} details - Un objeto JSON con detalles de la acción.
 */
async function logAction(userId, action, details) {
  try {
    // 1. Obtener el hash del último registro de auditoría
    const { data: lastLog, error: lastLogError } = await supabase
      .from('audit_logs')
      .select('current_hash')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastLogError && lastLogError.code !== 'PGRST116') {
      // PGRST116 significa 'no rows found', lo cual es normal si es el primer log.
      // Cualquier otro error es un problema.
      throw lastLogError;
    }

    const previousHash = lastLog ? lastLog.current_hash : '0'; // Si no hay logs, el hash previo es '0'

    // 2. Preparar los datos del nuevo registro
    const logEntryData = {
      user_id: userId,
      action: action,
      details: details,
      previous_hash: previousHash,
    };
    
    // 3. Crear el hash para el registro actual
    // El hash se basa en todos los datos del registro para asegurar la integridad.
    const dataToHash = JSON.stringify(logEntryData);
    const currentHash = crypto.createHash('sha256').update(dataToHash).digest('hex');

    // 4. Insertar el nuevo registro en la base de datos
    const { error: insertError } = await supabase
      .from('audit_logs')
      .insert([{ ...logEntryData, current_hash: currentHash }]);

    if (insertError) {
      throw insertError;
    }

    console.log(`Audit log created for action: ${action}`);
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
}

module.exports = logAction;