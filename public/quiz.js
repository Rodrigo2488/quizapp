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
    // Salva os resultados no localStorage antes de redirecionar
    cumulativeQI += sessionScore;
    localStorage.setItem('cumulativeQI', cumulativeQI);
    localStorage.setItem('acertos', acertos); // Total de acertos (independente de ser a primeira vez)
    localStorage.setItem('total', selectedQuestions.length); // Total de perguntas
    localStorage.setItem('qiAtual', cumulativeQI);
    localStorage.setItem('delta', sessionScore);

    // Redireciona para a página de resultados
    window.location.href = 'result.html';
    return;
  }

  const question = selectedQuestions[currentIndex];
  questionText.innerHTML = `
    ${question.question}
    <span style="color: ${difficultyColors[question.difficulty]}; font-weight: bold; font-size: 14px;">
      ${question.difficulty}
    </span>
  `;

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
  const buttons = document.querySelectorAll('.option-btn');
  const { correct: ptsCerto, wrong: ptsErrado } = pointsTable[difficulty.toLowerCase()];

  const params = new URLSearchParams(window.location.search);
  const categoryId = params.get('category');
  let answeredQuestions = JSON.parse(localStorage.getItem(`answeredQuestions_${categoryId}`)) || [];

  // Verifica se o usuário já respondeu esta pergunta
  let isFirstTime = !answeredQuestions.includes(questionId);

  let gained = 0;

  if (selectedIndex === correctIndex) {
    // Resposta correta
    selectedButton.style.backgroundColor = 'green';

    // Sempre conta como acerto, independentemente de ser a primeira vez
    acertos++;

    // Soma pontos apenas se for a primeira vez respondendo corretamente
    if (isFirstTime) {
      gained = ptsCerto;
    } else {
      gained = 0; // Não ganha pontos se já respondeu antes
    }
  } else {
    // Resposta errada
    selectedButton.style.backgroundColor = 'red';
    buttons[correctIndex].style.backgroundColor = 'green';

    // Sempre reduz pontos ao errar
    gained = ptsErrado;
  }

  sessionScore += gained;

  // Atualiza histórico de perguntas respondidas
  if (isFirstTime) {
    answeredQuestions.push(questionId);
    localStorage.setItem(`answeredQuestions_${categoryId}`, JSON.stringify(answeredQuestions));
  }

  buttons.forEach(btn => btn.disabled = true);

  setTimeout(() => {
    currentIndex++;
    showQuestion();
  }, 2000);
}

loadQuestions();