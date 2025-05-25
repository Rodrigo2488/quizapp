import express from 'express';
import { communityDB } from '../db/init.js';

const router = express.Router();

router.get('/questions', async (req, res) => {
  await communityDB.read();
  const { page = 1, limit = 10 } = req.query;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const questions = communityDB.data.questions.slice(startIndex, endIndex);
  res.json(questions);
});

router.post('/questions', async (req, res) => {
  const { question, options, answer, categoryIds, difficulty } = req.body;

  if (!question || !options || options.length !== 4 || answer == null) {
    return res.status(400).json({ error: 'Dados da pergunta incompletos.' });
  }

  const allowedDifficulties = ['fácil', 'normal', 'difícil'];
  const questionDifficulty = allowedDifficulties.includes(difficulty) ? difficulty : 'normal';

  await communityDB.read();
  const newId = communityDB.data.questions.length
    ? Math.max(...communityDB.data.questions.map(q => q.id)) + 1
    : 1;

  const newQuestion = {
    id: newId,
    question,
    options,
    answer,
    categoryIds: categoryIds || [],
    difficulty: questionDifficulty
  };

  communityDB.data.questions.push(newQuestion);
  await communityDB.write();

  res.status(201).json(newQuestion);
});

router.delete('/questions/:id', async (req, res) => {
  const id = parseInt(req.params.id);

  await communityDB.read();
  const idx = communityDB.data.questions.findIndex(q => q.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Pergunta não encontrada.' });
  }

  communityDB.data.questions.splice(idx, 1);
  await communityDB.write();

  res.status(200).json({ message: 'Pergunta deletada com sucesso.' });
});

export default router;