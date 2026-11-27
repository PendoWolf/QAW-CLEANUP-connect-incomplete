const STATUSES = ["todo", "doing", "done"];
const PRIORITIES = ["low", "medium", "high"];

function uid(prefix) {
  return prefix + "-" + Math.random().toString(36).slice(2, 9);
}

function requireSession() {
  const session = getSession();
  if (!session) {
    window.location.replace("index.html");
    return null;
  }
  return session;
}

function formatDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function currentPage() {
  const file = window.location.pathname.split("/").pop() || "index.html";
  return file.replace(".html", "") || "index";
}

function renderShell(session, active) {
  const app = document.getElementById("app");
  app.innerHTML = `
    <aside class="sidebar" data-pendo="sidebar">
      <div class="brand">
        <span class="mark" aria-hidden="true">K</span>
        <div>
          <strong>Keel</strong>
          <span>QA workspace</span>
        </div>
      </div>
      <nav class="nav">
        <a href="home.html" class="${active === "home" ? "is-active" : ""}" data-pendo="nav-home">Home</a>
        <a href="board.html" class="${active === "board" ? "is-active" : ""}" data-pendo="nav-board">Board</a>
        <a href="list.html" class="${active === "list" ? "is-active" : ""}" data-pendo="nav-list">List</a>
        <a href="insights.html" class="${active === "insights" ? "is-active" : ""}" data-pendo="nav-insights">Insights</a>
        <a href="settings.html" class="${active === "settings" ? "is-active" : ""}" data-pendo="nav-settings">Settings</a>
      </nav>
      <div class="sidebar-foot">
        <div class="who">
          <span class="avatar">${escapeHtml(session.name.charAt(0).toUpperCase())}</span>
          <div>
            <strong>${escapeHtml(session.name)}</strong>
            <span>${escapeHtml(session.role)}</span>
          </div>
        </div>
        <button type="button" class="ghost-btn" id="logout-btn" data-pendo="logout">Sign out</button>
      </div>
    </aside>
    <div class="stage">
      <header class="topbar">
        <label class="search">
          <span class="sr-only">Search tasks</span>
          <input id="global-search" type="search" placeholder="Search tasks" data-pendo="global-search" />
        </label>
        <button type="button" class="primary-btn" id="quick-add-btn" data-pendo="quick-add">New task</button>
      </header>
      <main class="content" id="content"></main>
    </div>
    <dialog class="modal" id="task-modal">
      <form method="dialog" id="task-form" data-pendo="task-form">
        <h2 id="task-modal-title">New task</h2>
        <label>
          Title
          <input name="title" required maxlength="80" data-pendo="task-title" />
        </label>
        <label>
          Notes
          <textarea name="notes" rows="3" maxlength="240" data-pendo="task-notes"></textarea>
        </label>
        <div class="row">
          <label>
            Status
            <select name="status" data-pendo="task-status">
              <option value="todo">To do</option>
              <option value="doing">Doing</option>
              <option value="done">Done</option>
            </select>
          </label>
          <label>
            Priority
            <select name="priority" data-pendo="task-priority">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>
        <menu>
          <button type="button" class="ghost-btn" id="cancel-task" value="cancel" data-pendo="task-cancel">Cancel</button>
          <button type="submit" class="primary-btn" data-pendo="task-save">Save task</button>
        </menu>
      </form>
    </dialog>
  `;

  document.getElementById("logout-btn").addEventListener("click", () => {
    trackPendo("signed_out");
    clearSession();
    window.location.replace("index.html");
  });

  document.getElementById("quick-add-btn").addEventListener("click", () => openTaskModal());
  document.getElementById("cancel-task").addEventListener("click", () => {
    document.getElementById("task-modal").close();
  });
  document.getElementById("task-form").addEventListener("submit", onSaveTask);
  document.getElementById("global-search").addEventListener("input", onGlobalSearch);
}

function onGlobalSearch(event) {
  const query = event.target.value.trim().toLowerCase();
  const page = currentPage();
  if (page === "list") renderList(query);
  if (page === "board") renderBoard(query);
  if (page === "home") renderHome(query);
}

function matchesQuery(task, query) {
  if (!query) return true;
  return (
    task.title.toLowerCase().includes(query) ||
    task.notes.toLowerCase().includes(query)
  );
}

