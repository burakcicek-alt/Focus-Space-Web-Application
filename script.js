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
    if (startTimer.isRunning) return;
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