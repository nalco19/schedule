/* ============================================
   AGENDA — app.js  |  PWA com localStorage
   ============================================ */

'use strict';

// ─── CONSTANTES & CONFIG ───────────────────────────────────────────────────
const DAYS_PT   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const CAT_COLORS = [
  '#ff5c35','#f59e0b','#10b981','#3b82f6','#8b5cf6',
  '#ec4899','#06b6d4','#84cc16','#f97316','#6366f1'
];
const DEFAULT_CATS = [
  { id: 'trabalho', name: 'Trabalho',  color: '#3b82f6' },
  { id: 'pessoal',  name: 'Pessoal',   color: '#10b981' },
  { id: 'saude',    name: 'Saúde',     color: '#ec4899' },
];

// ─── STATE ─────────────────────────────────────────────────────────────────
let state = {
  view:       'week',       // 'week' | 'day' | 'month'
  cursor:     new Date(),   // data de referência para navegação
  events:     [],           // array de eventos
  categories: [...DEFAULT_CATS],
  notifEnabled: false,
  editingId:  null,         // id do evento em edição
  selectedCatId: null,      // categoria selecionada no modal
  selectedColor: CAT_COLORS[0],
  searchOpen: false,
};

// ─── PERSISTÊNCIA ──────────────────────────────────────────────────────────
function save() {
  localStorage.setItem('agenda_events',     JSON.stringify(state.events));
  localStorage.setItem('agenda_categories', JSON.stringify(state.categories));
  localStorage.setItem('agenda_notif',      JSON.stringify(state.notifEnabled));
}

function load() {
  try {
    const evts  = localStorage.getItem('agenda_events');
    const cats  = localStorage.getItem('agenda_categories');
    const notif = localStorage.getItem('agenda_notif');
    if (evts)  state.events     = JSON.parse(evts);
    if (cats)  state.categories = JSON.parse(cats);
    if (notif) state.notifEnabled = JSON.parse(notif);
  } catch(e) { console.warn('Load error', e); }
}

// ─── UTILS ─────────────────────────────────────────────────────────────────
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }

function toDateStr(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth()+1).padStart(2,'0') + '-' +
    String(d.getDate()).padStart(2,'0');
}

function parseDate(str) {
  const [y,m,d] = str.split('-').map(Number);
  return new Date(y, m-1, d);
}

function minutesToTime(mins) {
  return String(Math.floor(mins/60)).padStart(2,'0') + ':' + String(mins%60).padStart(2,'0');
}

function timeToMinutes(t) {
  if (!t) return null;
  const [h,m] = t.split(':').map(Number);
  return h*60 + m;
}

function formatTime(t) { return t || ''; }

function catById(id) { return state.categories.find(c => c.id === id) || null; }

function catColor(id) { const c = catById(id); return c ? c.color : '#9a9590'; }

function toast(msg, duration=2200) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), duration);
}

// ─── RENDER PRINCIPAL ──────────────────────────────────────────────────────
function render() {
  updateHeader();
  updateTabs();
  const main = document.getElementById('mainContent');
  if      (state.view === 'month') renderMonth(main);
  else if (state.view === 'day')   renderDay(main);
  else                             renderWeek(main);
  renderSidebar();
  scheduleNotifications();
}

function updateHeader() {
  const lbl = document.getElementById('currentPeriodLabel');
  const c = state.cursor;
  if (state.view === 'month') {
    lbl.textContent = MONTHS_PT[c.getMonth()] + ' ' + c.getFullYear();
  } else if (state.view === 'day') {
    lbl.textContent = DAYS_PT[c.getDay()] + ', ' + c.getDate() + ' ' + MONTHS_SHORT[c.getMonth()];
  } else {
    const mon = getWeekStart(c);
    const sun = new Date(mon); sun.setDate(sun.getDate()+6);
    if (mon.getMonth() === sun.getMonth()) {
      lbl.textContent = mon.getDate() + '–' + sun.getDate() + ' ' + MONTHS_SHORT[mon.getMonth()] + ' ' + mon.getFullYear();
    } else {
      lbl.textContent = mon.getDate() + ' ' + MONTHS_SHORT[mon.getMonth()] + ' – ' + sun.getDate() + ' ' + MONTHS_SHORT[sun.getMonth()];
    }
  }
}

function updateTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === state.view);
  });
}

