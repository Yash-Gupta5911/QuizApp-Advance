const quizData = [
    {
        question: "What does HTML stand for?",
        options: ["Hyper Trainer Marking Language", "Hyper Text Marketing Language", "Hyper Text Markup Language", "Hyper Tool Multi Language"],
        answer: 2
    },
    {
        question: "Which HTML tag is used to create a hyperlink?",
        options: ["link tag", "anchor tag", "href", "hyper tag"],
        answer: 1
    },
    {
        question: "Which property is used in CSS to change the text color?",
        options: ["font-color", "text-color", "color", "background-color"],
        answer: 3
    },
    {
        question: "How do you insert a comment in a CSS file?",
        options: ["// this is a comment", "!-- this is a comment --", "/* this is a comment */", "# this is a comment"],
        answer: 1
    },
    {
        question: "Which HTML tag is used to define an unordered list?",
        options: ["ordered list", "unordered list", "list item", "list"],
        answer: 2
    },
    {
        question: "Which programming language is known as the 'language of the web'?",
        options: ["Python", "Java", "JavaScript", "C++"],
        answer: 2
    },
    {
        question: "What is the default position value of an HTML element in CSS?",
        options: ["relative", "fixed", "static", "absolute"],
        answer: 2
    },
    {
        question: "Which CSS property controls the size of text?",
        options: ["font-style", "text-size", "font-size", "text-style"],
        answer: 2
    },
    {
        question: "Which tag is used to insert an image in HTML?",
        options: ["img tag", "image tag", "src tag", "pic tag"],
        answer: 0
    },
    {
        question: "Which CSS property is used to make text bold?",
        options: ["font-weight", "font-style", "text-decoration", "text-weight"],
        answer: 1
    }
];

let currentQuestion = 0;
let userAnswers = new Array(quizData.length).fill(null);

function startQuiz() {
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('quizScreen').style.display = 'block';
    loadQuestion();
}

function loadQuestion() {
    const question = quizData[currentQuestion];
    document.getElementById('questionCounter').textContent = `Question ${currentQuestion + 1} of ${quizData.length}`;
    document.getElementById('questionText').textContent = question.question;

    const progressPercent = ((currentQuestion + 1) / quizData.length) * 100;
    document.getElementById('progressFill').style.width = progressPercent + '%';

    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'option';
        if (userAnswers[currentQuestion] === index) {
            optionDiv.classList.add('selected');
        }
        optionDiv.innerHTML = `<span class="option-label">${String.fromCharCode(65 + index)}</span>${option}`;
        optionDiv.onclick = () => selectOption(index);
        optionsContainer.appendChild(optionDiv);
    });

    updateNavigationButtons();
}

function selectOption(index) {
    userAnswers[currentQuestion] = index;
    const options = document.querySelectorAll('.option');
    options.forEach((opt, i) => {
        if (i === index) {
            opt.classList.add('selected');
        } else {
            opt.classList.remove('selected');
        }
    });
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const navigationButtons = document.getElementById('navigationButtons');

    if (currentQuestion === quizData.length - 1) {
        navigationButtons.style.display = 'none';
        submitBtn.classList.remove('hidden');
    } else {
        navigationButtons.style.display = 'flex';
        submitBtn.classList.add('hidden');

        if (currentQuestion === 0) {
            prevBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'block';
        }
    }
}

function nextQuestion() {
    if (currentQuestion < quizData.length - 1) {
        currentQuestion++;
        loadQuestion();
    }
}

function previousQuestion() {
    if (currentQuestion > 0) {
        currentQuestion--;
        loadQuestion();
    }
}

function submitQuiz() {
    document.getElementById('popupOverlay').style.display = 'flex';
}

function closePopup() {
    document.getElementById('popupOverlay').style.display = 'none';
    currentQuestion = 0;
    userAnswers = new Array(quizData.length).fill(null);
    document.getElementById('quizScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'block';
}
