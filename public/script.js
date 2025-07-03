const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const dueDate = document.getElementById('due-date');
const taskList = document.getElementById('task-list');

// タスクを読み込む
function loadTasks() {
  fetch('/tasks')
    .then(res => res.json())
    .then(tasks => {
      taskList.innerHTML = '';
      tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = 'task-item';
        
        // 期限が近い場合は警告スタイルを適用
        if (isDueSoon(task.dueDate)) {
          li.classList.add('urgent');
        }

        li.innerHTML = `
          <span>${task.text}</span>
          <span class="due-date ${isOverdue(task.dueDate) ? 'overdue' : ''}">
            ${formatDueDate(task.dueDate)}
          </span>
          <button class="delete-btn" data-id="${task.id}">削除</button>
        `;
        taskList.appendChild(li);
      });
    });
}

// 日付をフォーマット
function formatDueDate(dateString) {
  if (!dateString) return '期限なし';
  const date = new Date(dateString);
  return `期限: ${date.toLocaleDateString()}`;
}

// 期限が過ぎているかチェック
function isOverdue(dateString) {
  if (!dateString) return false;
  return new Date(dateString) < new Date();
}

// 期限が3日以内かチェック
function isDueSoon(dateString) {
  if (!dateString) return false;
  const dueDate = new Date(dateString);
  const today = new Date();
  const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
  return diffDays <= 3 && diffDays >= 0;
}

// タスクを追加
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

// タスクを削除
taskList.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    fetch(`/tasks/${id}`, { method: 'DELETE' })
      .then(() => loadTasks());
  }
});

// 初期読み込み
loadTasks();