// ─── WEEK VIEW ──────────────────────────────────────────────────────────────
function getWeekStart(d) {
  const dt = new Date(d);
  const day = dt.getDay(); // 0=Dom
  const diff = day === 0 ? -6 : 1 - day; // semana começa na segunda
  dt.setDate(dt.getDate() + diff);
  dt.setHours(0,0,0,0);
  return dt;
}

function renderWeek(container) {
  const mon = getWeekStart(state.cursor);
  const days = Array.from({length:7}, (_,i) => {
    const d = new Date(mon); d.setDate(d.getDate()+i); return d;
  });
  const today = toDateStr(new Date());

  // Header row
  const headerRow = document.createElement('div');
  headerRow.className = 'week-header-row';
  headerRow.innerHTML = '<div class="week-header-time-gutter"></div>';
  days.forEach(d => {
    const isToday = toDateStr(d) === today;
    const col = document.createElement('div');
    col.className = 'week-header-day' + (isToday ? ' today' : '');
    col.innerHTML = `<div class="week-header-day-name">${DAYS_PT[d.getDay()]}</div>
      <div class="week-header-day-num">${d.getDate()}</div>`;
    col.addEventListener('click', () => {
      state.cursor = new Date(d);
      state.view = 'day';
      render();
    });
    headerRow.appendChild(col);
  });

  // Time grid
  const scroll = document.createElement('div');
  scroll.className = 'week-scroll';

  const grid = document.createElement('div');
  grid.className = 'week-time-grid';

  // Time labels
  const labels = document.createElement('div');
  labels.className = 'week-time-labels';
  for (let h=0; h<24; h++) {
    const lbl = document.createElement('div');
    lbl.className = 'week-time-label';
    lbl.textContent = h === 0 ? '' : String(h).padStart(2,'0') + ':00';
    labels.appendChild(lbl);
  }

  // Columns
  const cols = document.createElement('div');
  cols.className = 'week-columns';

  const HOUR_H = 52;

  days.forEach((d, di) => {
    const dateStr = toDateStr(d);
    const col = document.createElement('div');
    col.className = 'week-col';
    // Hour lines
    for (let h=0; h<24; h++) {
      const line = document.createElement('div');
      line.className = 'week-hour-line';
      line.style.top = (h * HOUR_H) + 'px';
      col.appendChild(line);
    }
    // Click to add event
    col.addEventListener('click', (e) => {
      if (e.target.classList.contains('week-event')) return;
      const rect = col.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const mins = Math.round((y / HOUR_H) * 60 / 15) * 15;
      openModal(null, dateStr, minutesToTime(Math.min(mins, 23*60+45)));
    });
    // Events
    const dayEvts = state.events.filter(e => e.date === dateStr && e.startTime);
    dayEvts.forEach(evt => {
      const startM = timeToMinutes(evt.startTime) || 0;
      const endM   = evt.endTime ? timeToMinutes(evt.endTime) : startM + 60;
      const top    = (startM / 60) * HOUR_H;
      const height = Math.max(((endM - startM) / 60) * HOUR_H, 20);
      const evEl = document.createElement('div');
      evEl.className = 'week-event';
      evEl.style.top    = top + 'px';
      evEl.style.height = height + 'px';
      evEl.style.background = catColor(evt.categoryId);
      evEl.innerHTML = `<div class="week-event-title">${evt.title}</div>
        ${height > 36 ? `<div class="week-event-time">${evt.startTime}${evt.endTime ? '–'+evt.endTime : ''}</div>` : ''}`;
      evEl.addEventListener('click', (e) => { e.stopPropagation(); openModal(evt.id); });
      makeDraggable(evEl, evt, 'week', HOUR_H);
      col.appendChild(evEl);
    });
    // Today line
    if (dateStr === today) {
      const now = new Date();
      const nowMins = now.getHours()*60 + now.getMinutes();
      const line = document.createElement('div');
      line.className = 'week-now-line';
      line.style.top = ((nowMins/60)*HOUR_H) + 'px';
      col.appendChild(line);
    }
    cols.appendChild(col);
  });

  grid.appendChild(labels);
  grid.appendChild(cols);
  scroll.appendChild(grid);

  container.innerHTML = '';
  container.appendChild(headerRow);
  container.appendChild(scroll);

  // Scroll to 8am
  requestAnimationFrame(() => { scroll.scrollTop = 8 * HOUR_H - 20; });
}

