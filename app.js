const STORAGE_KEY = "agenda-ferias-storage-v2";

function getData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error("Erro ao ler dados guardados:", error);
    }
  }
  return structuredClone(window.DEFAULT_SCHEDULE);
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function resetData() {
  localStorage.removeItem(STORAGE_KEY);
  state = structuredClone(window.DEFAULT_SCHEDULE);
  render();
  showToast("Versão original reposta.");
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "agenda-ferias-backup.json";
  a.click();
  URL.revokeObjectURL(url);
  showToast("Backup exportado.");
}

function showToast(message) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2200);
}

function updateField(index, field, value) {
  state[index][field] = value;
}

function getBlockMeta(field) {
  if (field === "morning") return { label: "Manhã", icon: "☀️" };
  if (field === "afternoon") return { label: "Tarde", icon: "🌤️" };
  return { label: "Noite", icon: "🌙" };
}

function createBlock(index, field, value) {
  const meta = getBlockMeta(field);

  const wrapper = document.createElement("div");
  wrapper.className = "block";

  const blockTitle = document.createElement("div");
  blockTitle.className = "block-title";

  const icon = document.createElement("div");
  icon.className = "block-icon";
  icon.textContent = meta.icon;

  const label = document.createElement("label");
  label.textContent = meta.label;

  const textarea = document.createElement("textarea");
  textarea.value = value || "";
  textarea.placeholder = `Escreva aqui o plano para ${meta.label.toLowerCase()}...`;
  textarea.addEventListener("input", (event) => {
    updateField(index, field, event.target.value);
  });

  blockTitle.appendChild(icon);
  blockTitle.appendChild(label);
  wrapper.appendChild(blockTitle);
  wrapper.appendChild(textarea);

  return wrapper;
}

function render() {
  const grid = document.getElementById("scheduleGrid");
  const dayCount = document.getElementById("dayCount");
  grid.innerHTML = "";
  dayCount.textContent = state.length;

  state.forEach((dayData, index) => {
    const card = document.createElement("article");
    card.className = "day-card";

    const header = document.createElement("div");
    header.className = "day-header";

    const title = document.createElement("h2");
    title.className = "day-title";
    title.textContent = dayData.day;

    const mini = document.createElement("span");
    mini.className = "day-mini";
    mini.textContent = `Dia ${index + 1}`;

    header.appendChild(title);
    header.appendChild(mini);

    card.appendChild(header);
    card.appendChild(createBlock(index, "morning", dayData.morning));
    card.appendChild(createBlock(index, "afternoon", dayData.afternoon));
    card.appendChild(createBlock(index, "night", dayData.night));

    grid.appendChild(card);
  });
}

let state = getData();

document.getElementById("saveBtn").addEventListener("click", () => {
  saveData(state);
  showToast("Alterações guardadas neste navegador.");
});

document.getElementById("resetBtn").addEventListener("click", resetData);
document.getElementById("exportBtn").addEventListener("click", exportData);

render();
