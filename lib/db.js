const { Pool } = require('pg');

// Función para determinar si estamos en entorno Cloud Run
const isCloudRun = () => process.env.K_SERVICE !== undefined;

// Configuración para Cloud SQL en Cloud Run
const getCloudSqlConfig = () => {
  // Usa la variable de entorno DATABASE_URL si está definida
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
    };
  }

  // Configuración para usar con el conector de Cloud SQL
  return {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS || '@Da1006327348',
    database: process.env.DB_NAME || 'arbol_ciencia',
    host: process.env.DB_HOST || '/cloudsql/' + process.env.INSTANCE_CONNECTION_NAME,
    port: parseInt(process.env.DB_PORT || '5432', 10),
  };
};

// Configuración para desarrollo local
const getLocalConfig = () => {
  return {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'arbol_ciencia',
    password: process.env.DB_PASS || '@Da1006327348',
    port: parseInt(process.env.DB_PORT || '5432', 10),
  };
};

// Crea la conexión basada en el entorno
const pool = new Pool(isCloudRun() ? getCloudSqlConfig() : getLocalConfig());

// Agregar handler para errores de conexión
pool.on('error', (err) => {
  console.error('Error inesperado en el cliente PostgreSQL', err);
});

module.exports = pool;