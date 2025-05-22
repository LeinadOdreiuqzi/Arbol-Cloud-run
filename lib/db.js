/**
 * Archivo principal de configuración de base de datos
 * Este archivo selecciona automáticamente la configuración correcta según el entorno
 */

// Función para determinar si estamos en entorno Cloud Run
const isCloudRun = () => {
  // Durante la compilación de Next.js, asumimos que no es Cloud Run
  if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('Detección de entorno: Compilación de Next.js, no es Cloud Run');
    return false;
  }
  const inCloudRun = process.env.K_SERVICE !== undefined;
  console.log(`Ejecutando en Cloud Run: ${inCloudRun}`);
  return inCloudRun;
};

// Importar la configuración adecuada según el entorno
let db;

// Evitar conexión durante la compilación
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
  console.log('Fase de compilación detectada: omitiendo conexión a la base de datos');
  // Crear un pool falso para evitar errores durante la compilación
  const { Pool } = require('pg');
  db = new Pool();
  // No intentar conexión
} else {
  // Seleccionar la configuración correcta según el entorno
  if (isCloudRun()) {
    console.log('Cargando configuración de Cloud SQL');
    db = require('./config/db-cloud');
  } else {
    console.log('Cargando configuración local');
    db = require('./config/db-local');
  }
}

module.exports = db;