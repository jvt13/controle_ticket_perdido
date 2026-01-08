const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const ejs = require('ejs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configuração do EJS como template engine
app.engine('ejs', ejs.renderFile);
app.set('view engine', 'ejs');
app.use('/public', express.static(path.join(__dirname, 'src', 'public')));
app.use('/public/uploads', express.static(path.join(__dirname, 'src', 'uploads')));
app.set('views', path.join(__dirname, 'src', 'views'));

const router = require('./src/routers');
app.use('/', router);

// Inicialização do servidor com verificação de porta
function startServer(port) {
    const server = http.createServer(app);

    server.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`A porta ${port} está ocupada, tentando a próxima disponível...`);
            if (port < 5050) { // 🔹 Define um limite de tentativas (aqui, até a porta 5050)
                startServer(port + 1);
            } else {
                console.error("Não há portas disponíveis no intervalo definido.");
            }
        } else {
            console.error(`Erro ao iniciar o servidor: ${err.message}`);
        }
    });
}

startServer(PORT);