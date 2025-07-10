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

// 初期状態の復元
const lastView = localStorage.getItem('lastView') || 'input';
if (lastView === 'search') {
  switchToSearchView();
} else {
  switchToInputView();
}

// 画面切り替え
toggleViewBtn.addEventListener('click', () => {
  if (inputView.classList.contains('active')) {
    switchToSearchView();
  } else {
    switchToInputView();
  }
});

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

// タスク機能
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const taskText = taskInput.value.trim();
  const dueDateValue = dueDate.value;
  
  if (taskText && dueDateValue) {
    fetch('/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: taskText,
        dueDate: dueDateValue
      })
    })
    .then(() => {
      taskInput.value = '';
      dueDate.value = '';
      loadTasks();
    });
  }
});

function loadTasks() {
  fetch('/tasks')
    .then(res => res.json())
    .then(tasks => {
      taskList.innerHTML = '';
      tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
          <span>${task.text}</span>
          <div>
            <span class="due-date">${formatDate(task.dueDate)}</span>
            <button class="delete-btn" data-id="${task.id}">削除</button>
          </div>
        `;
        taskList.appendChild(li);
      });
    });
}

taskList.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    fetch(`/tasks/${id}`, { method: 'DELETE' })
      .then(() => loadTasks());
  }
});

// 検索機能
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dateInput = searchDate.value;
  
  if (!dateInput) return;
  
  const response = await fetch(`/tasks/search?date=${dateInput}`);
  const tasks = await response.json();
  
  searchResults.innerHTML = '';
  
  if (tasks.length === 0) {
    const message = document.createElement('li');
    message.textContent = '該当するタスクはありません';
    message.className = 'no-tasks-message';
    searchResults.appendChild(message);
  } else {
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'task-item';
      li.innerHTML = `
        <span>${task.text}</span>
        <span class="due-date">${formatDate(task.dueDate)}</span>
      `;
      searchResults.appendChild(li);
    });
  }
});

// ヘルパー関数
function formatDate(dateString) {
  if (!dateString) return '期限未設定';
  const date = new Date(dateString);
  return `期限: ${date.getFullYear()}/${date.getMonth()+1}/${date.getDate()}`;
}

// 初期化
loadTasks();