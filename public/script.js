// Função para carregar categorias do backend
async function loadCategories() {
  try {    
    const [categoriesResponse, communityResponse] = await Promise.all([
      fetch('/api/categories'),
      fetch('/api/community/questions')
    ]);

    const categoriesData = await categoriesResponse.json();
    const communityData = await communityResponse.json();

    const container = document.getElementById('categories-container');
    container.innerHTML = '';

    // Carrega categorias normais
    categoriesData.forEach(category => {
      const questionsCount = category.questionCount || 0;
      const card = createCategoryCard(
        category.name,
        category.description,
        category.image,
        `${questionsCount} Perguntas`,
        category.id
      );
      container.appendChild(card);
    });

    // Adiciona categoria comunidade
    const communityQuestions = communityData.questions || [];
    const communityCard = createCategoryCard(
      'Comunidade',
      'Perguntas elaboradas pela comunidade.',
      '/categorias/Comunidade.svg',
      `${communityQuestions.length} Perguntas`,
      'community'
    );
    container.appendChild(communityCard);

  } catch (error) {
    console.error('Erro ao carregar categorias:', error);
    displayLoadError();
  }
}

function createCategoryCard(name, description, image, questionsCount, id) {
  const card = document.createElement('div');
  card.className = 'category-card';
  card.innerHTML = `
    <div class="category-image">
      <img src="${image}" alt="Imagem ${name}" />
    </div>
    <h3>${name}</h3>
    <p>${description}</p>
    <span>${questionsCount}</span>
  `;

  card.addEventListener('click', () => {
    if (id === 'community') {
      window.location.href = `quiz.html?source=community`;
    } else {
      window.location.href = `quiz.html?category=${id}`;
    }
  });

  return card;
}

// Função para exibir mensagem de erro ao usuário
function displayLoadError() {
  const container = document.getElementById('categories-container');
  const errorMessage = `
    <div class="error-message">
      <p>Erro ao carregar categorias.</p>
      <button onclick="window.location.reload()" class="retry-btn">
        Tentar novamente
      </button>
    </div>
  `;
  container.innerHTML = errorMessage;
}

// Função para filtrar categorias com base no termo fornecido (nome e descrição)
function filterCategories(term) {
  const adminCode = '2488';
  const adminCardId = 'admin-panel-card';

  // Verifica se já existe o card de admin
  let adminCard = document.getElementById(adminCardId);

  if (term === adminCode) {
    // Se digitar o código, cria o card de Admin se ainda não existir
    if (!adminCard) {
      adminCard = document.createElement('div');
      adminCard.id = adminCardId;
      adminCard.classList.add('category-card');
      adminCard.innerHTML = `
        <div class="category-image">
          <img src="/categorias/Admin.png" alt="Painel de Administração">
        </div>
        <h3>Painel de Administração</h3>
        <p>Gerencie as categorias e perguntas.</p>
        <span>Administração</span>
      `;
      adminCard.addEventListener('click', () => {
        window.location.href = 'admin.html';
      });

      document.getElementById('categories-container').appendChild(adminCard);
    }
    // Oculta os outros cards
    document.querySelectorAll('.category-card').forEach(card => {
      if (card.id !== adminCardId) card.style.display = 'none';
    });
    adminCard.style.display = 'block';
  } else {
    // Se pesquisar algo diferente, remove o adminCard se existir
    if (adminCard) {
      adminCard.remove();
    }
    // Filtro normal (nome ou descrição)
    document.querySelectorAll('.category-card').forEach(card => {
      const name = card.querySelector('h3').textContent.toLowerCase();
      const description = card.querySelector('p').textContent.toLowerCase();
      card.style.display = (name.includes(term) || description.includes(term)) ? 'block' : 'none';
    });
  }
}

