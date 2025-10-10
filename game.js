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

  inputArea.style.display = 'none';
  choicesDiv.innerHTML = '';
  nextBtn.style.display = 'none';

  // --- Escenas con opciones múltiples ---
  if (scene.choices) {
    scene.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.textContent = choice.text;
      btn.onclick = () => loadNextScene(choice.nextScene);
      choicesDiv.appendChild(btn);
    });
    return;
  }

  // --- Escenas de respuesta escrita ---
  if (scene.type === 'input') {
    inputArea.style.display = 'block';
    document.getElementById('submitBtn').onclick = checkAnswer;
    nextBtn.onclick = () => loadNextScene(scene.nextScene);
    return;
  }

  // --- Escenas de ordenamiento (nuevo tipo) ---
  if (scene.type === 'ordering') {
    const container = document.createElement('div');
    container.classList.add('ordering-container');

    // Mezclamos los pasos
    const steps = scene.steps.map((step, i) => ({ text: step, index: i }));
    steps.sort(() => Math.random() - 0.5);

    const picked = [];
    const orderDisplay = document.createElement('p');
    orderDisplay.classList.add('order-display');
    orderDisplay.textContent = 'Tu orden: (vacío)';

    // Renderizar botones de pasos
    steps.forEach(step => {
      const btn = document.createElement('button');
      btn.textContent = step.text;
      btn.classList.add('ordering-step');
      btn.addEventListener('click', () => {
        if (!picked.includes(step.index)) {
          picked.push(step.index);
          btn.disabled = true;
          btn.classList.add('picked');
          orderDisplay.textContent =
            'Tu orden: ' + picked.map(i => scene.steps[i]).join(' → ');
        }
      });
      container.appendChild(btn);
    });

    const done = document.createElement('button');
    done.textContent = 'Confirmar orden';
    done.classList.add('btn-done');
    done.addEventListener('click', () => {
      const correct = scene.correctOrder;
      const ok =
        picked.length === correct.length &&
        picked.every((v, i) => v === correct[i]);

      if (ok) {
        score++;
        narrative.textContent =
          scene.transitionSuccess || 'El orden es correcto.';
      } else {
        narrative.textContent =
          scene.transitionFail || 'El orden no es correcto.';
      }

      // Limpia botones y muestra transición antes de continuar
      container.remove();
      orderDisplay.remove();

      // Pequeña pausa antes de mostrar "Siguiente"
      setTimeout(() => {
        nextBtn.style.display = 'block';
      }, 1000);
    });

    container.appendChild(done);
    choicesDiv.appendChild(container);
    choicesDiv.appendChild(orderDisplay);

    nextBtn.onclick = () => loadNextScene(scene.nextScene);
    return;
  }
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

  // breve pausa antes del botón siguiente
  setTimeout(() => {
    nextBtn.style.display = 'block';
  }, 1000);
}

function loadNextScene(id) {
  if (id === 'final') {
    showFinal();
  } else {
    const next = storyData.scenes.find(s => s.id === id);
    if (next) showScene(next);
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
