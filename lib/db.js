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

  // Obtener el nombre de la instancia directamente de las variables de entorno
  const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
  
  console.log('Configurando conexión Cloud SQL con:', {
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    instanceName: instanceConnectionName
  });

  // Configuración para usar con el conector de Cloud SQL
  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    // Configuración adicional para el socket de PostgreSQL
    ssl: false,
    // Añadir un timeout mayor para la conexión inicial
    connectionTimeoutMillis: 30000,
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

// Para debugging
const config = isCloudRun() ? getCloudSqlConfig() : getLocalConfig();
console.log('Usando configuración de base de datos:', {
  ...config,
  password: config.password ? '******' : undefined // Ocultar contraseña en los logs
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
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    client.release();
  } catch (err) {
    console.error('❌ Error al conectar con PostgreSQL:', err.message);
    console.error('Detalles:', err);
  }
};

// Ejecutar la prueba de conexión si estamos en Cloud Run
if (isCloudRun()) {
  testConnection();
}

module.exports = pool;