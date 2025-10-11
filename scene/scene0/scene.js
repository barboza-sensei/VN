
const textElement = document.getElementById("text");
const optionsElement = document.getElementById("options");

const sceneData = {
  text: [
    "Despertás de pie.",
    "No sabés si estabas caminando o si alguien te dejó ahí.",
    "La calle parece infinita en ambas direcciones.",
    "Hay faroles, pero ninguno encendido.",
    "Una brisa te empuja apenas hacia adelante.",
    "A tu izquierda, una esquina con una vidriera rota.",
    "A tu derecha, un callejón estrecho que huele a lluvia antigua.",
    "Una voz que no se oye pero se siente murmura: 'Elegí un camino.'"
  ],
  options: [
    { text: "Doblar a la izquierda", next: "../scene1/index.html" },
    { text: "Doblar a la derecha", next: "../scene2/index.html" }
  ]
};

let currentLine = 0;

function showNextLine() {
  if (currentLine < sceneData.text.length) {
    textElement.textContent = sceneData.text[currentLine];
    currentLine++;
    setTimeout(showNextLine, 2500);
  } else {
    showOptions();
  }
}

function showOptions() {
  optionsElement.innerHTML = "";
  sceneData.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt.text;
    btn.onclick = () => (window.location.href = opt.next);
    optionsElement.appendChild(btn);
  });
}

window.onload = showNextLine;
