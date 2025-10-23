// ====================================================================
// === MÓDULO 1: ESTADO GLOBAL (Accesibilidad y Audio) ===
// ====================================================================

let isMuted = localStorage.getItem('gameMuted') === 'true';
let isDyslexiaMode = localStorage.getItem('dyslexiaMode') === 'true';

// --- Funciones de Control Global ---

function applyDyslexiaModeState() {
    if (isDyslexiaMode) {
        document.body.classList.add('dyslexia-mode');
    } else {
        document.body.classList.remove('dyslexia-mode');
    }
}

function toggleDyslexiaMode() {
    isDyslexiaMode = !isDyslexiaMode;
    
    localStorage.setItem('dyslexiaMode', isDyslexiaMode);
    applyDyslexiaModeState();

    const btn = document.getElementById('dyslexia-mode-button');
    if (btn) {
        btn.classList.toggle('active');
        btn.innerHTML = isDyslexiaMode ? 'Aa' : 'A';
        btn.title = isDyslexiaMode ? 'Modo Dislexia (ON)' : 'Modo Dislexia (OFF)';
    }
}

function initializeAudioState() {
    const musicPlayer = document.getElementById('backgroundMusic');
    if (musicPlayer) {
        musicPlayer.muted = isMuted;
        if (!isMuted) {
            musicPlayer.play().catch(error => {
                console.log("Audio play blocked by browser. User interaction needed.");
            });
        }
    }
}

function toggleMute() {
    const musicPlayer = document.getElementById('backgroundMusic');
    const muteButton = document.getElementById('muteButton');
    
    isMuted = !isMuted;
    localStorage.setItem('gameMuted', isMuted);

    if (musicPlayer) {
        musicPlayer.muted = isMuted;
        if (!isMuted) {
            musicPlayer.play().catch(e => console.log("Play on unmute failed:", e));
        }
    }
    
    if (muteButton) {
        if (isMuted) {
            muteButton.classList.add('muted');
            muteButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            muteButton.classList.remove('muted');
            muteButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
    }
}

function createGlobalButtons() {
    // Inicializar el botón de Mute (que ya existe en index.html)
    const muteButton = document.getElementById('muteButton');
    if (muteButton) {
        if (isMuted) {
            muteButton.classList.add('muted');
            muteButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
        } else {
            muteButton.classList.remove('muted');
            muteButton.innerHTML = '<i class="fas fa-volume-up"></i>';
        }
        muteButton.addEventListener('click', toggleMute);
        // Usar la clase global de CSS
        muteButton.classList.add('global-control-btn'); 
    }

    // Inicializar el botón de Modo Dislexia (que ya existe en index.html)
    const dyslexiaButton = document.getElementById('dyslexia-mode-button');
    if (dyslexiaButton) {
        dyslexiaButton.innerHTML = isDyslexiaMode ? 'Aa' : 'A';
        dyslexiaButton.title = isDyslexiaMode ? 'Modo Dislexia (ON)' : 'Modo Dislexia (OFF)';
        if (isDyslexiaMode) {
            dyslexiaButton.classList.add('active');
        }
        dyslexiaButton.addEventListener('click', toggleDyslexiaMode);
        // Usar la clase global de CSS
        dyslexiaButton.classList.add('global-control-btn');
    }
}


// ====================================================================
// === MÓDULO 2: MOTOR PRINCIPAL DEL JUEGO (story_engine) ===
// ====================================================================

let storyData;
let currentScene;
let score = 0;

// Referencias al DOM inicializadas una sola vez
const narrative = document.getElementById('narrative');
const question = document.getElementById('question');
const inputArea = document.getElementById('input-area');
const choicesDiv = document.getElementById('choices');
const nextBtn = document.getElementById('nextBtn');
const answerInput = document.getElementById('answerInput');

// Función para inicializar el motor del juego
async function loadStory() {
  // Solo cargar el JSON si estamos en una escena de juego (donde existe #narrative)
  if (!narrative) return; 

  const res = await fetch('story.json');
  storyData = await res.json();
  
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.onclick = checkAnswer;
  }
  showScene(storyData.intro);
}

// --- UTILIDADES ---

function resetUI() {
    inputArea.style.display = 'none';
    choicesDiv.innerHTML = '';
    nextBtn.style.display = 'none';
    if (answerInput) answerInput.value = '';
}

function showText(scene) {
    if (!narrative || !question) return;

    // Aplicar el efecto fade-text a los contenedores
    narrative.classList.remove('fade-text');
    question.classList.remove('fade-text');
    
    // Forzar reflow para reiniciar la animación
    void narrative.offsetWidth; 
    void question.offsetWidth;

    narrative.textContent = scene.text || '';
    question.textContent = scene.question || '';

    narrative.classList.add('fade-text');
    question.classList.add('fade-text');
}

