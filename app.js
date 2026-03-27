
const STORAGE_KEY = "agenda-ferias-storage-v1";

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

function createBlock(index, field, labelText, value) {
  const wrapper = document.createElement("div");
  wrapper.className = "block";

  const label = document.createElement("label");
  label.textContent = labelText;

  const textarea = document.createElement("textarea");
  textarea.value = value || "";
  textarea.addEventListener("input", (event) => {
    updateField(index, field, event.target.value);
  });

  wrapper.appendChild(label);
  wrapper.appendChild(textarea);

  return wrapper;
}

function render() {
  const grid = document.getElementById("scheduleGrid");
  grid.innerHTML = "";

  state.forEach((dayData, index) => {
    const card = document.createElement("article");
    card.className = "day-card";

    const title = document.createElement("h2");
    title.className = "day-title";
    title.textContent = dayData.day;

    card.appendChild(title);
    card.appendChild(createBlock(index, "morning", "Manhã", dayData.morning));
    card.appendChild(createBlock(index, "afternoon", "Tarde", dayData.afternoon));
    card.appendChild(createBlock(index, "night", "Noite", dayData.night));

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
