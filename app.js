/**
 * Aethelis Architecture Processing Engine
 * Designed using a strict unidirectional decoupled Model-View-Controller layout.
 */

// ==========================================
// 1. STATELOCKED MATHEMATICAL EVALUATION ENGINE
// ==========================================
const CalculatorEngine = (function() {
  'use strict';

  return {
    evaluate(expression) {
      if (!expression) return '0';

      // Преобразуване на визуалните оператори към програмни токени
      let sanitized = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E');

      sanitized = this._parseScientificFunctions(sanitized);

      // Строга лексикална проверка за сигурност срещу XSS инжектиране
      const whiteListPattern = /^[0-9.+\-*/%^() ]+$/;
      const staticContext = sanitized.replace(/Math\.(sin|cos|tan|sqrt|pow|PI|E)/g, '');
      
      if (!whiteListPattern.test(staticContext)) {
        throw new SyntaxError('Security Breach: Illegal Token');
      }

      // Изчисляване в капсулиран контекст чрез изолация на функцията
      const evaluator = new Function(`"use strict"; return (${sanitized});`);
      const executionResult = evaluator();

      if (executionResult === undefined || Number.isNaN(executionResult) || !Number.isFinite(executionResult)) {
        throw new ArithmeticException('Math Bound Error');
      }

      return this._formatResolution(executionResult);
    },

    _parseScientificFunctions(expr) {
      let parsed = expr;
      // Обработка на експоненциални степени (x^y)
      parsed = parsed.replace(/(\d+(\.\d+)?)\^(\d+(\.\d+)?)/g, 'Math.pow($1,$3)');
      // Изчисляване на тригонометрия в градуси
      parsed = parsed.replace(/sin\(([^)]+)\)/g, 'Math.sin(($1) * Math.PI / 180)');
      parsed = parsed.replace(/cos\(([^)]+)\)/g, 'Math.cos(($1) * Math.PI / 180)');
      parsed = parsed.replace(/tan\(([^)]+)\)/g, 'Math.tan(($1) * Math.PI / 180)');
      parsed = parsed.replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)');
      return parsed;
    },

    _formatResolution(value) {
      if (Math.abs(value) < 1e-10 && value !== 0) return '0';
      const rawString = value.toString();
      if (rawString.includes('.') && rawString.length > 12) {
        return parseFloat(value.toFixed(8)).toString();
      }
      return rawString;
    }
  };
})();

// ==========================================
// 2. ACOUSTIC ENGINE (AUDIO CONTEXT SPECIFICATION)
// ==========================================
const AudioHapticEngine = (function() {
  'use strict';
  let audioContext = null;

  return {
    triggerTactileClick() {
      try {
        if (!audioContext) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContext.state === 'suspended') {
          audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(1150, audioContext.currentTime); 
        oscillator.frequency.exponentialRampToValueAtTime(350, audioContext.currentTime + 0.018);

        gainNode.gain.setValueAtTime(0.035, audioContext.currentTime); 
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.02);

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.02);

        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      } catch (error) {
        // Fallback при блокиране на аудио от политиките на браузъра
      }
    }
  };
})();

// ==========================================
// 3. REACTIVE APPLICATION STATE LEDGER
// ==========================================
class AppState {
  constructor() {
    this.currentInput = '0';
    this.expression = '';
    this.isScientific = false;
    this.activeOperator = null;
    this.openParenthesesCount = 0;
    this.history = JSON.parse(localStorage.getItem('luxury_calc_history')) || [];
    this.theme = localStorage.getItem('luxury_calc_theme') || 'dark';
    this.subscribers = [];
  }

  subscribe(callback) {
    this.subscribers.push(callback);
  }

  notify() {
    this.subscribers.forEach(callback => callback(this));
  }

  appendToken(token) {
    this.activeOperator = null;
    
    if (token === '(') this.openParenthesesCount++;
    if (token === ')') {
      if (this.openParenthesesCount > 0) this.openParenthesesCount--;
      else return; // Предотвратява затваряне на несъществуваща скоба
    }

    if (this.currentInput === 'Error' || (this.currentInput === '0' && token !== '.' && token !== ')')) {
      this.currentInput = token;
    } else {
      if (token === '.') {
        const structuralParts = this.currentInput.split(/[\+\-\*\/÷×−^]/);
        if (structuralParts[structuralParts.length - 1].includes('.')) return;
      }
      this.currentInput += token;
    }
    this.notify();
  }

  appendOperator(op) {
    if (this.currentInput === 'Error') return;
    const lastCharacter = this.currentInput.trim().slice(-1);
    const operatorRegistry = ['+', '-', '*', '/', '÷', '×', '−'];

    this.activeOperator = op;

    if (operatorRegistry.includes(lastCharacter)) {
      this.currentInput = this.currentInput.slice(0, -1) + op;
    } else {
      this.currentInput += op;
    }
    this.notify();
  }

