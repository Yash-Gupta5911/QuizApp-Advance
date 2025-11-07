import { supabase } from "./db.js";

let room = null;
let channel = null;
let questions = [];
let currentIndex = 0;
let previousPositions = {};

// DOM
const quizIdInput = document.getElementById("quizId");
const createBtn = document.getElementById("createRoomBtn");
const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const endBtn = document.getElementById("endBtn");
const roomInfo = document.getElementById("roomInfo");
const playersBody = document.getElementById("playersBody");
const broadcastState = document.getElementById("broadcastState");
const summaryBox = document.getElementById("summaryBox");

// ----------------------------
// Load Questions (NEW FORMAT)
// ----------------------------
async function loadQuestions(quizId) {
  const { data, error } = await supabase
    .from("questions")
    .select("id, question, options, correct_index")
    .eq("quiz_id", quizId);

  if (error) {
    alert(error.message);
    return [];
  }

  return data;
}

// ----------------------------
// Create Room
// ----------------------------
createBtn.onclick = async () => {
  const quizId = quizIdInput.value.trim();
  if (!quizId) return alert("Enter Quiz ID");

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return alert("Login required");

  const code = generateCode();

  const { data, error } = await supabase
    .from("rooms")
    .insert([{ quiz_id: quizId, code, host_id: user.user.id, status: "waiting" }])
    .select()
    .single();

  if (error) return alert(error.message);

  room = data;
  roomInfo.textContent = `Room Code: ${room.code}`;
  startBtn.disabled = false;
  endBtn.disabled = false;

  generateQR(room.code);

  questions = await loadQuestions(quizId);
  openRealtimeSubscriptions();
};

// Generate Room Code
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// Generate QR
function generateQR(code) {
  const link = `${location.origin}/live.html?code=${code}`;
  new QRious({
    element: document.getElementById("qrCanvas"),
    value: link,
    size: 200
  });
}

// ----------------------------
// Player Listener
// ----------------------------
function openRealtimeSubscriptions() {
  const channel = supabase
    .channel("room-players-" + room.id)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "room_players", filter: `room_id=eq.${room.id}` },
      loadPlayers
    )
    .subscribe();

  loadPlayers();

  openBroadcastChannel();
}

async function loadPlayers() {
  const { data } = await supabase
    .from("room_players")
    .select("player_name, score")
    .eq("room_id", room.id);

  playersBody.innerHTML = "";

  if (!data || !data.length) {
    playersBody.innerHTML = "<tr><td colspan='2'>No players yet</td></tr>";
    return;
  }

  data.forEach((p) => {
    playersBody.innerHTML += `<tr><td>${p.player_name}</td><td>${p.score}</td></tr>`;
  });
}

// ----------------------------
// Realtime Broadcast
// ----------------------------
function openBroadcastChannel() {
  channel = supabase.channel("room-" + room.code, {
    config: { broadcast: { self: true } }
  });

  channel.on("broadcast", { event: "state" }, ({ payload }) => {
    broadcastState.textContent = `Sent: ${payload.type}`;
  });

  channel.subscribe();
}

function broadcast(type, payload = {}) {
  channel.send({
    type: "broadcast",
    event: "state",
    payload: { type, ...payload }
  });
}

// ----------------------------
// Start Quiz
// ----------------------------
startBtn.onclick = () => {
  currentIndex = 0;
  broadcastQuestion();
  nextBtn.disabled = false;
};

function broadcastQuestion() {
  const q = questions[currentIndex];

  broadcast("question", {
    index: currentIndex,
    q: {
      id: q.id,
      text: q.question,
      options: q.options,
    }
  });
}

// ----------------------------
// Next Question
// ----------------------------
nextBtn.onclick = async () => {
  await tallyCurrentQuestion();

  broadcastScores();

  currentIndex++;

  if (currentIndex >= questions.length) {
    return endBtn.onclick();
  }

  broadcastQuestion();
};

// ----------------------------
// Tally Scores (NEW & FIXED)
// ----------------------------
async function tallyCurrentQuestion() {
  const question = questions[currentIndex];
  if (!question) return;

  await supabase.rpc("tally_scores_json", {
    room_id_input: room.id,
    question_id_input: question.id
  });

  loadAnswerSummary(question);
}

// ----------------------------
// Load Answer Summary (DYNAMIC)
// ----------------------------
async function loadAnswerSummary(q) {
  const { data } = await supabase
    .from("room_submissions")
    .select("selected, count")
    .eq("room_id", room.id)
    .eq("question_id", q.id);

  const counts = {};

  q.options.forEach((opt, idx) => {
    counts[idx] = 0;
  });

  data.forEach((x) => {
    counts[x.selected]++;
  });

  summaryBox.innerHTML = "<h3>Answer Summary</h3>";

  q.options.forEach((opt, idx) => {
    summaryBox.innerHTML += `
      <div class="option-summary">
        <strong>${opt.text || "Image Option"}</strong>
        — ${counts[idx]} votes
      </div>
    `;
  });
}

// ----------------------------
// Broadcast Scoreboard
// ----------------------------
async function broadcastScores() {
  const { data: players } = await supabase
    .from("room_players")
    .select("player_name, score")
    .eq("room_id", room.id)
    .order("score", { ascending: false });

  // movement tracking
  players.forEach((p, i) => {
    p.movement = previousPositions[p.player_name] - i || 0;
    previousPositions[p.player_name] = i;
  });

  broadcast("scores", { players });

  showHostScoreboard(players);
}

function showHostScoreboard(players) {
  summaryBox.innerHTML = "<h3>Scoreboard</h3>";

  players.forEach((p, i) => {
    summaryBox.innerHTML += `
      <div class="score-row" style="animation-delay:${i * 0.1}s">
        <span>${i + 1}. ${p.player_name}</span>
        <span>${p.score}</span>
        ${p.movement > 0 ? `<span class="up">▲ +${p.movement}</span>` : ""}
      </div>
    `;
  });
}

// ----------------------------
// End Quiz
// ----------------------------
endBtn.onclick = async () => {
  const { data: finalPlayers } = await supabase
    .from("room_players")
    .select("player_name, score")
    .eq("room_id", room.id)
    .order("score", { ascending: false });

  broadcast("final_results", { players: finalPlayers });

  summaryBox.innerHTML = "<h3>Quiz Ended</h3>";
  nextBtn.disabled = true;
  startBtn.disabled = true;
  endBtn.disabled = true;
};
