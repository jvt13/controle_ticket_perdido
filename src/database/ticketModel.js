const basePool = require('./conexao');
const { Pool } = require('pg');

async function inserirTicket(dados) {
  const query = `
    INSERT INTO ticket_segunda_via
    (protocolo, nome, documento, placa, motivo, data_atendimento, assinatura, pdf, pdf_base64, fotos, fotos_base64)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    RETURNING id
  `;

  const values = [
    dados.protocolo,
    dados.nome,
    dados.documento,
    dados.placa,
    dados.motivo,
    dados.data,
    dados.assinatura,
    dados.pdf,
    dados.pdf_base64 || null,
    JSON.stringify(dados.fotos || []),
    JSON.stringify(dados.fotos_base64 || [])
  ];

  // se a pool padrão já aponta para o DB correto, use-a; caso contrário, crie uma pool temporária
  const targetDb = 'controle_ticket_sec';
  let usePool = basePool;
  let createdTemp = false;

  if (!basePool.dbConfig || basePool.dbConfig.database !== targetDb) {
    const cfg = Object.assign({}, basePool.dbConfig || {}, { database: targetDb });
    usePool = new Pool(cfg);
    createdTemp = true;
  }

  try {
    const res = await usePool.query(query, values);
    return res;
  } finally {
    if (createdTemp) {
      await usePool.end().catch(() => {});
    }
  }
}

module.exports = { inserirTicket };
