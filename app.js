// === ✨ AUREUM PRECISION ENGINE v3.8 ===

const displayCurrent = document.getElementById('display-current');
const displayExpression = document.getElementById('display-expression');
const keypad = document.getElementById('keypad');
const drawer = document.getElementById('history-drawer');
const historyContent = document.getElementById('history-content');
const btnScientific = document.getElementById('toggle-scientific');

let currentInput = '0';
let expression = '';
let isCalculated = false;
let historyLog = [];

// --- 1. ТЕМИ & UI КОНТРОЛ ---
document.querySelectorAll('.theme-pill').forEach(pill => {
  pill.addEventListener('click', (e) => {
    document.querySelectorAll('.theme-pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');
    document.documentElement.setAttribute('data-theme', e.target.dataset.themeSet);
  });
});

document.getElementById('toggle-history').addEventListener('click', () => drawer.classList.add('open'));
document.getElementById('close-history').addEventListener('click', () => drawer.classList.remove('open'));
document.getElementById('clear-history').addEventListener('click', () => { historyLog = []; renderHistory(); });

btnScientific.addEventListener('click', () => {
  keypad.classList.toggle('scientific-active');
  btnScientific.classList.toggle('active');
  triggerTactileAudio();
});

// --- 2. PRECISION MATH ENGINE & FACTORIAL ---
function sanitizeFloat(num) {
  if (isNaN(num) || !isFinite(num)) return "Error";
  if (Number.isInteger(num)) return num;
  return parseFloat(Number(num).toPrecision(12));
}

// Изчисляване на факториел (x!)
function calculateFactorial(n) {
  if (n < 0 || !Number.isInteger(n)) return "Error";
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return sanitizeFloat(res);
}

// --- 3. CORE LOGIC ---
keypad.addEventListener('click', (e) => {
  const target = e.target.closest('button');
  if (!target) return;
  
  const value = target.dataset.value;
  const operator = target.dataset.operator;
  const action = target.dataset.action;

  if (value) appendValue(value);
  if (operator) setOperator(operator);
  if (action) executeAction(action);
  
  triggerTactileAudio();
});

function appendValue(val) {
  if (isCalculated) { currentInput = ''; isCalculated = false; }
  
  if (val === 'π') { currentInput = String(sanitizeFloat(Math.PI)); isCalculated = true; updateDisplay(); return; }
  if (val === 'e') { currentInput = String(sanitizeFloat(Math.E)); isCalculated = true; updateDisplay(); return; }

  if (currentInput === '0' && val !== '.') currentInput = '';
  if (val === '.' && currentInput.includes('.')) return;
  
  currentInput += val;
  updateDisplay();
}

function setOperator(op) {
  if (isCalculated) isCalculated = false;
  if (currentInput === 'Error') currentInput = '0';
  
  // Верижно смятане и смяна на знаци
  if (currentInput === '0' && expression.length > 0) {
    expression = expression.trim().slice(0, -1).trim() + ` ${op} `;
  } else {
    expression += `${currentInput} ${op} `;
  }
  
  currentInput = '0';
  updateDisplay();
}

