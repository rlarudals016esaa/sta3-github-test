const STORAGE_KEY = "class-todo-items";
const DEFAULT_PRIORITY = "medium";
const PRIORITY_LABELS = {
  high: "높음",
  medium: "보통",
  low: "낮음",
};

const form = document.querySelector("#todo-form");
const input = document.querySelector("#todo-input");
const priorityInput = document.querySelector("#todo-priority");
const list = document.querySelector("#todo-list");
const remainingCount = document.querySelector("#remaining-count");
const emptyState = document.querySelector("#empty-state");

let todos = loadTodos();

function loadTodos() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) {
      return saved.map((todo) => ({
        ...todo,
        priority: normalizePriority(todo.priority),
      }));
    }
  } catch (_) {}

  return [
    { id: crypto.randomUUID(), title: "강의 자료 만들기", completed: false, priority: DEFAULT_PRIORITY },
    { id: crypto.randomUUID(), title: "이메일 답장하기", completed: true, priority: DEFAULT_PRIORITY },
    { id: crypto.randomUUID(), title: "운동하기", completed: false, priority: DEFAULT_PRIORITY },
  ];
}

function normalizePriority(priority) {
  return Object.hasOwn(PRIORITY_LABELS, priority) ? priority : DEFAULT_PRIORITY;
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function render() {
  list.innerHTML = "";

  todos.forEach((todo) => {
    const item = document.createElement("li");
    item.className = `todo-item${todo.completed ? " completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", `${todo.title} 완료 여부`);
    checkbox.addEventListener("change", () => toggleTodo(todo.id));

    const title = document.createElement("span");
    title.className = "title";
    title.textContent = todo.title;

    const prioritySelect = document.createElement("select");
    prioritySelect.className = `priority-select priority-${todo.priority}`;
    prioritySelect.setAttribute("aria-label", `${todo.title} 우선순위`);

    Object.entries(PRIORITY_LABELS).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      prioritySelect.appendChild(option);
    });

    prioritySelect.value = todo.priority;
    prioritySelect.addEventListener("change", () =>
      updateTodoPriority(todo.id, prioritySelect.value)
    );

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button";
    deleteButton.textContent = "삭제";
    deleteButton.addEventListener("click", () => deleteTodo(todo.id));

    item.append(checkbox, title, prioritySelect, deleteButton);
    list.appendChild(item);
  });

  const remaining = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `${remaining}개의 할 일 남음`;
  emptyState.hidden = todos.length > 0;
}

function addTodo(title, priority = DEFAULT_PRIORITY) {
  todos.unshift({
    id: crypto.randomUUID(),
    title,
    completed: false,
    priority: normalizePriority(priority),
  });
  saveTodos();
  render();
}

function updateTodoPriority(id, priority) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, priority: normalizePriority(priority) } : todo
  );
  saveTodos();
  render();
}

function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  saveTodos();
  render();
}

function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) return;

  addTodo(title, priorityInput.value);
  input.value = "";
  priorityInput.value = DEFAULT_PRIORITY;
  input.focus();
});

render();
