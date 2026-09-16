const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

class FakeElement {
  constructor() {
    this.attributes = {};
    this.children = [];
    this.className = "";
    this.dataset = {};
    this.hidden = false;
    this.listeners = {};
    this.textContent = "";
    this.value = "";
    this.checked = false;
    this.classList = {
      toggle: (name, enabled) => {
        const names = new Set(this.className.split(" ").filter(Boolean));
        enabled ? names.add(name) : names.delete(name);
        this.className = [...names].join(" ");
      },
    };
  }

  set innerHTML(value) {
    if (value === "") this.children = [];
  }

  addEventListener(type, listener) {
    this.listeners[type] = listener;
  }

  append(...children) {
    this.children.push(...children);
  }

  appendChild(child) {
    this.children.push(child);
  }

  dispatch(type, event = {}) {
    this.listeners[type](event);
  }

  focus() {}

  setAttribute(name, value) {
    this.attributes[name] = value;
  }
}

const form = new FakeElement();
const input = new FakeElement();
const list = new FakeElement();
const remainingCount = new FakeElement();
const emptyState = new FakeElement();
const filterButtons = ["all", "active", "completed"].map((filter) => {
  const button = new FakeElement();
  button.dataset.filter = filter;
  return button;
});
const elements = {
  "#todo-form": form,
  "#todo-input": input,
  "#todo-list": list,
  "#remaining-count": remainingCount,
  "#empty-state": emptyState,
};
let storedTodos = JSON.stringify([
  { id: "active", title: "진행 중 항목", completed: false },
  { id: "completed", title: "완료 항목", completed: true },
]);

const context = {
  console,
  crypto: { randomUUID: () => "new" },
  document: {
    createElement: () => new FakeElement(),
    querySelector: (selector) => elements[selector],
    querySelectorAll: () => filterButtons,
  },
  localStorage: {
    getItem: () => storedTodos,
    setItem: (_, value) => {
      storedTodos = value;
    },
  },
};

const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
vm.runInNewContext(source, context);

const visibleTitles = () => list.children.map((item) => item.children[1].textContent);

assert.deepEqual(visibleTitles(), ["진행 중 항목", "완료 항목"]);
assert.equal(filterButtons[0].attributes["aria-pressed"], "true");

filterButtons[1].dispatch("click");
assert.deepEqual(visibleTitles(), ["진행 중 항목"]);

filterButtons[2].dispatch("click");
assert.deepEqual(visibleTitles(), ["완료 항목"]);

input.value = "새 항목";
form.dispatch("submit", { preventDefault() {} });
assert.deepEqual(visibleTitles(), ["완료 항목"]);
assert.equal(JSON.parse(storedTodos).length, 3);

filterButtons[1].dispatch("click");
assert.deepEqual(visibleTitles(), ["새 항목", "진행 중 항목"]);
list.children[0].children[0].dispatch("change");
assert.deepEqual(visibleTitles(), ["진행 중 항목"]);

filterButtons[2].dispatch("click");
assert.deepEqual(visibleTitles(), ["새 항목", "완료 항목"]);
list.children[0].children[2].dispatch("click");
assert.deepEqual(visibleTitles(), ["완료 항목"]);
assert.deepEqual(JSON.parse(storedTodos), [
  { id: "active", title: "진행 중 항목", completed: false },
  { id: "completed", title: "완료 항목", completed: true },
]);

console.log("status-filter: 모든 검증을 통과했습니다.");
