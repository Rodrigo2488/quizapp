document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const photoPreview = document.getElementById('preview');
  const photoLabel = document.querySelector('.photo-label');
  const photoModal = document.getElementById('photo-modal');
  const closeModal = document.querySelector('.close-modal');
  const avatarsGrid = document.getElementById('avatars-grid');
  const passwordInput = document.getElementById('password');

  // Move avatars para escopo global
  window.avatars = [
    { id: 1, name: 'avatar1', path: 'images/avatars/avatar1.png' },
    { id: 2, name: 'avatar2', path: 'images/avatars/avatar2.png' },
    { id: 3, name: 'avatar3', path: 'images/avatars/avatar3.png' },
    { id: 4, name: 'avatar4', path: 'images/avatars/avatar4.png' },
    { id: 5, name: 'avatar5', path: 'images/avatars/avatar5.png' },
    { id: 6, name: 'avatar6', path: 'images/avatars/avatar6.png' },
    { id: 7, name: 'avatar7', path: 'images/avatars/avatar7.png' },
    { id: 8, name: 'avatar8', path: 'images/avatars/avatar8.png' },
    { id: 9, name: 'avatar9', path: 'images/avatars/avatar9.png' },
    { id: 10, name: 'avatar10', path: 'images/avatars/avatar10.png' }
  ];

  let selectedAvatarId = null;

  // Carrega avatares no grid
  const loadAvatars = async () => {
    try {
      avatarsGrid.innerHTML = avatars.map(avatar => `
        <img 
          src="${avatar.path}" 
          alt="${avatar.name}" 
          class="avatar-option"
          data-avatar-id="${avatar.id}"
          style="width:64px;height:64px;border-radius:50%;margin:8px;cursor:pointer;border:2px solid transparent;"
        >
      `).join('');

      // Adiciona evento de seleção
      avatarsGrid.querySelectorAll('.avatar-option').forEach(img => {
        img.addEventListener('click', () => {
          const avatarId = parseInt(img.getAttribute('data-avatar-id'));
          selectAvatar(avatarId);
          // Destaca o selecionado
          avatarsGrid.querySelectorAll('.avatar-option').forEach(i => i.style.border = '2px solid transparent');
          img.style.border = '2px solid #1e90ff';
        });
      });
    } catch (error) {
      console.error('Erro ao carregar avatares:', error);
    }
  };

  // Só adiciona eventos se os elementos existem
  if (photoLabel && photoModal) {
    // Mostra modal ao clicar em "Escolher foto"
    photoLabel.addEventListener('click', (e) => {
      e.preventDefault();
      loadAvatars(); // Carrega os avatares sempre que abrir
      photoModal.style.display = 'flex';
    });
  }

  if (closeModal && photoModal) {
    // Fecha modal
    closeModal.addEventListener('click', () => {
      photoModal.style.display = 'none';
    });
  }

  if (photoModal) {
    // Fecha modal clicando fora
    window.addEventListener('click', (e) => {
      if (e.target === photoModal) {
        photoModal.style.display = 'none';
      }
    });
  }

  // Envio do formulário
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = passwordInput.value;

    // Validações
    if (username.length < 3) {
      alert('O nome de usuário deve ter pelo menos 3 caracteres');
      return;
    }

    if (password.length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      alert('Por favor, insira um email válido');
      return;
    }

    if (!selectedAvatarId) {
      alert('Por favor, selecione um avatar');
      return;
    }

    const formData = {
      username,
      email,
      password,
      avatarId: selectedAvatarId
    };

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      
      if (data.success) {
        // Salva dados do usuário logado normalmente...
        // Agora busque todos os usuários para exibir autor no quiz da comunidade
        try {
          const res = await fetch('/api/users/all');
          const usuarios = await res.json();
          localStorage.setItem('usuarios', JSON.stringify(usuarios));
        } catch (e) {
          // Se falhar, apenas continue
          localStorage.setItem('usuarios', '[]');
        }
        alert('Conta criada com sucesso!');
        window.location.href = 'index.html';
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert(error.message || 'Erro ao criar conta. Tente novamente.');
    }
  });

  // Move selectAvatar para escopo global
  window.selectAvatar = function(avatarId) {
    const avatar = window.avatars.find(a => a.id === avatarId);
    if (avatar) {
      photoPreview.src = avatar.path;
      selectedAvatarId = avatar.id;
      photoModal.style.display = 'none';
    }
  };
});


window.addEventListener('DOMContentLoaded', () => {
  const avatarsGrid = document.getElementById('avatars-grid');

  // Adiciona evento de seleção
  avatarsGrid.querySelectorAll('.avatar-option').forEach(img => {
    img.addEventListener('click', () => {
      avatarsGrid.querySelectorAll('.avatar-option').forEach(i => i.classList.remove('selected'));
      img.classList.add('selected');
      // ...restante do seu código de seleção...
    });
  });
});