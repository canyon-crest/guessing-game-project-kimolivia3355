// global variables
let level, answer, score;
const levelArr = document.getElementsByName("level");
const scoreArr = [];
// DOM elements (guarded so missing elements won't break the clock)
const dateElement = document.getElementById("date");
const playBtn = document.getElementById("playBtn");
const guessBtn = document.getElementById("guessBtn");
const guess = document.getElementById("guess");
const msg = document.getElementById("msg");
const wins = document.getElementById("wins");
const avgScore = document.getElementById("avgScore");
const nameInput = document.getElementById("nameInput");
const giveUpBtn = document.getElementById("giveUp");
const roundTimerEl = document.getElementById("roundTimer");
const fastestEl = document.getElementById("fastest");
const avgTimeEl = document.getElementById("avgTime");
const playsEl = document.getElementById("playsThisSession");
const resetStatsBtn = document.getElementById("resetStats");
let playerName = "";
// timing / stats
let roundStart = null;
let roundTimerInterval = null;
let fastestTimeMs = null;
let totalTimeMs = 0;
let gamesPlayed = 0;
let playsThisSession = 0;
//date display
if (dateElement) dateElement.textContent = time();
// add event listeners
if (playBtn) playBtn.addEventListener("click", play);
if (guessBtn) guessBtn.addEventListener("click", makeGuess);
if (giveUpBtn) giveUpBtn.addEventListener("click", giveUpGame);
if (guess) {
    guess.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (!guessBtn || !guessBtn.disabled) {
                makeGuess();
            }
        }
    });
}
if (resetStatsBtn) resetStatsBtn.addEventListener('click', resetStats);
// require a name before enabling play
if (nameInput) {
    if (playBtn) playBtn.disabled = nameInput.value.trim() === "";
    nameInput.addEventListener("input", () => {
        if (playBtn) playBtn.disabled = nameInput.value.trim() === "";
    });
}
if (dateElement) dateElement.innerHTML = time();

function play(){
    score = 0; //sets score to 0 every new game
    // require name before starting
    if (nameInput && nameInput.value.trim() === ""){
        if (msg) msg.textContent = "Please enter your name before playing.";
        if (nameInput) nameInput.focus();
        return;
    }
    playerName = nameInput && nameInput.value ? formatName(nameInput.value) : "Player";
    playsThisSession++;
    if (playsEl) playsEl.textContent = `Plays this session: ${playsThisSession}`;
    playBtn.disabled = true;
    guessBtn.disabled = false;
    if (giveUpBtn) giveUpBtn.disabled = false;
    guess.disabled = false;
    for(let i=0; i<levelArr.length; i++){
       if(levelArr[i].checked){
        level = parseInt(levelArr[i].value, 10);
       }
        levelArr[i].disabled = true;
    }
    if (msg) msg.textContent = `${playerName}, guess a number from 1-${level}`;
    answer = Math.floor(Math.random()*level)+1;

    roundStart = Date.now();
    if (roundTimerEl) roundTimerEl.textContent = `Round time: 0:00`;
    if (roundTimerInterval) clearInterval(roundTimerInterval);
    roundTimerInterval = setInterval(() => {
        if (!roundStart) return;
        const elapsed = Date.now() - roundStart;
        if (roundTimerEl) roundTimerEl.textContent = `Round time: ${formatMs(elapsed)}`;
    }, 500);
}
function makeGuess(){
    let userGuess = parseInt(guess.value);
    if(isNaN(userGuess) || userGuess < 1 || userGuess > level){
        if (msg) msg.textContent = `${playerName}, enter a VALID #1-${level}`;
        return;
    }
    score++; //valid guess add 1 to score
    const diff = Math.abs(userGuess - answer);
    const hint = getHint(diff, level);
    if(userGuess < answer){
        if (msg) msg.textContent = `${playerName}, too low — ${hint}. Try again.`;
    }
    else if(userGuess > answer){
        if (msg) msg.textContent = `${playerName}, too high — ${hint}. Try again.`;
    }
    else{
        // compute round time
        const roundTimeMs = roundStart ? (Date.now() - roundStart) : 0;
        const rating = getScoreRating(score, level);
        if (msg) msg.textContent = `${playerName}, you got it — it took you ${score} ${score === 1 ? 'try' : 'tries'}. ${rating} Time: ${formatMs(roundTimeMs)}. Press Play to play again.`;
        // record time and scores
        recordRoundTime(roundTimeMs);
        updateScore();
        reset();
    }
}
function reset(){
    guessBtn.disabled = true;
    guess.disabled = true;
    guess.value = "";
    guess.placeholder = "";
    // only enable Play again if a name is present
    playBtn.disabled = !(nameInput && nameInput.value.trim() !== "");
    if (giveUpBtn) giveUpBtn.disabled = true;
    // stop round timer
    if (roundTimerInterval) {
        clearInterval(roundTimerInterval);
        roundTimerInterval = null;
    }
    roundStart = null;
    if (roundTimerEl) roundTimerEl.textContent = `Round time: 0:00`;
     for(let i=0; i<levelArr.length; i++){
        levelArr[i].disabled = false;
    }
}

