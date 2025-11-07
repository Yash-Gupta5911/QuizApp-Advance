import { supabase } from "./db.js";

const leaderboardBody = document.getElementById("leaderboardBody");
const quizTitleEl = document.getElementById("quizTitle");

const params = new URLSearchParams(window.location.search);
const quizId = params.get("quizId");

// Redirect if missing
if (!quizId) {
  leaderboardBody.innerHTML = "<tr><td colspan='4'>Quiz ID missing.</td></tr>";
}

// -------------------------------
// Load Quiz Title
// -------------------------------
async function loadQuizTitle() {
  const { data } = await supabase
    .from("quizzes")
    .select("title")
    .eq("id", quizId)
    .single();

  if (data) quizTitleEl.textContent = data.title;
}

// -------------------------------
// Load Leaderboard
// -------------------------------
async function loadLeaderboard() {
  const { data, error } = await supabase
    .from("responses")
    .select("player_name, score, submitted_at")
    .eq("quiz_id", quizId)
    .order("score", { ascending: false })
    .order("submitted_at", { ascending: true });

  if (error) {
    leaderboardBody.innerHTML = "<tr><td colspan='4'>Error loading leaderboard.</td></tr>";
    return;
  }

  if (!data.length) {
    leaderboardBody.innerHTML = "<tr><td colspan='4'>No submissions yet.</td></tr>";
    return;
  }

  leaderboardBody.innerHTML = "";

  data.forEach((p, i) => {
    leaderboardBody.innerHTML += `
      <tr>
        <td>${i + 1}</td>
        <td>${p.player_name}</td>
        <td>${p.score}</td>
        <td>${new Date(p.submitted_at).toLocaleTimeString()}</td>
      </tr>
    `;
  });
}

// -------------------------------
// Realtime Updates
// -------------------------------
supabase
  .channel("leaderboard-updates")
  .on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "responses",
      filter: `quiz_id=eq.${quizId}`
    },
    loadLeaderboard
  )
  .subscribe();

// Initial Load
loadQuizTitle();
loadLeaderboard();
