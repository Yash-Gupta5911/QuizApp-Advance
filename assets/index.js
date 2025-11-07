// -----------------------------------------
// IMPORT SUPABASE
// -----------------------------------------
import { supabase } from "./db.js";

// -----------------------------------------
// DOM ELEMENTS
// -----------------------------------------
const quizList = document.getElementById("quizList");
const authModal = document.getElementById("authModal");
const authTitle = document.getElementById("authTitle");
const authActionBtn = document.getElementById("authActionBtn");
const authToggle = document.getElementById("authToggle");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const creatorOptions = document.getElementById("creatorOptions");
const authSection = document.getElementById("authSection");
const userNameSpan = document.getElementById("userName");

let isSignup = false;
let currentUser = null;

// -----------------------------------------
// LOAD PUBLIC QUIZZES
// -----------------------------------------
async function loadPublicQuizzes() {
  const { data, error } = await supabase
    .from("quizzes")
    .select("id, title, description, code, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    quizList.innerHTML = `<p style="color:red;">Error loading quizzes.</p>`;
    return;
  }

  if (!data.length) {
    quizList.innerHTML = `<p>No public quizzes yet. Be the first to create one!</p>`;
    return;
  }

  quizList.innerHTML = "";
  data.forEach((q) => {
    const card = document.createElement("div");
    card.className = "quiz-card";
    card.onclick = () => {
      const player = prompt("Enter your name to play:") || "Guest";
      localStorage.setItem("playerName", player);
      window.location.href = `quiz.html?quizId=${q.id}`;
    };

    card.innerHTML = `
      <h3>${q.title}</h3>
      <p>${q.description || ""}</p>
      <small>Code: <strong>${q.code}</strong></small>
    `;

    quizList.appendChild(card);
  });
}

loadPublicQuizzes();

// -----------------------------------------
// SHOW AUTH MODAL
// -----------------------------------------
loginBtn.onclick = () => {
  authModal.style.display = "flex";
};

// Close when clicking outside
window.onclick = (e) => {
  if (e.target === authModal) authModal.style.display = "none";
};

// -----------------------------------------
// TOGGLE LOGIN / SIGNUP
// -----------------------------------------
authToggle.onclick = () => {
  isSignup = !isSignup;

  if (isSignup) {
    authTitle.textContent = "Create an Account";
    authActionBtn.textContent = "Sign Up";
    authToggle.textContent = "Already have an account? Login";
  } else {
    authTitle.textContent = "Login to QuizVerse";
    authActionBtn.textContent = "Login";
    authToggle.textContent = "Don’t have an account? Sign up";
  }
};

// -----------------------------------------
// HANDLE LOGIN OR SIGNUP
// -----------------------------------------
authActionBtn.onclick = async () => {
  const email = authEmail.value.trim();
  const password = authPassword.value.trim();
  if (!email || !password) return alert("Enter email + password");

  let result;

  if (isSignup) {
    result = await supabase.auth.signUp({ email, password });

    if (result.error) return alert(result.error.message);

    // ✅ Insert user profile into "users" table
    if (result.data?.user) {
      const { error: dbError } = await supabase.from("users").insert([
        {
          id: result.data.user.id,
          email: result.data.user.email,
          name: result.data.user.email.split("@")[0]
        }
      ]);

      if (dbError) alert("Database error adding user profile");
    }
  } else {
    result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) return alert(result.error.message);
  }

  // ✅ Close modal and refresh session
  authModal.style.display = "none";
  checkSession();
};

// -----------------------------------------
// LOGOUT
// -----------------------------------------
logoutBtn.onclick = async () => {
  await supabase.auth.signOut();
  currentUser = null;
  checkSession();
};

// -----------------------------------------
// CHECK USER SESSION
// -----------------------------------------
async function checkSession() {
  const { data } = await supabase.auth.getSession();
  currentUser = data?.session?.user || null;

  if (currentUser) {
    authSection.style.display = "none";
    creatorOptions.style.display = "block";
    userNameSpan.textContent = currentUser.email.split("@")[0];
  } else {
    authSection.style.display = "block";
    creatorOptions.style.display = "none";
  }
}

checkSession();

// -----------------------------------------
// AUTO REFRESH ON AUTH CHANGE
// -----------------------------------------
supabase.auth.onAuthStateChange(() => {
  checkSession();
});
