const DB = "ReibunDatabase";
const DB_TABLE = "ReibunStore";
const DB_VERSION = 1;
const CL_WORD = "word";
const PATH_NOUN = "noun";
const PATH_PART = "part";
const PATH_VERB = "verb";
const TYPE_EDIT = "edit";
const TYPE_KEEP = "keep";
const TYPE_SEARCH = "search";
const TYPE_REIBUN = "reibun";
const CL_SELECTED = "selected";
const ID_EDIT_NOUN ="edit-noun";
const ID_EDIT_PART = "edit-part";
const ID_EDIT_VERB = "edit-verb";
const ID_KEEP_NOUN = "keep-noun";
const ID_KEEP_PART = "keep-part";
const ID_KEEP_VERB = "keep-verb";
const ID_SEARCH = "search";
const ID_REIBUN = "reibun";


function Controller() {
  this.selectedWordIndex = 0;
  this.db = null;
  this.initDatabase().then(() => this.getReibun()).catch(error => console.error(error));
  this.selectEditWord(PATH_NOUN);
}

Controller.prototype.selectWord = function(wordElement) {
  const wordIndex = this._findWordIndex(wordElement);
  this.selectedWordIndex = wordIndex;
  const selectedWord = document.querySelector('.' + CL_SELECTED);
  if (selectedWord) selectedWord.classList.remove(CL_SELECTED); 
  wordElement.classList.add(CL_SELECTED);
}

Controller.prototype.selectWordByIndex = function(wordIndex) {
  this.selectedWordIndex = wordIndex;
  const selectedWord = document.querySelector('.' + CL_SELECTED);
  if (selectedWord) selectedWord.classList.remove(CL_SELECTED); 
  const AllWordElements = this._findAllWordElements(); 
  AllWordElements[wordIndex].classList.add(CL_SELECTED);  
}

Controller.prototype.selectEditWord = function(path) {
  let index = 0;
  switch (path) {
    case PATH_NOUN:
      index = 0;
      break;
    case PATH_PART:
      index = 1;
      break;
    case PATH_VERB:
      index = 2;
      break;
  }
  this.selectWordByIndex(index);
}

