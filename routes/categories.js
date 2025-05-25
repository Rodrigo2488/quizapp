import express from 'express';
import { db } from '../db/init.js';

const router = express.Router();

router.get('/', (req, res) => {
  const categories = (db.data.categories || []).map(category => {
    const count = (db.data.questions || []).filter(q => q.categoryIds.includes(category.id)).length;
    return {
      ...category,
      questionCount: count
    };
  });
  res.json(categories);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const category = (db.data.categories || []).find(c => c.id === id);
  if (!category) {
    return res.status(404).json({ error: 'Categoria não encontrada.' });
  }
  res.json(category);
});

router.post('/', async (req, res) => {
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

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const idx = (db.data.categories || []).findIndex(c => c.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Categoria não encontrada.' });

  db.data.categories.splice(idx, 1);
  await db.write();
  res.status(200).json({ message: 'Categoria deletada com sucesso.' });
});

export default router;