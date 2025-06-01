import express from 'express';
import { usersDB } from '../db/init.js';

const router = express.Router();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Verificar se email e senha foram fornecidos
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
    }

    // Carrega dados dos usuários
    await usersDB.read();

    if (!usersDB.data || !usersDB.data.users) {
      console.error('Estrutura do banco de dados inválida');
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }

    // Procura usuário pelo email e senha
    const user = usersDB.data.users.find(u =>
      u.email === email && u.password === password
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha incorretos'
      });
    }

    // Remove senha antes de enviar dados do usuário
    const { password: _, ...userData } = user;

    res.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer login'
    });
  }
});

export default router;