  clearAll() {
    this.currentInput = '0';
    this.expression = '';
    this.activeOperator = null;
    this.openParenthesesCount = 0;
    this.notify();
  }

  clearEntry() {
    this.currentInput = '0';
    this.activeOperator = null;
    this.notify();
  }

  executeBackspace() {
    if (this.currentInput === 'Error' || this.currentInput.length <= 1) {
      this.currentInput = '0';
    } else {
      const removedChar = this.currentInput.slice(-1);
      if (removedChar === '(') this.openParenthesesCount = Math.max(0, this.openParenthesesCount - 1);
      if (removedChar === ')') this.openParenthesesCount++;
      this.currentInput = this.currentInput.slice(0, -1);
    }
    this.notify();
  }

  toggleNumericSign() {
    if (this.currentInput === '0' || this.currentInput === 'Error') return;
    this.currentInput = this.currentInput.startsWith('-') ? this.currentInput.slice(1) : '-' + this.currentInput;
    this.notify();
  }

  processPercentage() {
    if (this.currentInput === 'Error') return;
    try {
      const tokens = this.currentInput.split(/([\+\-\*\/÷×−])/);
      const targets = parseFloat(tokens[tokens.length - 1]);
      if (!isNaN(targets)) {
        tokens[tokens.length - 1] = (targets / 100).toString();
        this.currentInput = tokens.join('');
        this.notify();
      }
    } catch (e) {
      this.currentInput = 'Error';
      this.notify();
    }
  }

  injectScientificModifier(action) {
    if (this.currentInput === 'Error') return;
    if (['sin', 'cos', 'tan', 'sqrt'].includes(action)) {
      this.openParenthesesCount++;
      this.currentInput = this.currentInput === '0' ? `${action}(` : `${action}(${this.currentInput})`;
    } else if (action === 'pow') {
      this.currentInput += '^';
    }
    this.notify();
  }

  compute() {
    if (!this.currentInput || this.currentInput === 'Error') return;
    try {
      // Автоматично синтактично затваряне на висящи скоби
      while (this.openParenthesesCount > 0) {
        this.currentInput += ')';
        this.openParenthesesCount--;
      }

      const rawFormula = this.currentInput;
      const evaluationResult = CalculatorEngine.evaluate(rawFormula);
      
      this.expression = rawFormula + ' =';
      this.currentInput = evaluationResult;
      this.activeOperator = null;
      this._commitHistoryLog({ expr: rawFormula, res: evaluationResult });
    } catch (error) {
      this.currentInput = 'Error';
      this.expression = '';
    }
    this.notify();
  }

  _commitHistoryLog(entry) {
    this.history.unshift(entry);
    if (this.history.length > 20) this.history.pop();
    localStorage.setItem('luxury_calc_history', JSON.stringify(this.history));
  }

  purgeHistory() {
    this.history = [];
    localStorage.removeItem('luxury_calc_history');
    this.notify();
  }

