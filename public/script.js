// DOM要素
const toggleViewBtn = document.getElementById('toggle-view');
const inputView = document.getElementById('input-view');
const searchView = document.getElementById('search-view');
const modeTitle = document.getElementById('mode-title');
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const dueDate = document.getElementById('due-date');
const taskList = document.getElementById('task-list');
const searchForm = document.getElementById('search-form');
const searchDate = document.getElementById('search-date');
const searchResults = document.getElementById('search-results');

// 画面切り替え
function switchToInputView() {
  inputView.classList.add('active');
  searchView.classList.remove('active');
  toggleViewBtn.textContent = '検索';
  modeTitle.textContent = 'タスク追加';
  localStorage.setItem('lastView', 'input');
}

function switchToSearchView() {
  searchView.classList.add('active');
  inputView.classList.remove('active');
  toggleViewBtn.textContent = '入力';
  modeTitle.textContent = 'タスク検索';
  localStorage.setItem('lastView', 'search');
}

// 初期状態復元
const lastView = localStorage.getItem('lastView') || 'input';
if (lastView === 'search') {
  switchToSearchView();
} else {
  switchToInputView();
}

toggleViewBtn.addEventListener('click', () => {
  if (inputView.classList.contains('active')) {
    switchToSearchView();
  } else {
    switchToInputView();
  }
});

// タスク機能
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const taskText = taskInput.value.trim();
  const dueDateValue = dueDate.value;
  
  if (!taskText || !dueDateValue) {
    alert('タスクと日付を入力してください');
    return;
  }

  try {
    const response = await fetch('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: taskText,
        dueDate: dueDateValue
      })
    });
    
    if (!response.ok) throw new Error('追加に失敗');
    
    taskInput.value = '';
    dueDate.value = '';
    loadTasks();
  } catch (err) {
    alert('エラー: ' + err.message);
  }
});

// タスク読み込み
async function loadTasks() {
  try {
    const response = await fetch('/tasks');
    if (!response.ok) throw new Error('データ取得失敗');
    
    const tasks = await response.json();
    renderTaskList(taskList, tasks);
  } catch (err) {
    console.error('エラー:', err);
    taskList.innerHTML = '<p class="error-message">データの読み込みに失敗しました</p>';
  }
}

// タスク表示
function renderTaskList(container, tasks) {
  container.innerHTML = '';
  
  if (tasks.length === 0) {
    container.innerHTML = '<p class="no-tasks">タスクがありません</p>';
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item ${task.done ? 'done' : ''} ${isOverdue(task.dueDate) ? 'overdue' : ''}`;
    
    li.innerHTML = `
      <div class="task-content">
        <button class="do-btn" data-id="${task.id}">
          ${task.done ? '✓' : 'Do'}
        </button>
        <span class="task-text">${task.text}</span>
        <span class="due-date">${formatDate(task.dueDate)}</span>
      </div>
      ${task.done ? '<span class="auto-delete">24時間後に削除</span>' : ''}
      <button class="delete-btn" data-id="${task.id}">削除</button>
    `;
    container.appendChild(li);
  });

  // イベントリスナー設定
  document.querySelectorAll('.do-btn').forEach(btn => {
    btn.addEventListener('click', toggleTaskDone);
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', deleteTask);
  });
}

// タスク状態切り替え
async function toggleTaskDone(e) {
  const id = parseInt(e.target.dataset.id);
  
  try {
    const response = await fetch(`/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: e.target.textContent.trim() !== '✓' })
    });
    
    if (!response.ok) throw new Error('更新失敗');
    loadTasks();
  } catch (err) {
    alert('エラー: ' + err.message);
  }
}

// タスク削除
async function deleteTask(e) {
  if (!confirm('本当に削除しますか？')) return;
  
  const id = parseInt(e.target.dataset.id);
  try {
    const response = await fetch(`/tasks/${id}`, { 
      method: 'DELETE' 
    });
    
    if (!response.ok) throw new Error('削除失敗');
    loadTasks();
  } catch (err) {
    alert('削除エラー: ' + err.message);
  }
}

// 検索機能
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dateInput = searchDate.value;
  
  if (!dateInput) {
    alert('日付を選択してください');
    return;
  }

  try {
    const response = await fetch(`/tasks/search?date=${dateInput}`);
    if (!response.ok) throw new Error('検索失敗');
    
    const tasks = await response.json();
    renderTaskList(searchResults, tasks);
  } catch (err) {
    alert('検索エラー: ' + err.message);
    searchResults.innerHTML = `<p class="error-message">${err.message}</p>`;
  }
});

// ヘルパー関数
function formatDate(dateString) {
  if (!dateString) return '期限未設定';
  const date = new Date(dateString);
  return `期限: ${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`;
}

function isOverdue(dateString) {
  return new Date(dateString) < new Date();
}

// 初期化
loadTasks();