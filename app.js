const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// ミドルウェア
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// タスクデータ
let tasks = [];
let nextId = 1;

// タスク分類関数
function categorizeTask(task) {
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const diffDays = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
  
  if (dueDate < now) return 'overdue';
  if (diffDays <= 3) return 'urgent';
  if (diffDays <= 10) return 'upcoming';
  return 'later';
}

// タスク一覧取得（分類済み）
app.get('/tasks', (req, res) => {
  const categorized = {
    overdue: [],
    urgent: [],
    upcoming: [],
    later: []
  };

  tasks.forEach(task => {
    const category = categorizeTask(task);
    categorized[category].push(task);
  });

  // 各カテゴリ内で期限日順にソート
  Object.values(categorized).forEach(category => {
    category.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  });

  res.json(categorized);
});

// タスク検索
app.get('/tasks/search', (req, res) => {
  const { text, date } = req.query;
  let results = [...tasks];
  
  if (text) {
    results = results.filter(task => 
      task.text.toLowerCase().includes(text.toLowerCase())
    );
  }
  
  if (date) {
    results = results.filter(task => 
      task.dueDate === date
    );
  }
  
  res.json(results);
});

// タスク追加
app.post('/tasks', (req, res) => {
  const newTask = {
    id: nextId++,
    text: req.body.text,
    dueDate: req.body.dueDate,
    done: false,
    createdAt: new Date().toISOString()
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// タスク状態更新
app.patch('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = tasks.find(t => t.id === taskId);
  
  if (task) {
    task.done = req.body.done;
    res.json(task);
  } else {
    res.status(404).send('タスクが見つかりません');
  }
});

// タスク削除
app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  tasks = tasks.filter(task => task.id !== taskId);
  res.sendStatus(204);
});

// 自動削除処理（24時間経過した完了タスク）
setInterval(() => {
  const now = new Date();
  tasks = tasks.filter(task => {
    if (!task.done) return true;
    const doneTime = new Date(task.createdAt);
    return now - doneTime < 24 * 60 * 60 * 1000;
  });
}, 60 * 60 * 1000);

// サーバー起動
app.listen(port, () => {
  console.log(`サーバー起動: http://localhost:${port}`);
});