function openTaskModal(task) {
  const modal = document.getElementById("task-modal");
  const form = document.getElementById("task-form");
  form.dataset.taskId = task ? task.id : "";
  document.getElementById("task-modal-title").textContent = task ? "Edit task" : "New task";
  form.title.value = task ? task.title : "";
  form.notes.value = task ? task.notes : "";
  form.status.value = task ? task.status : "todo";
  form.priority.value = task ? task.priority : "medium";
  modal.showModal();
}

function onSaveTask(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const tasks = getTasks();
  const existingId = form.dataset.taskId;
  const payload = {
    title: form.title.value.trim(),
    notes: form.notes.value.trim(),
    status: form.status.value,
    priority: form.priority.value,
  };

  if (existingId) {
    const index = tasks.findIndex((task) => task.id === existingId);
    if (index >= 0) tasks[index] = { ...tasks[index], ...payload };
    trackPendo("task_updated", { status: payload.status, priority: payload.priority });
  } else {
    tasks.unshift({
      id: uid("task"),
      createdAt: Date.now(),
      ...payload,
    });
    trackPendo("task_created", { status: payload.status, priority: payload.priority });
  }

  setTasks(tasks);
  document.getElementById("task-modal").close();
  refreshPage();
}

function deleteTask(id) {
  setTasks(getTasks().filter((task) => task.id !== id));
  trackPendo("task_deleted");
  refreshPage();
}

function moveTask(id, status) {
  const tasks = getTasks().map((task) =>
    task.id === id ? { ...task, status } : task
  );
  setTasks(tasks);
  trackPendo("task_moved", { status });
  refreshPage();
}

function refreshPage() {
  const query = document.getElementById("global-search")?.value.trim().toLowerCase() || "";
  const page = currentPage();
  if (page === "home") renderHome(query);
  if (page === "board") renderBoard(query);
  if (page === "list") renderList(query);
  if (page === "insights") renderInsights();
  if (page === "settings") renderSettings();
}

function counts(tasks) {
  return {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    doing: tasks.filter((t) => t.status === "doing").length,
    done: tasks.filter((t) => t.status === "done").length,
    high: tasks.filter((t) => t.priority === "high").length,
  };
}

function renderHome(query) {
  const session = getSession();
  const tasks = getTasks().filter((task) => matchesQuery(task, query));
  const stats = counts(getTasks());
  const recent = tasks.slice(0, 4);
  document.getElementById("content").innerHTML = `
    <section class="hero">
      <div>
        <p class="eyebrow">Signed in as ${escapeHtml(session.email)}</p>
        <h1>Welcome back, ${escapeHtml(session.name.split(" ")[0])}.</h1>
        <p class="lede">A static workspace for tagging pages, features, and visitor metadata. Nothing here leaves the browser.</p>
      </div>
      <button type="button" class="primary-btn" id="home-add" data-pendo="home-new-task">Add a task</button>
    </section>
    <section class="stats" data-pendo="home-stats">
      <article class="stat"><span>Open</span><strong>${stats.todo}</strong></article>
      <article class="stat"><span>In progress</span><strong>${stats.doing}</strong></article>
      <article class="stat"><span>Done</span><strong>${stats.done}</strong></article>
      <article class="stat"><span>High priority</span><strong>${stats.high}</strong></article>
    </section>
    <section class="panel">
      <div class="panel-head">
        <h2>Recent work</h2>
        <a href="list.html" data-pendo="home-view-all">View all</a>
      </div>
      <ul class="recent" data-pendo="recent-list">
        ${
          recent.length
            ? recent
                .map(
                  (task) => `
            <li>
              <div>
                <strong>${escapeHtml(task.title)}</strong>
                <span>${escapeHtml(task.status)} · ${escapeHtml(task.priority)}</span>
              </div>
              <button type="button" class="ghost-btn" data-edit="${task.id}" data-pendo="home-edit-task">Edit</button>
            </li>`
                )
                .join("")
            : `<li class="empty">No matching tasks.</li>`
        }
      </ul>
    </section>
  `;
  document.getElementById("home-add").addEventListener("click", () => openTaskModal());
  document.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const task = getTasks().find((item) => item.id === btn.dataset.edit);
      if (task) openTaskModal(task);
    });
  });
}

