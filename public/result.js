document.addEventListener('DOMContentLoaded', async () => {
  const userData = JSON.parse(localStorage.getItem('userData'));
  let userPositionData = null;

  // 1. Busque a posição do usuário ANTES de montar o ranking
  if (userData && userData.email) {
    try {
      const response = await fetch('/api/users/getQI', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email })
      });
      const data = await response.json();
      if (data.success) {
        userData.qi = data.qi;
        localStorage.setItem('userData', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Erro ao sincronizar QI:', error);
    }

    // Aqui busca a posição do usuário
    try {
      const resUser = await fetch('/api/users/position', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userData.email })
      });
      userPositionData = await resUser.json();
    } catch (error) {
      userPositionData = null;
    }
  }

  // *** BUSQUE O RANKING AQUI ***
  let rankingData = null;
  try {
    const res = await fetch('/api/users/ranking');
    rankingData = await res.json();
  } catch (error) {
    rankingData = { success: false, ranking: [] };
  }

  const rankingList = document.getElementById('ranking-list');
  let userInTop10 = false;

  // Limpe o ranking antes de adicionar os itens
  rankingList.innerHTML = '';

  if (rankingData && rankingData.success && Array.isArray(rankingData.ranking)) {
    rankingData.ranking.forEach((user, idx) => {
      const isCurrentUser = userData && user.email === userData.email;
      if (isCurrentUser) userInTop10 = true;
      rankingList.innerHTML += `
        <li class="ranking-item${isCurrentUser ? ' meu-ranking' : ''}">
          <span style="font-weight:bold;width:22px;display:inline-block;">${idx + 1}º</span>
          <img src="${user.avatarPath || 'images/avatars/default-avatar.png'}" alt="avatar" style="width:28px;height:28px;border-radius:50%;border:1.5px solid #1e90ff;background:#222;margin-right:6px;">
          <span style="flex:1;">${user.username || user.email.split('@')[0]}</span>
          <span style="font-weight:bold;color:#1e90ff;">${user.qi}</span>
        </li>
      `;
    });

    // Se o usuário não está no top 10, exibe ele como linha extra
    if (!userInTop10 && userPositionData && userPositionData.success) {
      rankingList.innerHTML += `
        <li class="ranking-item meu-ranking" style="margin-top:10px;">
          <span style="font-weight:bold;width:22px;display:inline-block;">${userPositionData.position}º</span>
          <img src="${userPositionData.avatarPath || 'images/avatars/default-avatar.png'}" alt="avatar" style="width:28px;height:28px;border-radius:50%;border:1.5px solid #1e90ff;background:#222;margin-right:6px;">
          <span style="flex:1;">${userPositionData.username || userData.email.split('@')[0]}</span>
          <span style="font-weight:bold;color:#1e90ff;">${userPositionData.qi}</span>
        </li>
      `;
    }
  }

  // Texto de posição
  if (userPositionData && userPositionData.success) {
    document.getElementById('user-ranking').innerHTML =
      `Sua posição: <span style="color:#1e90ff;font-weight:bold;">${userPositionData.position}º</span> — <span style="color:#1e90ff;font-weight:bold;">${userPositionData.totalUsers}</span> usuários`;
  }
});