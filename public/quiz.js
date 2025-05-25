let questions = [];
let selectedQuestions = [];
let currentIndex = 0;
let acertos = 0;
let sessionScore = 0; // Pontos desta sessão

// QI acumulado em todas as sessões
let cumulativeQI = parseInt(localStorage.getItem('cumulativeQI'), 10) || 0;

const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const categoryText = document.getElementById('category-text');
const progressText = document.getElementById('progress-text');

const difficultyColors = {
  'fácil': 'green',
  'normal': 'orange',
  'difícil': 'red',
  'especialista': 'white'
};

const pointsTable = {
  'fácil': { correct: 2, wrong: -5 },
  'normal': { correct: 3, wrong: -3 },
  'difícil': { correct: 5, wrong: -2 },
  'especialista': { correct: 7, wrong: -1 }
};

async function loadQuestions() {
  const params = new URLSearchParams(window.location.search);
  const categoryId = params.get('category');
  const source = params.get('source');

  if (source === 'community') {
    try {
      const response = await fetch('/api/community/questions');
      const data = await response.json();
      
      if (!data || !data.questions) {
        questionText.textContent = 'Erro na estrutura dos dados.';
        return;
      }

      if (!Array.isArray(data.questions) || data.questions.length === 0) {
        questionText.textContent = 'Nenhuma pergunta disponível da comunidade.';
        return;
      }

      questions = data.questions;
      categoryText.textContent = 'Comunidade';
      
      // Carrega histórico de perguntas respondidas
      let perguntasRespondidasComunidade = JSON.parse(
        localStorage.getItem('perguntasRespondidasComunidade')
      ) || [];

      // Separa perguntas não respondidas
      let perguntasNovas = questions.filter(q => !perguntasRespondidasComunidade.includes(q.id));
      
      // Define o número total de perguntas para 10
      const TOTAL_PERGUNTAS = 10;
      
      // Se houver perguntas novas
      if (perguntasNovas.length > 0) {
        if (perguntasNovas.length >= TOTAL_PERGUNTAS) {
          selectedQuestions = shuffle(perguntasNovas).slice(0, TOTAL_PERGUNTAS);
        } else {
          const perguntasRespondidas = questions.filter(q => 
            perguntasRespondidasComunidade.includes(q.id)
          );
          const perguntasFaltantes = TOTAL_PERGUNTAS - perguntasNovas.length;
          
          selectedQuestions = [
            ...perguntasNovas,
            ...shuffle(perguntasRespondidas).slice(0, perguntasFaltantes)
          ];
          selectedQuestions = shuffle(selectedQuestions);
        }
      } else {
        selectedQuestions = shuffle(questions).slice(0, TOTAL_PERGUNTAS);
      }

      localStorage.setItem('total', selectedQuestions.length);
      showQuestion();
      
    } catch (error) {
      console.error('Erro ao carregar perguntas da comunidade:', error);
      questionText.textContent = 'Erro ao carregar perguntas da comunidade.';
    }
    return;
  }

  // Lógica existente para categorias normais
  if (!categoryId) {
    questionText.textContent = 'Categoria não informada!';
    return;
  }

  const resCat = await fetch('/api/categories');
  const categories = await resCat.json();
  const category = categories.find(c => c.id === parseInt(categoryId, 10));
  if (!category) {
    questionText.textContent = 'Categoria não encontrada!';
    return;
  }

  categoryText.textContent = category.name;

  const resQ = await fetch(`/api/questions?category=${categoryId}`);
  questions = await resQ.json();

  if (questions.length === 0) {
    questionText.textContent = 'Nenhuma pergunta disponível para esta categoria.';
    return;
  }

  // Carrega histórico de respondidas
  let answeredQuestions = JSON.parse(localStorage.getItem(`answeredQuestions_${categoryId}`)) || [];

  // Separa perguntas inéditas
  let unansweredQuestions = questions.filter(q => !answeredQuestions.includes(q.id));

  // Embaralha array
  function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
  }

  // Seleciona 15 perguntas conforme regra
  if (unansweredQuestions.length >= 15) {
    selectedQuestions = shuffle(unansweredQuestions).slice(0, 15);
  } else {
    const stillNeeded = 15 - unansweredQuestions.length;
    const answeredPool = questions.filter(q => answeredQuestions.includes(q.id));
    selectedQuestions = shuffle([...unansweredQuestions, ...shuffle(answeredPool).slice(0, stillNeeded)]);
  }

  // Salva o total de perguntas para a página de resultados
  localStorage.setItem('total', selectedQuestions.length);

  showQuestion();
}

