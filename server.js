import express from 'express';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';

const defaultData = {
  categories: [
    {
      id: 1,
      name: "Conhecimentos Gerais",
      description: "Teste seus conhecimentos sobre diversos assuntos.",
      image: "/categorias/Conhecimentos_gerais.svg",
      questionCount: 15
    },
    {
      id: 2,
      name: "Ciências",
      description: "Questões de biologia, química, física e geociências.",
      image: "/categorias/Ciencias.svg",
      questionCount: 15
    }
  ],
  questions: [
    {
      id: 1,
      question: "Qual é a capital do Brasil?",
      options: ["São Paulo", "Rio de Janeiro", "Brasília", "Belo Horizonte"],
      answer: 2,
      difficulty: "fácil",
      categoryIds: [1]
    },
    {
      id: 2,
      question: "Qual o elemento químico representado pelo símbolo 'O'?",
      options: ["Oxigênio", "Ouro", "Prata", "Zinco"],
      answer: 0,
      difficulty: "fácil",
      categoryIds: [2]
    }
  ]
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile(file);
const db = new Low(adapter, defaultData);

const categoriesFolder = path.join(__dirname, 'public', 'categorias');
if (!fs.existsSync(categoriesFolder)) fs.mkdirSync(categoriesFolder, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, categoriesFolder),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/\s+/g, '_')
      .replace(/[^\w\-]/g, '');
    cb(null, `${name}_${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagem inválido.'));
    }
  }
});

async function init() {
  await db.read();
  if (!db.data || Object.keys(db.data).length === 0) {
    db.data = defaultData;
    await db.write();
  }

  const app = express();
  app.use(express.json());

  app.use('/categorias', express.static(path.join(__dirname, 'public', 'categorias')));
  app.use(express.static(path.join(__dirname, 'public')));

  // Rota de listagem de categorias com questionCount dinâmico
  app.get('/api/categories', (req, res) => {
    const categories = (db.data.categories || []).map(category => {
      const count = (db.data.questions || []).filter(q => q.categoryIds.includes(category.id)).length;
      return {
        ...category,
        questionCount: count
      };
    });
    res.json(categories);
  });

  app.get('/api/categories/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const category = (db.data.categories || []).find(c => c.id === id);
    if (!category) {
      return res.status(404).json({ error: 'Categoria não encontrada.' });
    }
    res.json(category);
  });

  app.post('/api/categories', async (req, res) => {
    const { name, image, description, questionCount } = req.body;
    if (!name || !image || !description) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando.' });
    }
    const newId = db.data.categories.length ? Math.max(...db.data.categories.map(c => c.id)) + 1 : 1;
    const newCategory = { id: newId, name, image, description, questionCount: questionCount || 15 };
    db.data.categories.push(newCategory);
    await db.write();
    res.status(201).json(newCategory);
  });

  app.put('/api/categories/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const idx = (db.data.categories || []).findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Categoria não encontrada.' });

    const { name, description, image, questionCount } = req.body;
    db.data.categories[idx] = {
      ...db.data.categories[idx],
      name,
      description,
      image,
      questionCount
    };

    await db.write();
    res.json(db.data.categories[idx]);
  });

  app.delete('/api/categories/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const idx = (db.data.categories || []).findIndex(c => c.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Categoria não encontrada.' });

    db.data.categories.splice(idx, 1);
    await db.write();
    res.status(200).json({ message: 'Categoria deletada com sucesso.' });
  });

  app.get('/api/questions', (req, res) => {
    const categoryId = parseInt(req.query.category);
    if (isNaN(categoryId)) return res.status(400).json({ error: 'Categoria não especificada.' });

    const questions = (db.data.questions || []).filter(q => q.categoryIds.includes(categoryId));

    if (!questions.length) {
      return res.status(404).json({ message: 'Nenhuma pergunta encontrada.' });
    }
    res.json(questions);
  });

  app.post('/api/questions', async (req, res) => {
    const { question, options, answer, categoryIds, difficulty } = req.body;
    if (!question || !options || options.length !== 4 || answer == null || !categoryIds?.length) {
      return res.status(400).json({ error: 'Dados da pergunta incompletos.' });
    }

    const allowedDifficulties = ['fácil', 'normal', 'difícil'];
    const questionDifficulty = allowedDifficulties.includes(difficulty) ? difficulty : 'normal';

    const newId = db.data.questions.length ? Math.max(...db.data.questions.map(q => q.id)) + 1 : 1;
    const newQuestion = { id: newId, question, options, answer, categoryIds, difficulty: questionDifficulty };
    db.data.questions.push(newQuestion);
    await db.write();
    res.status(201).json(newQuestion);
  });

  app.put('/api/questions/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const idx = (db.data.questions || []).findIndex(q => q.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Pergunta não encontrada.' });

    const { question, options, answer, categoryIds, difficulty } = req.body;

    if (!question || !options || options.length !== 4 || answer == null || !categoryIds?.length) {
      return res.status(400).json({ error: 'Dados da pergunta incompletos.' });
    }

    const allowedDifficulties = ['fácil', 'normal', 'difícil'];
    const questionDifficulty = allowedDifficulties.includes(difficulty) ? difficulty : 'normal';

    db.data.questions[idx] = {
      id,
      question,
      options,
      answer,
      categoryIds,
      difficulty: questionDifficulty
    };

    await db.write();
    res.json(db.data.questions[idx]);
  });

  app.delete('/api/questions/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const idx = (db.data.questions || []).findIndex(q => q.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Pergunta não encontrada.' });

    db.data.questions.splice(idx, 1);
    await db.write();
    res.status(200).json({ message: 'Pergunta deletada com sucesso.' });
  });

  app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada.' });
    }
    res.json({ imagePath: `/categorias/${req.file.filename}` });
  });

  app.get('/api/images', (req, res) => {
    fs.readdir(categoriesFolder, (err, files) => {
      if (err) return res.status(500).json({ error: 'Erro ao ler pasta de imagens.' });
      const images = files.filter(f => /\.(svg|png|jpe?g|gif)$/i.test(f)).map(f => `/categorias/${f}`);
      res.json(images);
    });
  });

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.listen(3000, () => console.log('Servidor rodando em http://localhost:3000'));
}

init();