  exportLedgerData() {
    if (this.history.length === 0) return;
    let csvPayload = "data:text/csv;charset=utf-8,Expression,Result\n";
    this.history.forEach(item => { csvPayload += `"${item.expr}","${item.res}"\n`; });
    const encodedUri = encodeURI(csvPayload);
    const hiddenAnchor = document.createElement("a");
    hiddenAnchor.setAttribute("href", encodedUri);
    hiddenAnchor.setAttribute("download", `Aethelis_Ledger_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(hiddenAnchor);
    hiddenAnchor.click();
    document.body.removeChild(hiddenAnchor);
  }

  loadHistoricalRecord(item) {
    this.currentInput = item.res;
    this.expression = item.expr + ' =';
    this.notify();
  }

  toggleSystemTheme() {
    this.theme = this.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('luxury_calc_theme', this.theme);
    this.notify();
  }

  toggleScientificLayout() {
    this.isScientific = !this.isScientific;
    this.notify();
  }
}

// ==========================================
// 4. VIEW CONTROLLER ORCHESTRATION LAYER
// ==========================================
class CalculatorController {
  constructor(state) {
    this.state = state;
    this.dom = {
      displayExpression: document.getElementById('display-expression'),
      displayCurrent: document.getElementById('display-current'),
      keypad: document.getElementById('keypad'),
      historyLog: document.getElementById('history-log'),
      clearHistory: document.getElementById('clear-history'),
      exportHistory: document.getElementById('export-history'),
      scientificToggle: document.getElementById('scientific-toggle'),
      themeToggle: document.getElementById('theme-toggle'),
      htmlRoot: document.documentElement
    };
    this._bindLifecycleEvents();
  }

  _bindLifecycleEvents() {
    this.state.subscribe(this.render.bind(this));
    this.dom.keypad.addEventListener('click', this._onGridTouch.bind(this));
    this.dom.clearHistory.addEventListener('click', () => { AudioHapticEngine.triggerTactileClick(); this.state.purgeHistory(); });
    this.dom.exportHistory.addEventListener('click', () => { AudioHapticEngine.triggerTactileClick(); this.state.exportLedgerData(); });
    this.dom.scientificToggle.addEventListener('click', () => { AudioHapticEngine.triggerTactileClick(); this.state.toggleScientificLayout(); });
    this.dom.themeToggle.addEventListener('click', () => { AudioHapticEngine.triggerTactileClick(); this.state.toggleSystemTheme(); });
    window.addEventListener('keydown', this._onPhysicalKeyPress.bind(this));
    this.render(this.state);
  }

  _onGridTouch(event) {
    const activationButton = event.target.closest('.btn');
    if (!activationButton) return;
    
    AudioHapticEngine.triggerTactileClick();
    this._pulseDisplayChamber();

    const { value, operator, action } = activationButton.dataset;
    if (value !== undefined) this.state.appendToken(value);
    if (operator !== undefined) this.state.appendOperator(operator);
    if (action !== undefined) this._executeMappedAction(action);
  }

  _executeMappedAction(action) {
    switch (action) {
      case 'clear': this.state.clearAll(); break;
      case 'clear-entry': this.state.clearEntry(); break;
      case 'backspace': this.state.executeBackspace(); break;
      case 'toggle-sign': this.state.toggleNumericSign(); break;
      case 'percent': this.state.processPercentage(); break;
      case 'calculate': this.state.compute(); break;
      default: this.state.injectScientificModifier(action);
    }
  }

  _onPhysicalKeyPress(event) {
    let actionableKey = true;
    if ((event.key >= '0' && event.key <= '9') || ['0', '.', '(', ')', 'e', 'π'].includes(event.key)) {
      this.state.appendToken(event.key);
    } else if (['+', '-', '*', '/', '^'].includes(event.key)) {
      const physicalKeyMap = { '+': '+', '-': '-', '*': '×', '/': '÷', '^': '^' };
      this.state.appendOperator(physicalKeyMap[event.key]);
    } else if (event.key === 'Enter' || event.key === '=') {
      event.preventDefault();
      this.state.compute();
    } else if (event.key === 'Backspace') {
      this.state.executeBackspace();
    } else if (event.key === 'Escape') {
      this.state.clearAll();
    } else if (event.key === 'Delete') {
      this.state.clearEntry();
    } else {
      actionableKey = false;
    }

    if (actionableKey) {
      AudioHapticEngine.triggerTactileClick();
      this._pulseDisplayChamber();
    }
  }

  _pulseDisplayChamber() {
    this.dom.displayCurrent.classList.add('glow-active');
    setTimeout(() => this.dom.displayCurrent.classList.remove('glow-active'), 140);
  }

  _dynamicTextScaling(outputValue) {
    const stringLength = outputValue.length;
    let computedFont = '3rem';
    if (stringLength > 16) computedFont = '1.6rem';
    else if (stringLength > 12) computedFont = '2.1rem';
    else if (stringLength > 9) computedFont = '2.5rem';
    this.dom.displayCurrent.style.fontSize = computedFont;
  }

  render(state) {
    this.dom.htmlRoot.setAttribute('data-theme', state.theme);

    if (state.isScientific) {
      this.dom.keypad.classList.add('scientific-mode');
      this.dom.scientificToggle.classList.add('active');
    } else {
      this.dom.keypad.classList.remove('scientific-mode');
      this.dom.scientificToggle.classList.remove('active');
    }

    this.dom.displayCurrent.textContent = state.currentInput;
    this.dom.displayExpression.textContent = state.expression;
    this._dynamicTextScaling(state.currentInput);

    const computationalTriggers = this.dom.keypad.querySelectorAll('.btn');
    computationalTriggers.forEach(btn => {
      if (btn.dataset.operator && state.activeOperator === btn.dataset.operator) {
        btn.classList.add('operator-active');
      } else {
        btn.classList.remove('operator-active');
      }
    });

    this.dom.historyLog.innerHTML = '';
    if (state.history.length === 0) {
      this.dom.historyLog.innerHTML = '<div class="empty-state">No recent records</div>';
    } else {
      state.history.forEach(item => {
        const layoutRow = document.createElement('div');
        layoutRow.className = 'history-item';
        layoutRow.innerHTML = `<span class="history-expr">${item.expr}</span><span class="history-res">${item.res}</span>`;
        layoutRow.addEventListener('click', () => { AudioHapticEngine.triggerTactileClick(); state.loadHistoricalRecord(item); });
        this.dom.historyLog.appendChild(layoutRow);
      });
    }
  }
}

// Global Micro-Initialization Engine Thread Execution
document.addEventListener('DOMContentLoaded', () => {
  new CalculatorController(new AppState());
});