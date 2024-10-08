const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // importando dotenv
const loginController = require('./public/src/controllers/loginController');
const photoProfileController = require('./public/src/controllers/photoProfileController');
const redis = require('redis');


const client = redis.createClient({
  url: 'redis://localhost:6379', // Porta de conexão com Redis
  socket: {
    reconnectStrategy: false // Impede o loop de reconexão em caso de falha na primeira tentativa
  }
});


// Inicializa o aplicativo Express
const app = express();

app.use(express.json({ limit: '10mb' })); // Ajuste o limite de tamanho da imagem


app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Conectar ao MongoDB (login e produtos)
mongoose.connect('mongodb://localhost:27017/primegaming', {});

// Console conexão com MongoDB
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erro na conexão com o MongoDB:'));
db.once('open', () => {
    console.log('Conectado ao MongoDB');
});

// rotas login signup
app.post('/signup', loginController.signup);
app.post('/login', loginController.login);

// Rota para atualizar a imagem de perfil
app.post('/api/users/updateProfileImage', photoProfileController.updateProfileImage);


// Importando as rotas
const clientsRoutes = require('./public/src/routes/clientsRoutes');
const productsRoutes = require('./public/src/routes/productsRoutes');
const usersRoutes = require('./public/src/routes/usersRoutes');


// Endpoints
app.use('/api/clients', clientsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/users', usersRoutes);


// REDIS DB
// Endpoint para adicionar atividades recentes no Redis
app.post('/api/atividades', async (req, res) => {
    const { msgAtividadesRecentes } = req.body;
  
    try {
      const reply = await client.lPush('atividades', msgAtividadesRecentes);
      res.send({ message: 'Atividade salva com sucesso no Redis', reply });
    } catch (err) {
      console.error('Erro ao salvar atividade no Redis:', err);
      res.status(500).send('Erro ao salvar atividade no Redis');
    }
  });
  
  // Endpoint para buscar atividades recentes
  app.get('/api/atividades', async (req, res) => {
    try {
      const atividades = await client.lRange('atividades', 0, -1);
      res.send(atividades);
    } catch (err) {
      console.error('Erro ao buscar atividades no Redis:', err);
      res.status(500).send('Erro ao buscar atividades no Redis');
    }
  });


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Aplicação está sendo executada na porta ${PORT}`);
});

// Conectar ao Redis
client.connect()
  .then(() => {
    console.log('Conectado ao Redis');
  })
  .catch(err => {
    console.error('Redis não conectado', err.message);
  });

// Escutar erros no cliente Redis
client.on('error', (err) => {
  console.error('Erro no cliente Redis:', err);
});
