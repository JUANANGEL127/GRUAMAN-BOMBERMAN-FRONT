// src/config/gameConfig.js
/**
 * Configuración de mundos y niveles del juego
 * Basado en los componentes reales de GRUAMAN-BOMBERMAN
 *
 * IDs de mundos → usados por LevelWrapper para mapear componentes
 * Routes         → corresponden a las rutas reales de main.jsx
 */

export const gameWorlds = {
  // ===========================================
  // BOMBERMAN - 8 FORMULARIOS
  // Orden: hora_ingreso, permiso_trabajo, planillabombeo, checklist,
  //        chequeo_alturas, inspeccion_epcc_bomberman, inventariosobra, hora_salida
  // ===========================================
  bomberman: [
    // 1. HORA DE INGRESO (Compartido)
    {
      id: 'hora-ingreso',
      name: 'Misión: Registro de Entrada',
      description: 'Marca tu llegada, héroe',
      icon: '🕐',
      emoji: '⏰',
      shared: true,
      component: 'HoraIngreso',
      route: '/hora_ingreso',
      color: '#FF9800',
      bgColor: '#FFF3E0',
      daily: true,
      order: 1,
      sections: 1
    },

    // 2. PERMISO DE TRABAJO (Compartido)
    {
      id: 'permiso-trabajo',
      name: 'Misión: Permiso de Trabajo',
      description: 'Autorización para iniciar tareas',
      icon: '📋',
      emoji: '👷‍♀️',
      shared: true,
      component: 'PermisoTrabajo',
      route: '/permiso_trabajo',
      color: '#4CAF50',
      bgColor: '#E8F5E9',
      daily: true,
      order: 2,
      sections: 6
    },

    // 3. PLANILLA BOMBEO (Exclusivo Bomberman)
    {
      id: 'planilla-bombeo',
      name: 'Misión: Planilla de Bombeo',
      description: 'Control de operación de bomba',
      icon: '💧',
      emoji: '🌊',
      shared: false,
      component: 'PlanillaBombeo',
      route: '/planillabombeo',
      color: '#9C27B0',
      bgColor: '#F3E5F5',
      daily: false,
      order: 3,
      sections: 3
    },

    // 4. CHECKLIST BOMBA (Exclusivo Bomberman)
    {
      id: 'checklist',
      name: 'Misión: Checklist Bomba',
      description: 'Revisión completa del equipo',
      icon: '✅',
      emoji: '🔧',
      shared: false,
      component: 'Checklist',
      route: '/checklist',
      color: '#F44336',
      bgColor: '#FFEBEE',
      daily: false,
      order: 4,
      sections: 3
    },

    // 5. HERRAMIENTAS DE MANTENIMIENTO (Exclusivo Bomberman)
    {
      id: 'herramientas-mantenimiento',
      name: 'Misión: Herramientas de Mantenimiento',
      description: 'Control de herramientas de mantenimiento',
      icon: '🔩',
      emoji: '🧰',
      shared: false,
      component: 'HerramientasMantenimiento',
      route: '/herramientas_mantenimiento',
      color: '#FF9800',
      bgColor: '#FFF3E0',
      daily: false,
      order: 5,
      sections: 2
    },

    // 6. KIT DE LAVADO Y MANTENIMIENTO (Exclusivo Bomberman)
    {
      id: 'kit-limpieza',
      name: 'Misión: Kit de Lavado',
      description: 'Kit de lavado y mantenimiento',
      icon: '🧴',
      emoji: '🧹',
      shared: false,
      component: 'KitLimpieza',
      route: '/kit_limpieza',
      color: '#4CAF50',
      bgColor: '#E8F5E9',
      daily: false,
      order: 6,
      sections: 2
    },

    // 7. TRABAJO EN ALTURA (Compartido)
    {
      id: 'chequeo-altura',
      name: 'Misión: Trabajo en Altura',
      description: 'Verificación de seguridad en alturas',
      icon: '🪜',
      emoji: '⬆️',
      shared: true,
      component: 'ChequeoAlturas',
      route: '/chequeo_alturas',
      color: '#2196F3',
      bgColor: '#E3F2FD',
      daily: false,
      order: 6,
      sections: 4
    },

    // 7. INSPECCIÓN EPCC BOMBERMAN (Exclusivo Bomberman)
    {
      id: 'inspeccion-epcc-bomberman',
      name: 'Misión: Inspección EPCC',
      description: 'Equipos de protección certificados',
      icon: '🛡',
      emoji: '🛡️',
      shared: false,
      component: 'InspeccionEpccBomberman',
      route: '/inspeccion_epcc_bomberman',
      color: '#00BCD4',
      bgColor: '#E0F7FA',
      daily: false,
      order: 7,
      sections: 2
    },

    // 8. INVENTARIOS OBRA (Exclusivo Bomberman - NO DIARIO)
    {
      id: 'inventarios-obra',
      name: 'Misión: Inventario de Obra',
      description: 'Control de materiales y herramientas',
      icon: '📦',
      emoji: '📝',
      shared: false,
      component: 'InventariosObra',
      route: '/inventariosobra',
      color: '#795548',
      bgColor: '#EFEBE9',
      daily: false, // ⚠️ IMPORTANTE: No es diario (mensual)
      order: 8,
      sections: 2
    },

    // 9. HORA DE SALIDA (Compartido)
    {
      id: 'hora-salida',
      name: 'Misión: Registro de Salida',
      description: 'Cierra la jornada, héroe',
      icon: '🕔',
      emoji: '🌙',
      shared: true,
      component: 'HoraSalida',
      route: '/hora_salida',
      color: '#607D8B',
      bgColor: '#ECEFF1',
      daily: true,
      order: 8,
      sections: 1
    }
  ],

  // ===========================================
  // GRUAMAN - 8 FORMULARIOS
  // Orden: hora_ingreso, permiso_trabajo, chequeo_alturas, chequeo_torregruas,
  //        chequeo_elevador, inspeccion_epcc, inspeccion_izaje, hora_salida
  // ===========================================
  gruaman: [
    // 1. HORA DE INGRESO (Compartido)
    {
      id: 'hora-ingreso',
      name: 'Misión: Registro de Entrada',
      description: 'Marca tu llegada, héroe',
      icon: '🕐',
      emoji: '⏰',
      shared: true,
      component: 'HoraIngreso',
      route: '/hora_ingreso',
      color: '#FF9800',
      bgColor: '#FFF3E0',
      daily: true,
      order: 1,
      sections: 1
    },

    // 2. PERMISO DE TRABAJO (Compartido)
    {
      id: 'permiso-trabajo',
      name: 'Misión: Permiso de Trabajo',
      description: 'Autorización para iniciar tareas',
      icon: '📋',
      emoji: '👷‍♀️',
      shared: true,
      component: 'PermisoTrabajo',
      route: '/permiso_trabajo',
      color: '#4CAF50',
      bgColor: '#E8F5E9',
      daily: true,
      order: 2,
      sections: 6
    },

    // 3. TRABAJO EN ALTURA (Compartido)
    {
      id: 'chequeo-altura',
      name: 'Misión: Trabajo en Altura',
      description: 'Verificación de seguridad en alturas',
      icon: '🪜',
      emoji: '⬆️',
      shared: true,
      component: 'ChequeoAlturas',
      route: '/chequeo_alturas',
      color: '#2196F3',
      bgColor: '#E3F2FD',
      daily: false,
      order: 3,
      sections: 4
    },

    // 4. CHEQUEO TORREGRÚAS (Exclusivo Gruaman)
    {
      id: 'chequeo-torregruas',
      name: 'Misión: Chequeo Torregrúa',
      description: 'Inspección de torre grúa',
      icon: '🏗️',
      emoji: '🏗️',
      shared: false,
      component: 'ChequeoTorregruas',
      route: '/chequeo_torregruas',
      color: '#673AB7',
      bgColor: '#EDE7F6',
      daily: false,
      order: 4,
      sections: 3
    },

    // 5. CHEQUEO ELEVADOR (Exclusivo Gruaman)
    {
      id: 'chequeo-elevador',
      name: 'Misión: Chequeo Elevador',
      description: 'Inspección de elevador de carga',
      icon: '🔼',
      emoji: '📦',
      shared: false,
      component: 'ChequeoElevador',
      route: '/chequeo_elevador',
      color: '#E91E63',
      bgColor: '#FCE4EC',
      daily: false,
      order: 5,
      sections: 3
    },

    // 6. INSPECCIÓN EPCC (Exclusivo Gruaman)
    {
      id: 'inspeccion-epcc',
      name: 'Misión: Inspección EPCC',
      description: 'Equipos de protección certificados',
      icon: '🛡',
      emoji: '🛡️',
      shared: false,
      component: 'InspeccionEpcc',
      route: '/inspeccion_epcc',
      color: '#009688',
      bgColor: '#E0F2F1',
      daily: false,
      order: 6,
      sections: 2
    },

    // 7. INSPECCIÓN DE IZAJE (Exclusivo Gruaman)
    {
      id: 'inspeccion-izaje',
      name: 'Misión: Inspección Izaje',
      description: 'Control de equipos de izaje',
      icon: '⚙️',
      emoji: '🏋',
      shared: false,
      component: 'InspeccionIzaje',
      route: '/inspeccion_izaje',
      color: '#3F51B5',
      bgColor: '#E8EAF6',
      daily: false,
      order: 7,
      sections: 2
    },

    // 8. ATS — ANÁLISIS DE TRABAJO SEGURO (Exclusivo Gruaman)
    {
      id: 'ats',
      name: 'Misión: ATS',
      description: 'Análisis de Trabajo Seguro',
      icon: '📋',
      emoji: '🦺',
      shared: false,
      component: 'AtsSelector',
      route: '/ats-selector',
      color: '#FF5722',
      bgColor: '#FBE9E7',
      daily: false,
      order: 8,
      sections: 1
    },

    // 9. HORA DE SALIDA (Compartido)
    {
      id: 'hora-salida',
      name: 'Misión: Registro de Salida',
      description: 'Cierra la jornada, héroe',
      icon: '🕔',
      emoji: '🌙',
      shared: true,
      component: 'HoraSalida',
      route: '/hora_salida',
      color: '#607D8B',
      bgColor: '#ECEFF1',
      daily: true,
      order: 9,
      sections: 1
    }
  ]
};

