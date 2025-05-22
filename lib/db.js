/**
 * Archivo principal de configuración de base de datos
 * Este archivo selecciona la configuración correcta según el entorno
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
// Configuración para Cloud Run
else if (RUNNING_IN_CLOUD_RUN) {
  console.log('ENTORNO CLOUD RUN: Aplicando configuración para Cloud SQL');

  // Log detallado de variables de entorno para Cloud Run
  console.log('--- Variables de Entorno para Cloud SQL ---');
  console.log(`INSTANCE_CONNECTION_NAME: "${process.env.INSTANCE_CONNECTION_NAME}" (Tipo: ${typeof process.env.INSTANCE_CONNECTION_NAME})`);
  console.log(`DB_USER: "${process.env.DB_USER}" (Tipo: ${typeof process.env.DB_USER})`);
  console.log(`DB_PASS: "${process.env.DB_PASS ? '****** (definida)' : 'NO DEFINIDA o vacía'}" (Tipo: ${typeof process.env.DB_PASS})`);
  console.log(`DB_NAME: "${process.env.DB_NAME}" (Tipo: ${typeof process.env.DB_NAME})`);
  console.log('-------------------------------------------');

  const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME || 'web-arboldelaciencia:us-central1:arboldelaciencia1';
  const dbUser = process.env.DB_USER || 'postgres';
  const dbName = process.env.DB_NAME || 'postgres';
  const dbPass = process.env.DB_PASS;

  if (typeof dbPass !== 'string' || dbPass.trim() === '') {
    console.error('ERROR CRÍTICO: DB_PASS no es una cadena válida o está vacía.');
    // Considera lanzar un error aquí o manejarlo de forma que la app no intente conectar
  }

  const socketPath = `/cloudsql/${instanceConnectionName}`;
  
  console.log('Conexión mediante socket Unix:', {
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
  
  // Crear el pool con la configuración de Cloud SQL
  pool = new Pool(cloudConfig);
  
  // Configurar respaldo con IP pública
  setTimeout(() => {
    const publicIp = process.env.DB_PUBLIC_IP || '34.41.227.140';
    console.log(`Intentando conexión alternativa por IP pública: ${publicIp}`);
    
    // Este código solo se ejecuta si la conexión principal falla
    try {
      const fallbackPool = new Pool({
        user: dbUser,
        password: dbPass,
        database: dbName,
        host: publicIp,
        port: 5432,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 60000
      });
      
      // Probar la conexión alternativa
      fallbackPool.connect()
        .then(client => {
          console.log('Conexión alternativa exitosa');
          client.release();
        })
        .catch(err => {
          console.error('Error en conexión alternativa:', err.message);
        });
    } catch (err) {
      console.error('Error al configurar conexión alternativa:', err.message);
    }
  }, 10000);
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