function taskCard(task) {
  return `
    <article class="card" data-task-id="${task.id}" data-pendo="task-card">
      <div class="card-top">
        <span class="pill ${task.priority}">${escapeHtml(task.priority)}</span>
        <span class="muted">${formatDate(task.createdAt)}</span>
      </div>
      <h3>${escapeHtml(task.title)}</h3>
      <p>${escapeHtml(task.notes) || "No notes"}</p>
      <div class="card-actions">
        <button type="button" class="ghost-btn" data-edit="${task.id}" data-pendo="card-edit">Edit</button>
        <button type="button" class="ghost-btn danger" data-delete="${task.id}" data-pendo="card-delete">Delete</button>
      </div>
    </article>
  `;
}

function bindCardActions(root) {
  root.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const task = getTasks().find((item) => item.id === btn.dataset.edit);
      if (task) openTaskModal(task);
    });
  });
  root.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteTask(btn.dataset.delete));
  });
}

function renderBoard(query) {
  const tasks = getTasks().filter((task) => matchesQuery(task, query));
  document.getElementById("content").innerHTML = `
    <section class="page-head">
      <div>
        <p class="eyebrow">Kanban</p>
        <h1>Board</h1>
      </div>
      <div class="filters" data-pendo="board-filters">
        ${PRIORITIES.map(
          (priority) =>
            `<button type="button" class="chip" data-priority="${priority}" data-pendo="filter-${priority}">${priority}</button>`
        ).join("")}
      </div>
    </section>
    <section class="board" data-pendo="kanban-board">
      ${STATUSES.map((status) => {
        const column = tasks.filter((task) => task.status === status);
        return `
          <div class="column" data-status="${status}" data-pendo="column-${status}">
            <header>
              <h2>${status === "todo" ? "To do" : status === "doing" ? "Doing" : "Done"}</h2>
              <span>${column.length}</span>
            </header>
            <div class="stack">${column.map(taskCard).join("") || `<p class="empty">Nothing here.</p>`}</div>
            ${status !== "todo" ? "" : ""}
            <div class="move-row">
              ${STATUSES.filter((s) => s !== status)
                .map(
                  (target) =>
                    `<button type="button" class="ghost-btn" data-move-to="${target}" data-pendo="move-to-${target}">Move here…</button>`
                )
                .join("")}
            </div>
          </div>
        `;
      }).join("")}
    </section>
  `;

  const content = document.getElementById("content");
  bindCardActions(content);

  let selectedId = null;
  content.querySelectorAll(".card").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      content.querySelectorAll(".card").forEach((el) => el.classList.remove("is-selected"));
      card.classList.add("is-selected");
      selectedId = card.dataset.taskId;
    });
  });

  content.querySelectorAll("[data-move-to]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!selectedId) return;
      moveTask(selectedId, btn.dataset.moveTo);
    });
  });

  let activePriority = "";
  content.querySelectorAll("[data-priority]").forEach((chip) => {
    chip.addEventListener("click", () => {
      activePriority = activePriority === chip.dataset.priority ? "" : chip.dataset.priority;
      content.querySelectorAll(".card").forEach((card) => {
        const task = getTasks().find((item) => item.id === card.dataset.taskId);
        card.hidden = Boolean(activePriority) && task?.priority !== activePriority;
      });
      content.querySelectorAll("[data-priority]").forEach((el) => {
        el.classList.toggle("is-active", el.dataset.priority === activePriority);
      });
    });
  });
}

