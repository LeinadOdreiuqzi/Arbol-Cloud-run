const { Pool } = require('pg');

// Valores predeterminados para la conexión si las variables de entorno no están disponibles
const DB_DEFAULTS = {
  user: 'postgres',
  password: '@Da1006327348',  // Solo para uso local
  localDatabase: 'arbol_ciencia',  // Nombre de la BD local
  cloudDatabase: 'postgres',     // Nombre de la BD en Cloud SQL
  host: 'localhost',
  port: 5432,
  instanceName: 'web-arboldelaciencia:us-central1:arboldelaciencia1',
  publicIp: '34.41.227.140'
};

// Obtener valores seguros de las variables de entorno o usar valores predeterminados
const getEnvVar = (name, defaultValue) => {
  const value = process.env[name];
  if (value === undefined || value === null || value === '') {
    console.warn(`⚠️ Variable de entorno ${name} no definida, usando valor predeterminado`);
    return defaultValue;
  }
  return value;
};

// Función para determinar si estamos en entorno Cloud Run
// Más confiable para detectar Cloud Run
const isCloudRun = () => {
  const inCloudRun = process.env.K_SERVICE !== undefined;
  console.log(`Ejecutando en Cloud Run: ${inCloudRun}`);
  return inCloudRun;
};

// Configuración global para la BD que usaremos en toda la aplicación
const DB_CONFIG = {
  user: getEnvVar('DB_USER', DB_DEFAULTS.user),
  password: getEnvVar('DB_PASS', DB_DEFAULTS.password),
  // Usar la BD correcta según el entorno (Cloud o local)
  database: isCloudRun() ? 
    getEnvVar('DB_NAME', DB_DEFAULTS.cloudDatabase) : 
    getEnvVar('DB_NAME', DB_DEFAULTS.localDatabase),
  instanceName: getEnvVar('INSTANCE_CONNECTION_NAME', DB_DEFAULTS.instanceName),
  publicIp: getEnvVar('DB_PUBLIC_IP', DB_DEFAULTS.publicIp),
  port: parseInt(getEnvVar('DB_PORT', DB_DEFAULTS.port), 10)
};

// Forzar impresión de valores para debugging (sin mostrar contraseña)
console.log('Configuración de base de datos:', {
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
        connectionTimeoutMillis: 30000,
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
    connectionTimeoutMillis: 30000,
  };
};

// Configuración para desarrollo local
const getLocalConfig = () => {
  console.log('Usando configuración local para PostgreSQL');
  return {
    user: DB_CONFIG.user,
    host: 'localhost',
    database: DB_CONFIG.database,
    password: DB_CONFIG.password,
    port: DB_CONFIG.port,
  };
};

// Seleccionar la configuración apropiada basada en el entorno
const config = isCloudRun() ? getCloudSqlConfig() : getLocalConfig();

// Logs para diagnóstico (sin mostrar la contraseña)
console.log('Configuración de conexión final:', {
  ...config,
  password: '******', // Ocultar contraseña en los logs por seguridad
});

// Crea la conexión basada en el entorno
const pool = new Pool(config);

// Agregar handler para errores de conexión
pool.on('error', (err) => {
  console.error('Error inesperado en el cliente PostgreSQL', err);
});

// Prueba rápida de conexión al iniciar
const testConnection = async () => {
  try {
    console.log('Probando conexión a PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    
    // Realizar una consulta simple para probar la conexión
    const res = await client.query('SELECT NOW() as time');
    console.log('Hora del servidor PostgreSQL:', res.rows[0].time);
    
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Error al conectar con PostgreSQL:', err.message);
    console.error('Detalles del error:', err);
    console.error('Stack trace:', err.stack);
    return false;
  }
};

// Ejecutar la prueba de conexión
testConnection();

// Exportamos tanto el pool como la función de test por si necesitamos usarla en otras partes
module.exports = pool;