Controller.prototype.selectNextWord = function() {
  const selectedWordElement =  this._getSelectedWordElement();
  const nextWordElement = selectedWordElement.nextElementSibling;
  if (nextWordElement) {
    this.selectedWordIndex += 1;
    selectedWordElement.classList.remove(CL_SELECTED);
    nextWordElement.classList.add(CL_SELECTED);
    nextWordElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

Controller.prototype.selectPrevWord = function() {
  const selectedWordElement = this._getSelectedWordElement();
  const prevWordElement = selectedWordElement.previousElementSibling;
  if (prevWordElement) {
    this.selectedWordIndex -= 1;
    selectedWordElement.classList.remove(CL_SELECTED);
    prevWordElement.classList.add(CL_SELECTED);
    prevWordElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

Controller.prototype.selectList = function(listId) {
  const wordList = document.getElementById(listId);
  const firstWordElement = wordList.querySelectorAll('.' + CL_WORD)[0];
  if (firstWordElement) this.selectWord(firstWordElement);
}

Controller.prototype.saveWord = function() {
  const selectedWordElement = this._getSelectedWordElement();
  const selectedWordPath = selectedWordElement.dataset.path;
  const selectedWordText = trim(selectedWordElement.value);
  if (selectedWordText != "") {
    const li = document.createElement('li');
    li.classList.add(CL_WORD);
    li.setAttribute('data-type', TYPE_KEEP);
    li.innerText = eschtml(selectedWordText);
    switch (selectedWordPath) {
      case PATH_NOUN:
        li.setAttribute('data-path', PATH_NOUN);
        document.getElementById(ID_KEEP_NOUN).appendChild(li);
        break;
      case PATH_PART:
        li.setAttribute('data-path', PATH_PART);
        document.getElementById(ID_KEEP_PART).appendChild(li);
        break;
      case PATH_VERB:
        li.setAttribute('data-path', PATH_VERB);
        document.getElementById(ID_KEEP_VERB).appendChild(li);
        break;
    }
  }
}

Controller.prototype.deleteWord = function() {
  const selectedWordElement = this._getSelectedWordElement();
  const prevWordElement = selectedWordElement.previousElementSibling;
  const nextWordElement = selectedWordElement.nextElementSibling;
  selectedWordElement.remove();
  if (prevWordElement) {
    this.selectWord(prevWordElement);
  } else if (nextWordElement) {
    this.selectWord(nextWordElement);
  } else {
    this.selectWord(document.getElementById(ID_EDIT_NOUN));
  }
}

Controller.prototype.useWord = function() {
  const selectedWordElement = this._getSelectedWordElement();
  const selectedWordPath = selectedWordElement.dataset.path;
  const selectedWordText = selectedWordElement.innerText;
  const editWordElement = document.getElementById(TYPE_EDIT + '-' + selectedWordPath);
  editWordElement.value = eschtml(selectedWordText);
  calcInputTextWidth(editWordElement);
}

Controller.prototype.changeWord = function(path) {
  const file = 'csv/' + path + '.csv';
  fetch(file)
    .then(response => response.text())
    .then(text => {
      const lines = text.split('\n');
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      const randomWord = randomLine.split(',')[0];
      const wordElement = document.getElementById('edit-' + path);
      wordElement.value = eschtml(randomWord);
      calcInputTextWidth(wordElement);
    })
    .catch(error => console.error(error));
}

Controller.prototype.searchWords = function(path, searchWord) {
  fetch('csv/' + path + '.csv')
    .then(response => response.text())
    .then(text => {
      const lines = text.split('\n');
      let results = [];
      const katakanaSearch = searchWord.replace(/[\u3041-\u3096]/g, match => {
        return String.fromCharCode(match.charCodeAt(0) + 0x60);
      });
      const hiraganaSearch = searchWord.replace(/[\u30A1-\u30F6]/g, match => {
        return String.fromCharCode(match.charCodeAt(0) - 0x60);
      });
      lines.forEach(line => {
        const [word, reading] = line.split(',');
        if ((word && (word.startsWith(katakanaSearch) || word.startsWith(hiraganaSearch))) ||
          (reading && (reading.startsWith(katakanaSearch) || reading.startsWith(hiraganaSearch)))) {
          results.push(word);
        }
      });

      const searchList = document.getElementById(ID_SEARCH);
      searchList.innerHTML = '';

      if (results.length > 0) {
        const fragment = document.createDocumentFragment();
        results.forEach(suggestion => {
          const li = document.createElement('li');
          li.classList.add(CL_WORD);
          li.dataset.path = path;
          li.dataset.type = TYPE_SEARCH;
          li.textContent = eschtml(suggestion);
          fragment.appendChild(li);
        });

        searchList.appendChild(fragment);
      }
    })
    .catch(error => console.error(error));
}

Controller.prototype.editStart = function() {
  const selectedWordElement = this._getSelectedWordElement();
  selectedWordElement.focus();
  document.getElementById(ID_SEARCH).innerHTML = "";
}

Controller.prototype.editEnd = function() {
  document.activeElement.blur();
}

Controller.prototype.getReibun = function() {
  return new Promise((resolve, reject) => {
    const transaction = this.db.transaction(DB_TABLE, "readonly");
    const store = transaction.objectStore(DB_TABLE);
    const getRequest = store.openCursor();
    document.getElementById(ID_REIBUN).innerHTML = '';

    getRequest.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        createReibunListElement({ id: cursor.key, text: cursor.value });
        cursor.continue();
      }
      resolve(cursor);
    };
    getRequest.onerror = (event) => {
      reject(event.target.errorCode);
    };
  });
}

Controller.prototype.saveReibun = function() {
  return new Promise((resolve, reject) => {

    const text = trim(document.getElementById(ID_EDIT_NOUN).value) + trim(document.getElementById(ID_EDIT_PART).value) + trim(document.getElementById(ID_EDIT_VERB).value);
    const transaction = this.db.transaction(DB_TABLE, "readwrite");
    const store = transaction.objectStore(DB_TABLE);
    const addRequest = store.add(text);

    addRequest.onsuccess = (event) => {
      resolve({ id: event.target.result, text: text });
    };

    addRequest.onerror = (event) => {
      reject(event.target.errorCode);
    };
  });
}

Controller.prototype.deleteReibun = function() {
  return new Promise((resolve, reject) => {
    const selectedWordElement = this._getSelectedWordElement();
    const transaction = this.db.transaction(DB_TABLE, "readwrite");
    const store = transaction.objectStore(DB_TABLE);
    const reibunId = Number(selectedWordElement.dataset.id);
    const reibunText = selectedWordElement.textContent;
    const deleteRequest = store.delete(reibunId);

    deleteRequest.onsuccess = () => {
      resolve({ id: reibunId, text: reibunText });
    };

    deleteRequest.onerror = (event) => {
      reject(event.target.errorCode);
    };
  });
}

Controller.prototype.initDatabase = function() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(DB_TABLE, { autoIncrement: true });
    };

    request.onsuccess = (event) => {
      this.db = event.target.result;
      resolve();
    };

    request.onerror = (event) => {
      reject(event.target.errorCode);
    };
  });
}

