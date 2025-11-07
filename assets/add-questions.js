import { supabase } from "./db.js";

const params = new URLSearchParams(window.location.search);
const quizId = params.get("quizId");

// Redirect if invalid quiz
if (!quizId) {
  alert("Missing quiz ID");
  location.href = "index.html";
}

// Fix Excel import button
document.getElementById("importBtn").onclick = () => {
  window.location.href = `import.html?quizId=${quizId}`;
};

let options = [];

// ----------------------
// Refresh Options UI
// ----------------------
function refreshOptionsUI() {
  const list = document.getElementById("optionsList");
  const correct = document.getElementById("correctIndex");

  list.innerHTML = "";
  correct.innerHTML = "";

  options.forEach((opt, i) => {
    list.innerHTML += `
      <div class="option-edit-row">
        <input placeholder="Option text"
               value="${opt.text}"
               onchange="updateOptionText(${i}, this.value)" />

        <input type="file" onchange="uploadOptionImage(${i}, event)">

        ${opt.image ? `<img src="${opt.image}" class="option-image">` : ""}

        <button class="deleteOptionBtn" onclick="removeOption(${i})">X</button>
      </div>
    `;

    correct.innerHTML += `<option value="${i}">Option ${i + 1}</option>`;
  });
}

// ----------------------
// Add/Remove Options
// ----------------------
window.addOption = () => {
  options.push({ text: "", image: null });
  refreshOptionsUI();
};
document.getElementById("addOptionBtn").onclick = addOption;

window.removeOption = (i) => {
  options.splice(i, 1);
  refreshOptionsUI();
};

window.updateOptionText = (i, text) => {
  options[i].text = text;
};

// ----------------------
// Upload Option Image
// ----------------------
window.uploadOptionImage = async (i, event) => {
  const file = event.target.files[0];
  if (!file) return;

  const filePath = `options/${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage.from("quiz-media").upload(filePath, file);

  if (error) {
    alert("Upload error");
    return;
  }

  options[i].image = supabase.storage.from("quiz-media").getPublicUrl(filePath).data.publicUrl;
  refreshOptionsUI();
};

// ----------------------
// Save Question
// ----------------------
document.getElementById("addBtn").onclick = async () => {
  const text = question.value.trim();

  if (!text) return alert("Enter question text");
  if (options.length < 2) return alert("Add at least 2 options");

  // Filter out empty options
  const cleanOptions = options.filter(o => o.text.trim() !== "" || o.image);

  if (cleanOptions.length < 2) {
    return alert("Please add at least 2 valid options (not empty).");
  }

  let qImage = null;
  const qImgFile = document.getElementById("questionImage").files[0];

  if (qImgFile) {
    const path = `questions/${Date.now()}-${qImgFile.name}`;
    await supabase.storage.from("quiz-media").upload(path, qImgFile);
    qImage = supabase.storage.from("quiz-media").getPublicUrl(path).data.publicUrl;
  }

  const correct_index = parseInt(document.getElementById("correctIndex").value);

  const { error } = await supabase.from("questions").insert([
    {
      quiz_id: quizId,
      question: text,
      options: cleanOptions,
      correct_index,
      image: qImage
    }
  ]);

  if (error) {
    alert(error.message);
    return;
  }

  options = [];
  question.value = "";
  questionImage.value = "";
  refreshOptionsUI();
};

// Finish Quiz
document.getElementById("finishBtn").onclick = () => {
  window.location.href = "index.html";
};

// Init
refreshOptionsUI();
