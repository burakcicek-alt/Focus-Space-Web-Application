const state = {
  currentMode: "focus",
  durations: {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  },
  timeLeft: 25 * 60,
  totalTime: 25 * 60,
  isRunning: false,
  timerInterval: null,
  completedPomodoros: 0,
  totalFocusMinutesToday: 0,
  streakDays: 1,
  activeTaskId: null,
  tasks: [],
  soundEnabled: true,
  autoStartBreaks: false,
  themeIndex: 0,
};

const themes = ["theme-zen", "theme-sunset", "theme-cyber", "theme-forest"];

const timerDisplay = document.getElementById("timer-display");
const progressCircle = document.getElementById("progress-circle");
const playBtn = document.getElementById("play-btn");
const playIcon = document.getElementById("play-icon");
const playText = document.getElementById("play-text");
const activeTaskLabel = document.getElementById("active-task-label");

const circleRadius = 102;
const circleCircumference = 2 * Math.PI * circleRadius;

window.addEventListener("DOMContentLoaded", () => {
  loadLocalStorage();
  updateTimerDisplay();
  renderTasks();
  updateStatsUI();
});

function toggleTimer() {
  if (state.isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  if (state.isRunning) return;
  state.isRunning = true;

  if (playIcon) playIcon.className = "fa-solid fa-pause";
  if (playText) playText.textContent = "Durdur";

  state.timerInterval = setInterval(() => {
    if (state.timeLeft > 0) {
      state.timeLeft--;
      updateTimerDisplay();

      if (
        state.currentMode === "focus" &&
        (state.totalTime - state.timeLeft) % 60 === 0
      ) {
        state.totalFocusMinutesToday++;
        updateStatsUI();
        saveLocalStorage();
      }
    } else {
      handleSessionComplete();
    }
  }, 1000);
}

function pauseTimer() {
  state.isRunning = false;
  clearInterval(state.timerInterval);
  if (playIcon) playIcon.className = "fa-solid fa-play";
  if (playText) playText.textContent = "Başlat";
}

function resetTimer() {
  pauseTimer();
  state.timeLeft = state.durations[state.currentMode];
  state.totalTime = state.durations[state.currentMode];
  updateTimerDisplay();
}

function skipSession() {
  pauseTimer();
  let nextMode = "focus";
  if (state.currentMode === "focus") {
    nextMode =
      (state.completedPomodoros + 1) % 4 === 0 ? "longBreak" : "shortBreak";
  }
  switchMode(nextMode);
}

function switchMode(mode) {
  pauseTimer();
  state.currentMode = mode;

  ["focus", "shortBreak", "longBreak"].forEach((m) => {
    const btn = document.getElementById(`mode-${m}`);
    if (btn) {
      if (m === mode) {
        btn.className =
          "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 bg-sky-500/20 text-sky-300 border border-sky-400/30";
      } else {
        btn.className =
          "px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition all duration-300";
      }
    }
  });

  state.timeLeft = state.durations[mode];
  state.totalTime = state.durations[mode];
  updateTimerDisplay();
}

function addTime(minutes) {
  const addedSeconds = minutes * 60;
  state.timeLeft = Math.max(0, state.timeLeft + addedSeconds);
  state.totalTime = Math.max(state.timeLeft, state.totalTime + addedSeconds);
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const mins = Math.floor(state.timeLeft / 60);
  const secs = state.timeLeft % 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  if (timerDisplay) timerDisplay.textContent = formatted;
  document.title = `(${formatted}) FocusSpace`;

  if (progressCircle) {
    const progress = state.timeLeft / state.totalTime;
  const offset = circleCircumference - progress * circleCircumference;
  progressCircle.style.strokeDashoffset = offset;
  }
}

function handleSessionComplete() {
  pauseTimer();
  playNotificationSound();

  if (state.currentMode === "focus") {
    state.completedPomodoros++;

    if (state.activeTaskId) {
      const task = state.tasks.find(t => t.id === state.activeTaskId);
      if (task) {
        task.completedPomodoros = (task.completedPomodoros || 0) + 1;
        renderTasks();
      }
    }

    saveLocalStorage();
    updateStatsUI();

    const nextBreak =
      (state.completedPomodoros % 4 === 0) ? "longBreak" : "shortBreak";
    switchMode(nextBreak);

    if (state.autoStartBreaks) {
      startTimer();
    } else {
      switchMode("focus");
    }
  }
}

function handleAddTask(e) {
  e.preventDefault();
  const input = document.getElementById('task-input');
  if(!input) return;

  const title = input.value.trim();
  if (!title) return;

  const newTask = {
    id: Date.now().toString(),
    title: title,
    completed: false,
    completedPomodoros: 0
  };

  state.tasks.push(newTask);

  if (!state.activeTaskId) {
    setActiveTask(newTask.id);
  }

  input.value = '';
  renderTasks();
  saveLocalStorage();
}

function renderTasks() {
    const taskList = document.getElementById('task-list');
    if (!taskList) return;

    taskList.innerHTML = '';

    if (state.tasks.length === 0) {
        taskList.innerHTML = ``;
        return;
    }

    state.tasks.forEach(task => {
        const isActive = task.id === state.activeTaskId;
        const li = document.createElement('li');
        li.className = `flex items-center justify-between p-3 rounded-xl border transition-all duration-200 ${
            isActive
                 ? 'bg-sky-500/10 border-sky-500/40 text-white'
                 : 'bg-white/5 border-white/10 text-gray-300 hover:border-white/20'
        }`;

        li.innerHTML = `${task.title} 🍅 ${task.completedPomodoros || 0}`;

        taskList.appendChild(li);
    });
}

function toggleTaskCompleted(id) {
  const task = state.tasks.find(t => t.id === id);

  if (task) {
    task.completed = !task.completed;
    renderTasks();
    saveLocalStorage();
  }
}

function deleteTask(id) {
  state.tasks = state.tasks.filter((t) => t.id !== id);
  if (state.activeTaskId === id) {
    state.activeTaskId = state.tasks.length > 0 ? state.tasks[0].id : null;
    updateActiveTaskLabel();
  }
  renderTasks();
  saveLocalStorage();
}

function setActiveTask(id) {
  state.activeTaskId = id;
  updateActiveTaskLabel();
  renderTasks();
  saveLocalStorage();
}

function updateActiveTaskLabel() {
  if (!activeTaskLabel) return;

  const task = state.tasks.find((t) => t.id === state.activeTaskId);

  if (task) {
    activeTaskLabel.innerHTML = `📌 ${task.title}`;
  } else {
    activeTaskLabel.innerHTML = `📌 Görev seçilmedi`;
  }
}

function updateStatsUI() {

  const completedPomoCount = document.getElementById('completed-pomodoros-count');
  const focusTimeCount = document.getElementById('total-focus-mins');
  const streakCount = document.getElementById('streak-count');

  if (completedPomoCount) completedPomoCount.textContent = state.completedPomodoros;
  if (focusTimeCount) focusTimeCount.textContent = `${state.totalFocusMinutesToday} dk`;
  if (streakCount) streakCount.textContent = `${state.streakDays}`;

}

function playNotificationSound() {
  if (!state.soundEnabled) return;

  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3);

    gain.gain.setTargetAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (e) {
    console.warn('Web Audio API desteklenmiyor vea engellendi:', e);
  }
}

function saveLocalStorage() {
  const dataToSave = {
    completedPomodoros: state.completedPomodoros,
    totalFocusMinutesToday: state.totalFocusMinutesToday,
    streakDays: state.streakDays,
    activeTaskId: state.activeTaskId,
    tasks: state.tasks,
    soundEnabled: state.soundEnabled,
    autoStartBreaks: state.autoStartBreaks,
    themeIndex: state.themeIndex
  };
  localStorage.setItem('focusspace_state', JSON.stringify(dataToSave));
}

function loadLocalStorage() {
  const saved = localStorage.getItem('focusspace_state');
  if(!saved) return;

  try {
    const parsed = JSON.parse(saved);
    state.completedPomodoros = parsed.completedPomodoros || 0;
    state.totalFocusMinutesToday = parsed.totalFocusMinutesToday || 0;
    state.streakDays = parsed.streakDays || 1;
    state.activeTaskId = parsed.activeTaskId || null;
    state.tasks = parsed.tasks || [];
    state.soundEnabled = parsed.soundEnabled ?? true;
    state.autoStartBreaks = parsed.themeIndex || 0;

    updateActiveTaskLabel();
  } catch (e) {
    console.error('LocalStorage verisi okunamadı:', e);
  }
}