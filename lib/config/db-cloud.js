const { Pool } = require('pg');

// Obtener valores seguros de las variables de entorno o usar valores predeterminados
const getEnvVar = (name, defaultValue) => {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') {
    console.log(`⚠️ Variable de entorno ${name} no definida, usando valor predeterminado`);
    return defaultValue;
  }
  return value;
};

const DB_DEFAULTS = {
  user: 'postgres',
  database: 'postgres',
  instanceName: 'web-arboldelaciencia:us-central1:arboldelaciencia1',
  publicIp: '34.41.227.140',
  port: 5432
};

// Añadir logs para depurar DB_PASS
console.log(`DEBUG: Valor de process.env.DB_PASS: "${process.env.DB_PASS}"`);
console.log(`DEBUG: Tipo de process.env.DB_PASS: ${typeof process.env.DB_PASS}`);

// Configuración para Cloud SQL
const DB_CONFIG = {
  user: getEnvVar('DB_USER', DB_DEFAULTS.user),
  password: getEnvVar('DB_PASS', ''),  // No usar valor por defecto para contraseña en Cloud
  database: getEnvVar('DB_NAME', DB_DEFAULTS.database),
  instanceName: getEnvVar('INSTANCE_CONNECTION_NAME', DB_DEFAULTS.instanceName),
  publicIp: getEnvVar('DB_PUBLIC_IP', DB_DEFAULTS.publicIp),
  port: parseInt(getEnvVar('DB_PORT', DB_DEFAULTS.port), 10)
};

console.log('Usando configuración CLOUD SQL para PostgreSQL');
console.log('Configuración de base de datos cloud:', {
  ...DB_CONFIG,
  password: '******' // Ocultar contraseña en los logs
});

// Pool para la conexión de fallback (usando IP pública)
let fallbackPool = null;

// Función para obtener la configuración de conexión de Cloud SQL usando socket Unix
const getCloudSqlConfig = () => {
  // Usa la variable de entorno DATABASE_URL si está definida
  if (process.env.DATABASE_URL) {
    console.log('Usando DATABASE_URL para conectar a PostgreSQL');
    return {
      connectionString: process.env.DATABASE_URL,
    };
  }

  // Construir la ruta del socket Unix
  const socketPath = `/cloudsql/${DB_CONFIG.instanceName}`;
  
  console.log('Intentando conexión principal a Cloud SQL (socket Unix):', {
    method: 'Socket Unix',
    socketPath,
    user: DB_CONFIG.user,
    database: DB_CONFIG.database,
  });

  // Configuramos un intento de conexión alternativa usando IP pública como respaldo
  setTimeout(async () => {
    try {
      console.log('Intentando conexión alternativa a Cloud SQL (IP pública):', {
        host: DB_CONFIG.publicIp,
        port: DB_CONFIG.port,
        user: DB_CONFIG.user,
        database: DB_CONFIG.database,
      });
      
      fallbackPool = new Pool({
        user: DB_CONFIG.user,
        password: DB_CONFIG.password,
        database: DB_CONFIG.database,
        host: DB_CONFIG.publicIp,
        port: DB_CONFIG.port,
        ssl: {
          rejectUnauthorized: false // Para desarrollo; en producción debería verificar el certificado
        },
        connectionTimeoutMillis: 60000,
      });
      
      // Probar la conexión alternativa
      const client = await fallbackPool.connect();
      console.log('✅ Conexión alternativa por IP pública establecida correctamente');
      const res = await client.query('SELECT NOW() as time');
      console.log('Hora del servidor (conexión IP):', res.rows[0].time);
      client.release();
    } catch (err) {
      console.error('❌ Error al intentar conexión alternativa:', err.message);
    }
  }, 5000); // Esperar 5 segundos antes de intentar la conexión alternativa
  
  // Configuración principal usando socket Unix
  return {
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    database: DB_CONFIG.database,
    host: socketPath,  // Usar el socket Unix directamente
    // Sin especificar port cuando usamos socket Unix
    ssl: false,
    connectionTimeoutMillis: 60000,  // Aumentar el timeout a 60 segundos
    statement_timeout: 60000,        // Timeout para consultas
    idle_in_transaction_session_timeout: 60000,  // Timeout para transacciones inactivas
  };
};

// Crea la conexión basada en el entorno
const pool = new Pool(getCloudSqlConfig());

// Agregar handler para errores de conexión
pool.on('error', (err) => {
  console.error('Error inesperado en el cliente PostgreSQL Cloud', err);
});

// Prueba rápida de conexión al iniciar
const testConnection = async () => {
  try {
    // Evitar la conexión durante la compilación (Next.js)
    if (process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build') {
      console.log('Omitiendo prueba de conexión durante la compilación');
      return false;
    }
    
    console.log('Probando conexión a PostgreSQL Cloud...');
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL Cloud establecida correctamente');
    
    // Realizar una consulta simple para probar la conexión
    const res = await client.query('SELECT NOW() as time');
    console.log('Hora del servidor PostgreSQL Cloud:', res.rows[0].time);
    
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Error al conectar con PostgreSQL Cloud:', err.message);
    console.error('Detalles del error:', err);
    return false;
  }
};

// Ejecutar la prueba de conexión solo si no estamos en fase de compilación
if (!(process.env.NODE_ENV === 'production' && process.env.NEXT_PHASE === 'phase-production-build')) {
  testConnection();
}

module.exports = pool;
