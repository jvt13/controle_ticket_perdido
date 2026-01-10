const { Pool } = require('pg');

const dbConfig = {
  user: 'postgres',
  host: 'localhost',
  password: '4053',
  port: 5432,
  database: 'postgres' // banco padrão inicial
};

const pool = new Pool(dbConfig);

// expose the original config so callers can create a new pool for a different DB
pool.dbConfig = dbConfig;

module.exports = pool;
