const accessRules = require('../utils/accessRules');

function isWithinTime(start, end, now) {
  const [sHour, sMin] = start.split(":").map(Number);
  const [eHour, eMin] = end.split(":").map(Number);
  const startTime = new Date(now);
  const endTime = new Date(now);

  startTime.setHours(sHour, sMin, 0);
  endTime.setHours(eHour, eMin, 59);

  return now >= startTime && now <= endTime;
}

module.exports = function checkTimeAccess(action, resource) {
  return (req, res, next) => {
    const role = req.user.user_metadata.role;
    const now = new Date();
    const day = now.getDay();

    const rules = accessRules[role] || accessRules["Usuario"];

    const matchedRule = rules.find(rule =>
      rule.action === action &&
      rule.resource === resource &&
      rule.days.includes(day)
    );

    if (!matchedRule) {
      return res.status(403).json({
        error: `Acceso denegado: ${role} no tiene permisos para ${action} en ${resource}`,
      });
    }

    if (!isWithinTime(matchedRule.start, matchedRule.end, now)) {
      return res.status(403).json({
        error: `Acceso denegado: ${role} no puede ${action} en ${resource} fuera del horario permitido (${matchedRule.start} - ${matchedRule.end})`,
      });
    }

    next();
  };
};

