// 브라우저에서 화면을 움직이는 JavaScript입니다.
// 지금 저장한 옷은 이 브라우저의 localStorage에 보관됩니다.
const STORAGE_KEY = 'closet-note-items-v1';
const NOTES_KEY = 'closet-note-ideas-v1';
const OUTFITS_KEY = 'closet-note-outfits-v1';
const grid = document.querySelector('#wardrobe-grid');
const emptyState = document.querySelector('#empty-state');
const itemCount = document.querySelector('#item-count');
const dialog = document.querySelector('#item-dialog');
const form = document.querySelector('#item-form');
const errorMessage = document.querySelector('#form-error');
const searchInput = document.querySelector('#search-input');
const noteDialog = document.querySelector('#note-dialog');
const noteForm = document.querySelector('#note-form');
const noteError = document.querySelector('#note-error');
const notesGrid = document.querySelector('#notes-grid');
const notesEmpty = document.querySelector('#notes-empty');
const notesCount = document.querySelector('#note-count');
const outfitDialog = document.querySelector('#outfit-dialog');
const outfitForm = document.querySelector('#outfit-form');
const outfitError = document.querySelector('#outfit-error');
let items = load(STORAGE_KEY);
let notes = load(NOTES_KEY);
let outfits = load(OUTFITS_KEY);
let currentFilter = '전체';
function load(key) { try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; } }
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function renderItems() {
  const query = searchInput.value.trim().toLowerCase();
  const visibleItems = items.filter((item) => (currentFilter === '전체' || item.category === currentFilter) && (item.name + ' ' + item.note).toLowerCase().includes(query));
  itemCount.textContent = items.length; emptyState.hidden = items.length > 0; grid.replaceChildren();
  for (const item of visibleItems) {
    const card = document.createElement('article'); card.className = 'item-card';
    card.innerHTML = '<img class="item-photo" src="' + item.photo + '" alt="' + escapeHtml(item.name) + ' 사진" /><button class="delete-button" type="button" aria-label="' + escapeHtml(item.name) + ' 삭제">×</button><div class="item-meta"><p class="item-category">' + escapeHtml(item.category) + '</p><h3 class="item-name">' + escapeHtml(item.name) + '</h3>' + (item.note ? '<p class="item-note">' + escapeHtml(item.note) + '</p>' : '') + '</div>';
    card.querySelector('.delete-button').addEventListener('click', () => deleteItem(item.id)); grid.append(card);
  }
  if (items.length && !visibleItems.length) { const message = document.createElement('p'); message.className = 'empty-state'; message.textContent = '조건에 맞는 옷이 없어요. 다른 검색어나 종류를 선택해보세요.'; grid.append(message); }
}
function renderNotes() {
  notesGrid.replaceChildren(); notesCount.textContent = notes.length; notesEmpty.hidden = notes.length > 0;
  for (const note of notes) {
    const card = document.createElement('article'); card.className = 'note-card';
    const linkedItems = note.itemIds.map((id) => items.find((item) => item.id === id)).filter(Boolean);
    const names = linkedItems.map((item) => escapeHtml(item.name)).join(' · ');
    card.innerHTML = '<img class="note-photo" src="' + note.photo + '" alt="참고 코디 사진" /><div class="note-meta"><p>' + escapeHtml(note.note || '코디 영감') + '</p><small>' + (names || '아직 내 옷을 연결하지 않았어요') + '</small><button class="note-delete" type="button">노트 삭제</button></div>';
    card.querySelector('.note-delete').addEventListener('click', () => { notes = notes.filter((entry) => entry.id !== note.id); save(NOTES_KEY, notes); renderNotes(); }); notesGrid.append(card);
  }
}
function renderOptions(target, emptyText) {
  const options = document.querySelector(target); options.replaceChildren();
  if (!items.length) { options.textContent = emptyText; return; }
  for (const item of items) { const label = document.createElement('label'); label.className = 'closet-option'; label.innerHTML = '<input type="checkbox" name="itemIds" value="' + item.id + '" /><img src="' + item.photo + '" alt="" /><span>' + escapeHtml(item.name) + '</span>'; options.append(label); }
}
function dateKey(date) { return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0'); }
function renderTodayOutfit() {
  const date = new Date(); document.querySelector('#today-date').textContent = (date.getMonth() + 1) + '.' + date.getDate();
  const today = outfits.find((outfit) => outfit.date === dateKey(date)); const content = document.querySelector('#today-content'); content.replaceChildren();
  const action = document.querySelector('#open-outfit-form');
  if (!today) { content.innerHTML = '<div class="today-empty-mark">＋</div><p>오늘 입은 옷을 골라<br />나만의 코디로 기록해보세요.</p>'; action.textContent = '오늘 코디 완성하기 ＋'; return; }
  const pieces = document.createElement('div'); pieces.className = 'today-pieces';
  for (const id of today.itemIds) { const item = items.find((entry) => entry.id === id); if (!item) continue; const piece = document.createElement('div'); piece.className = 'today-piece'; piece.innerHTML = '<img src="' + item.photo + '" alt="' + escapeHtml(item.name) + '" /><span>' + escapeHtml(item.name) + '</span>'; pieces.append(piece); }
  content.append(pieces); if (today.note) { const caption = document.createElement('p'); caption.className = 'today-caption'; caption.textContent = today.note; content.append(caption); } action.textContent = '오늘 코디 수정하기 ↗';
}
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]); }
function readImage(file) { return new Promise((resolve, reject) => { if (!file) return resolve(''); if (!file.type.startsWith('image/')) return reject(new Error('이미지 파일을 선택해주세요.')); if (file.size > 2000000) return reject(new Error('사진은 2MB 이하로 선택해주세요.')); const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('사진을 읽지 못했어요.')); reader.readAsDataURL(file); }); }
function deleteItem(id) { items = items.filter((item) => item.id !== id); save(STORAGE_KEY, items); renderItems(); renderNotes(); renderTodayOutfit(); }
function openForm() { errorMessage.textContent = ''; dialog.showModal(); }
document.querySelector('#open-form').addEventListener('click', openForm);
document.querySelector('#empty-add').addEventListener('click', openForm);
document.querySelector('#close-form').addEventListener('click', () => dialog.close());
document.querySelector('#open-note-form').addEventListener('click', () => { noteError.textContent = ''; renderOptions('#closet-options', '먼저 내 옷장에서 옷을 등록하면 여기서 골라 연결할 수 있어요.'); noteDialog.showModal(); });
document.querySelector('#close-note-form').addEventListener('click', () => noteDialog.close());
document.querySelector('#open-outfit-form').addEventListener('click', () => { outfitError.textContent = ''; renderOptions('#outfit-options', '먼저 내 옷장에서 옷을 등록해주세요.'); const current = outfits.find((entry) => entry.date === dateKey(new Date())); if (current) { outfitForm.querySelectorAll('input[name="itemIds"]').forEach((box) => { box.checked = current.itemIds.includes(box.value); }); outfitForm.elements.note.value = current.note || ''; } outfitDialog.showModal(); });
document.querySelector('#close-outfit-form').addEventListener('click', () => outfitDialog.close());
searchInput.addEventListener('input', renderItems);
document.querySelectorAll('.filter-chip').forEach((button) => button.addEventListener('click', () => { document.querySelector('.filter-chip.selected')?.classList.remove('selected'); button.classList.add('selected'); currentFilter = button.dataset.filter; renderItems(); }));
form.addEventListener('submit', async (event) => { event.preventDefault(); errorMessage.textContent = ''; const data = new FormData(form); const name = String(data.get('name')).trim(); const file = data.get('photo'); if (!name || !file?.size) { errorMessage.textContent = '옷 이름과 옷 사진을 입력해주세요.'; return; } try { const photo = await readImage(file); items.unshift({ id: crypto.randomUUID(), name, category: String(data.get('category')), note: String(data.get('note')).trim(), photo }); save(STORAGE_KEY, items); renderItems(); form.reset(); dialog.close(); } catch (error) { errorMessage.textContent = error.message; } });
noteForm.addEventListener('submit', async (event) => { event.preventDefault(); noteError.textContent = ''; const data = new FormData(noteForm); try { const photo = await readImage(data.get('photo')); notes.unshift({ id: crypto.randomUUID(), photo, note: String(data.get('note')).trim(), itemIds: data.getAll('itemIds').map(String) }); save(NOTES_KEY, notes); renderNotes(); noteForm.reset(); noteDialog.close(); } catch (error) { noteError.textContent = error.message; } });
outfitForm.addEventListener('submit', (event) => { event.preventDefault(); const itemIds = [...outfitForm.querySelectorAll('input[name="itemIds"]:checked')].map((box) => box.value); if (!itemIds.length) { outfitError.textContent = '오늘 입은 옷을 하나 이상 골라주세요.'; return; } const date = dateKey(new Date()); outfits = outfits.filter((entry) => entry.date !== date); outfits.unshift({ date, itemIds, note: String(new FormData(outfitForm).get('note')).trim() }); save(OUTFITS_KEY, outfits); renderTodayOutfit(); outfitForm.reset(); outfitDialog.close(); });
renderItems(); renderNotes(); renderTodayOutfit();
