const pool = require('./conexao');
const { Pool } = require('pg');

async function initDatabase() {
  const dbName = 'controle_ticket_sec';

  try {
    const exists = await pool.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (exists.rowCount === 0) {
      await pool.query(`CREATE DATABASE ${dbName}`);
      console.log(`Banco de dados '${dbName}' criado.`);
    } else {
      console.log(`Banco de dados '${dbName}' já existe.`);
    }
  } catch (err) {
    console.error('Erro ao verificar/criar banco de dados:', err.message);
    throw err;
  }

  // Agora conecte-se ao banco recém-criado (ou existente) para garantir a tabela
  const newConfig = Object.assign({}, pool.dbConfig || {}, { database: dbName });
  const newPool = new Pool(newConfig);

  try {
    await newPool.query(`
      CREATE TABLE IF NOT EXISTS ticket_segunda_via (
        id SERIAL PRIMARY KEY,
        protocolo UUID NOT NULL,
        nome VARCHAR(150),
        documento VARCHAR(50),
        placa VARCHAR(20),
        motivo VARCHAR(100),
        data_atendimento DATE,
        assinatura TEXT,
        pdf VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("Tabela 'ticket_segunda_via' verificada/criada com sucesso.");
  } catch (err) {
    console.error('Erro ao verificar/criar tabela:', err.message);
    throw err;
  } finally {
    await newPool.end().catch(() => {});
  }
}

module.exports = initDatabase;