function giveUpGame(){
    // if no active game, ignore
    if (typeof answer === 'undefined' || typeof level === 'undefined'){
        if (msg) msg.textContent = playerName ? `${playerName}, there's no active game.` : `Enter your name and press Play to start.`;
        return;
    }
    // do not record give-ups in leaderboard, reveal answer, record time, reset
    const roundTimeMs = roundStart ? (Date.now() - roundStart) : 0;
    recordRoundTime(roundTimeMs);
    if (msg) msg.textContent = `${playerName || 'Player'}, you gave up — the answer was ${answer}. Time: ${formatMs(roundTimeMs)}. Press Play to try again.`;
    reset();
}
function resetStats(){
    scoreArr.length = 0;
    totalTimeMs = 0;
    gamesPlayed = 0;
    fastestTimeMs = null;
    playsThisSession = 0;
    if (playsEl) playsEl.textContent = `Plays this session: 0`;
    if (fastestEl) fastestEl.textContent = `Fastest Time: -`;
    if (avgTimeEl) avgTimeEl.textContent = `Average Time: -`;
    if (wins) wins.textContent = `Total wins: 0`;
    if (avgScore) avgScore.textContent = `Average Score: `;
    let lb = document.getElementsByName("leaderboard");
    for (let i = 0; i < lb.length; i++) {
        lb[i].textContent = '-';
    }
    if (roundTimerInterval) {
        clearInterval(roundTimerInterval);
        roundTimerInterval = null;
    }
    roundStart = null;
    if (roundTimerEl) roundTimerEl.textContent = `Round time: 0:00`;
    if (msg) msg.textContent = `Session stats reset.`;
}
function updateScore(){
    scoreArr.push(score);
    scoreArr.sort((a, b) => a - b); // sort increasing order
    let lb = document.getElementsByName("leaderboard");
    wins.textContent = `${playerName || 'Player'} - Total wins: ${scoreArr.length}`;
    let sum = 0;
    for(let i=0; i<scoreArr.length; i++){
        sum += scoreArr[i];
        if(i<lb.length){
            lb[i].textContent = scoreArr[i];
        }
    }
    let avg = sum/scoreArr.length
    avgScore.textContent = `${playerName || 'Player'} - Average Score: ${avg.toFixed(2)}`;
}
function recordRoundTime(ms){
    if (!ms || isNaN(ms)) ms = 0;
    gamesPlayed++;
    totalTimeMs += ms;
    if (fastestTimeMs === null || ms < fastestTimeMs) fastestTimeMs = ms;
    updateTimeStatsUI();
}
function updateTimeStatsUI(){
    if (fastestEl) fastestEl.textContent = `Fastest Time: ${fastestTimeMs === null ? '-' : formatMs(fastestTimeMs)}`;
    if (avgTimeEl) avgTimeEl.textContent = `Average Time: ${gamesPlayed === 0 ? '-' : formatMs(Math.round(totalTimeMs / gamesPlayed))}`;
}
// hint based on distance
function getHint(diff, level){
    if (diff === 0) return 'Correct';
    const veryHot = Math.max(1, Math.round(level * 0.03));
    const hot = Math.max(2, Math.round(level * 0.06));
    const warm = Math.max(3, Math.round(level * 0.15));
    const cool = Math.max(5, Math.round(level * 0.3));
    if (diff <= veryHot) return 'Boiling hot';
    if (diff <= hot) return 'Very hot';
    if (diff <= warm) return 'Hot';
    if (diff <= cool) return 'Warm';
    return 'Cold';
}
// score rating (lower is better)
function getScoreRating(score, level){
    if (!level) level = 10;
    if (score === 1) return 'Perfect!';
    const excellent = Math.max(1, Math.round(level * 0.1));
    const good = Math.max(2, Math.round(level * 0.25));
    const okay = Math.max(3, Math.round(level * 0.5));
    if (score <= excellent) return 'Excellent';
    if (score <= good) return 'Good';
    if (score <= okay) return 'OK';
    return 'Could be better';
}
function formatMs(ms){
    const totalSeconds = Math.floor(ms/1000);
    const hours = Math.floor(totalSeconds/3600);
    const minutes = Math.floor((totalSeconds % 3600)/60);
    const seconds = totalSeconds % 60;
    const pad = (n) => n.toString().padStart(2,'0');
    if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    return `${minutes}:${pad(seconds)}`;
}
function getOrdinal(n){
    const v = n % 100;
    if (v >= 11 && v <= 13) return 'th';
    switch (n % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}
function time(){
    const d = new Date();
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    const monthName = months[d.getMonth()];
    const day = d.getDate();
    const suffix = getOrdinal(day);
    const year = d.getFullYear();
    const timeStr = formatClockTime(d);
    return `${monthName} ${day}${suffix}, ${year} ${timeStr}`;
}
function formatClockTime(d){
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const seconds = d.getSeconds();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 -> 12
    const pad = (n) => n.toString().padStart(2,'0');
    return `${hours}:${pad(minutes)}:${pad(seconds)} ${ampm}`;
}
function formatName(str) {
    if (!str) return "";
    return str.trim().split(/\s+/).map(word => {
        const lower = word.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }).join(' ');
}
function currentClock () {
    if (dateElement) dateElement.textContent = time();
}
currentClock();
setInterval(currentClock, 1000);