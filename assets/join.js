import { supabase } from "./db.js";

document.getElementById("joinForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const playerName = document.getElementById("playerName").value.trim();
  const quizCode = document.getElementById("quizCode").value.trim().toUpperCase();

  if (!playerName || !quizCode) {
    return alert("Please fill all fields");
  }

  // ✅ Check quiz code
  const { data, error } = await supabase
    .from("quizzes")
    .select("id")
    .eq("code", quizCode)
    .single();

  if (error || !data) {
    return alert("❌ Invalid Quiz Code");
  }

  // ✅ Save name locally
  localStorage.setItem("playerName", playerName);

  // ✅ Go to quiz
  window.location.href = `quiz.html?quizId=${data.id}`;
});