// --- LÓGICA DE ESCENAS ---

function showScene(scene) {
  currentScene = scene;
  resetUI();
  showText(scene);

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
    return;
  }

  // --- Escenas de ordenamiento ---
  if (scene.type === 'ordering') {
    handleOrderingScene(scene);
    return;
  }
  
  // --- Escenas de narrativa simple (Continuar) ---
  if (scene.nextScene) {
      nextBtn.style.display = 'block';
      nextBtn.onclick = () => loadNextScene(scene.nextScene);
  }
}

function handleOrderingScene(scene) {
    // ... (La lógica de ordering es extensa, se mantiene igual que la versión anterior) ...
    const container = document.createElement('div');
    container.classList.add('ordering-container');
    choicesDiv.appendChild(container);

    const steps = scene.steps.map((step, i) => ({ text: step, index: i }));
    steps.sort(() => Math.random() - 0.5);

    let pickedIndices = [];
    
    const orderDisplay = document.createElement('p');
    orderDisplay.classList.add('order-display');
    const updateDisplay = () => {
        const orderText = pickedIndices.map(i => scene.steps[i]).join(' → ');
        orderDisplay.textContent = `Tu orden: ${orderText || '(vacío)'}`;
    };
    updateDisplay();
    choicesDiv.appendChild(orderDisplay);
    
    steps.forEach(step => {
      const btn = document.createElement('button');
      btn.textContent = step.text;
      btn.classList.add('ordering-step');
      btn.addEventListener('click', () => {
        if (!btn.disabled) {
          pickedIndices.push(step.index);
          btn.disabled = true;
          btn.classList.add('selected');
          updateDisplay();
        }
      });
      container.appendChild(btn);
    });

    const done = document.createElement('button');
    done.textContent = 'Confirmar orden';
    done.classList.add('btn-done');
    done.addEventListener('click', () => {
        container.querySelectorAll('button').forEach(b => b.disabled = true);
        done.disabled = true;

        const correctOrder = scene.correctOrder;
        const isCorrect =
            pickedIndices.length === correctOrder.length &&
            pickedIndices.every((v, i) => v === correctOrder[i]);

        if (isCorrect) {
            score++;
            showText({ text: scene.transitionSuccess || 'El orden es correcto.' });
        } else {
            showText({ text: scene.transitionFail || 'El orden no es correcto.' });
        }

        orderDisplay.remove();
        container.remove();
        
        setTimeout(() => {
            nextBtn.style.display = 'block';
            nextBtn.onclick = () => loadNextScene(scene.nextScene);
        }, 1200);
    });

    container.appendChild(done);
}


function checkAnswer() {
  if (!answerInput || !currentScene.answer) return;

  const userAns = answerInput.value.trim();
  
  answerInput.disabled = true; 
  document.getElementById('submitBtn').disabled = true;

  if (userAns === currentScene.answer) {
    score++;
    showText({ text: currentScene.transitionSuccess || 'Correcto.' });
  } else {
    showText({ text: currentScene.transitionFail || 'Incorrecto.' });
  }

  inputArea.style.display = 'none';

  setTimeout(() => {
    nextBtn.style.display = 'block';
    nextBtn.onclick = () => loadNextScene(currentScene.nextScene);
  }, 1000);
}

function loadNextScene(id) {
  if (answerInput) {
      answerInput.disabled = false;
      const submitBtn = document.getElementById('submitBtn');
      if (submitBtn) submitBtn.disabled = false;
  }

  if (id === 'final') {
    showFinal();
  } else {
    const next = storyData.scenes.find(s => s.id === id);
    if (next) showScene(next);
  }
}

function showFinal() {
  resetUI();
  
  let ending;
  if (score >= 7) ending = storyData.finals.good;
  else if (score >= 4) ending = storyData.finals.neutral;
  else ending = storyData.finals.bad;

  showText({ 
      text: ending.text + `\n\n[Puntuación final: ${score} puntos]`, 
      question: ending.title 
  });
}


// ====================================================================
// === INICIALIZACIÓN (Se ejecuta al cargar el DOM) ===
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar y crear los botones globales (Mute/Dislexia)
    applyDyslexiaModeState();
    createGlobalButtons();
    initializeAudioState();
    
    // 2. Cargar el motor del juego (solo si está en una escena de juego)
    // El motor usa elementos específicos (#narrative, etc.) que NO están en index.html
    loadStory(); 
});
  
