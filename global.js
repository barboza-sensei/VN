// ====================================================================
// === MÓDULO 1: ESTADO GLOBAL (Accesibilidad y Audio) ===
// ====================================================================

// 🚨 CAMBIO DE ESTADO INICIAL: La música comienza SILENCIADA si no hay estado guardado.
// isMuted = true si localStorage es 'true' O si no hay estado guardado (null).
let isMuted = localStorage.getItem('gameMuted') === 'true';
if (localStorage.getItem('gameMuted') === null) {
    isMuted = true;
}

let isDyslexiaMode = localStorage.getItem('dyslexiaMode') === 'true';

// 🚨 NUEVO: La voz/narración comienza INACTIVA si no hay estado guardado.
let isVoiceActive = localStorage.getItem('gameVoiceActive') === 'true'; 
if (localStorage.getItem('gameVoiceActive') === null) {
    isVoiceActive = false;
}

// 🚨 NUEVO: Referencia global para la pista de audio de la narración actual.
let currentNarrativeAudio = null; 


// --- Funciones de Control Global ---

function applyDyslexiaModeState() {
    // 🚨 CLAVE: Aplica la clase inmediatamente para persistencia
    if (isDyslexiaMode) {
        document.body.classList.add('dyslexia-mode'); 
    } else {
        document.body.classList.remove('dyslexia-mode');
    }
}

// CLAVE: Llama inmediatamente al inicio del script para aplicar el estado guardado
applyDyslexiaModeState(); 


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
        // Aplica el estado de silencio (que ahora es TRUE por defecto)
        musicPlayer.muted = isMuted;
    }
    // No hay que inicializar la voz aquí, ya que se maneja en showText.
}

function toggleMute() {
    const musicPlayer = document.getElementById('backgroundMusic');
    const muteButton = document.getElementById('muteButton');
    
    isMuted = !isMuted;
    localStorage.setItem('gameMuted', isMuted);

    if (musicPlayer) {
        musicPlayer.muted = isMuted;
        
        if (!isMuted) {
            // Intentar reproducir al desmutear
            musicPlayer.play().catch(e => console.error("Play on unmute failed:", e));
        } else {
            musicPlayer.pause();
        }
    }
    
    if (muteButton) {
        // Actualiza el icono y la clase visual
        if (isMuted) {
            muteButton.classList.add('muted');
            muteButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
            muteButton.title = 'Silenciar/Activar Música (Silenciada)';
        } else {
            muteButton.classList.remove('muted');
            muteButton.innerHTML = '<i class="fas fa-volume-up"></i>';
            muteButton.title = 'Silenciar/Activar Música (Activada)';
        }
    }
}

// 🚨 NUEVA FUNCIÓN: Alternar las pistas de voz
function toggleVoice() {
    isVoiceActive = !isVoiceActive;
    localStorage.setItem('gameVoiceActive', isVoiceActive);
    
    // Si se desactiva, detener la reproducción de inmediato.
    if (!isVoiceActive && currentNarrativeAudio) {
        currentNarrativeAudio.pause();
        currentNarrativeAudio = null;
    }

    const btn = document.getElementById('voiceButton');
    if (btn) {
        btn.classList.toggle('active');
        btn.title = isVoiceActive ? 'Voz/Narración (ON)' : 'Voz/Narración (OFF)';
    }
}