// ─── DAY VIEW ───────────────────────────────────────────────────────────────
function renderDay(container) {
  const dateStr = toDateStr(state.cursor);
  const today   = toDateStr(new Date());
  const HOUR_H  = 60;
  const isToday = dateStr === today;

  const header = document.createElement('div');
  header.className = 'day-header';
  const dayName = DAYS_PT[state.cursor.getDay()];
  const dayNum  = state.cursor.getDate();
  const month   = MONTHS_PT[state.cursor.getMonth()];
  header.innerHTML = `<div class="day-header-date">${dayName}, <strong>${dayNum}</strong> ${month} ${state.cursor.getFullYear()}</div>`;

  const grid = document.createElement('div');
  grid.className = 'day-time-grid';

  const labels = document.createElement('div');
  labels.className = 'day-time-labels';
  for (let h=0; h<24; h++) {
    const lbl = document.createElement('div');
    lbl.className = 'day-time-label';
    lbl.textContent = h === 0 ? '' : String(h).padStart(2,'0') + ':00';
    labels.appendChild(lbl);
  }

  const col = document.createElement('div');
  col.className = 'day-col';
  for (let h=0; h<24; h++) {
    const line = document.createElement('div');
    line.className = 'day-hour-line';
    line.style.top = (h * HOUR_H) + 'px';
    col.appendChild(line);
  }
  col.addEventListener('click', (e) => {
    if (e.target.closest('.day-event')) return;
    const rect = col.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const mins = Math.round((y / HOUR_H) * 60 / 15) * 15;
    openModal(null, dateStr, minutesToTime(Math.min(mins, 23*60+45)));
  });

  const dayEvts = state.events.filter(e => e.date === dateStr);
  if (dayEvts.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-day';
    empty.textContent = 'Sem eventos. Toca para adicionar.';
    empty.style.top = (HOUR_H * 9) + 'px';
    empty.style.position = 'absolute';
    col.appendChild(empty);
  }
  dayEvts.forEach(evt => {
    const startM = timeToMinutes(evt.startTime) || 0;
    const endM   = evt.endTime ? timeToMinutes(evt.endTime) : startM + 60;
    const top    = (startM / 60) * HOUR_H;
    const height = Math.max(((endM - startM) / 60) * HOUR_H, 40);
    const el = document.createElement('div');
    el.className = 'day-event';
    el.style.top    = top + 'px';
    el.style.height = height + 'px';
    el.style.background = catColor(evt.categoryId);
    el.innerHTML = `<div class="day-event-title">${evt.title}</div>
      <div class="day-event-time">${evt.startTime || ''}${evt.endTime ? ' – '+evt.endTime : ''}</div>
      ${evt.description ? `<div class="day-event-desc">${evt.description}</div>` : ''}`;
    el.addEventListener('click', () => openModal(evt.id));
    makeDraggable(el, evt, 'day', HOUR_H);
    col.appendChild(el);
  });

  if (isToday) {
    const now = new Date();
    const nowMins = now.getHours()*60 + now.getMinutes();
    const line = document.createElement('div');
    line.className = 'day-now-line';
    line.style.top = ((nowMins/60)*HOUR_H) + 'px';
    col.appendChild(line);
  }

  grid.appendChild(labels);
  grid.appendChild(col);

  container.innerHTML = '';
  container.appendChild(header);
  container.appendChild(grid);

  requestAnimationFrame(() => { container.scrollTop = 8 * HOUR_H - 20; });
}

