import { supabase } from "./db.js";

const params = new URLSearchParams(window.location.search);
const quizId = params.get("quizId");

let playerName = localStorage.getItem("playerName") || "Guest";

let questions = [];
let index = 0;
let score = 0;

let timerInterval;
let timePerQuestion = 15;
let timeLeft = timePerQuestion;

const quizTitle = document.getElementById("quizTitle");
const quizBox = document.getElementById("quizBox");
const questionText = document.getElementById("questionText");
const optionsDiv = document.getElementById("options");
const timerSpan = document.getElementById("timer");
const nextBtn = document.getElementById("nextBtn");

// ------------------------------------
// Load Quiz
// ------------------------------------
async function loadQuiz() {
  const { data: quizData } = await supabase
    .from("quizzes")
    .select("title")
    .eq("id", quizId)
    .single();

  quizTitle.textContent = quizData?.title || "Quiz";

  // Load questions
  const { data } = await supabase
    .from("questions")
    .select("*")
    .eq("quiz_id", quizId);

  if (!data || !data.length) {
    quizTitle.textContent = "No questions found.";
    return;
  }

  questions = data;
  quizBox.style.display = "block";
  showQuestion();
}

// ------------------------------------
// Show Question
// ------------------------------------
function showQuestion() {
  const q = questions[index];

  questionText.textContent = q.question;
  optionsDiv.innerHTML = "";
  nextBtn.style.display = "none";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("div");
    btn.className = "option";
    btn.innerHTML = `
      ${opt.text ? `<p>${opt.text}</p>` : ""}
      ${opt.image ? `<img src="${opt.image}" />` : ""}
    `;
    btn.onclick = () => selectAnswer(i);
    optionsDiv.appendChild(btn);
  });

  startTimer();
}

// ------------------------------------
// Timer
// ------------------------------------
function startTimer() {
  clearInterval(timerInterval);
  timeLeft = timePerQuestion;
  timerSpan.textContent = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    timerSpan.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      goNext();
    }
  }, 1000);
}

// ------------------------------------
// Select Answer
// ------------------------------------
function selectAnswer(i) {
  clearInterval(timerInterval);

  const correct = questions[index].correct_index;

  if (i === correct) score++;

  nextBtn.style.display = "block";
  nextBtn.onclick = goNext;
}

// ------------------------------------
// Next Question / End Quiz
// ------------------------------------
function goNext() {
  index++;
  if (index < questions.length) {
    showQuestion();
  } else {
    endQuiz();
  }
}

// ------------------------------------
// End Quiz
// ------------------------------------
function endQuiz() {
  document.body.innerHTML = `
    <div class="container" style="text-align:center; margin-top:50px;">
      <h2>🎉 Quiz Completed!</h2>
      <p><strong>${playerName}</strong>, you scored:</p>
      <h1>${score} / ${questions.length}</h1>

      <button class="home-btn" onclick="location.href='index.html'">
        Return Home
      </button>
    </div>
  `;
}

// Load the quiz
loadQuiz();
