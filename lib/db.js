const { Pool } = require('pg');

// Forzar impresión de variables de entorno para debugging (sin mostrar valores sensibles)
console.log('Variables de entorno disponibles:', {
  K_SERVICE: process.env.K_SERVICE ? 'definido' : 'no definido',
  DB_HOST: process.env.DB_HOST ? `'${process.env.DB_HOST}'` : 'no definido',
  DB_USER: process.env.DB_USER ? `'${process.env.DB_USER}'` : 'no definido',
  DB_NAME: process.env.DB_NAME ? `'${process.env.DB_NAME}'` : 'no definido',
  INSTANCE_CONNECTION_NAME: process.env.INSTANCE_CONNECTION_NAME ? `'${process.env.INSTANCE_CONNECTION_NAME}'` : 'no definido',
});

// Función para determinar si estamos en entorno Cloud Run
// Más confiable para detectar Cloud Run
const isCloudRun = () => {
  const inCloudRun = process.env.K_SERVICE !== undefined;
  console.log(`Ejecutando en Cloud Run: ${inCloudRun}`);
  return inCloudRun;
};

// Función para construir la configuración de conexión a Cloud SQL
const getCloudSqlConfig = () => {
  // Usa la variable de entorno DATABASE_URL si está definida
  if (process.env.DATABASE_URL) {
    console.log('Usando DATABASE_URL para conectar a PostgreSQL');
    return {
      connectionString: process.env.DATABASE_URL,
    };
  }

  // Obtener el nombre de la instancia directamente de las variables de entorno
  const instanceConnectionName = process.env.INSTANCE_CONNECTION_NAME;
  const socketPath = `/cloudsql/${instanceConnectionName}`;
  
  console.log('Configurando conexión Cloud SQL con socket Unix:', {
    socketPath,
    user: process.env.DB_USER,
    database: process.env.DB_NAME,
  });

  // Configuración específica para Cloud SQL con socket Unix
  return {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
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
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'arbol_ciencia',
    password: process.env.DB_PASS || '@Da1006327348',
    port: parseInt(process.env.DB_PORT || '5432', 10),
  };
};

// Seleccionar la configuración apropiada basada en el entorno
const config = isCloudRun() ? getCloudSqlConfig() : getLocalConfig();

// Logs para diagnóstico (sin mostrar la contraseña)
console.log('Usando configuración de base de datos:', {
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
    console.log('Intentando conectar a PostgreSQL...');
    const client = await pool.connect();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    
    // Realizar una consulta simple para probar la conexión
    const res = await client.query('SELECT NOW() as time');
    console.log('Hora del servidor PostgreSQL:', res.rows[0].time);
    
    client.release();
  } catch (err) {
    console.error('❌ Error al conectar con PostgreSQL:', err.message);
    console.error('Detalles del error:', err);
    console.error('Stack trace:', err.stack);
  }
};

// Ejecutar la prueba de conexión
testConnection();

module.exports = pool;