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
  password: '@Da1006327348',
  database: 'arbol_ciencia',
  host: 'localhost',
  port: 5432
};

// Configuración para desarrollo local
const config = {
  user: getEnvVar('DB_USER', DB_DEFAULTS.user),
  host: DB_DEFAULTS.host,
  database: getEnvVar('DB_NAME', DB_DEFAULTS.database),
  password: getEnvVar('DB_PASS', DB_DEFAULTS.password),
  port: parseInt(getEnvVar('DB_PORT', DB_DEFAULTS.port), 10),
};

console.log('======= USANDO CONFIGURACION LOCAL PARA POSTGRESQL =======');
console.log('ADVERTENCIA: Esta configuración NO debería usarse en Cloud Run');
console.log('Configuración de conexión local:', {
  ...config,
  password: '******', // Ocultar contraseña en los logs por seguridad
});

// Crea la conexión para entorno local
const pool = new Pool(config);

// Agregar handler para errores de conexión
pool.on('error', (err) => {
  console.error('Error inesperado en el cliente PostgreSQL local', err);
});

// Probar conexión al iniciar
const testConnection = async () => {
  try {
    console.log('Probando conexión a PostgreSQL local...');
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL local establecida correctamente');
    const res = await client.query('SELECT NOW() as time');
    console.log('Hora del servidor PostgreSQL:', res.rows[0].time);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Error al conectar con PostgreSQL local:', err.message);
    console.error('Detalles del error:', err);
    return false;
  }
};

// Ejecutar prueba de conexión
testConnection();

module.exports = pool;
