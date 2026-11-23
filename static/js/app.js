(() => {
  const KEY = 'stray-pals-favorites-v1';
  const read = () => { try { const value = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; } };
  const write = items => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { showToast('瀏覽器沒有足夠空間儲存，請稍後再試。'); } updateCounts(); };
  window.Pals = { read, write, KEY };
  window.escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  window.showToast = message => { const toast = document.getElementById('toast'); if (!toast) return; toast.textContent = message; toast.classList.add('show'); clearTimeout(window._toastTimer); window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2500); };
  function updateCounts() { document.querySelectorAll('[data-favorite-count]').forEach(node => node.textContent = read().length); }
  function animalFallback() { return `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="100%" height="100%" fill="#fff0df"/><text x="50%" y="48%" text-anchor="middle" font-size="92">🐶🐱</text><text x="50%" y="75%" text-anchor="middle" font-size="25" fill="#795548">照片暫時看不到</text></svg>')}`; }
  window.animalFallback = animalFallback;
  function renderFavorites() {
    const list = document.getElementById('favorites-list'); if (!list) return;
    const items = read();
    list.innerHTML = items.length ? items.map(a => `<article class="detail-row"><b>${escapeHTML(a.name || a.variety || '浪浪')}・${escapeHTML(a.shelter_id || '')}</b><span>${escapeHTML(a.area || '')}｜${escapeHTML(a.shelter || '')}</span><button class="text-link" data-remove-favorite="${escapeHTML(a.id)}">移除</button></article>`).join('') : '<p class="status-box">還沒有收藏喔，去找找喜歡的浪浪吧！</p>';
  }
  document.addEventListener('click', event => {
    const opener = event.target.closest('[data-show-favorites]');
    if (opener) { renderFavorites(); document.getElementById('favorites-panel')?.classList.remove('hidden'); }
    if (event.target.closest('[data-close-modal]')) event.target.closest('.modal-backdrop')?.classList.add('hidden');
    const remove = event.target.closest('[data-remove-favorite]');
    if (remove) { write(read().filter(a => String(a.id) !== remove.dataset.removeFavorite)); renderFavorites(); showToast('已從關注清單移除'); }
    if (event.target.classList.contains('modal-backdrop')) event.target.classList.add('hidden');
  });
  updateCounts();
})();