// ─── MONTH VIEW ─────────────────────────────────────────────────────────────
function renderMonth(container) {
  const year  = state.cursor.getFullYear();
  const month = state.cursor.getMonth();
  const today = toDateStr(new Date());

  const firstDay = new Date(year, month, 1);
  let startDow = firstDay.getDay(); // 0=Dom
  startDow = startDow === 0 ? 6 : startDow - 1; // ajustar para semana Seg–Dom

  const daysInMonth = new Date(year, month+1, 0).getDate();
  const daysInPrev  = new Date(year, month, 0).getDate();
  const totalCells  = Math.ceil((startDow + daysInMonth) / 7) * 7;

  const view = document.createElement('div');
  view.className = 'month-view';

  // Weekday headers
  const wdRow = document.createElement('div');
  wdRow.className = 'month-weekdays';
  ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'].forEach(d => {
    const el = document.createElement('div');
    el.className = 'month-weekday'; el.textContent = d;
    wdRow.appendChild(el);
  });

  const grid = document.createElement('div');
  grid.className = 'month-grid';

  for (let i=0; i<totalCells; i++) {
    let day, dateObj, isOther = false;
    if (i < startDow) {
      day = daysInPrev - startDow + i + 1;
      dateObj = new Date(year, month-1, day);
      isOther = true;
    } else if (i >= startDow + daysInMonth) {
      day = i - startDow - daysInMonth + 1;
      dateObj = new Date(year, month+1, day);
      isOther = true;
    } else {
      day = i - startDow + 1;
      dateObj = new Date(year, month, day);
    }
    const dateStr = toDateStr(dateObj);
    const isToday = dateStr === today;
    const dayEvts = state.events.filter(e => e.date === dateStr);

    const cell = document.createElement('div');
    cell.className = 'month-cell' + (isOther ? ' other-month' : '') + (isToday ? ' today' : '');
    cell.addEventListener('click', () => {
      state.cursor = dateObj;
      state.view = 'day';
      render();
    });

    const numEl = document.createElement('div');
    numEl.className = 'month-day-num'; numEl.textContent = day;
    cell.appendChild(numEl);

    // Show up to 2 event pills, rest as dots
    const maxPills = 2;
    dayEvts.slice(0, maxPills).forEach(evt => {
      const pill = document.createElement('div');
      pill.className = 'month-event-pill';
      pill.style.background = catColor(evt.categoryId);
      pill.textContent = (evt.startTime ? evt.startTime + ' ' : '') + evt.title;
      pill.addEventListener('click', (e) => { e.stopPropagation(); openModal(evt.id); });
      cell.appendChild(pill);
    });
    if (dayEvts.length > maxPills) {
      const more = document.createElement('div');
      more.style.cssText = 'font-size:0.62rem;color:var(--text-muted);text-align:center;';
      more.textContent = '+' + (dayEvts.length - maxPills);
      cell.appendChild(more);
    }

    grid.appendChild(cell);
  }

  view.appendChild(wdRow);
  view.appendChild(grid);
  container.innerHTML = '';
  container.appendChild(view);
}

// ─── SIDEBAR ────────────────────────────────────────────────────────────────
function renderSidebar() {
  // Categories
  const catList = document.getElementById('categoryList');
  catList.innerHTML = '';
  state.categories.forEach(cat => {
    const item = document.createElement('div');
    item.className = 'cat-item';
    item.innerHTML = `<div class="cat-dot" style="background:${cat.color}"></div>
      <span class="cat-name">${cat.name}</span>
      <button class="cat-delete" data-id="${cat.id}" aria-label="Eliminar">✕</button>`;
    item.querySelector('.cat-delete').addEventListener('click', (e) => {
      e.stopPropagation();
      state.categories = state.categories.filter(c => c.id !== cat.id);
      save(); render();
    });
    catList.appendChild(item);
  });
  // Notifications toggle
  document.getElementById('notifToggle').checked = state.notifEnabled;
}

// ─── NAVIGATION ─────────────────────────────────────────────────────────────
function navigate(dir) {
  const c = state.cursor;
  if (state.view === 'week') {
    c.setDate(c.getDate() + dir * 7);
  } else if (state.view === 'day') {
    c.setDate(c.getDate() + dir);
  } else {
    c.setMonth(c.getMonth() + dir);
  }
  render();
}

// ─── MODAL ──────────────────────────────────────────────────────────────────
function openModal(id=null, date=null, time=null) {
  state.editingId = id;
  const evt = id ? state.events.find(e => e.id === id) : null;

  document.getElementById('modalTitle').textContent = id ? 'Editar Evento' : 'Novo Evento';
  document.getElementById('evtTitle').value    = evt?.title || '';
  document.getElementById('evtDate').value     = evt?.date  || date || toDateStr(state.cursor);
  document.getElementById('evtStart').value    = evt?.startTime || time || '';
  document.getElementById('evtEnd').value      = evt?.endTime   || (time ? autoEndTime(time) : '');
  document.getElementById('evtDesc').value     = evt?.description || '';
  document.getElementById('evtReminder').value = evt?.reminder !== undefined ? evt.reminder : '15';
  document.getElementById('deleteEvtBtn').classList.toggle('hidden', !id);

  // Category picker
  state.selectedCatId = evt?.categoryId || null;
  renderCategoryPicker('modalCategoryPicker');

  document.getElementById('modalOverlay').classList.remove('hidden');
  document.getElementById('evtTitle').focus();
}

