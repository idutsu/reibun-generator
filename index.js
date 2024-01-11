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
const EL_REIBUN_LIST = document.getElementById("reibun");
const CLASS_CURRENT_DATA = "selected";
const CLASS_DATA = "data";
const DATA_TYPE_EDIT = "edit";
const DATA_TYPE_KEEP = "keep";
const DATA_TYPE_SEARCH = "search";
const DATA_TYPE_REIBUN = "reibun";
const DATA_PATH_NOUN = "noun";
const DATA_PATH_PART = "part";
const DATA_PATH_VERB = "verb";
const DB = "ReibunDatabase";
const DB_TABLE = "ReibunStore";
const DB_VERSION = 1;

function Controller() {
  this.currentData = null;
  this.db = null;
  this.initDatabase().then(() => this.getReibun()).catch(error => console.error(error));
  this.resetCurrentData();
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

Controller.prototype.getReibun = function() {
  return new Promise((resolve, reject) => {
    const transaction = this.db.transaction(DB_TABLE, "readonly");
    const store = transaction.objectStore(DB_TABLE);
    const getRequest = store.openCursor();
    EL_REIBUN_LIST.innerHTML = '';

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
    const text = trim(EL_EDIT_NOUN.value) + trim(EL_EDIT_PART.value) + trim(EL_EDIT_VERB.value);
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

    const transaction = this.db.transaction(DB_TABLE, "readwrite");
    const store = transaction.objectStore(DB_TABLE);
    const id = Number(this.currentData.dataset.id);
    const text = this.currentData.textContent;
    const deleteRequest = store.delete(id);

    deleteRequest.onsuccess = () => {
      resolve({ id: id, text: text });
    };

    deleteRequest.onerror = (event) => {
      reject(event.target.errorCode);
    };
  });
}

Controller.prototype.setCurrentData = function(element) {
  if (this.currentData) this.currentData.classList.remove(CLASS_CURRENT_DATA);
  this.currentData = element;
  this.currentData.classList.add(CLASS_CURRENT_DATA);
  return this.currentData;
}

Controller.prototype.setCurrentDataFromPathAndType = function(path, type) {
  const element = document.getElementById(type + '-' + path);
  console.log(type);

  this.setCurrentData(element);
}

Controller.prototype.resetCurrentData = function() {
  this.setCurrentData(EL_EDIT_NOUN);
}

Controller.prototype.nextData = function() {
  const nextData = this.currentData.nextElementSibling;
  if (nextData) {
    this.setCurrentData(nextData).scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
};

Controller.prototype.prevData = function() {
  const prevData = this.currentData.previousElementSibling;
  if (prevData) {
    this.setCurrentData(prevData).scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
}

Controller.prototype.setCurrentList = function(element) {
  const data = element.querySelector('.' + CLASS_DATA);
  if (data) this.setCurrentData(data);
}

Controller.prototype.deleteWordInSentence = function() {
  this.currentData.value = "";
}

Controller.prototype.deleteData = function() {
  const prevData = this.currentData.previousElementSibling;
  const nextData = this.currentData.nextElementSibling;
  this.currentData.remove();
  if (prevData) {
    this.setCurrentData(prevData);
  } else if (nextData) {
    this.setCurrentData(nextData);
  } else {
    this.resetCurrentData();
  }
}

Controller.prototype.keepData = function() {
  const text = trim(this.currentData.value);
  if (text != "") {
    const path = this.currentData.dataset.path;
    const li = document.createElement('li');
    li.classList.add(CLASS_DATA);
    li.setAttribute('data-type', DATA_TYPE_KEEP);
    li.innerText = eschtml(text);
    switch (path) {
      case DATA_PATH_NOUN:
        li.setAttribute('data-path', DATA_PATH_NOUN);
        EL_KEEP_LIST_NOUN.appendChild(li);
        break;
      case DATA_PATH_PART:
        li.setAttribute('data-path', DATA_PATH_PART);
        EL_KEEP_LIST_PART.appendChild(li);
        break;
      case DATA_PATH_VERB:
        li.setAttribute('data-path', DATA_PATH_VERB);
        EL_KEEP_LIST_VERB.appendChild(li);
        break;
    }
  }
}

Controller.prototype.useData = function() {
  const path = this.currentData.dataset.path;
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
  calcInputTextWidth(input);
}

Controller.prototype.getRandomWordFromCsv = function(path) {
  const file = 'csv/' + path + '.csv';
  fetch(file)
    .then(response => response.text())
    .then(text => {
      const lines = text.split('\n');
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      const randomWord = randomLine.split(',')[0];
      const input = document.getElementById('edit-' + path);
      input.value = eschtml(randomWord);
      calcInputTextWidth(input);
    })
    .catch(error => console.error(error));
}

Controller.prototype.getSearchWordsFromCsv = function(path, searchText) {
  fetch('csv/' + path + '.csv')
    .then(response => response.text())
    .then(text => {
      const lines = text.split('\n');
      let results = [];
      const katakanaSearch = searchText.replace(/[\u3041-\u3096]/g, match => {
        return String.fromCharCode(match.charCodeAt(0) + 0x60);
      });
      const hiraganaSearch = searchText.replace(/[\u30A1-\u30F6]/g, match => {
        return String.fromCharCode(match.charCodeAt(0) - 0x60);
      });
      lines.forEach(line => {
        const [word, reading] = line.split(',');
        if ((word && (word.startsWith(katakanaSearch) || word.startsWith(hiraganaSearch))) ||
          (reading && (reading.startsWith(katakanaSearch) || reading.startsWith(hiraganaSearch)))) {
          results.push(word);
        }
      });

      EL_SEARCH_LIST.innerHTML = '';

      if (results.length > 0) {
        const fragment = document.createDocumentFragment();
        results.forEach(suggestion => {
          const li = document.createElement('li');
          li.classList.add(CLASS_DATA);
          li.dataset.path = path;
          li.dataset.type = "search";
          li.textContent = eschtml(suggestion);
          fragment.appendChild(li);
        });
        EL_SEARCH_LIST.appendChild(fragment);
      }
    })
    .catch(error => console.error(error));
}

Controller.prototype.startEdit = function() {
  this.currentData.focus();
  EL_SEARCH_LIST.innerHTML = "";
}

Controller.prototype.endEdit = function() {
  [EL_EDIT_NOUN, EL_EDIT_PART, EL_EDIT_VERB].forEach(element => {
    element.blur();
  });
}

let controller = new Controller();
controller.getRandomWordFromCsv(DATA_PATH_NOUN);
controller.getRandomWordFromCsv(DATA_PATH_PART);
controller.getRandomWordFromCsv(DATA_PATH_VERB);

const keysPressed = {};
let isKeyPressed = false;
let isComposing = false;

document.addEventListener('keydown', function(event) {

  if (isKeyPressed) return;

  keysPressed[event.key] = true;

  let currentData = controller.currentData;
  let currentDataType = currentData.dataset.type;
  let currentDataPath = currentData.dataset.path;
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
      if(isEditing) {
        event.preventDefault();
        if (EL_SEARCH_LIST.querySelector('li') && !isComposing) {
          if (currentDataType == DATA_TYPE_EDIT) {
            controller.setCurrentList(EL_SEARCH_LIST);
          } else if (currentDataType == DATA_TYPE_SEARCH) {
            controller.nextData();
          }
        }
      } else {
        if (currentDataType != DATA_TYPE_EDIT) {
          if (currentData.nextElementSibling) controller.nextData();
        }
      }
      break;
    case 'ArrowUp':
      if(isEditing) {
        event.preventDefault();
        if (currentDataType == DATA_TYPE_SEARCH) {
          if (currentData == EL_SEARCH_LIST.querySelector('li')) {
            controller.setCurrentDataFromPathAndType(currentDataPath, DATA_TYPE_EDIT);
          } else {
            controller.prevData();
          }
        }
      } else {
        if (currentDataType != DATA_TYPE_EDIT) {
          if (currentData.nextElementSibling) controller.nextData();
        }
      }
      break;
    case 'Enter':
      if (isEditing) {
        if (currentDataType == DATA_TYPE_SEARCH) {
          controller.useData();
          controller.endEdit();
          controller.setCurrentDataFromPathAndType(currentDataPath, DATA_TYPE_EDIT);
          EL_SEARCH_LIST.innerHTML = "";
        }
      } else {
        if (currentDataType == DATA_TYPE_KEEP || currentDataType == DATA_TYPE_SEARCH) {
          controller.useData();
        } else if (currentDataType == DATA_TYPE_EDIT) {
          const path = currentData.dataset.path;
          controller.getRandomWordFromCsv(path);
        }  
      }
      break;
    case 'd':
      if (isEditing) return;
      if (currentDataType == DATA_TYPE_EDIT) {
        controller.deleteWordInSentence();
      } else if (currentDataType == DATA_TYPE_REIBUN) {
        controller.deleteReibun().then(() => controller.deleteData());
      } else {
        controller.deleteData();
      }
      break;
    case ' ':
      if (isEditing) return;
      controller.saveReibun().then((data) => createReibunListElement(data));
      break;
    case 'e':
      if (isEditing && isEditingCurrentData) return;
      if (currentDataType == DATA_TYPE_EDIT) {
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
      if (currentDataType == DATA_TYPE_EDIT) controller.keepData();
      break;
    case 'n':
      if (isEditing) return;
      controller.setCurrentList(EL_KEEP_LIST_NOUN);
      break;
    case 'p':
      if (isEditing) return;
      controller.setCurrentList(EL_KEEP_LIST_PART);
      break;
    case 'v':
      if (isEditing) return;
      controller.setCurrentList(EL_KEEP_LIST_VERB);
      break;
    case 's':
      if (isEditing) return;
      controller.setCurrentList(EL_SEARCH_LIST);
      break;
    case 'r':
      if (isEditing) return;
      controller.setCurrentList(EL_REIBUN_LIST);
      break;
    case 'f':
      if (isEditing) return;
      if (currentDataType == DATA_TYPE_EDIT) {
        if (currentData.nextElementSibling) {
          controller.nextData();
        } else {
          controller.resetCurrentData();
        }
      } else {
        controller.resetCurrentData();
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
      controller.getSearchWordsFromCsv(path, text);
    }
  });

  element.addEventListener('input', function(event) {
    calcInputTextWidth(this);
    if (!isComposing) {
      const text = event.target.value;
      const path = event.target.dataset.path
      if (text.length > 0) {
        controller.getSearchWordsFromCsv(path, text);
      }
    }
    if (!event.target.value) EL_SEARCH_LIST.innerHTML = "";
  });
});

function createReibunListElement(record) {
  const li = document.createElement("li");
  li.classList.add(CLASS_DATA);
  li.setAttribute('data-type', DATA_TYPE_REIBUN);
  li.setAttribute('data-id', record.id);
  li.textContent = eschtml(record.text);
  EL_REIBUN_LIST.prepend(li);
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
