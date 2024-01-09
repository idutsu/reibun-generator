const EL_ROOT = document.getElementById("root");
const EL_EDIT_NOUN = document.getElementById("edit-noun");
const EL_EDIT_PART = document.getElementById("edit-part");
const EL_EDIT_VERB = document.getElementById("edit-verb");
const EL_CALC_NOUN = document.getElementById("calc-noun");
const EL_CALC_PART = document.getElementById("calc-part");
const EL_CALC_VERB = document.getElementById("calc-verb");
const EL_KEEP_LIST_NOUN = document.getElementById("keep-noun");
const EL_KEEP_LIST_PART = document.getElementById("keep-part");
const EL_KEEP_LIST_VERB = document.getElementById("keep-verb");
const EL_SEARCH_LIST = document.getElementById("search");
const STATUS_BAR = document.getElementById('status');

const CLASS_CURRENT_DATA = "current";
const CLASS_DATA = "data";

const LIST_NUMBER_SLOT = 0;
const LIST_NUMBER_KEEP_NOUN = 1;
const LIST_NUMBER_KEEP_PART = 2;
const LIST_NUMBER_KEEP_VERB = 3;
const LIST_NUMBER_SEARCH = 4;
const DATA_TYPE_SLOT = "slot";
const DATA_TYPE_KEEP = "keep";
const DATA_TYPE_SEARCH = "search";
const DATA_PATH_NOUN = "noun";
const DATA_PATH_PART = "part";
const DATA_PATH_VERB = "verb";

function Controller() {
  this.currentData;
  this.resetCurrentData(EL_EDIT_NOUN)
}

Controller.prototype._getAllData = function() {
  return EL_ROOT.querySelectorAll("." + CLASS_DATA);
}

Controller.prototype.getCurrentDataType = function() {
  return this.currentData.dataset.type;
}

Controller.prototype.getCurrentDataPath = function() {
  return this.currentData.dataset.path;
}

Controller.prototype._setCurrentData = function(element) {
  this.currentData = element;
  this._setCurrentDataClass();
}

Controller.prototype.resetCurrentData = function() {
  this._setCurrentData(EL_EDIT_NOUN);
}

Controller.prototype.getCurrentListIndex = function() {
  return this.currentData.dataset.list;
}

Controller.prototype._setCurrentDataClass = function() {
  const data = this._getAllData();
  data.forEach(element => {
    element.classList.remove(CLASS_CURRENT_DATA);
  });
  this.currentData.classList.add(CLASS_CURRENT_DATA);
}

Controller.prototype.nextData = function() {
  const nextData = this.currentData.nextElementSibling;
  if (nextData) this._setCurrentData(nextData);
};

Controller.prototype.prevData = function() {
  const prevData = this.currentData.previousElementSibling;
  if (prevData) this._setCurrentData(prevData);
}

Controller.prototype.setCurrentList = function(element) {
  const data = element.querySelector('.' + CLASS_DATA);
  if (data) this._setCurrentData(data);
}

Controller.prototype.deleteWordInSentence = function() {
  this.currentData.value = "";
}

Controller.prototype.deleteData = function() {
  const prevData = this.currentData.previousElementSibling;
  const nextData = this.currentData.nextElementSibling;
  this.currentData.remove();
  if (prevData) {
    this._setCurrentData(prevData);
  } else if (nextData) {
    this._setCurrentData(nextData);
  } else {
    this.resetCurrentData();
  }
  this.currentDdata = null;
}

Controller.prototype.keepData = function() {
  const text = this.currentData.value.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');
  if (text != "") {
    const path = this.getCurrentDataPath();
    const li = document.createElement('li');
    li.classList.add(CLASS_DATA);
    li.setAttribute('data-type', DATA_TYPE_KEEP);
    li.innerText = text;
    switch (path) {
      case DATA_PATH_NOUN:
        li.setAttribute('data-path', DATA_PATH_NOUN);
        li.setAttribute('data-list', LIST_NUMBER_KEEP_NOUN);
        EL_KEEP_LIST_NOUN.appendChild(li);
        break;
      case DATA_PATH_PART:
        li.setAttribute('data-path', DATA_PATH_PART);
        li.setAttribute('data-list', LIST_NUMBER_KEEP_PART);
        EL_KEEP_LIST_PART.appendChild(li);
        break;
      case DATA_PATH_VERB:
        li.setAttribute('data-path', DATA_PATH_VERB);
        li.setAttribute('data-list', LIST_NUMBER_KEEP_VERB);
        EL_KEEP_LIST_VERB.appendChild(li);
        break;
    }
  }
}

Controller.prototype.useData = function() {
  const path = this.getCurrentDataPath();
  const word = this.currentData.innerText;
  let input = null;
  switch (path) {
    case DATA_PATH_NOUN:
      input = EL_EDIT_NOUN;
      break;
    case DATA_PATH_PART:
      input = EL_EDIT_PART;
      break;
    case DATA_PATH_VERB:
      input = EL_EDIT_VERB;
      break;
  }
  input.value = word;
  this.calcInputTextWidth(input);
}

Controller.prototype.saveData = function() {
  const saveData = EL_EDIT_NOUN.value + EL_EDIT_PART.value + EL_EDIT_VERB.value;
  fetch('/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: saveData })
  })
    .then(response => response.json())
    .then(data => {
      STATUS_BAR.innerText = "「" + data.text + "」を保存しました";
      STATUS_BAR.style.display = "block";
      setTimeout(() => {
        STATUS_BAR.style.display = "none";
      }, 3000);
    })
    .catch(error => {
      console.error('Error:', error)
      STATUS_BAR.innerText = "'Error: '" + error;
      STATUS_BAR.style.display = "block";
    });
}

