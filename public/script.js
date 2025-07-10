// DOM要素
const toggleModeBtn = document.getElementById('toggle-mode');
const searchForm = document.getElementById('search-form');
const taskForm = document.getElementById('task-form');
const cancelSearchBtn = document.getElementById('cancel-search');
const taskInput = document.getElementById('task-input');
const dueDate = document.getElementById('due-date');
const searchInput = document.getElementById('search-input');
const searchDate = document.getElementById('search-date');

const taskLists = {
  overdue: document.getElementById('overdue-tasks'),
  urgent: document.getElementById('urgent-tasks'),
  upcoming: document.getElementById('upcoming-tasks'),
  later: document.getElementById('later-tasks')
};

let isSearchMode = false;

// モード切り替え
toggleModeBtn.addEventListener('click', () => {
  isSearchMode = !isSearchMode;
  
  if (isSearchMode) {
    searchForm.style.display = 'flex';
    taskForm.style.display = 'none';
    toggleModeBtn.textContent = '追加モード';
    toggleModeBtn.style.backgroundColor = '#27ae60';
  } else {
    searchForm.style.display = 'none';
    taskForm.style.display = 'flex';
    toggleModeBtn.textContent = '検索モード';
    toggleModeBtn.style.backgroundColor = '#3498db';
    loadTasks();
  }
});

// 検索実行
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = searchInput.value.trim();
  const date = searchDate.value;
  
  try {
    let url = '/tasks/search?';
    if (text) url += `text=${encodeURIComponent(text)}`;
    if (date) url += `${text ? '&' : ''}date=${date}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('検索失敗');
    
    const tasks = await response.json();
    renderSearchResults(tasks);
  } catch (err) {
    console.error('検索エラー:', err);
    alert('検索中にエラーが発生しました');
  }
});

// 検索キャンセル
cancelSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchDate.value = '';
  loadTasks();
});

// 検索結果表示
function renderSearchResults(tasks) {
  // 全カラムをクリア
  Object.values(taskLists).forEach(list => {
    list.innerHTML = '';
  });
  
  if (tasks.length === 0) {
    taskLists.overdue.innerHTML = '<p class="no-tasks">該当するタスクがありません</p>';
    return;
  }
  
  // タスクを分類して表示
  tasks.forEach(task => {
    const category = categorizeTask(task);
    taskLists[category].appendChild(createTaskElement(task, task.done));
  });
}

// タスク分類
function categorizeTask(task) {
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
  
  if (dueDate < now) return 'overdue';
  if (diffDays <= 3) return 'urgent';
  if (diffDays <= 10) return 'upcoming';
  return 'later';
}

// タスク要素作成
function createTaskElement(task, isDone) {
  const li = document.createElement('li');
  li.className = `task-item ${isDone ? 'done' : ''}`;
  
  li.innerHTML = `
    <div class="task-content">
      <button class="do-btn" data-id="${task.id}">
        ${isDone ? '✓' : 'Do'}
      </button>
      <span class="task-text">${task.text}</span>
      <button class="delete-btn" data-id="${task.id}">削除</button>
      <span class="due-date">${formatDate(task.dueDate)}</span>
    </div>
    ${isDone ? '<span class="auto-delete">24時間後に削除</span>' : ''}
  `;
  
  // イベントリスナー追加
  li.querySelector('.do-btn').addEventListener('click', toggleTaskDone);
  li.querySelector('.delete-btn').addEventListener('click', deleteTask);
  
  return li;
}

// タスク状態切り替え
async function toggleTaskDone(e) {
  const id = parseInt(e.target.dataset.id);
  const isDone = e.target.textContent.includes('✓');
  
  try {
    const response = await fetch(`/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !isDone })
    });
    
    if (!response.ok) throw new Error('更新失敗');
    if (isSearchMode) {
      // 検索モード中は現在の検索条件で再検索
      searchForm.dispatchEvent(new Event('submit'));
    } else {
      loadTasks();
    }
  } catch (err) {
    console.error('エラー:', err);
  }
}

// タスク削除
async function deleteTask(e) {
  const id = parseInt(e.target.dataset.id);
  try {
    const response = await fetch(`/tasks/${id}`, { 
      method: 'DELETE' 
    });
    
    if (!response.ok) throw new Error('削除失敗');
    if (isSearchMode) {
      searchForm.dispatchEvent(new Event('submit'));
    } else {
      loadTasks();
    }
  } catch (err) {
    console.error('削除エラー:', err);
  }
}

// 日付フォーマット
function formatDate(dateString) {
  if (!dateString) return '期限未設定';
  const date = new Date(dateString);
  return `期限: ${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`;
}

// タスク追加
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
    console.error('エラー:', err);
  }
});

// タスク読み込み
async function loadTasks() {
  try {
    const response = await fetch('/tasks');
    if (!response.ok) throw new Error('データ取得失敗');
    
    const { overdue, urgent, upcoming, later } = await response.json();
    
    renderTaskList('overdue', overdue);
    renderTaskList('urgent', urgent);
    renderTaskList('upcoming', upcoming);
    renderTaskList('later', later);
  } catch (err) {
    console.error('エラー:', err);
    Object.values(taskLists).forEach(list => {
      list.innerHTML = '<p class="error-message">データの読み込みに失敗しました</p>';
    });
  }
}

// タスク表示
function renderTaskList(category, tasks) {
  const container = taskLists[category];
  container.innerHTML = '';
  
  if (tasks.length === 0) {
    container.innerHTML = '<p class="no-tasks">タスクがありません</p>';
    return;
  }

  const undoneTasks = tasks.filter(task => !task.done);
  const doneTasks = tasks.filter(task => task.done);

  // 未完了タスクを期限順に表示
  undoneTasks
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .forEach(task => {
      container.appendChild(createTaskElement(task, false));
    });

  // 完了タスクを表示
  doneTasks.forEach(task => {
    container.appendChild(createTaskElement(task, true));
  });
}

// 初期化
loadTasks();