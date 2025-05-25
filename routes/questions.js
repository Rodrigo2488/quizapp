import express from 'express';
import { db } from '../db/init.js';

const router = express.Router();

// Rota para listar perguntas de uma categoria
router.get('/', (req, res) => {
  const categoryId = parseInt(req.query.category);
  if (isNaN(categoryId)) return res.status(400).json({ error: 'Categoria não especificada.' });

  const questions = (db.data.questions || []).filter(q => q.categoryIds.includes(categoryId));

  if (!questions.length) {
    return res.status(404).json({ message: 'Nenhuma pergunta encontrada.' });
  }
  res.json(questions);
});

// Rota para adicionar uma nova pergunta
router.post('/', async (req, res) => {
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

// Rota para atualizar uma pergunta
router.put('/:id', async (req, res) => {
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

// Rota para deletar uma pergunta
router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const idx = (db.data.questions || []).findIndex(q => q.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Pergunta não encontrada.' });

  db.data.questions.splice(idx, 1);
  await db.write();
  res.status(200).json({ message: 'Pergunta deletada com sucesso.' });
});

export default router;