Controller.prototype.fetchRandomWordFromCsv = function(path) {
  fetch('/' + path)
    .then(response => response.text())
    .then(word => {
      const input = document.getElementById('edit-' + path);
      input.value = word;
      this.calcInputTextWidth(input);
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
}

Controller.prototype.fetchSearchWordsFromCsv = function(input, path) {
  fetch('/search?input=' + input + '&path=' + path)
    .then(response => response.json())
    .then(data => {
      const fragment = document.createDocumentFragment();
      EL_SEARCH_LIST.innerHTML = '';
      if (data.length > 0) {
        data.forEach(suggestion => {
          const li = document.createElement('li');
          li.classList.add(CLASS_DATA);
          li.dataset.path = path;
          li.dataset.type = "search";
          li.dataset.list = LIST_NUMBER_SEARCH;
          li.textContent = suggestion;
          fragment.appendChild(li);
        });
        EL_SEARCH_LIST.appendChild(fragment);
      } else {
      }
    })
    .catch(error => console.error('Error:', error));
};

Controller.prototype.startEdit = function() {
  const element = this.currentData;
  element.focus();
  EL_SEARCH_LIST.innerHTML = "";
}

Controller.prototype.endEdit = function() {
  [EL_EDIT_NOUN, EL_EDIT_PART, EL_EDIT_VERB].forEach(element => {
    element.blur();
  });
}

Controller.prototype.calcInputTextWidth = function(input) {
  const calcId = "calc-" + input.dataset.path;
  const calc = document.getElementById(calcId);
  calc.textContent = input.value;
  calc.style.display = 'inline';
  const width = calc.offsetWidth;
  calc.style.display = 'none';
  input.style.width = width + 'px';
}


let controller = new Controller();
controller.fetchRandomWordFromCsv(DATA_PATH_NOUN);
controller.fetchRandomWordFromCsv(DATA_PATH_PART);
controller.fetchRandomWordFromCsv(DATA_PATH_VERB);

const keysPressed = {};
let isKeyPressed = false;
let isComposing = false;

document.addEventListener('keydown', function(event) {

  if (isKeyPressed) return;

  keysPressed[event.key] = true;

  let currentData = controller.currentData;
  let currentDataType = controller.getCurrentDataType();
  let isEditing = false;
  let isEditingCurrentData = false;

  [EL_EDIT_NOUN, EL_EDIT_PART, EL_EDIT_VERB].forEach(element => {
    if (document.activeElement == element) {
      isEditing = true;
      if (element == currentData) isEditingCurrentData = true;
      return false;
    }
  });

  switch (event.key) {
    case 'ArrowDown':
      if (isEditing) return;
      if (currentData.nextElementSibling) controller.nextData();
      break;
    case 'ArrowUp':
      if (isEditing) return;
      if (currentData.previousElementSibling) controller.prevData();
      break;
    case 'Enter':
      if (isEditing) return;
      if (currentDataType == DATA_TYPE_KEEP || currentDataType == DATA_TYPE_SEARCH) {
        controller.useData();
      } else if (currentDataType == DATA_TYPE_SLOT) {
        const path = controller.getCurrentDataPath();
        controller.fetchRandomWordFromCsv(path);
      }
      break;
    case 'Delete':
      if (isEditing) return;
      if (currentDataType == DATA_TYPE_SLOT) {
        controller.deleteWordInSentence();
      } else {
        controller.deleteData();
      }
      break;
    case 'p':
      if (isEditing) return;
      controller.saveData();
      break;
    case 'e':
      if (isEditing && isEditingCurrentData) return;
      if (currentDataType == DATA_TYPE_SLOT) {
        event.preventDefault();
        controller.startEdit();
        isEditing = true;
        isEditingCurrentData = true;
      }
      break;
    case 'Escape':
      if (!isEditing) return;
      controller.endEdit();
      break;
    case 'k':
      if (isEditing) return;
      currentDataType = controller.getCurrentDataType();
      if (currentDataType == DATA_TYPE_SLOT) controller.keepData();
      break;
    case 'a':
      if (isEditing) return;
      controller._setCurrentData(EL_EDIT_NOUN);
      break;
    case 's':
      if (isEditing) return;
      controller._setCurrentData(EL_EDIT_PART);
      break;
    case 'd':
      if (isEditing) return;
      controller._setCurrentData(EL_EDIT_VERB);
      break;
    case 'z':
      if (isEditing) return;
      controller.setCurrentList(EL_KEEP_LIST_NOUN);
      break;
    case 'x':
      if (isEditing) return;
      controller.setCurrentList(EL_KEEP_LIST_PART);
      break;
    case 'c':
      if (isEditing) return;
      controller.setCurrentList(EL_KEEP_LIST_VERB);
      break;
    case 'v':
      if (isEditing) return;
      controller.setCurrentList(EL_SEARCH_LIST);
      break;
  }
  isKeyPressed = true;
});

document.addEventListener('keyup', function(event) {
  delete keysPressed[event.key];
  isKeyPressed = false;
});

[EL_EDIT_NOUN, EL_EDIT_PART, EL_EDIT_VERB].forEach(element => {

  element.addEventListener('compositionstart', function() {
    isComposing = true;
  });

  element.addEventListener('compositionend', function(event) {
    isComposing = false;
    const text = event.target.value;
    const path = event.target.dataset.path
    if (text.length > 0) {
      controller.fetchSearchWordsFromCsv(text, path);
    }
  });

  element.addEventListener('input', function(event) {
    controller.calcInputTextWidth(this);
    if (!isComposing) {
      const text = event.target.value;
      const path = event.target.dataset.path
      if (text.length > 0) {
        controller.fetchSearchWordsFromCsv(text, path);
      }
    }
  });
});
