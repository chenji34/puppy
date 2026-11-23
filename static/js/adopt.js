(() => {
  const grid = document.getElementById('animal-grid'); if (!grid) return;
  let kind = '', page = 1, currentAnimals = [], selectedAnimal = null;
  const status = document.getElementById('animal-status');
  const esc = window.escapeHTML;
  const displayName = a => a.name && a.name !== a.variety ? a.name : a.variety;
  function card(a) {
    const saved = window.Pals.read().some(item => String(item.id) === String(a.id));
    return `<article class="animal-card"><img class="animal-image" loading="lazy" src="${esc(a.image)}" alt="浪浪照片：${esc(displayName(a))}" onerror="this.onerror=null;this.src=animalFallback()"><div class="animal-content"><h2 class="animal-title">${esc(displayName(a))}</h2><div class="badge-row"><span class="badge">${esc(a.kind)}</span><span class="badge">${esc(a.sex)}</span><span class="badge">${esc(a.bodytype)}</span></div><div class="animal-meta"><span>🎨 毛色：${esc(a.color)}</span><span>📍 ${esc(a.area)}・${esc(a.shelter)}</span></div><div class="animal-buttons"><button class="save-button ${saved?'saved':''}" data-save="${esc(a.id)}">${saved?'💛 已關注':'🤍 加入關注'}</button><button class="button-primary" data-parent-card="${esc(a.id)}">給爸媽看</button></div></div></article>`;
  }
  async function load() {
    status.className = 'status-box'; status.textContent = '正在邀請浪浪來見面…'; grid.innerHTML = '';
    document.getElementById('page-label').textContent = `第 ${page} 頁`;
    document.getElementById('prev-page').disabled = page <= 1;
    try {
      const params = new URLSearchParams({page}); if (kind) params.set('kind',kind);
      const area = document.getElementById('area-filter').value, body = document.getElementById('body-filter').value;
      if (area) params.set('area_id',area); if (body) params.set('bodytype',body);
      const response = await fetch(`/api/animals?${params}`), payload = await response.json();
      if (!response.ok) throw new Error(payload.error || '收容所資料正在整理中，請稍後再試一次喔！');
      currentAnimals = payload.animals || [];
      if (!currentAnimals.length) { status.className = 'status-box status-empty'; status.textContent = '這一頁暫時沒有符合條件、附有照片的浪浪，試試別的篩選吧！'; }
      else { status.textContent = `找到 ${currentAnimals.length} 位浪浪，認養資訊請和家長一起確認喔！`; grid.innerHTML = currentAnimals.map(card).join(''); }
      document.getElementById('next-page').disabled = currentAnimals.length < 100;
    } catch (error) { status.className = 'status-box status-error'; status.textContent = error.message || '收容所資料正在整理中，請稍後再試一次喔！'; document.getElementById('next-page').disabled = true; }
  }
  document.querySelectorAll('[data-kind]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-kind]').forEach(item=>item.classList.remove('active')); button.classList.add('active'); kind=button.dataset.kind; page=1; load(); }));
  document.getElementById('search-animals').addEventListener('click', () => {page=1;load();});
  document.getElementById('prev-page').addEventListener('click',()=>{if(page>1){page--;load();}});
  document.getElementById('next-page').addEventListener('click',()=>{page++;load();});
  grid.addEventListener('click', event => {
    const save = event.target.closest('[data-save]');
    if (save) { const a=currentAnimals.find(item=>String(item.id)===save.dataset.save); if(!a)return; const items=window.Pals.read(); const exists=items.some(item=>String(item.id)===String(a.id)); window.Pals.write(exists?items.filter(item=>String(item.id)!==String(a.id)):[...items,a]); load(); window.showToast(exists?'已取消關注':'已加入我的關注清單'); return; }
    const show = event.target.closest('[data-parent-card]');
    if (show) { selectedAnimal=currentAnimals.find(item=>String(item.id)===show.dataset.parentCard); if(!selectedAnimal)return; const a=selectedAnimal; const rows=[['動物收容編號',a.shelter_id],['品種',a.variety],['所在地',a.area],['收容所名稱',a.shelter],['聯絡電話',a.phone],['地址',a.address]]; document.getElementById('adopt-details').innerHTML=rows.map(([label,value])=>`<div class="detail-row"><b>${esc(label)}</b>${esc(value)}</div>`).join(''); document.getElementById('adopt-modal').classList.remove('hidden'); }
  });
  document.getElementById('copy-adopt').addEventListener('click', async () => { if(!selectedAnimal)return; const a=selectedAnimal; const text=`給爸媽看的領養小卡\n浪浪：${displayName(a)}\n動物收容編號：${a.shelter_id}\n品種：${a.variety}\n所在地：${a.area}\n收容所名稱：${a.shelter}\n聯絡電話：${a.phone}\n地址：${a.address}\n\n請家長協助聯絡收容所確認最新資料與認養條件。`; try { await navigator.clipboard.writeText(text); window.showToast('小卡資訊已複製，可以和爸媽分享囉！'); } catch { const input=document.createElement('textarea'); input.value=text; document.body.append(input); input.select(); document.execCommand('copy'); input.remove(); window.showToast('小卡資訊已複製，可以和爸媽分享囉！'); } });
  load();
})();
