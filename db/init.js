import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbFile = path.join(__dirname, 'db.json');
const communityFile = path.join(__dirname, 'db_community.json');
const usersFile = path.join(__dirname, 'db_users.json'); // Novo arquivo

// Dados padrão para os bancos
const defaultDB = {
  categories: [],
  questions: []
};

const defaultCommunityDB = {
  questions: []
};

const defaultUsersDB = {  // Estrutura padrão para usuários
  users: []
};

const dbAdapter = new JSONFile(dbFile);
const communityAdapter = new JSONFile(communityFile);
const usersAdapter = new JSONFile(usersFile); // Novo adapter

// Inicialize com dados padrão
export const db = new Low(dbAdapter, defaultDB);
export const communityDB = new Low(communityAdapter, defaultCommunityDB);
export const usersDB = new Low(usersAdapter, defaultUsersDB); // Nova exportação

export async function initDatabases() {
  try {
    // Inicializa o banco de dados principal
    await db.read();
    if (!db.data) {
      await db.write();
      console.log('Banco de dados principal inicializado.');
    }

    // Inicializa o banco de dados da comunidade
    await communityDB.read();
    if (!communityDB.data) {
      await communityDB.write();
      console.log('Banco de dados da comunidade inicializado.');
    }

    // Inicializa o banco de dados de usuários
    await usersDB.read();
    if (!usersDB.data) {
      await usersDB.write();
      console.log('Banco de dados de usuários inicializado.');
    }
  } catch (error) {
    console.error('Erro ao inicializar os bancos de dados:', error);
    throw error;
  }
}