function executeAction(action) {
  if (action === 'clear') { currentInput = '0'; expression = ''; }
  if (action === 'clear-entry') { currentInput = '0'; } 
  
  if (action === 'backspace') {
    if (isCalculated) { currentInput = '0'; isCalculated = false; }
    else { currentInput = currentInput.slice(0, -1) || '0'; }
  }
  
  if (action === 'toggle-sign') currentInput = String(parseFloat(currentInput) * -1);
  if (action === 'percent') { currentInput = String(sanitizeFloat(parseFloat(currentInput) / 100)); isCalculated = true; }
  
  // 🔥 РАЗШИРЕНИ НАУЧНИ ИЗЧИСЛЕНИЯ
  let num = parseFloat(currentInput);
  
  // Тригонометрия (Градуси)
  if (action === 'sin') { currentInput = String(sanitizeFloat(Math.sin(num * (Math.PI / 180)))); isCalculated = true; }
  if (action === 'cos') { currentInput = String(sanitizeFloat(Math.cos(num * (Math.PI / 180)))); isCalculated = true; }
  if (action === 'tan') { currentInput = String(sanitizeFloat(Math.tan(num * (Math.PI / 180)))); isCalculated = true; }
  
  // Логаритми
  if (action === 'ln') { currentInput = num > 0 ? String(sanitizeFloat(Math.log(num))) : "Error"; isCalculated = true; }
  if (action === 'log') { currentInput = num > 0 ? String(sanitizeFloat(Math.log10(num))) : "Error"; isCalculated = true; }
  
  // Корени и Степени
  if (action === 'sqrt') { currentInput = num >= 0 ? String(sanitizeFloat(Math.sqrt(num))) : "Error"; isCalculated = true; }
  if (action === 'cbrt') { currentInput = String(sanitizeFloat(Math.cbrt(num))); isCalculated = true; }
  if (action === 'pow2') { currentInput = String(sanitizeFloat(Math.pow(num, 2))); isCalculated = true; }
  if (action === 'pow3') { currentInput = String(sanitizeFloat(Math.pow(num, 3))); isCalculated = true; }
  
  // Допълнителни
  if (action === 'reciprocal') { currentInput = num !== 0 ? String(sanitizeFloat(1 / num)) : "Error"; isCalculated = true; }
  if (action === 'abs') { currentInput = String(sanitizeFloat(Math.abs(num))); isCalculated = true; }
  if (action === 'fact') { currentInput = String(calculateFactorial(num)); isCalculated = true; }
  
  if (action === 'calculate') executeCalculation();
  updateDisplay();
}

function executeCalculation() {
  if (!expression && !currentInput) return;
  let finalExpression = expression + currentInput;
  
  // Заменяме визуалните знаци с машинни (вкл. ^ за повдигане на степен)
  let evalCode = finalExpression.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**');
  
  try {
    let rawResult = eval(evalCode);
    let preciseResult = sanitizeFloat(rawResult);
    
    displayExpression.innerText = finalExpression + " =";
    currentInput = String(preciseResult);
    expression = '';
    isCalculated = true;
    
    if (preciseResult !== "Error") {
      historyLog.unshift({ expr: finalExpression, res: preciseResult });
      renderHistory();
    }
    updateDisplay();
  } catch {
    displayCurrent.innerText = "Error";
    currentInput = '0'; expression = '';
  }
}

function updateDisplay() {
  displayCurrent.innerText = currentInput;
  displayExpression.innerText = expression;
}

function renderHistory() {
  if (historyLog.length === 0) {
    historyContent.innerHTML = `<div class="empty-state">No calculations yet.</div>`;
    return;
  }
  historyContent.innerHTML = historyLog.map(item => `
    <div class="history-item">
      <div class="hist-expr">${item.expr}</div>
      <div class="hist-res">${item.res}</div>
    </div>
  `).join('');
}

// --- 4. TACTILE AUDIO ---
function triggerTactileAudio() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = ctx.createOscillator(); 
  const gain = ctx.createGain();
  
  osc.type = 'sine'; 
  osc.frequency.setValueAtTime(1000, ctx.currentTime);
  gain.gain.setValueAtTime(0.01, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.03);
  
  osc.connect(gain); 
  gain.connect(ctx.destination);
  osc.start(); 
  osc.stop(ctx.currentTime + 0.03);
}

// --- 5. KEYBOARD MODE ---
window.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') { appendValue(e.key); triggerTactileAudio(); }
  if (e.key === '.') { appendValue('.'); triggerTactileAudio(); }
  
  // Добавена поддръжка за клавиша ^ (Shift + 6)
  if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/' || e.key === '^') { 
    setOperator(e.key === '*' ? '×' : e.key === '/' ? '÷' : e.key); triggerTactileAudio(); 
  }
  
  if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); executeCalculation(); triggerTactileAudio(); }
  if (e.key === 'Backspace') { executeAction('backspace'); triggerTactileAudio(); }
  if (e.key === 'Escape') { executeAction('clear'); triggerTactileAudio(); }
});