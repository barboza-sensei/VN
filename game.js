let storyData;
let currentScene;
let score = 0;

async function loadStory() {
  const res = await fetch('story.json');
  storyData = await res.json();
  showScene(storyData.intro);
}

function showScene(scene) {
  const narrative = document.getElementById('narrative');
  const question = document.getElementById('question');
  const inputArea = document.getElementById('input-area');
  const choicesDiv = document.getElementById('choices');
  const nextBtn = document.getElementById('nextBtn');

  currentScene = scene;
  narrative.textContent = scene.text || '';
  question.textContent = scene.question || '';

  inputArea.style.display = scene.type === 'input' ? 'block' : 'none';
  choicesDiv.innerHTML = '';
  nextBtn.style.display = 'none';

  if (scene.choices) {
    inputArea.style.display = 'none';
    scene.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.textContent = choice.text;
      btn.onclick = () => loadNextScene(choice.nextScene);
      choicesDiv.appendChild(btn);
    });
  }

  document.getElementById('submitBtn').onclick = checkAnswer;
  nextBtn.onclick = () => loadNextScene(scene.nextScene);
}

function checkAnswer() {
  const userAns = document.getElementById('answerInput').value.trim();
  const narrative = document.getElementById('narrative');
  const question = document.getElementById('question');
  const nextBtn = document.getElementById('nextBtn');
  const inputArea = document.getElementById('input-area');

  if (!currentScene.answer) return;

  if (userAns === currentScene.answer) {
    score++;
    narrative.textContent = currentScene.transitionSuccess || 'Correcto.';
  } else {
    narrative.textContent = currentScene.transitionFail || 'Incorrecto.';
  }

  question.textContent = '';
  inputArea.style.display = 'none';
  nextBtn.style.display = 'block';
}

function loadNextScene(id) {
  if (id === 'final') {
    showFinal();
  } else {
    const next = storyData.scenes.find(s => s.id === id);
    showScene(next);
  }
}

function showFinal() {
  const narrative = document.getElementById('narrative');
  const question = document.getElementById('question');
  const inputArea = document.getElementById('input-area');
  const choicesDiv = document.getElementById('choices');
  const nextBtn = document.getElementById('nextBtn');

  inputArea.style.display = 'none';
  choicesDiv.innerHTML = '';
  nextBtn.style.display = 'none';

  let ending;
  if (score >= 7) ending = storyData.finals.good;
  else if (score >= 4) ending = storyData.finals.neutral;
  else ending = storyData.finals.bad;

  narrative.textContent = ending.text;
  question.textContent = ending.title;
}

loadStory();
