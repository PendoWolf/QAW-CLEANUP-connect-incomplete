const STORAGE_KEYS = {
  session: "keel.session",
  tasks: "keel.tasks",
};

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getSession() {
  return loadJson(STORAGE_KEYS.session, null);
}

function setSession(session) {
  saveJson(STORAGE_KEYS.session, session);
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.session);
}

function seedTasks() {
  return [
    {
      id: "task-1",
      title: "Tag the sign-in page in Pendo",
      notes: "Confirm the URL rule matches /index.html and the sign-in button.",
      status: "doing",
      priority: "high",
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: "task-2",
      title: "Verify visitor identify after login",
      notes: "Check visitor id, email, role, and account metadata.",
      status: "todo",
      priority: "high",
      createdAt: Date.now() - 86400000,
    },
    {
      id: "task-3",
      title: "Create a guide on the board",
      notes: "Target the New task button and the Done column.",
      status: "todo",
      priority: "medium",
      createdAt: Date.now() - 3600000 * 8,
    },
    {
      id: "task-4",
      title: "Smoke-test settings save",
      notes: "Update display name and confirm pendo.updateOptions fires.",
      status: "done",
      priority: "low",
      createdAt: Date.now() - 86400000 * 4,
    },
  ];
}

function getTasks() {
  const tasks = loadJson(STORAGE_KEYS.tasks, null);
  if (!tasks) {
    const seeded = seedTasks();
    saveJson(STORAGE_KEYS.tasks, seeded);
    return seeded;
  }
  return tasks;
}

function setTasks(tasks) {
  saveJson(STORAGE_KEYS.tasks, tasks);
}

function resetWorkspace() {
  localStorage.removeItem(STORAGE_KEYS.tasks);
}
