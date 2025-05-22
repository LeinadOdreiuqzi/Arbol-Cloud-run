/**
 * Archivo principal de configuración de base de datos
 * Este archivo selecciona la configuración correcta según el entorno
 *
 * En producción (Cloud Run), importa la configuración de db-cloud.js
 * En desarrollo local, usa la configuración local
 */

const { Pool } = require('pg');

// Verificar de manera definitiva si estamos en Cloud Run
const RUNNING_IN_CLOUD_RUN = process.env.K_SERVICE !== undefined;

// Imprimir el entorno de ejecución de manera inequívoca
console.log(`=== ENTORNO DE EJECUCIÓN ===`);
console.log(`K_SERVICE: ${process.env.K_SERVICE}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`EJECUTANDO EN CLOUD RUN: ${RUNNING_IN_CLOUD_RUN ? 'SÍ' : 'NO'}`);

// Pool que se usará para la conexión a la base de datos
let pool;

// Configuración para la fase de compilación
if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
  console.log('FASE DE COMPILACIÓN: Creando pool falso sin intentar conexión');
  // Crear un pool falso durante la compilación
  pool = new Pool();
}
// Configuración para Cloud Run - Usar db-cloud.js
else if (RUNNING_IN_CLOUD_RUN) {
  console.log('ENTORNO CLOUD RUN: Importando configuración desde db-cloud.js');
  
  try {
    // Importar la configuración de db-cloud.js dinámicamente
    const cloudConfig = require('./config/db-cloud');
    console.log('Configuración importada de db-cloud.js');
    
    // Usar el pool exportado por db-cloud.js
    pool = cloudConfig;
    
    // Configurar manejador de errores
    pool.on('error', err => {
      console.error('Error en el pool de conexiones PostgreSQL (db-cloud):', err.message);
    });
    
    console.log('Configuración de Cloud SQL aplicada exitosamente');
  } catch (error) {
    console.error('Error al cargar la configuración de db-cloud.js:', error.message);
    console.error('Stack:', error.stack);
    
    // Si hay un error al cargar db-cloud.js, intentar con configuración de respaldo
    console.log('Intentando configuración de respaldo...');
    
    const instanceConnectionName = 'web-arboldelaciencia:us-central1:arboldelaciencia1';
    const dbUser = 'postgres';
    const dbName = 'postgres';
    const dbPass = 'lI][\\S4B#\\89%Gyf'; // Contraseña hardcodeada de respaldo
    
    const socketPath = `/cloudsql/${instanceConnectionName}`;
    
    console.log('Conexión de respaldo mediante socket Unix:', {
      socketPath,
      user: dbUser,
      database: dbName
    });
    
    const cloudConfig = {
      user: dbUser,
      password: dbPass, 
      database: dbName,
      host: socketPath,
      ssl: false,
      connectionTimeoutMillis: 60000,
      statement_timeout: 60000,
      idle_in_transaction_session_timeout: 60000
    };
    
    pool = new Pool(cloudConfig);
  }
}
// Configuración para entorno local
else {
  console.log('ENTORNO LOCAL: Aplicando configuración para PostgreSQL local');
  
  // Configuración para desarrollo local
  const localConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '@Da1006327348',
    database: process.env.DB_NAME || 'arbol_ciencia',
    host: 'localhost',
    port: 5432
  };
  
  console.log('Configuración local:', {
    ...localConfig,
    password: '******'
  });
  
  // Crear el pool con la configuración local
  pool = new Pool(localConfig);
}

// Agregar manejador de errores
pool.on('error', err => {
  console.error('Error inesperado en la conexión a PostgreSQL:', err.message);
});

// Probar la conexión si no estamos en fase de compilación
if (!(process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build')) {
  console.log('Probando conexión a PostgreSQL...');
  
  pool.connect()
    .then(client => {
      console.log('Conexión exitosa a PostgreSQL');
      return client.query('SELECT NOW() as time')
        .then(res => {
          console.log('Hora del servidor:', res.rows[0].time);
          client.release();
        })
        .catch(err => {
          console.error('Error en consulta:', err.message);
          client.release();
        });
    })
    .catch(err => {
      console.error('Error al conectar con PostgreSQL:', err.message);
    });
}

// Exportar el pool para su uso en la aplicación
module.exports = pool;