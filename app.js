const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let tasks = [];

// タスク一覧取得（ソート済み）
app.get('/tasks', (req, res) => {
  const now = new Date();
  const sortedTasks = [...tasks].sort((a, b) => {
    const aDue = new Date(a.dueDate);
    const bDue = new Date(b.dueDate);
    
    if (a.done && !b.done) return 1;
    if (!a.done && b.done) return -1;
    
    if (aDue < now && bDue >= now) return -1;
    if (aDue >= now && bDue < now) return 1;
    
    return aDue - bDue;
  });
  res.json(sortedTasks);
});

// タスク追加
app.post('/tasks', (req, res) => {
  const newTask = {
    id: Date.now(),
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
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (task) {
    task.done = req.body.done;
    res.json(task);
  } else {
    res.sendStatus(404);
  }
});

// タスク削除（修正版）
app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const initialLength = tasks.length;
  tasks = tasks.filter(task => task.id !== taskId);
  
  if (tasks.length === initialLength) {
    return res.status(404).json({ error: 'タスクが見つかりません' });
  }
  res.sendStatus(204);
});

// 検索機能（修正版）
app.get('/tasks/search', (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: '検索日付が必要です' });
  }

  try {
    const searchDate = new Date(date).toISOString().split('T')[0];
    const filteredTasks = tasks.filter(task => {
      const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
      return taskDate === searchDate;
    });
    
    res.json(filteredTasks.sort((a, b) => 
      new Date(a.dueDate) - new Date(b.dueDate)
    ));
  } catch (err) {
    res.status(400).json({ error: '無効な日付形式' });
  }
});

// 自動削除処理
setInterval(() => {
  const now = new Date();
  tasks = tasks.filter(task => {
    if (!task.done) return true;
    const doneTime = new Date(task.createdAt);
    return now - doneTime < 24 * 60 * 60 * 1000;
  });
}, 60 * 60 * 1000);

app.listen(port, () => {
  console.log(`サーバー起動: http://localhost:${port}`);
});