function showQuestion() {
  if (currentIndex >= selectedQuestions.length) {
    cumulativeQI += sessionScore;
    localStorage.setItem('cumulativeQI', cumulativeQI);
    localStorage.setItem('acertos', acertos);
    localStorage.setItem('total', selectedQuestions.length);
    localStorage.setItem('qiAtual', cumulativeQI);
    localStorage.setItem('delta', sessionScore);

    // Atualiza backend se logado
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData && userData.email) {
      fetch('/api/users/updateQI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email, newQI: cumulativeQI })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          userData.qi = cumulativeQI;
          localStorage.setItem('userData', JSON.stringify(userData));
        }
        window.location.href = 'result.html';
      })
      .catch(() => window.location.href = 'result.html');
      return;
    }

    window.location.href = 'result.html';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const source = params.get('source');
  const question = selectedQuestions[currentIndex];

  // Exibe a pergunta normalmente
  questionText.innerHTML = `
    ${question.question}
    <span style="color: ${difficultyColors[question.difficulty]}; font-weight: bold; font-size: 14px;">
      ${question.difficulty}
    </span>
  `;

  // EXIBE AUTOR PARA PERGUNTAS DA COMUNIDADE
  const authorInfo = document.getElementById('author-info');
  if (source === 'community') {
    let usuarios = allUsers; // <-- use a lista global carregada do backend

    let authorHTML = `<span style="color:#1e90ff;font-weight:bold;">By: </span>`;
    if (question.userId && Number(question.userId) > 0) {
      const user = usuarios.find(u => Number(u.id) === Number(question.userId));
      if (user) {
        authorHTML += `<span style="color:#1e90ff;">${user.username}</span>
          <img src="/images/avatars/avatar${user.avatarId || 1}.png" alt="avatar" style="width:24px;height:24px;border-radius:50%;border:1.5px solid #1e90ff;vertical-align:middle;margin-left:8px;">`;
      } else {
        authorHTML += `<span style="color:#1e90ff;">Usuário desconhecido</span>`;
      }
    } else {
      authorHTML += `<span style="color:#1e90ff;">Pergunta padrão</span>`;
    }
    authorInfo.innerHTML = authorHTML;
    authorInfo.style.display = 'block';
    authorInfo.style.textAlign = 'left';
  } else {
    authorInfo.innerHTML = '';
    authorInfo.style.display = 'none';
  }

  progressText.textContent = `${currentIndex + 1}/${selectedQuestions.length}`;
  optionsContainer.innerHTML = '';
  question.options.forEach((option, index) => {
    const btn = document.createElement('button');
    btn.textContent = option;
    btn.classList.add('option-btn');
    btn.addEventListener('click', () => handleAnswer(index, question.answer, btn, question.difficulty, question.id));
    optionsContainer.appendChild(btn);
  });
}

function handleAnswer(selectedIndex, correctIndex, selectedButton, difficulty, questionId) {
  const params = new URLSearchParams(window.location.search);
  const source = params.get('source');
  const categoryId = params.get('category'); // Movido para dentro da função
  const buttons = document.querySelectorAll('.option-btn');

  if (source === 'community') {
    // Tabela de pontos para perguntas da comunidade por dificuldade
    const pontosComunidade = {
      'fácil': { correto: 1, errado: -3 },
      'normal': { correto: 2, errado: -2 },
      'difícil': { correto: 3, errado: -1 },
      'especialista': { correto: 7, errado: -1 } // mantém especialista igual
    };

    // Busca histórico de perguntas respondidas da comunidade
    let perguntasRespondidasComunidade = JSON.parse(
      localStorage.getItem('perguntasRespondidasComunidade')
    ) || [];
    
    let ePrimeiraVez = !perguntasRespondidasComunidade.includes(questionId);
    let pontosGanhos = 0;

    if (selectedIndex === correctIndex) {
      selectedButton.style.backgroundColor = 'green';
      acertos++;
      
      // Só ganha pontos se for primeira vez
      if (ePrimeiraVez) {
        pontosGanhos = pontosComunidade[difficulty.toLowerCase()].correto;
      }
    } else {
      selectedButton.style.backgroundColor = 'red';
      buttons[correctIndex].style.backgroundColor = 'green';
      // Sempre perde pontos ao errar
      pontosGanhos = pontosComunidade[difficulty.toLowerCase()].errado;
    }

    sessionScore += pontosGanhos;

    // Atualiza histórico se for primeira vez
    if (ePrimeiraVez) {
      perguntasRespondidasComunidade.push(questionId);
      localStorage.setItem(
        'perguntasRespondidasComunidade', 
        JSON.stringify(perguntasRespondidasComunidade)
      );
    }
  } else {
    // Perguntas normais
    let answeredQuestions = JSON.parse(localStorage.getItem(`answered_${categoryId}`)) || [];
    let isFirstTime = !answeredQuestions.includes(questionId);
    
    const ptsCerto = pointsTable[difficulty].correct;
    const ptsErrado = pointsTable[difficulty].wrong;
    
    let gained = 0;

    if (selectedIndex === correctIndex) {
      selectedButton.style.backgroundColor = 'green';
      acertos++;
      
      if (isFirstTime) {
        gained = ptsCerto;
        answeredQuestions.push(questionId);
        localStorage.setItem(`answered_${categoryId}`, JSON.stringify(answeredQuestions));
      }
    } else {
      selectedButton.style.backgroundColor = 'red';
      buttons[correctIndex].style.backgroundColor = 'green';
      gained = ptsErrado;
    }

    sessionScore += gained;
  }

  buttons.forEach(btn => btn.disabled = true);

  setTimeout(() => {
    currentIndex++;
    showQuestion();
  }, 2000);
}

async function getBackendQI() {
  const userData = JSON.parse(localStorage.getItem('userData'));
  if (userData && userData.email) {
    try {
      const response = await fetch('/api/users/getQI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email })
      });
      const data = await response.json();
      if (data.success) return data.qi;
    } catch (e) { /* ignore */ }
  }
  return null;
}

let allUsers = [];

async function fetchAllUsers() {
  try {
    const res = await fetch('/api/users/all');
    let users = await res.json();
    // Filtra apenas usuários com id válido
    allUsers = users.filter(u => u && typeof u.id !== 'undefined');
  } catch {
    allUsers = [];
  }
}

(async () => {
  await fetchAllUsers();
  let backendQI = await getBackendQI();
  if (backendQI !== null) {
    cumulativeQI = backendQI;
    localStorage.setItem('cumulativeQI', backendQI);
  }
  await loadQuestions();
})();