import { supabase } from "./db.js";

// ✅ Get Quiz ID
const params = new URLSearchParams(window.location.search);
const quizId = params.get("quizId");

// ✅ Redirect if quizId is missing
if (!quizId) {
  alert("Quiz ID missing.");
  location.href = "index.html";
}

// ✅ Import Handler
document.getElementById("importBtn").onclick = async () => {
  const file = document.getElementById("fileInput").files[0];
  if (!file) return alert("Please upload an Excel file!");

  const reader = new FileReader();

  reader.onload = async (e) => {
    const data = new Uint8Array(e.target.result);
    const workbook = XLSX.read(data, { type: "array" });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (!rows.length) {
      return alert("Excel sheet is empty or invalid format.");
    }

    let success = 0;

    for (let row of rows) {
      if (!row.question || !row.options || row.correct_index === undefined) {
        console.warn("Skipping invalid row:", row);
        continue;
      }

      const questionText = row.question;
      const questionImage = row.question_image || null;

      // ✅ Parse options
      const options = row.options.split(",").map(o => o.trim());

      // ✅ Parse option images (optional)
      let optionImages = [];
      if (row.option_images) {
        optionImages = row.option_images.split(",").map(o => o.trim());
      }

      // ✅ Build option object list
      const optionObjects = options.map((text, i) => ({
        text,
        image: optionImages[i] || null
      }));

      // ✅ Insert into Supabase
      const { error } = await supabase.from("questions").insert([
        {
          quiz_id: quizId,
          question: questionText,
          image: questionImage,
          options: optionObjects,
          correct_index: parseInt(row.correct_index)
        }
      ]);

      if (!error) success++;
    }

    alert(`✅ Imported ${success} question(s) successfully!`);
    window.location.href = "index.html";
  };

  reader.readAsArrayBuffer(file);
};
