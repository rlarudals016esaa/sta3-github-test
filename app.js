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
const startTimeInput = document.querySelector("#todo-start-time");
const searchInput = document.querySelector("#search-input");
const list = document.querySelector("#todo-list");
const remainingCount = document.querySelector("#remaining-count");
const emptyState = document.querySelector("#empty-state");
const filterButtons = document.querySelectorAll(".status-filter");

let todos = loadTodos();
let currentFilter = "all";

function loadTodos() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved)) {
      const normalizedTodos = saved.map((todo) => ({
        ...todo,
        priority: normalizePriority(todo.priority),
        startTime: normalizeStartTime(todo.startTime),
      }));
      const sortedTodos = sortTodosByStartTime(normalizedTodos);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedTodos));
      return sortedTodos;
    }
  } catch (_) {}

  return [
    { id: crypto.randomUUID(), title: "강의 자료 만들기", completed: false, priority: DEFAULT_PRIORITY, startTime: "" },
    { id: crypto.randomUUID(), title: "이메일 답장하기", completed: true, priority: DEFAULT_PRIORITY, startTime: "" },
    { id: crypto.randomUUID(), title: "운동하기", completed: false, priority: DEFAULT_PRIORITY, startTime: "" },
  ];
}

function normalizePriority(priority) {
  return Object.hasOwn(PRIORITY_LABELS, priority) ? priority : DEFAULT_PRIORITY;
}

function normalizeStartTime(startTime) {
  const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  return typeof startTime === "string" && timePattern.test(startTime)
    ? startTime
    : "";
}

function sortTodosByStartTime(items) {
  return items
    .map((todo, index) => ({ todo, index }))
    .sort((first, second) => {
      const firstTime = first.todo.startTime;
      const secondTime = second.todo.startTime;

      if (!firstTime && !secondTime) return first.index - second.index;
      if (!firstTime) return 1;
      if (!secondTime) return -1;
      if (firstTime === secondTime) return first.index - second.index;

      return firstTime < secondTime ? -1 : 1;
    })
    .map(({ todo }) => todo);
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function render() {
  list.innerHTML = "";

  const query = searchInput.value.toLocaleLowerCase();
  const visibleTodos = todos.filter((todo) => {
    const matchesStatus =
      currentFilter === "active"
        ? !todo.completed
        : currentFilter === "completed"
          ? todo.completed
          : true;

    return matchesStatus && todo.title.toLocaleLowerCase().includes(query);
  });

  visibleTodos.forEach((todo) => {
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

    const startTime = document.createElement("input");
    startTime.type = "time";
    startTime.className = "start-time-input";
    startTime.value = todo.startTime;
    startTime.setAttribute("aria-label", `${todo.title} 시작시간`);
    startTime.addEventListener("change", () =>
      updateTodoStartTime(todo.id, startTime.value)
    );

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

    item.append(checkbox, title, startTime, prioritySelect, deleteButton);
    list.appendChild(item);
  });

  const remaining = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `${remaining}개의 할 일 남음`;
  emptyState.hidden = visibleTodos.length > 0;

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function addTodo(title, priority = DEFAULT_PRIORITY, startTime = "") {
  todos.unshift({
    id: crypto.randomUUID(),
    title,
    completed: false,
    priority: normalizePriority(priority),
    startTime: normalizeStartTime(startTime),
  });
  todos = sortTodosByStartTime(todos);
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

function updateTodoStartTime(id, startTime) {
  todos = todos.map((todo) =>
    todo.id === id
      ? { ...todo, startTime: normalizeStartTime(startTime) }
      : todo
  );
  todos = sortTodosByStartTime(todos);
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

  addTodo(title, priorityInput.value, startTimeInput.value);
  input.value = "";
  priorityInput.value = DEFAULT_PRIORITY;
  startTimeInput.value = "";
  input.focus();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    render();
  });
});

searchInput.addEventListener("input", render);

render();
