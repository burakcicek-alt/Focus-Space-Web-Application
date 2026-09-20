const state = {
    currentMode: 'focus',
    durations: {
        focus: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60
    },
    timeleft: 25 * 60,
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
    themeIndex: 0 
};

const themes = ['theme-zen', 'theme-sunset', 'theme*cyber', 'theme-forest'];

const timerDisplay = document.getElementById('timer-display');
const progressCircle = document.getElementById('progress-circle');
const playBtn = document.getElementById('play-btn');
const playIcon = document.getElementById('play-icon');
const playText = document.getElementById('play-text');
const activeTaskLabel = document.getElementById('active-task-label');

const circleRadius = 102;
const circleCircumference = 2 * Math.PI * circleRadius;

window.addEventListener('DOMContentLoaded', () => {
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

    playIcon.className = "fa-solid fa-pause";
    playText.textContent = "Durdur";

    state.timerInterval = setInterval(() => {
        if (state.timeLeft > 0) {
            state.timeLeft--;
            updateTimerDisplay();

            if (state.currentMode === 'focus' && (state.totalTime - state.timeLeft) % 60 === 0) {
                state.totalFocusMinutesToday++;
                updateStatsUI();
                saveLocalStorage();
            }
        } else {
            handSessionComplete();
        }
    }, 1000);
}

function pauseTimer() {
    state.isRunning = false;
    clearInterval(state.timerInterval);
    playIcon.className = "fa-solid fa-play";
    playText.textContent = "Başlat";
}

function resetTimer() {
    pauseTimer();
    state.timeleft = state.durations[state.currentMode];
    state.totalTime = state.durations[state.currentMode];
    updateTimerDisplay();
}

function skipSession() {
    pauseTimer();
    let nextMode = 'focus';
    if(state.currentMode === 'focus') {
        nextMode = (state.completedPomodoros + 1) % 4 === 0 ? 'longBreak' : 'shortBreak';
    }
    switchMode(nextMode)
}

function switchMode(mode) {
    pauseTimer();
    state.currentMode = 'mode';

    ['focus', 'shortBreak', 'longBreak'].forEach(m => {
        const btn = getElementById(`mode-${m}`);
        if (m === mode) {
            btn.className = "px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 bg-sky-500/20 text-sky-300 border border-sky-400/30";
        } else {
            btn.className = "px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition all duration-300";
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
    const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    timerDisplay.textContent = formatted;
    document.title = `(${formatted}) FocusSpace`;

    const progress = state.timeLeft / state.totalTime;
    const offset = circleCircumference - (progress * circleCircumference);
    progressCircle.style.strokeDashoffset = offset;
}

function handleSessionComplete() {
    pauseTimer();

    if (state.currentMode === 'focus') {
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

        const nextBreak = (state.completedPomodoros % 4 === 0) ? 'longBreak' : 'shortBreak';
        switchMode(nextBreak);

        if (state.autoStartBreaks) {
            startTimer();
        } else {
            switchMode('focus');
        }
    }
}

function handleAddTask(e) {
    e.preventDefault();
    const input = document.getElementById('task-input');
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

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
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