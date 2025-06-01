// Variáveis para imagem da pergunta
let questionImageUrl = '';
let useImageInQuestion = true;

function showSection(id) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'add-category') loadImageGallery();
  if (id === 'add-question') loadQuestionHelpers();
}

function toggleCategoryOptions() {
  document.getElementById('category-options').classList.toggle('active');
}

async function loadImageGallery() {
  const res = await fetch('/api/images');
  const images = await res.json();
  const gal = document.getElementById('image-gallery');
  gal.innerHTML = '';
  images.forEach(img => {
    const i = document.createElement('img');
    i.src = img;
    i.alt = img.split('/').pop();
    i.onclick = () => {
      document.getElementById('cat-image').value = img;
      document.querySelectorAll('#image-gallery img').forEach(x => x.classList.remove('selected'));
      i.classList.add('selected');
    };
    gal.appendChild(i);
  });
}

function loadQuestionHelpers() {
  loadCategories();
}

async function loadCategories() {
  const res = await fetch('/api/categories');
  const categories = await res.json();
  const opts = document.getElementById('category-options');
  opts.innerHTML = '';
  categories.forEach(cat => {
    const d = document.createElement('div');
    d.textContent = cat.name;
    d.dataset.id = cat.id;
    d.onclick = () => d.classList.toggle('selected');
    opts.appendChild(d);
  });
}

document.getElementById('form-add-question').addEventListener('submit', async e => {
  e.preventDefault();
  const question = document.getElementById('question-text').value.trim();
  const options = [
    document.getElementById('option1').value,
    document.getElementById('option2').value,
    document.getElementById('option3').value,
    document.getElementById('option4').value
  ];
  const answerInput = document.querySelector('input[name="answer"]:checked');
  const answer = answerInput ? parseInt(answerInput.value) : NaN;
  const categoryIds = Array.from(document.querySelectorAll('#category-options div.selected')).map(d => parseInt(d.dataset.id));
  const difficulty = document.getElementById('difficulty').value;

  // Adicione antes do fetch:
  let image = '';
  if (questionImageUrl && document.getElementById('chk-use-image').checked) {
    image = questionImageUrl;
  }

  if (!question || options.some(opt => !opt) || isNaN(answer) || categoryIds.length === 0 || !difficulty) {
    return alert('Preencha todos os campos!');
  }
  const res = await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, options, answer, categoryIds, difficulty, image })
  });
  if (res.ok) {
    alert('Pergunta adicionada!');
    document.getElementById('form-add-question').reset();
    document.getElementById('category-button').textContent = 'Selecione Categorias';
    document.querySelectorAll('#category-options div').forEach(d => d.classList.remove('selected'));
    questionImageUrl = '';
    showQuestionImagePreview();
  } else alert('Erro!');
});

document.getElementById('form-add-image').addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData();
  fd.append('image', document.getElementById('image-file').files[0]);
  const res = await fetch('/api/upload',{method:'POST',body:fd});
  if(res.ok) alert('Imagem enviada!'); else alert('Erro no upload');
});

// ✅ Função para salvar nova categoria
document.getElementById('form-add-category').addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('cat-name').value.trim();
  const description = document.getElementById('cat-description').value.trim();
  const image = document.getElementById('cat-image').value.trim();
  if (!name || !description || !image) {
    return alert('Preencha todos os campos!');
  }
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description, image })
  });
  if (res.ok) {
    alert('Categoria adicionada!');
    document.getElementById('form-add-category').reset();
    document.querySelectorAll('#image-gallery img').forEach(i => i.classList.remove('selected'));
  } else {
    alert('Erro ao adicionar categoria!');
  }
});

// Abrir modal
document.getElementById('btn-add-image').onclick = function() {
  document.getElementById('image-modal').style.display = 'flex';
  document.getElementById('image-url-input').value = questionImageUrl || '';
  document.getElementById('image-url-feedback').textContent = '';
  document.getElementById('btn-confirm-image').disabled = true;
  if (questionImageUrl) validateImageUrl(questionImageUrl);
  document.getElementById('image-url-input').focus();
};

// Cancelar modal
document.getElementById('btn-cancel-image').onclick = function() {
  document.getElementById('image-modal').style.display = 'none';
};

// Validação de URL de imagem
function validateImageUrl(url) {
  const feedback = document.getElementById('image-url-feedback');
  const btn = document.getElementById('btn-confirm-image');
  if (!url.match(/\.(jpeg|jpg|png|gif|webp|svg)$/i)) {
    feedback.textContent = 'URL não parece ser de uma imagem válida.';
    feedback.style.color = 'orange';
    btn.disabled = true;
    return;
  }
  // Testar carregamento real da imagem
  const img = new window.Image();
  img.onload = function() {
    feedback.textContent = 'Imagem válida!';
    feedback.style.color = 'green';
    btn.disabled = false;
  };
  img.onerror = function() {
    feedback.textContent = 'Não foi possível carregar a imagem.';
    feedback.style.color = 'red';
    btn.disabled = true;
  };
  img.src = url;
}

// Ao digitar no input, validar
document.getElementById('image-url-input').oninput = function(e) {
  validateImageUrl(e.target.value.trim());
};

// Confirmar imagem
document.getElementById('btn-confirm-image').onclick = function() {
  questionImageUrl = document.getElementById('image-url-input').value.trim();
  showQuestionImagePreview();
  document.getElementById('image-modal').style.display = 'none';
};

// Atualizar preview ao marcar/desmarcar o checkbox
document.getElementById('chk-use-image').onchange = function(e) {
  useImageInQuestion = e.target.checked;
  showQuestionImagePreview();
};

// Exibir preview da imagem
function showQuestionImagePreview() {
  const preview = document.getElementById('question-image-preview');
  if (questionImageUrl && document.getElementById('chk-use-image').checked) {
    preview.innerHTML = `<img src="${questionImageUrl}" style="max-width:220px;max-height:120px;border-radius:6px;box-shadow:0 2px 8px #0003;">`;
    preview.style.display = 'block';
  } else {
    preview.innerHTML = '';
    preview.style.display = 'none';
  }
}

// Fecha o dropdown de categorias ao clicar fora
document.addEventListener('mousedown', function(event) {
  const dropdown = document.getElementById('category-options');
  const button = document.getElementById('category-button');
  if (!dropdown.contains(event.target) && !button.contains(event.target)) {
    dropdown.classList.remove('active');
  }
});

loadImageGallery();