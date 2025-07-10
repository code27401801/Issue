const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let tasks = [];

// タスク一覧取得
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// タスク追加
app.post('/tasks', (req, res) => {
  const newTask = {
    id: Date.now(),
    text: req.body.text,
    dueDate: req.body.dueDate,
    done: false
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// タスク削除
app.delete('/tasks/:id', (req, res) => {
  tasks = tasks.filter(task => task.id !== parseInt(req.params.id));
  res.sendStatus(204);
});

// 日付検索
app.get('/tasks/search', (req, res) => {
  const { date } = req.query;
  
  if (!date) {
    return res.status(400).json({ error: '日付パラメータが必要です' });
  }

  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
    return taskDate === date;
  });

  res.json(filteredTasks);
});

app.listen(port, () => {
  console.log(`ToDoアプリ起動: http://localhost:${port}`);
});