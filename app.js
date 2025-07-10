const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let tasks = [];

app.get('/tasks', (req, res) => {
  res.json(tasks);
});

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

app.delete('/tasks/:id', (req, res) => {
  tasks = tasks.filter(task => task.id !== parseInt(req.params.id));
  res.sendStatus(204);
});

app.get('/tasks/search', (req, res) => {
  const { date } = req.query;
  if (!date) return res.status(400).json({ error: '日付が必要です' });
  
  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.dueDate).toISOString().split('T')[0];
    return taskDate === date;
  });
  
  res.json(filteredTasks);
});

app.listen(port, () => {
  console.log(`サーバー起動: http://localhost:${port}`);
});