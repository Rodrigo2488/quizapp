// Função para carregar categorias do backend
async function loadCategories() {
  try {
    const res = await fetch('/api/categories'); // Faz uma requisição para buscar as categorias
    if (!res.ok) throw new Error(`Falha ao carregar categorias: ${res.status} ${res.statusText}`);
    const categories = await res.json(); // Converte a resposta para JSON
    const container = document.getElementById('categories-container'); // Seleciona o container onde as categorias serão exibidas
    container.innerHTML = ''; // Limpa o conteúdo atual (caso tenha algo)

    categories.forEach(cat => {
      // Cria o cartão de categoria
      const card = document.createElement('div');
      card.classList.add('category-card'); // Adiciona a classe para estilizar o card

      // Adiciona o conteúdo do card (imagem, título, descrição, número de perguntas)
      card.innerHTML = `
        <div class="category-image">
          <img src="${cat.image}" alt="Imagem de ${cat.name}">
        </div>
        <h3>${cat.name}</h3>
        <p>${cat.description}</p>
        <span>${cat.questionCount} perguntas</span>
      `;

      // Torna o card clicável para redirecionar para a página do quiz
      card.addEventListener('click', () => {
        window.location.href = `quiz.html?category=${cat.id}`;
      });

      // Adiciona o card no container
      container.appendChild(card);
    });
  } catch (error) {
    console.error('Erro ao carregar categorias:', error); // Exibe erro no console se falhar
    displayLoadError();
  }
}

// Função para exibir mensagem de erro ao usuário
function displayLoadError() {
  const container = document.getElementById('categories-container');
  container.innerHTML = '<p class="error-message">Erro ao carregar categorias. Tente novamente mais tarde.</p>';
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
});
