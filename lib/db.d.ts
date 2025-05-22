import { Pool } from 'pg';

/**
 * Definición de tipos para el módulo de base de datos
 * Exporta una instancia de Pool de pg configurada según el entorno
 */

declare const db: Pool;
export default db;
