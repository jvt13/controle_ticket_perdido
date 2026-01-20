const { inserirTicket } = require('../database/ticketModel');


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

  // fotos vêm como req.body['fotos[]'] ou req.body.fotos dependendo do cliente
  let fotosRecebidas = req.body['fotos[]'] || req.body.fotos || [];
  if (typeof fotosRecebidas === 'string') fotosRecebidas = [fotosRecebidas];

  /* ===== CRIAR PASTA UPLOADS SE NÃO EXISTIR ===== */
  const pastaUploads = path.join(__dirname, '..', 'uploads');

  if (!fs.existsSync(pastaUploads)) {
    fs.mkdirSync(pastaUploads);
  }


  const protocolo = uuidv4();
  const nomeArquivo = `termo_${protocolo}.pdf`;
  const caminhoPDF = path.join(__dirname, '..', 'uploads', nomeArquivo);

  const doc = new PDFDocument({ margin: 50 });
  const writeStream = fs.createWriteStream(caminhoPDF);
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.pipe(writeStream);

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

  // adicionar as fotos (cada uma em nova página) antes de finalizar o PDF
  try {
    for (let i = 0; i < fotosRecebidas.length && i < 4; i++) {
      const dataUrl = fotosRecebidas[i];
      if (!dataUrl) continue;
      const match = dataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (!match) continue;
      const base64data = match[2];
      const buf = Buffer.from(base64data, 'base64');
      doc.addPage();
      // ajustar tamanho para caber a página
      try {
        doc.image(buf, { fit: [500, 700], align: 'center', valign: 'center' });
      } catch (e) {
        doc.fontSize(12).text('Imagem indisponível', { align: 'center' });
      }
    }
  } catch (err) {
    console.error('Erro ao adicionar fotos ao PDF:', err);
  }

  doc.end();

  // aguardar finalização do stream e obter buffer do PDF
  let pdfBuffer = null;
  try {
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });
    pdfBuffer = Buffer.concat(chunks);
  } catch (err) {
    console.error('Erro ao gerar PDF combinado:', err);
  }

  const pdfBase64 = pdfBuffer ? `data:application/pdf;base64,${pdfBuffer.toString('base64')}` : null;

  // salvar fotos recebidas (base64 dataURLs) como arquivos na pasta uploads
  const fotosSalvas = [];
  try {
    for (let i = 0; i < fotosRecebidas.length && i < 4; i++) {
      const dataUrl = fotosRecebidas[i];
      if (!dataUrl) continue;
      const match = dataUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
      if (!match) continue;
      const ext = match[1].split('/')[1] || 'png';
      const base64data = match[2];
      const buf = Buffer.from(base64data, 'base64');
      const fotoNome = `foto_${protocolo}_${i + 1}.${ext}`;
      const fotoCaminho = path.join(__dirname, '..', 'uploads', fotoNome);
      fs.writeFileSync(fotoCaminho, buf);
      fotosSalvas.push(fotoNome);
    }
  } catch (err) {
    console.error('Erro ao salvar fotos:', err);
  }
  try {
    await inserirTicket({
      protocolo,
      nome,
      documento,
      placa,
      motivo,
      data,
      assinatura,
      pdf: nomeArquivo,
      pdf_base64: pdfBase64,
      fotos: fotosSalvas,
      fotos_base64: fotosRecebidas
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

