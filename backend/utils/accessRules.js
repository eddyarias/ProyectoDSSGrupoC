module.exports = {
    Usuario: [
        { action: "Crear", resource: "Incidente", start: "07:00", end: "17:00", days: [1, 2, 3, 4, 5] },
        { action: "Ver", resource: "Incidentes", start: "07:00", end: "17:00", days: [1, 2, 3, 4, 5] },
        { action: "Editar", resource: "Incidentes", start: "07:00", end: "17:00", days: [1, 2, 3, 4, 5] },
        { action: "Adjuntar", resource: "Evidencia", start: "07:00", end: "17:00", days: [1, 2, 3, 4, 5] },
    ],
    "Analista de Seguridad": [
        { action: "Ver", resource: "Incidentes", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
        { action: "Editar", resource: "Incidente", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
        { action: "Clasificar", resource: "Incidente", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
        { action: "Cambiar estado", resource: "Incidente", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
        { action: "Generar", resource: "Reporte mensual", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
        { action: "Ver", resource: "Reportes", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
        { action: "Visualizar", resource: "Dashboard de incidentes", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
        { action: "Exportar", resource: "Incidentes", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
    ],
    "Jefe de SOC": [
        { action: "Ver", resource: "Incidentes", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
        { action: "Editar", resource: "Incidente", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
        { action: "Autorizar", resource: "Incidente", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
        { action: "Cerrar", resource: "Incidente", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
        { action: "Generar", resource: "Reporte mensual", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
        { action: "Ver", resource: "Reportes", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
        { action: "Ver", resource: "Usuarios", start: "07:00", end: "19:00", days: [1, 2, 3, 4, 5] },
    ],
    "Gerente de Riesgos": [
        { action: "Generar", resource: "Reporte mensual", start: "08:00", end: "18:00", days: [1, 2, 3, 4, 5] },
        { action: "Ver", resource: "Reportes", start: "08:00", end: "18:00", days: [1, 2, 3, 4, 5] },
        { action: "Exportar", resource: "Reportes", start: "08:00", end: "18:00", days: [1, 2, 3, 4, 5] },
    ],
    Auditor: [
        { action: "Ver", resource: "Reportes mensuales", start: "00:00", end: "23:59", days: [0, 1, 2, 3, 4, 5, 6] },
        { action: "Ver", resource: "Reportes", start: "00:00", end: "23:59", days: [0, 1, 2, 3, 4, 5, 6] },
        { action: "Ver", resource: "Incidentes", start: "00:00", end: "23:59", days: [0, 1, 2, 3, 4, 5, 6] },
        { action: "Exportar", resource: "Casos", start: "00:00", end: "23:59", days: [0, 1, 2, 3, 4, 5, 6] },
    ]
};
