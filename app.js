const express = require('express');
const app = express();
const port = 3000;

// ミドルウェア設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// タスクをメモリで管理（初期タスクなし）
let tasks = [];

// タスク一覧取得
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// タスク追加（期限日付を追加）
app.post('/tasks', (req, res) => {
  const newTask = {
    id: Date.now(), // ユニークなIDを生成
    text: req.body.text,
    dueDate: req.body.dueDate, // 期限日付
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

// ルートURLへのアクセス
app.get('/', (req, res) => {
  res.send('ToDoアプリへようこそ！');
});

app.listen(port, () => {
  console.log(`ToDoアプリ起動: http://localhost:${port}`);
});