Controller.prototype._getSelectedWordElement = function() {
  return document.querySelectorAll('.' + CL_WORD)[this.selectedWordIndex];
}

Controller.prototype._findWordFromIndex = function(wordIndex) {
  return document.querySelectorAll('.' + CL_WORD)[wordIndex];
}

Controller.prototype._findAllWordElements = function() {
  return document.querySelectorAll('.' + CL_WORD);
}

Controller.prototype._findWordIndex = function(wordElement) {
  const AllWordElements = this._findAllWordElements();
  const AllWordElementsArray = Array.from(AllWordElements);
  return AllWordElementsArray.indexOf(wordElement);
}



let controller = new Controller();
controller.changeWord(PATH_NOUN);
controller.changeWord(PATH_PART);
controller.changeWord(PATH_VERB);

const keysPressed = {};
let isKeyPressed = false;
let isComposing = false;

const EL_EDIT_NOUN = document.getElementById(ID_EDIT_NOUN);
const EL_EDIT_PART = document.getElementById(ID_EDIT_PART);
const EL_EDIT_VERB = document.getElementById(ID_EDIT_VERB);
const EL_SEARCH =  document.getElementById(ID_SEARCH);
const EL_REIBUN =  document.getElementById(ID_REIBUN);

document.addEventListener('keydown', function(event) {

  if (isKeyPressed) return;

  keysPressed[event.key] = true;

  const selectedWordElement = controller._getSelectedWordElement();
  const selectedWordPath = selectedWordElement.dataset.path;
  const selectedWordType = selectedWordElement.dataset.type;

  let isEditing = false;
  let isEditingCurrentData = false;

  [EL_EDIT_NOUN, EL_EDIT_NOUN, EL_EDIT_VERB].forEach(element => {
    if (document.activeElement == element) {
      isEditing = true;
      if (element == selectedWordElement) isEditingCurrentData = true;
      return false;
    }
  });

  switch (event.key) {
    case 'ArrowDown':
      if(isEditing) {
        event.preventDefault();
        if (!isComposing) {
          if (selectedWordType == TYPE_EDIT) {
            controller.selectList(ID_SEARCH);
          } else if (selectedWordType == TYPE_SEARCH) {
            controller.selectNextWord();
          }
        }
      } else {
        if (selectedWordType != TYPE_EDIT) {
          if (selectedWordElement.nextElementSibling) controller.selectNextWord();
        }
      }
      break;
    case 'ArrowUp':
      if(isEditing) {
        event.preventDefault();
        if (selectedWordType == TYPE_SEARCH) {
          if (!selectedWordElement.previousElementSibling) {
            controller.selectEditWord(selectedWordPath);
          } else {
            controller.selectPrevWord();
          }
        }
      } else {
        if (selectedWordType != TYPE_EDIT) {
          if (selectedWordElement.previousElementSibling) controller.selectPrevWord();
        }
      }
      break;
    case 'Enter':
      if (isEditing) {
        if (selectedWordType == TYPE_SEARCH) {
          controller.useWord();
          controller.editEnd();
          controller.selectEditWord(selectedWordPath);
          EL_SEARCH.innerHTML = "";
        }
      } else {
        if (selectedWordType == TYPE_KEEP || selectedWordType == TYPE_SEARCH) {
          controller.useWord();
        } else if (selectedWordType == TYPE_EDIT) {
          controller.changeWord(selectedWordPath);
        }  
      }
      break;
    case 'd':
      if (isEditing) return;
      if (selectedWordType == TYPE_EDIT) {
        selectedWordElement.value == "";
      } else if (selectedWordType == TYPE_REIBUN) {
        controller.deleteReibun().then(() => controller.deleteWord());
      } else {
        controller.deleteWord();
      }
      break;
    case ' ':
      if (isEditing) return;
      controller.saveReibun().then((data) => createReibunListElement(data));
      break;
    case 'e':
      if (isEditing && isEditingCurrentData) return;
      if (selectedWordType == TYPE_EDIT) {
        event.preventDefault();
        controller.editStart();
        isEditing = true;
        isEditingCurrentData = true;
      }
      break;
    case 'Escape':
      if (!isEditing) return;
      controller.editEnd();
      break;
    case 'k':
      if (isEditing) return;
      if (selectedWordType == TYPE_EDIT) controller.saveWord();
      break;
    case 'n':
      if (isEditing) return;
      controller.selectList(ID_KEEP_NOUN);
      break;
    case 'p':
      if (isEditing) return;
      controller.selectList(ID_KEEP_PART);
      break;
    case 'v':
      if (isEditing) return;
      controller.selectList(ID_KEEP_VERB);
      break;
    case 's':
      if (isEditing) return;
      controller.selectList(ID_SEARCH);
      break;
    case 'r':
      if (isEditing) return;
      controller.selectList(ID_REIBUN);
      break;
    case 'f':
      if (isEditing) return;
      if (selectedWordType == TYPE_EDIT) {
        if(selectedWordPath == PATH_NOUN) controller.selectEditWord(PATH_PART);
        if(selectedWordPath == PATH_PART) controller.selectEditWord(PATH_VERB);
        if(selectedWordPath == PATH_VERB) controller.selectEditWord(PATH_NOUN);
      } else {
        controller.selectEditWord(PATH_NOUN);
      }
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
      controller.searchWords(path, text);
    }
  });

  element.addEventListener('input', function(event) {
    const selectedWordElement = controller._getSelectedWordElement();
    const selectedWordPath = selectedWordElement.dataset.path;
    const selectedWordType = selectedWordElement.dataset.type;
    const text = event.target.value;
    if (!isComposing) if (text.length > 0) controller.searchWords(selectedWordPath, text);
    if (selectedWordType == TYPE_SEARCH) controller.selectEditWord(selectedWordPath);
    if (!text) EL_SEARCH.innerHTML = "";
    calcInputTextWidth(this);
  });
});

function createReibunListElement(record) {
  const li = document.createElement("li");
  li.classList.add(CL_WORD);
  li.setAttribute('data-type', TYPE_REIBUN);
  li.setAttribute('data-id', record.id);
  li.textContent = eschtml(record.text);
  EL_REIBUN.prepend(li);
}

function calcInputTextWidth(input) {
  const calcId = "calc-" + input.dataset.path;
  const calc = document.getElementById(calcId);
  calc.textContent = input.value;
  calc.style.display = 'inline';
  const width = calc.offsetWidth;
  calc.style.display = 'none';
  input.style.width = width + 'px';
}

function eschtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function trim(str) {
  return str.replace(/^[\s\u3000]+|[\s\u3000]+$/g, '');
}
