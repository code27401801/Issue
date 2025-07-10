const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const dueDate = document.getElementById('due-date');
const taskList = document.getElementById('task-list');
const searchForm = document.getElementById('search-form');
const searchDate = document.getElementById('search-date');
const searchResults = document.getElementById('search-results');

// タスク読み込み
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
          <span class="due-date">期限: ${task.dueDate}</span>
          <button class="delete-btn" data-id="${task.id}">削除</button>
        `;
        taskList.appendChild(li);
      });
    });
}

// タスク追加
taskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  fetch('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      text: taskInput.value,
      dueDate: dueDate.value
    })
  })
  .then(() => {
    taskInput.value = '';
    dueDate.value = '';
    loadTasks();
  });
});

// タスク削除
taskList.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    fetch(`/tasks/${id}`, { method: 'DELETE' })
      .then(() => loadTasks());
  }
});

// 日付検索
searchForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const dateInput = searchDate.value;
  
  if (!dateInput) return;
  
  const response = await fetch(`/tasks/search?date=${dateInput}`);
  const tasks = await response.json();
  
  searchResults.innerHTML = '';
  
  if (tasks.length === 0) {
    const message = document.createElement('p');
    message.textContent = '該当するタスクはありません';
    message.className = 'no-tasks-message';
    searchResults.appendChild(message);
  } else {
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${task.text}</span>
        <span class="due-date">期限: ${task.dueDate}</span>
      `;
      searchResults.appendChild(li);
    });
  }
});

// 初期化
loadTasks();