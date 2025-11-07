import { supabase } from "./db.js";

let room = null;
let channel = null;
let currentQuestion = null;
let answered = false;

let timeLeft = 15;
let timerInterval = null;

// DOM
const joinPanel = document.getElementById("joinPanel");
const playPanel = document.getElementById("playPanel");
const joinBtn = document.getElementById("joinBtn");
const roomCodeInput = document.getElementById("roomCode");
const playerNameInput = document.getElementById("playerName");
const questionTitle = document.getElementById("questionTitle");
const optionsDiv = document.getElementById("options");
const timerEl = document.getElementById("timer");
const statusEl = document.getElementById("status");

// ✅ Auto-fill room code from link
const params = new URLSearchParams(location.search);
if (params.get("code")) {
  roomCodeInput.value = params.get("code").toUpperCase();
}

// -----------------------------------
// JOIN ROOM
// -----------------------------------
joinBtn.onclick = async () => {
  const code = roomCodeInput.value.trim().toUpperCase();
  const name = playerNameInput.value.trim() || "Guest";

  if (!code) return alert("Enter room code");

  const { data: r, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("code", code)
    .single();

  if (error || !r) return alert("Invalid Room Code");

  room = r;

  // add player
  await supabase.from("room_players").insert([
    { room_id: room.id, player_name: name, score: 0 }
  ]);

  // swap UI
  joinPanel.style.display = "none";
  playPanel.style.display = "block";

  connectToRoom(code, name);
};

// -----------------------------------
// OPEN REALTIME CHANNEL
// -----------------------------------
function connectToRoom(code, playerName) {
  if (channel) supabase.removeChannel(channel);

  channel = supabase.channel("room-" + code, {
    config: { broadcast: { self: true } }
  });

  channel.on("broadcast", { event: "state" }, ({ payload }) => {
    if (payload.type === "question") {
      renderQuestion(payload.q, payload.index, playerName);
    }

    if (payload.type === "scores") {
      showScoreboard(payload.players);
    }

    if (payload.type === "final_results") {
      showFinalResults(payload.players, playerName);
    }

    if (payload.type === "end") {
      endSession();
    }
  });

  channel.subscribe();
}

// -----------------------------------
// RENDER QUESTION
// -----------------------------------
function renderQuestion(q, index, playerName) {
  currentQuestion = q;
  answered = false;

  questionTitle.textContent = q.text;
  optionsDiv.innerHTML = "";
  statusEl.textContent = "";

  q.options.forEach((opt, idx) => {
    const box = document.createElement("div");
    box.className = "option";
    box.innerHTML = `
      ${opt.text ? opt.text : ""}
      ${opt.image ? `<br><img src="${opt.image}" style="width:120px;">` : ""}
    `;
    box.onclick = () => submitAnswer(idx, playerName);
    optionsDiv.appendChild(box);
  });

  startTimer();
}

// -----------------------------------
// TIMER
// -----------------------------------
function startTimer() {
  timeLeft = 15;
  timerEl.textContent = timeLeft;

  clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timeLeft--;
    timerEl.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      answered = true;
      statusEl.textContent = "⏳ Time up!";
    }
  }, 1000);
}

// -----------------------------------
// SUBMIT ANSWER
// -----------------------------------
async function submitAnswer(optionIndex, playerName) {
  if (answered) return;
  answered = true;

  clearInterval(timerInterval);

  // Get correct index
  const { data: q } = await supabase
    .from("questions")
    .select("correct_index")
    .eq("id", currentQuestion.id)
    .single();

  const isCorrect = q.correct_index === optionIndex;

  // Push submission to DB
  await supabase.from("room_submissions").insert([
    {
      room_id: room.id,
      question_id: currentQuestion.id,
      player_name: playerName,
      selected: optionIndex,
      correct: isCorrect
    }
  ]);

  statusEl.textContent = isCorrect ? "✅ Correct!" : "❌ Wrong!";
}

// -----------------------------------
// SHOW SCOREBOARD
// -----------------------------------
function showScoreboard(players) {
  questionTitle.textContent = "📊 Leaderboard";
  optionsDiv.innerHTML = "";

  players.forEach((p, i) => {
    optionsDiv.innerHTML += `
      <div class="score-row" style="animation-delay:${i * 0.1}s;">
        <span>${i + 1}. ${p.player_name}</span>
        <span>${p.score}</span>
      </div>
    `;
  });

  statusEl.textContent = "Waiting for next question…";
}

// -----------------------------------
// FINAL RESULTS
// -----------------------------------
function showFinalResults(players, playerName) {
  clearInterval(timerInterval);

  questionTitle.textContent = "🏁 Final Results";
  optionsDiv.innerHTML = "";

  const me = players.find(p => p.player_name === playerName);
  const position = players.findIndex(p => p.player_name === playerName) + 1;

  optionsDiv.innerHTML += `
    <h2>Your Position: ${position}</h2>
    <h3>Your Score: ${me.score}</h3>
    <hr>
    <h3>Leaderboard</h3>
  `;

  players.forEach((p, i) => {
    optionsDiv.innerHTML += `
      <div class="score-row">
        <span>${i + 1}. ${p.player_name}</span>
        <span>${p.score}</span>
      </div>
    `;
  });

  statusEl.textContent = "Game Over";
}

// -----------------------------------
// SESSION ENDED
// -----------------------------------
function endSession() {
  clearInterval(timerInterval);
  questionTitle.textContent = "❗ Host ended the quiz.";
  optionsDiv.innerHTML = "";
  statusEl.textContent = "";
}
