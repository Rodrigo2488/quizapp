document.addEventListener('DOMContentLoaded', () => {
  const categoriesContainer = document.getElementById('categories-container');
  const editSection = document.getElementById('edit-section');
  const editCategoryName = document.getElementById('edit-category-name');
  const editOptionsButtons = document.getElementById('edit-options-buttons');
  const editForm = document.getElementById('edit-form');
  const editId = document.getElementById('edit-id');
  const editName = document.getElementById('edit-name');
  const editDescription = document.getElementById('edit-description');
  const editImageInput = document.getElementById('edit-image');
  const galleryEdit = document.getElementById('image-gallery-edit');
  const showEditCategoryBtn = document.getElementById('show-edit-category-btn');
  const showEditQuestionsBtn = document.getElementById('show-edit-questions-btn');
  const questionSearch = document.getElementById('question-search');
  const questionSearchInput = document.getElementById('search-questions-input');
  const questionSearchBtn = document.getElementById('question-search-btn');
  const questionList = document.getElementById('question-list');

  let categories = [];
  let images = [];
  let currentCatId = null;
  let currentCategory = null;

  let allQuestions = [];
  let currentPage = 1;
  const questionsPerPage = 20;

  async function loadCategories() {
    const res = await fetch('/api/categories');
    categories = await res.json();
    renderCategories(categories);
  }

  function renderCategories(cats) {
    categoriesContainer.innerHTML = '';
    cats.forEach(cat => {
      const card = document.createElement('div');
      card.className = 'category-card';
      card.innerHTML = `
        <div class="category-image">
          <img src="${cat.image}" alt="${cat.name}" />
        </div>
        <h3>${cat.name}</h3>
        <p>${cat.description}</p>
      `;
      card.addEventListener('click', () => prepareCategorySelection(cat));
      categoriesContainer.appendChild(card);
    });
  }

  async function prepareCategorySelection(category) {
    currentCatId = category.id;
    currentCategory = category;

    editSection.style.display = 'block';
    editCategoryName.textContent = category.name;
    editOptionsButtons.style.display = 'flex';
    editForm.style.display = 'none';
    questionSearch.style.display = 'none';
    questionList.innerHTML = '';

    window.scrollTo(0, document.body.scrollHeight);
  }

  async function loadImageGallery() {
    const res = await fetch('/api/images');
    images = await res.json();
    galleryEdit.innerHTML = '';
    images.forEach(src => {
      const img = document.createElement('img');
      img.src = src;
      img.alt = src.split('/').pop();
      img.addEventListener('click', () => selectImage(img, src));
      galleryEdit.appendChild(img);
    });
  }

  function selectImage(imgElement, src) {
    editImageInput.value = src;
    galleryEdit.querySelectorAll('img').forEach(i => i.classList.remove('selected'));
    imgElement.classList.add('selected');
  }

  async function showEditCategory() {
    editOptionsButtons.style.display = 'none';
    editForm.style.display = 'block';
    questionSearch.style.display = 'none';

    editId.value = currentCategory.id;
    editName.value = currentCategory.name;
    editDescription.value = currentCategory.description;
    await loadImageGallery();
    const selectedImg = galleryEdit.querySelector(`img[src="${currentCategory.image}"]`);
    if (selectedImg) selectImage(selectedImg, currentCategory.image);
  }

  async function showEditQuestions() {
    editOptionsButtons.style.display = 'none';
    editForm.style.display = 'none';
    questionSearch.style.display = 'block';
    questionList.innerHTML = '';
    await fetchQuestions();
  }

  async function fetchQuestions() {
    const res = await fetch(`/api/questions?category=${currentCatId}`);
    const qs = await res.json();
    allQuestions = qs;
    currentPage = 1;
    renderQuestions();
  }

  function renderQuestions() {
    questionList.innerHTML = '';

    const start = (currentPage - 1) * questionsPerPage;
    const end = start + questionsPerPage;
    const currentQuestions = allQuestions.slice(start, end);

    if (currentQuestions.length === 0) {
      questionList.innerHTML = '<p>Nenhuma pergunta encontrada.</p>';
      return;
    }

    const list = document.createElement('ul');
    list.className = 'question-list-ul';

    currentQuestions.forEach(q => {
      const li = document.createElement('li');
      li.className = 'question-list-item';
      li.textContent = `${q.id} - ${q.question}`;
      li.addEventListener('click', () => loadQuestionToEdit(q));
      list.appendChild(li);
    });

    questionList.appendChild(list);
    renderPagination();
  }

  function renderPagination() {
    const totalPages = Math.ceil(allQuestions.length / questionsPerPage);
    const paginationDiv = document.createElement('div');
    paginationDiv.className = 'pagination';

    if (currentPage > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.textContent = 'Anterior';
      prevBtn.addEventListener('click', () => {
        currentPage--;
        renderQuestions();
      });
      paginationDiv.appendChild(prevBtn);
    }

    for (let i = 1; i <= totalPages; i++) {
      const pageBtn = document.createElement('button');
      pageBtn.textContent = i;
      if (i === currentPage) pageBtn.classList.add('active-page');
      pageBtn.addEventListener('click', () => {
        currentPage = i;
        renderQuestions();
      });
      paginationDiv.appendChild(pageBtn);
    }

    if (currentPage < totalPages) {
      const nextBtn = document.createElement('button');
      nextBtn.textContent = 'Próxima';
      nextBtn.addEventListener('click', () => {
        currentPage++;
        renderQuestions();
      });
      paginationDiv.appendChild(nextBtn);
    }

    questionList.appendChild(paginationDiv);
  }

  showEditCategoryBtn.addEventListener('click', showEditCategory);
  showEditQuestionsBtn.addEventListener('click', showEditQuestions);

  questionSearchBtn.addEventListener('click', () => {
    const term = questionSearchInput.value.toLowerCase();
    const filtered = allQuestions.filter(q => q.question.toLowerCase().includes(term));
    allQuestions = filtered;
    currentPage = 1;
    renderQuestions();
  });

  editForm.addEventListener('submit', async e => {
    e.preventDefault();

    const updatedCategory = {
      name: editName.value,
      description: editDescription.value,
      image: editImageInput.value
    };

    const res = await fetch(`/api/categories/${editId.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedCategory)
    });

    if (res.ok) {
      alert('Categoria atualizada com sucesso!');
      await loadCategories();
      editForm.style.display = 'none';
      editOptionsButtons.style.display = 'flex';
      editCategoryName.textContent = updatedCategory.name;
    } else {
      alert('Erro ao atualizar categoria.');
    }
  });

  async function loadQuestionToEdit(question) {
    questionList.innerHTML = '';

    const form = document.createElement('form');
    form.id = 'question-edit-form';
    form.style.marginTop = '20px';

    const categoriesRes = await fetch('/api/categories');
    const categoriesData = await categoriesRes.json();

    const selectedCatIds = Array.isArray(question.categoryIds)
      ? question.categoryIds
      : [];

    const optionsHTML = question.options.map((opt, i) => {
      const optId = `option-${i}`;
      return `
        <div class="option-item" style="display: flex; align-items: center; margin-bottom: 10px;">
          <input 
            type="radio" 
            name="correctOption" 
            value="${i}" 
            id="correctOption-${i}"
            ${question.answer === i ? 'checked' : ''}
            style="margin-right: 10px; width: 20px; height: 20px;"
          />
          <label for="correctOption-${i}" style="margin-right: 10px; cursor: pointer;">Correta</label>
          
          <input 
            type="text" 
            name="option${i}" 
            id="${optId}" 
            value="${opt || ''}" 
            placeholder="Alternativa ${i + 1}" 
            required
            style="flex-grow: 1; padding: 10px; font-size: 16px; background-color: #111; color: #fff; border: 1px solid #555; border-radius: 5px;"
          />
        </div>
      `;
    }).join('');

    const categoriesHTML = categoriesData.map(cat => {
      const inputId = `cat-${cat.id}`;
      return `
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <input 
            type="checkbox" 
            name="cat" 
            value="${cat.id}" 
            id="${inputId}"
            ${selectedCatIds.includes(cat.id) ? 'checked' : ''}
          />
          <label for="${inputId}" style="cursor: pointer;">
            ${cat.name}
          </label>
        </div>
      `;
    }).join('');

    form.innerHTML = `
      <div class="form-group">
        <label for="questionText">Pergunta:</label>
        <input 
          id="questionText"
          type="text" 
          name="questionText" 
          value="${question.question}" 
          required
        />
      </div>

      <div class="form-group">
        <label>Alternativas:</label>
        <div id="edit-options">${optionsHTML}</div>
      </div>

      <div class="form-group">
        <label for="difficulty">Dificuldade:</label>
        <select id="difficulty" name="difficulty" required>
          <option value="fácil"        ${question.difficulty === 'fácil' ? 'selected' : ''}>Fácil</option>
          <option value="normal"       ${question.difficulty === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="difícil"      ${question.difficulty === 'difícil' ? 'selected' : ''}>Difícil</option>
          <option value="especialista" ${question.difficulty === 'especialista' ? 'selected' : ''}>Especialista</option>
        </select>
      </div>

      <div class="form-group">
        <label>Categorias:</label>
        <div id="edit-categories">${categoriesHTML}</div>
      </div>

      <button type="submit" id="save-question-btn">Salvar Pergunta</button>
    `;

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const updated = {
        question: fd.get('questionText'),
        options: [
          fd.get('option0'),
          fd.get('option1'),
          fd.get('option2'),
          fd.get('option3')
        ],
        answer: parseInt(fd.get('correctOption'), 10),
        difficulty: fd.get('difficulty'),
        categoryIds: fd.getAll('cat').map(id => parseInt(id, 10))
      };

      const res = await fetch(`/api/questions/${question.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });

      if (res.ok) {
        alert('Pergunta atualizada com sucesso!');
        await fetchQuestions();
      } else {
        alert('Erro ao salvar pergunta.');
      }
    });

    questionList.appendChild(form);
  }

  loadCategories();
});