function autoEndTime(start) {
  const m = timeToMinutes(start);
  if (m === null) return '';
  return minutesToTime(Math.min(m + 60, 23*60+59));
}

function closeModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
  state.editingId = null;
}

function saveEvent() {
  const title = document.getElementById('evtTitle').value.trim();
  if (!title) { toast('Adiciona um título ao evento'); return; }

  const evtData = {
    id:         state.editingId || uid(),
    title,
    date:       document.getElementById('evtDate').value,
    startTime:  document.getElementById('evtStart').value,
    endTime:    document.getElementById('evtEnd').value,
    description:document.getElementById('evtDesc').value.trim(),
    categoryId: state.selectedCatId,
    reminder:   document.getElementById('evtReminder').value,
    created:    new Date().toISOString(),
  };

  if (state.editingId) {
    state.events = state.events.map(e => e.id === state.editingId ? evtData : e);
    toast('Evento atualizado');
  } else {
    state.events.push(evtData);
    toast('Evento criado');
  }
  save(); closeModal(); render();
}

function deleteEvent() {
  if (!state.editingId) return;
  if (!confirm('Eliminar este evento?')) return;
  state.events = state.events.filter(e => e.id !== state.editingId);
  save(); closeModal(); render();
  toast('Evento eliminado');
}

// ─── CATEGORY PICKER ────────────────────────────────────────────────────────
function renderCategoryPicker(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  // "Sem categoria" pill
  const none = document.createElement('button');
  none.className = 'cat-pill' + (state.selectedCatId === null ? ' selected' : '');
  none.style.background = state.selectedCatId === null ? '#9a9590' : '';
  none.innerHTML = '<div class="cat-pill-dot" style="background:#9a9590"></div>Nenhuma';
  none.addEventListener('click', () => { state.selectedCatId = null; renderCategoryPicker(containerId); });
  container.appendChild(none);

  state.categories.forEach(cat => {
    const pill = document.createElement('button');
    const sel = state.selectedCatId === cat.id;
    pill.className = 'cat-pill' + (sel ? ' selected' : '');
    pill.style.background = sel ? cat.color : '';
    pill.innerHTML = `<div class="cat-pill-dot" style="background:${cat.color}"></div>${cat.name}`;
    pill.addEventListener('click', () => {
      state.selectedCatId = cat.id;
      renderCategoryPicker(containerId);
    });
    container.appendChild(pill);
  });
}

// ─── CATEGORY MODAL ─────────────────────────────────────────────────────────
function openCatModal() {
  state.selectedColor = CAT_COLORS[0];
  document.getElementById('catName').value = '';
  renderColorSwatches();
  document.getElementById('catModalOverlay').classList.remove('hidden');
  document.getElementById('catName').focus();
}

function renderColorSwatches() {
  const container = document.getElementById('colorSwatches');
  container.innerHTML = '';
  CAT_COLORS.forEach(color => {
    const sw = document.createElement('div');
    sw.className = 'color-swatch' + (color === state.selectedColor ? ' selected' : '');
    sw.style.background = color;
    sw.addEventListener('click', () => { state.selectedColor = color; renderColorSwatches(); });
    container.appendChild(sw);
  });
}

function saveCategory() {
  const name = document.getElementById('catName').value.trim();
  if (!name) { toast('Dá um nome à categoria'); return; }
  state.categories.push({ id: uid(), name, color: state.selectedColor });
  save(); render();
  document.getElementById('catModalOverlay').classList.add('hidden');
  toast('Categoria criada');
}

// ─── SEARCH ─────────────────────────────────────────────────────────────────
function toggleSearch() {
  state.searchOpen = !state.searchOpen;
  document.getElementById('searchBar').classList.toggle('hidden', !state.searchOpen);
  document.getElementById('mainContent').classList.toggle('search-open', state.searchOpen);
  document.getElementById('viewTabs').classList.toggle('search-open', state.searchOpen);
  if (state.searchOpen) {
    document.getElementById('searchInput').focus();
    document.getElementById('searchResults').innerHTML = '';
  }
}

