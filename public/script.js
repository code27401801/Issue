// DOM要素
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const dueDate = document.getElementById('due-date');
const taskLists = {
  overdue: document.getElementById('overdue-tasks'),
  urgent: document.getElementById('urgent-tasks'),
  upcoming: document.getElementById('upcoming-tasks'),
  later: document.getElementById('later-tasks')
};

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

  // イベントリスナー設定
  container.querySelectorAll('.do-btn').forEach(btn => {
    btn.addEventListener('click', toggleTaskDone);
  });

  container.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', deleteTask);
  });
}

// タスク要素作成
function createTaskElement(task, isDone) {
  const li = document.createElement('li');
  li.className = `task-item ${isDone ? 'done' : ''}`;
  
  li.innerHTML = `
    <div class="task-content">
      <button class="do-btn" data-id="${task.id}">
        ${isDone ? '✓' : 'Do'} <!-- 未完了時は空、完了時は✓ -->
      </button>
      <span class="task-text">${task.text}</span>
      <button class="delete-btn" data-id="${task.id}">削除</button>
      <span class="due-date">${formatDate(task.dueDate)}</span>
    </div>
    <span class="auto-delete" style="display: ${isDone ? 'block' : 'none'}">24時間後に削除</span>
  `;
  
  return li;
}

// タスク状態切り替え
async function toggleTaskDone(e) {
  const id = parseInt(e.target.dataset.id);
  const isDone = e.target.textContent.trim() === '✓';
  
  try {
    const response = await fetch(`/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !isDone })
    });
    
    if (!response.ok) throw new Error('更新失敗');
    loadTasks();
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
    loadTasks();
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

// 初期化
loadTasks();