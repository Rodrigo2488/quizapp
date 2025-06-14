import express from 'express';
import { initDatabases, db, communityDB, usersDB } from './db/init.js';
import categoriesRoutes from './routes/categories.js';
import questionsRoutes from './routes/questions.js';
import communityRoutes from './routes/community.js';
import loginRoutes from './routes/login.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import fsSync from 'fs';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Configurar middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Configurar Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
  );
  next();
});

app.post('/api/community/questions', async (req, res) => {
  try {
    // Lê o arquivo atual
    const filePath = path.join(__dirname, 'db', 'db_community.json');
    const fileData = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileData);

    // Adiciona a nova pergunta
    data.questions.push(req.body);

    // Salva o arquivo atualizado
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao salvar pergunta:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao salvar pergunta no banco de dados' 
    });
  }
});

app.get('/api/community/questions', async (req, res) => {
  try {
    const filePath = path.join(__dirname, 'db', 'db_community.json');
    const fileData = await fs.readFile(filePath, 'utf8');
    const data = JSON.parse(fileData);
    
    if (!data.questions || !Array.isArray(data.questions)) {
      res.status(500).json({ error: 'Estrutura de dados inválida' });
      return;
    }
    
    res.json(data);
  } catch (error) {
    console.error('Erro ao ler perguntas da comunidade:', error);
    res.status(500).json({ error: 'Erro ao carregar perguntas' });
  }
});

// Rota de registro de usuários
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, email, password, photoUrl, avatarId } = req.body; // <- Incluído avatarId
    
    await usersDB.read();

    if (usersDB.data.users.some(user => user.email === email)) {
      return res.status(400).json({
        success: false,
        error: 'Este email já está cadastrado'
      });
    }

    const newUser = {
      id: Date.now(),
      username,
      email,
      password, // Em produção, deve ser criptografado
      photoUrl,
      avatarId, // <- Adicionado aqui também
      qi: 0,
      createdAt: new Date().toISOString()
    };

    usersDB.data.users.push(newUser);
    await usersDB.write();

    res.json({
      success: true,
      message: 'Usuário cadastrado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao registrar usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar conta. Tente novamente.'
    });
  }
});

// Rota para atualizar QI do usuário
app.post('/api/users/updateQI', async (req, res) => {
  try {
    const { email, newQI } = req.body;

    // Carrega dados dos usuários
    await usersDB.read();
    
    // Encontra o usuário e atualiza o QI
    const userIndex = usersDB.data.users.findIndex(u => u.email === email);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    // Atualiza o QI
    usersDB.data.users[userIndex].qi = newQI;
    
    // Salva no arquivo
    await usersDB.write();

    res.json({
      success: true,
      newQI
    });

  } catch (error) {
    console.error('Erro ao atualizar QI:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar QI'
    });
  }
});

// Rota para obter QI atual do usuário
app.post('/api/users/getQI', async (req, res) => {
  try {
    const { email } = req.body;

    await usersDB.read();
    
    const user = usersDB.data.users.find(u => u.email === email);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      qi: user.qi
    });

  } catch (error) {
    console.error('Erro ao obter QI:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao obter QI'
    });
  }
});

// Top 10 Ranking
app.get('/api/users/ranking', async (req, res) => {
  try {
    await usersDB.read();
    const users = usersDB.data.users || [];
    const ranking = users
      .sort((a, b) => b.qi - a.qi)
      .slice(0, 10)
      .map(u => ({
        username: u.username,
        email: u.email,
        avatarPath: u.avatarId
          ? `/images/avatars/avatar${u.avatarId}.png`
          : '/images/avatars/default-avatar.png',
        qi: u.qi
      }));
    res.json({ success: true, ranking });
  } catch (error) {
    res.json({ success: false, message: 'Erro ao ler usuários.' });
  }
});

// Posição do usuário logado
app.post('/api/users/position', async (req, res) => {
  try {
    const { email } = req.body;
    await usersDB.read();
    const users = usersDB.data.users || [];
    const sorted = users.sort((a, b) => b.qi - a.qi);
    const position = sorted.findIndex(u => u.email === email);
    if (position === -1) {
      return res.json({ success: false, message: 'Usuário não encontrado.' });
    }
    res.json({
      success: true,
      position: position + 1,
      qi: sorted[position].qi,
      username: sorted[position].username,
      avatarPath: sorted[position].avatarId
        ? `/images/avatars/avatar${sorted[position].avatarId}.png`
        : '/images/avatars/default-avatar.png',
      totalUsers: sorted.length
    });
  } catch (error) {
    res.json({ success: false, message: 'Erro ao calcular posição.' });
  }
});

// Rota para obter todos os usuários (apenas para fins administrativos)
app.get('/api/users/all', (req, res) => {
  const dbPath = path.join(__dirname, 'db', 'db_users.json');
  const db = JSON.parse(fsSync.readFileSync(dbPath, 'utf8'));
  res.json(db.users);
});

// Rota para listar imagens de categorias
app.get('/api/images', async (req, res) => {
  const imagesDir = path.join(__dirname, 'public', 'categorias');
  try {
    const files = await fs.readdir(imagesDir);
    // Filtra apenas por arquivos de imagem comuns e retorna o caminho relativo à pasta public
    const imagePaths = files
      .filter(file => /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(file))
      .map(file => `/categorias/${file}`); // Caminho acessível pelo navegador
    res.json(imagePaths);
  } catch (error) {
    console.error('Erro ao listar imagens:', error);
    res.status(500).json({ error: 'Erro ao buscar imagens de categorias.' });
  }
});

async function startServer() {
  try {
    await initDatabases(); // Inicializa os bancos de dados

    // Rotas da API
    app.use('/api/categories', categoriesRoutes);
    app.use('/api/questions', questionsRoutes);
    app.use('/api/community', communityRoutes);
    app.use('/api/users', loginRoutes);

    // Rota para a página inicial
    app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // Middleware para lidar com rotas não encontradas
    app.use((req, res) => {
      res.status(404).format({
        html: () => {
          try {
            res.sendFile(path.join(__dirname, 'public', '404.html'));
          } catch (err) {
            res.send('<h1>404 - Página não encontrada</h1>');
          }
        },
        json: () => {
          res.json({ error: 'Not found' });
        },
        default: () => {
          res.type('txt').send('Not found');
        }
      });
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Servidor rodando na porta ${port}`));
  } catch (error) {
    console.error('Erro ao iniciar o servidor:', error);
  }
}

startServer();

