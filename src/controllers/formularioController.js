const initDatabase = require('../database/init');
const { inserirTicket } = require('../database/ticketModel');

initDatabase();


exports.formulario = (req, res) => {
  res.render('formulario');
};


// Aqui futuramente:
// - salvar dados
// - salvar imagem da assinatura (base64)
// - gerar PDF se quiser

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');

exports.salvarFormulario = async (req, res) => {
  const { nome, documento, placa, data, assinatura, motivo } = req.body;

  /* ===== CRIAR PASTA UPLOADS SE NÃO EXISTIR ===== */
  const pastaUploads = path.join(__dirname, '..', 'uploads');

  if (!fs.existsSync(pastaUploads)) {
    fs.mkdirSync(pastaUploads);
  }


  const protocolo = uuidv4();
  const nomeArquivo = `termo_${protocolo}.pdf`;
  const caminhoPDF = path.join(__dirname, '..', 'uploads', nomeArquivo);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(caminhoPDF));

  /* ===== LOGO ===== */
  const logoPath = path.join(__dirname, '..', 'public', 'img', 'logo.png');

  doc.image(logoPath, {
    fit: [120, 60],
    align: 'center'
  });

  doc.moveDown(1);

  /* ===== CABEÇALHO ===== */
  doc.fontSize(16).text('TERMO DE SEGUNDA VIA DE TICKET', { align: 'center' });
  doc.moveDown(2);

  /* ===== TEXTO ===== */
  doc.fontSize(11).text(
    'Declaro que solicitei a segunda via de ticket de estacionamento por motivo de perda, estando ciente das regras vigentes do estacionamento e assumindo total responsabilidade pelas informações prestadas neste formulário.',
    { align: 'justify' }
  );

  doc.moveDown(2);

  /* ===== DADOS ===== */
  doc.text(`Nome do Cliente: ${nome}`);
  doc.text(`Documento: ${documento}`);
  doc.text(`Placa do Veículo: ${placa}`);
  doc.text(`Data: ${data}`);

  doc.moveDown(3);

  /* ===== ASSINATURA ===== */
  doc.text('Assinatura do Cliente:');
  doc.moveDown(1);

  const assinaturaBase64 = assinatura.replace(/^data:image\/png;base64,/, '');
  const assinaturaBuffer = Buffer.from(assinaturaBase64, 'base64');

  doc.image(assinaturaBuffer, {
    fit: [300, 120],
    align: 'left'
  });

  doc.moveDown(2);

  /* ===== RODAPÉ ===== */
  doc.fontSize(9).text(`Protocolo: ${protocolo}`);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);

  doc.end();

  try {
    await inserirTicket({
      protocolo,
      nome,
      documento,
      placa,
      motivo,
      data,
      assinatura,
      pdf: nomeArquivo
    });
  } catch (err) {
    console.error('Erro ao salvar no banco:', err);
    return res.status(500).send('Erro ao salvar atendimento');
  }


  /*res.send(`
    <h2>Atendimento finalizado com sucesso</h2>
    <p>Protocolo: ${protocolo}</p>
    <a href="/public/uploads/${nomeArquivo}" target="_blank">Abrir PDF</a>
  `);*/
  res.send(`
  <h2>Atendimento finalizado com sucesso</h2>
  <p>Protocolo: ${protocolo}</p>

  <button onclick="window.print()">Imprimir</button>
  <br><br>

  <a href="/public/uploads/${nomeArquivo}" target="_blank">
    Abrir PDF
  </a>
`);

};

