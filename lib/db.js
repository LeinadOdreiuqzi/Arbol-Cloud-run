const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',            // Tu usuario de PostgreSQL (ej: 'postgres' o el que creaste)
  host: 'localhost',           // Si es local, deja 'localhost'
  database: 'arbol_ciencia',   // El nombre de tu base de datos
  password: '@Da1006327348',   // Pon aquí tu contraseña real
  port: 5432,                  // Puerto por defecto
});

module.exports = pool;