// ===========================================
// HELPERS
// ===========================================

/**
 * Obtener mundos por personaje
 */
export const getWorldsByCharacter = (character) => {
  return gameWorlds[character] || [];
};

/**
 * Obtener solo permisos diarios
 */
export const getDailyWorlds = (character) => {
  const worlds = gameWorlds[character] || [];
  return worlds.filter(w => w.daily !== false);
};

/**
 * Obtener mundo específico
 */
export const getWorldById = (character, worldId) => {
  const worlds = gameWorlds[character] || [];
  return worlds.find(w => w.id === worldId);
};

/**
 * Verificar si un mundo está compartido
 */
export const isSharedWorld = (worldId) => {
  const allWorlds = [...gameWorlds.bomberman, ...gameWorlds.gruaman];
  const world = allWorlds.find(w => w.id === worldId);
  return world?.shared || false;
};

/**
 * Obtener color del personaje
 */
export const getCharacterColor = (character) => {
  return {
    bomberman: {
      primary: '#FF6B35',
      secondary: '#F7931E',
      gradient: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
    },
    gruaman: {
      primary: '#4A90E2',
      secondary: '#357ABD',
      gradient: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)'
    }
  }[character];
};

/**
 * Obtener nombre amigable del personaje
 * Mapeo basado en usuario.empresa de BienvenidaSeleccion:
 *   "GyE"     → gruaman
 *   "Lideres" → bomberman
 *   otros     → bomberman
 */
export const getCharacterName = (character) => {
  return {
    bomberman: 'Bomberman',
    gruaman: 'Gruaman'
  }[character] || character;
};

/**
 * Determinar personaje a partir de usuario.empresa
 * (misma lógica que BienvenidaSeleccion.jsx línea 110-116)
 */
export const determineCharacter = (empresa) => {
  if (empresa === 'GyE') return 'gruaman';
  return 'bomberman'; // AIC, Lideres, otros
};

/**
 * Calcular progreso total
 */
export const calculateProgress = (completedWorlds, totalWorlds) => {
  if (!totalWorlds || totalWorlds === 0) return 0;
  return Math.round((completedWorlds / totalWorlds) * 100);
};

export default gameWorlds;