function doSearch(query) {
  const q = query.toLowerCase().trim();
  const results = document.getElementById('searchResults');
  if (!q) { results.innerHTML = ''; return; }

  const matches = state.events.filter(e =>
    e.title.toLowerCase().includes(q) ||
    (e.description || '').toLowerCase().includes(q)
  ).slice(0, 12);

  if (!matches.length) {
    results.innerHTML = '<div class="search-empty">Sem resultados</div>'; return;
  }

  results.innerHTML = '';
  matches.forEach(evt => {
    const cat = catById(evt.categoryId);
    const d = evt.date ? parseDate(evt.date) : null;
    const dateLabel = d ? DAYS_PT[d.getDay()] + ', ' + d.getDate() + ' ' + MONTHS_SHORT[d.getMonth()] : '';
    const el = document.createElement('div');
    el.className = 'search-result-item';
    el.innerHTML = `<div class="search-dot" style="background:${catColor(evt.categoryId)}"></div>
      <div class="search-info">
        <div class="search-title">${evt.title}</div>
        <div class="search-meta">${dateLabel}${evt.startTime ? ' · '+evt.startTime : ''}${cat ? ' · '+cat.name : ''}</div>
      </div>`;
    el.addEventListener('click', () => {
      if (evt.date) { state.cursor = parseDate(evt.date); state.view = 'day'; render(); }
      toggleSearch();
      openModal(evt.id);
    });
    results.appendChild(el);
  });
}

// ─── NOTIFICAÇÕES ───────────────────────────────────────────────────────────
async function requestNotifPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const p = await Notification.requestPermission();
  return p === 'granted';
}

function scheduleNotifications() {
  if (!state.notifEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();
  state.events.forEach(evt => {
    if (!evt.date || !evt.startTime || !evt.reminder) return;
    const [y,m,d] = evt.date.split('-').map(Number);
    const [h,min] = evt.startTime.split(':').map(Number);
    const evtTime = new Date(y, m-1, d, h, min);
    const notifTime = new Date(evtTime - Number(evt.reminder) * 60000);
    const delta = notifTime - now;
    if (delta > 0 && delta < 24 * 3600000) {
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('📅 ' + evt.title, {
            body: evt.reminder == 0 ? 'A começar agora' : `Em ${evt.reminder} minutos`,
            icon: 'icons/icon-192.png',
          });
        }
      }, delta);
    }
  });
}

// ─── DRAG & DROP ────────────────────────────────────────────────────────────
function makeDraggable(el, evt, viewType, HOUR_H) {
  let startY, startTop, dragging = false, ghost = null;

  const onMove = (clientY) => {
    if (!dragging) {
      if (Math.abs(clientY - startY) > 6) dragging = true;
      else return;
    }
    const dy = clientY - startY;
    if (ghost) ghost.style.top = (startTop + dy) + 'px';
  };

  const onEnd = (clientY) => {
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    if (!dragging) { if (ghost) ghost.remove(); return; }

    const dy = clientY - startY;
    const startMins = timeToMinutes(evt.startTime) || 0;
    const endMins   = evt.endTime ? timeToMinutes(evt.endTime) : startMins + 60;
    const duration  = endMins - startMins;
    const deltaMins = Math.round((dy / HOUR_H) * 60 / 15) * 15;
    const newStart  = Math.max(0, Math.min(startMins + deltaMins, 23*60));
    const newEnd    = newStart + duration;

    state.events = state.events.map(e => e.id === evt.id ? {
      ...e,
      startTime: minutesToTime(newStart),
      endTime:   minutesToTime(Math.min(newEnd, 23*60+59)),
    } : e);
    save(); render();
    if (ghost) ghost.remove();
    toast('Evento movido');
  };

  const onMouseMove = (e) => onMove(e.clientY);
  const onMouseUp   = (e) => onEnd(e.clientY);
  const onTouchMove = (e) => { e.preventDefault(); onMove(e.touches[0].clientY); };
  const onTouchEnd  = (e) => onEnd(e.changedTouches[0].clientY);

  el.addEventListener('mousedown', (e) => {
    startY = e.clientY; startTop = el.offsetTop; dragging = false;
    ghost = el.cloneNode(true);
    ghost.className += ' drag-ghost';
    ghost.style.cssText += `top:${startTop}px;left:${el.offsetLeft}px;width:${el.offsetWidth}px;height:${el.offsetHeight}px;position:absolute;`;
    el.parentNode.appendChild(ghost);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  el.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY; startTop = el.offsetTop; dragging = false;
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
  }, { passive: true });
}