function renderList(query) {
  const tasks = getTasks().filter((task) => matchesQuery(task, query));
  document.getElementById("content").innerHTML = `
    <section class="page-head">
      <div>
        <p class="eyebrow">All work</p>
        <h1>List</h1>
      </div>
      <button type="button" class="primary-btn" id="list-add" data-pendo="list-new-task">New task</button>
    </section>
    <section class="table-wrap" data-pendo="task-table">
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Created</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${
            tasks.length
              ? tasks
                  .map(
                    (task) => `
            <tr>
              <td>
                <strong>${escapeHtml(task.title)}</strong>
                <div class="muted">${escapeHtml(task.notes)}</div>
              </td>
              <td>
                <select data-status-for="${task.id}" data-pendo="list-status">
                  ${STATUSES.map(
                    (status) =>
                      `<option value="${status}" ${task.status === status ? "selected" : ""}>${status}</option>`
                  ).join("")}
                </select>
              </td>
              <td><span class="pill ${task.priority}">${escapeHtml(task.priority)}</span></td>
              <td>${formatDate(task.createdAt)}</td>
              <td class="row-actions">
                <button type="button" class="ghost-btn" data-edit="${task.id}" data-pendo="list-edit">Edit</button>
                <button type="button" class="ghost-btn danger" data-delete="${task.id}" data-pendo="list-delete">Delete</button>
              </td>
            </tr>`
                  )
                  .join("")
              : `<tr><td colspan="5" class="empty">No matching tasks.</td></tr>`
          }
        </tbody>
      </table>
    </section>
  `;
  document.getElementById("list-add").addEventListener("click", () => openTaskModal());
  const content = document.getElementById("content");
  bindCardActions(content);
  content.querySelectorAll("[data-status-for]").forEach((select) => {
    select.addEventListener("change", () => moveTask(select.dataset.statusFor, select.value));
  });
}

function renderInsights() {
  const stats = counts(getTasks());
  const max = Math.max(stats.todo, stats.doing, stats.done, 1);
  document.getElementById("content").innerHTML = `
    <section class="page-head">
      <div>
        <p class="eyebrow">Local only</p>
        <h1>Insights</h1>
      </div>
    </section>
    <section class="charts" data-pendo="insights-charts">
      ${["todo", "doing", "done"]
        .map((status) => {
          const value = stats[status];
          const width = Math.round((value / max) * 100);
          return `
            <article class="chart-row">
              <div class="chart-label">
                <strong>${status === "todo" ? "To do" : status === "doing" ? "Doing" : "Done"}</strong>
                <span>${value}</span>
              </div>
              <div class="bar" data-pendo="bar-${status}"><span style="width:${width}%"></span></div>
            </article>
          `;
        })
        .join("")}
    </section>
    <section class="panel callout" data-pendo="insights-note">
      <h2>Why this page exists</h2>
      <p>Use it to tag a read-only analytics view and to confirm guides can target chart rows without depending on a live API.</p>
    </section>
  `;
}

function renderSettings() {
  const session = getSession();
  const keySet = window.APP_CONFIG.pendoApiKey !== "YOUR_PENDO_API_KEY";
  document.getElementById("content").innerHTML = `
    <section class="page-head">
      <div>
        <p class="eyebrow">Visitor metadata</p>
        <h1>Settings</h1>
      </div>
    </section>
    <form class="panel form" id="profile-form" data-pendo="profile-form">
      <label>
        Display name
        <input name="name" value="${escapeHtml(session.name)}" required data-pendo="settings-name" />
      </label>
      <label>
        Email
        <input name="email" type="email" value="${escapeHtml(session.email)}" required data-pendo="settings-email" />
      </label>
      <label>
        Role
        <select name="role" data-pendo="settings-role">
          ${["QA Engineer", "Product Manager", "Designer", "Engineer"]
            .map(
              (role) =>
                `<option ${session.role === role ? "selected" : ""}>${role}</option>`
            )
            .join("")}
        </select>
      </label>
      <button type="submit" class="primary-btn" data-pendo="settings-save">Save profile</button>
    </form>
    <section class="panel">
      <h2>Pendo agent</h2>
      <p class="muted">API key is ${keySet ? "configured" : "not set"} in <code>js/config.js</code>.</p>
      <p class="muted">Visitor ID: <code data-pendo="visitor-id">${escapeHtml(session.visitorId)}</code></p>
      <button type="button" class="ghost-btn danger" id="reset-data" data-pendo="reset-data">Reset sample tasks</button>
    </section>
  `;

  document.getElementById("profile-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const next = {
      ...session,
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      role: form.role.value,
    };
    setSession(next);
    identifyPendo(next);
    trackPendo("profile_updated", { role: next.role });
    renderShell(next, "settings");
    renderSettings();
  });

  document.getElementById("reset-data").addEventListener("click", () => {
    resetWorkspace();
    getTasks();
    trackPendo("sample_data_reset");
    window.location.href = "home.html";
  });
}

function bootApp() {
  const session = requireSession();
  if (!session) return;
  initPendo(session);
  renderShell(session, currentPage());
  refreshPage();
}

window.bootApp = bootApp;
window.openTaskModal = openTaskModal;
