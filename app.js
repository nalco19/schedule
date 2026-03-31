const STORAGE_KEY = "agenda-ferias-storage-v3";

function getDefaultData() {
  if (
    typeof window !== "undefined" &&
    window.DEFAULT_SCHEDULE &&
    typeof structuredClone === "function"
  ) {
    return structuredClone(window.DEFAULT_SCHEDULE);
  }

  if (typeof window !== "undefined" && window.DEFAULT_SCHEDULE) {
    return JSON.parse(JSON.stringify(window.DEFAULT_SCHEDULE));
  }

  return [];
}

function getData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error("Erro ao ler dados guardados:", error);
  }

  return getDefaultData();
}

function saveData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Erro ao guardar dados:", error);
  }
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

let state = [];

function updateField(index, field, value) {
  if (!state[index]) return;
  state[index][field] = value;
  saveData(state);
}

function resetData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Erro ao limpar dados guardados:", error);
  }

  state = getDefaultData();
  render();

  showToast("Versão original reposta.");
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "agenda-semanal-backup.json";
  a.click();
  URL.revokeObjectURL(url);

  showToast("Backup exportado.");
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

function createDayHeader(index, dayValue) {
  const header = document.createElement("div");
  header.className = "day-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "day-title-wrap";

  const dayLabel = document.createElement("span");
  dayLabel.className = "day-label";
  dayLabel.textContent = "Nome do dia";

  const titleInput = document.createElement("input");
  titleInput.className = "day-title-input";
  titleInput.type = "text";
  titleInput.value = dayValue || "";
  titleInput.placeholder = "Ex: Seg 6 ABR";

  titleInput.addEventListener("input", (event) => {
    updateField(index, "day", event.target.value);
  });

  const mini = document.createElement("span");
  mini.className = "day-mini";
  mini.textContent = `Dia ${index + 1}`;

  titleWrap.appendChild(dayLabel);
  titleWrap.appendChild(titleInput);
  header.appendChild(titleWrap);
  header.appendChild(mini);

  return header;
}

function render() {
  const grid = document.getElementById("scheduleGrid");
  const dayCount = document.getElementById("dayCount");

  if (!grid) {
    console.error("Elemento #scheduleGrid não encontrado.");
    return;
  }

  if (!dayCount) {
    console.error("Elemento #dayCount não encontrado.");
    return;
  }

  grid.innerHTML = "";
  dayCount.textContent = state.length;

  state.forEach((dayData, index) => {
    const card = document.createElement("article");
    card.className = "day-card";

    card.appendChild(createDayHeader(index, dayData.day));
    card.appendChild(createBlock(index, "morning", dayData.morning));
    card.appendChild(createBlock(index, "afternoon", dayData.afternoon));
    card.appendChild(createBlock(index, "night", dayData.night));

    grid.appendChild(card);
  });
}

function initApp() {
  state = getData();

  const saveBtn = document.getElementById("saveBtn");
  const resetBtn = document.getElementById("resetBtn");
  const exportBtn = document.getElementById("exportBtn");

  if (saveBtn) {
    saveBtn.addEventListener("click", () => {
      saveData(state);
      showToast("Alterações guardadas neste navegador.");
    });
  } else {
    console.warn("Botão #saveBtn não encontrado.");
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", resetData);
  } else {
    console.warn("Botão #resetBtn não encontrado.");
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", exportData);
  } else {
    console.warn("Botão #exportBtn não encontrado.");
  }

  render();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initApp);
} else {
  initApp();
}