// ─── EXPORT .ICS ────────────────────────────────────────────────────────────
function exportICS() {
  if (!state.events.length) { toast('Sem eventos para exportar'); return; }
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Agenda PWA//PT'];
  state.events.forEach(evt => {
    const [y,m,d] = (evt.date || '2000-01-01').split('-');
    const dtBase = y + m.padStart(2,'0') + d.padStart(2,'0');
    const dtStart = evt.startTime
      ? dtBase + 'T' + evt.startTime.replace(':','') + '00'
      : dtBase;
    const dtEnd = evt.endTime
      ? dtBase + 'T' + evt.endTime.replace(':','') + '00'
      : dtBase;
    lines.push('BEGIN:VEVENT');
    lines.push('UID:' + evt.id + '@agenda-pwa');
    lines.push('SUMMARY:' + evt.title);
    lines.push(evt.startTime ? 'DTSTART:' + dtStart : 'DTSTART;VALUE=DATE:' + dtBase);
    lines.push(evt.endTime   ? 'DTEND:' + dtEnd     : 'DTEND;VALUE=DATE:' + dtBase);
    if (evt.description) lines.push('DESCRIPTION:' + evt.description.replace(/\n/g,'\\n'));
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'agenda.ics';
  a.click();
  toast('Ficheiro .ics exportado');
}

// ─── PWA INSTALL ────────────────────────────────────────────────────────────
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  document.getElementById('installSection').classList.remove('hidden');
});
document.getElementById('installBtn').addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') toast('App instalada!');
  deferredInstallPrompt = null;
  document.getElementById('installSection').classList.add('hidden');
});

// ─── SERVICE WORKER ─────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(e => console.warn('SW:', e));
}

// ─── EVENT LISTENERS ────────────────────────────────────────────────────────
document.getElementById('prevBtn').addEventListener('click', () => navigate(-1));
document.getElementById('nextBtn').addEventListener('click', () => navigate(1));
document.getElementById('todayBtn').addEventListener('click', () => { state.cursor = new Date(); render(); });

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => { state.view = btn.dataset.view; render(); });
});

document.getElementById('menuToggle').addEventListener('click', () => {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebarOverlay');
  sb.classList.remove('hidden');
  ov.classList.remove('hidden');
  requestAnimationFrame(() => sb.classList.add('open'));
});
document.getElementById('sidebarClose').addEventListener('click', closeSidebar);
document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
function closeSidebar() {
  const sb = document.getElementById('sidebar');
  sb.classList.remove('open');
  setTimeout(() => {
    sb.classList.add('hidden');
    document.getElementById('sidebarOverlay').classList.add('hidden');
  }, 280);
}

document.getElementById('fabBtn').addEventListener('click', () => openModal());

document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
});
document.getElementById('saveEvtBtn').addEventListener('click', saveEvent);
document.getElementById('deleteEvtBtn').addEventListener('click', deleteEvent);

document.getElementById('catModalClose').addEventListener('click', () => {
  document.getElementById('catModalOverlay').classList.add('hidden');
});
document.getElementById('catModalOverlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('catModalOverlay'))
    document.getElementById('catModalOverlay').classList.add('hidden');
});
document.getElementById('saveCatBtn').addEventListener('click', saveCategory);
document.getElementById('addCategoryBtn').addEventListener('click', openCatModal);

document.getElementById('searchToggle').addEventListener('click', toggleSearch);
document.getElementById('searchInput').addEventListener('input', (e) => doSearch(e.target.value));
document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Escape') toggleSearch();
});

document.getElementById('exportBtn').addEventListener('click', exportICS);

document.getElementById('notifToggle').addEventListener('change', async (e) => {
  if (e.target.checked) {
    const ok = await requestNotifPermission();
    if (!ok) {
      e.target.checked = false;
      toast('Permite notificações nas definições do browser');
      return;
    }
    state.notifEnabled = true;
    toast('Lembretes ativados');
  } else {
    state.notifEnabled = false;
    toast('Lembretes desativados');
  }
  save(); scheduleNotifications();
});

// Swipe gesture para navegar
let touchStartX = 0;
document.getElementById('mainContent').addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });
document.getElementById('mainContent').addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 60) navigate(dx < 0 ? 1 : -1);
}, { passive: true });

// ─── INIT ────────────────────────────────────────────────────────────────────
load();
render();

// Atualizar linha "agora" a cada minuto
setInterval(() => {
  if (state.view === 'week' || state.view === 'day') render();
}, 60000);