// Função de debounce para otimizar pesquisa
function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Inicialização ao carregar o DOM
document.addEventListener('DOMContentLoaded', () => {
  const loginModal = document.getElementById('login-modal');
  const loginForm = document.getElementById('login-form');
  const qiValue = document.getElementById('qi-value');

  // Função para verificar estado do login
  async function checkLoginState() {
    const isLoggedIn = localStorage.getItem('userLoggedIn');
    const userData = JSON.parse(localStorage.getItem('userData'));

    if (isLoggedIn && userData) {
      try {
        // Sempre busca QI atualizado do backend
        const response = await fetch('/api/users/getQI', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email: userData.email })
        });

        const data = await response.json();
        
        if (data.success) {
          userData.qi = data.qi;
          localStorage.setItem('userData', JSON.stringify(userData));
          qiValue.textContent = data.qi;
        }

        loginModal.style.display = 'none';
        return true;
      } catch (error) {
        console.error('Erro ao sincronizar QI:', error);
      }
    }
    
    loginModal.style.display = 'flex';
    return false;
  }

  // Verifica login ao carregar a página
  checkLoginState();

  // Resto do código do login form
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validação básica
    if (!email || !password) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Login bem sucedido
        localStorage.setItem('userLoggedIn', 'true');
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        // Atualiza QI e fecha modal
        qiValue.textContent = data.user.qi || '0';
        loginModal.style.display = 'none';
      } else {
        // Erro no login
        alert(data.error || 'Email ou senha incorretos');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      alert('Erro ao fazer login. Tente novamente.');
    }
  });

  // Exibe o Q.I. acumulado no cabeçalho
  const qi = parseInt(localStorage.getItem('cumulativeQI'), 10) || 0; // Busca o QI salvo ou 0
  const qiEl = document.getElementById('qi-value');
  if (qiEl) qiEl.textContent = qi; // Atualiza o valor do QI na tela

  // Carrega as categorias na página
  loadCategories();

  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');

  // Handler único para pesquisa
  const handleSearch = debounce(() => {
    const term = searchInput.value.toLowerCase();
    filterCategories(term);
  }, 300);

  if (searchInput) {
    // Filtra enquanto digita com debounce
    searchInput.addEventListener('input', handleSearch);
  }

  if (searchBtn && searchInput) {
    // Filtra ao clicar no botão (executa imediatamente)
    searchBtn.addEventListener('click', () => {
      const term = searchInput.value.toLowerCase();
      filterCategories(term);
    });
  }

  // Controles do modal
  const addQuestionBtn = document.querySelector('.floating-btn');
  const modal = document.getElementById('add-question-modal');
  const closeBtn = document.querySelector('.close-btn');
  const addQuestionForm = document.getElementById('add-question-form');

  // Abrir modal
  addQuestionBtn.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  // Fechar modal (botão X)
  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    addQuestionForm.reset(); // Limpa o formulário
  });

  // Fechar modal clicando fora
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
      addQuestionForm.reset(); // Limpa o formulário
    }
  });

  // Prevenir fechamento ao clicar no conteúdo do modal
  modal.querySelector('.modal-content').addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Enviar formulário
  addQuestionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userData = JSON.parse(localStorage.getItem('userData'));

    // Coleta os dados do formulário
    const formData = {
      id: Date.now(),
      question: document.getElementById('question-text').value,
      options: Array.from(document.querySelectorAll('.option-input input[type="text"]'))
        .map(input => input.value),
      answer: parseInt(document.querySelector('input[name="correct"]:checked').value),
      categoryIds: [],
      difficulty: document.getElementById('difficulty').value,
      userId: userData ? userData.id : null // <-- Adiciona o id do usuário
    };

    try {
      const response = await fetch('/api/community/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        modal.style.display = 'none';
        addQuestionForm.reset();
        alert('Pergunta adicionada com sucesso!');
      } else {
        throw new Error('Erro ao adicionar pergunta');
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao adicionar pergunta. Tente novamente.');
    }
  });
});