function createGlobalButtons() {
    const muteButton = document.getElementById('muteButton');
    if (muteButton) {
        // Inicializar icono y clase (Ahora refleja el estado inicial de isMuted=true)
        if (isMuted) {
            muteButton.classList.add('muted');
            muteButton.innerHTML = '<i class="fas fa-volume-mute"></i>';
            muteButton.title = 'Silenciar/Activar Música (Silenciada)';
        } else {
            muteButton.classList.remove('muted');
            muteButton.innerHTML = '<i class="fas fa-volume-up"></i>';
            muteButton.title = 'Silenciar/Activar Música (Activada)';
        }
        muteButton.addEventListener('click', toggleMute);
        muteButton.classList.add('global-control-btn'); 
    }

    const dyslexiaButton = document.getElementById('dyslexia-mode-button');
    if (dyslexiaButton) {
        dyslexiaButton.innerHTML = isDyslexiaMode ? 'Aa' : 'A';
        dyslexiaButton.title = isDyslexiaMode ? 'Modo Dislexia (ON)' : 'Modo Dislexia (OFF)';
        if (isDyslexiaMode) {
            dyslexiaButton.classList.add('active');
        }
        dyslexiaButton.addEventListener('click', toggleDyslexiaMode);
        dyslexiaButton.classList.add('global-control-btn');
    }

    // 🚨 NUEVO: Inicializar el botón de Voz/Narración
    const voiceButton = document.getElementById('voiceButton');
    if (voiceButton) {
        if (isVoiceActive) {
            voiceButton.classList.add('active');
        }
        voiceButton.title = isVoiceActive ? 'Voz/Narración (ON)' : 'Voz/Narración (OFF)';
        voiceButton.addEventListener('click', toggleVoice);
        voiceButton.classList.add('global-control-btn');
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

// Función para inicializar el motor del juego (Solo en escenas de juego)
async function loadStory() {
  if (!narrative) return; 

  try {
      const res = await fetch('story.json');
      storyData = await res.json();
  } catch (error) {
      console.error("Error al cargar story.json:", error);
      narrative.textContent = "Error: No se pudo cargar el archivo de la historia.";
      return;
  }
  
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.onclick = checkAnswer;
  }
  showScene(storyData.intro);
}

// --- UTILIDADES ---

function resetUI() {
    if (inputArea) inputArea.style.display = 'none';
    if (choicesDiv) choicesDiv.innerHTML = '';
    if (nextBtn) nextBtn.style.display = 'none';
    if (answerInput) answerInput.value = '';
}

function showText(scene) {
    if (!narrative || !question) return;

    // 🚨 Detener el audio narrativo anterior
    if (currentNarrativeAudio) {
        currentNarrativeAudio.pause(); 
        currentNarrativeAudio = null;
    }

    narrative.classList.remove('fade-text');
    question.classList.remove('fade-text');
    void narrative.offsetWidth; 
    void question.offsetWidth;

    narrative.textContent = scene.text || '';
    question.textContent = scene.question || '';

    narrative.classList.add('fade-text');
    question.classList.add('fade-text');
    
    // 🚨 NUEVA LÓGICA DE REPRODUCCIÓN DE VOZ 🚨
    if (isVoiceActive && scene.audioPath) {
        currentNarrativeAudio = new Audio(scene.audioPath);
        
        currentNarrativeAudio.play().catch(e => {
            console.warn("No se pudo reproducir la narración (Error/Archivo no encontrado):", e);
        });
    }
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
      // 🚨 Detener la voz al hacer clic en una opción
      btn.onclick = () => {
          if (currentNarrativeAudio) currentNarrativeAudio.pause();
          loadNextScene(choice.nextScene);
      };
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
      // 🚨 Detener la voz al hacer clic en Siguiente
      nextBtn.onclick = () => {
          if (currentNarrativeAudio) currentNarrativeAudio.pause();
          loadNextScene(scene.nextScene);
      };
  }
}

function handleOrderingScene(scene) {
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
            // 🚨 Detener la voz al hacer clic en Siguiente
            nextBtn.onclick = () => {
                if (currentNarrativeAudio) currentNarrativeAudio.pause();
                loadNextScene(scene.nextScene);
            };
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
    // 🚨 Detener la voz al hacer clic en Siguiente
    nextBtn.onclick = () => {
        if (currentNarrativeAudio) currentNarrativeAudio.pause();
        loadNextScene(currentScene.nextScene);
    };
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
  
  // 🚨 Detener cualquier audio narrativo en el final
  if (currentNarrativeAudio) {
      currentNarrativeAudio.pause();
      currentNarrativeAudio = null;
  }
  
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
// === INICIALIZACIÓN DE SCRIPTS ===
// ====================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicializar audio y botones globales
    createGlobalButtons();
    initializeAudioState();
    
    // Iniciar el motor del juego (solo se ejecutará en escenas de juego)
    loadStory(); 
});
        
