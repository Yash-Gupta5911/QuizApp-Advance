import { supabase } from "./db.js";

// Redirect if not logged in
async function checkAuth() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    alert("Please login to create a quiz.");
    location.href = "index.html";
  }
}

checkAuth();

// Utility: generate safe unique code
function generateCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

document.getElementById("saveQuizBtn").onclick = async () => {
  const title = quizTitle.value.trim();
  const description = quizDesc.value.trim();
  const is_public = quizPublic.checked;

  if (title.length < 3) {
    alert("Title must be at least 3 characters.");
    return;
  }

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    alert("You must be logged in to create a quiz");
    return;
  }

  const creator_id = userData.user.id;
  const code = generateCode();

  const { data, error } = await supabase
    .from("quizzes")
    .insert([
      { title, description, is_public, code, creator_id }
    ])
    .select();

  if (error) {
    alert("Error creating quiz: " + error.message);
    return;
  }

  alert("✅ Quiz Created! Now add questions.");
  window.location.href = `add-questions.html?quizId=${data[0].id}`;
};
