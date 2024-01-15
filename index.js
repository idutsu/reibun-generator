const DB = "ReibunDatabase";
const DB_TABLE = "ReibunStore";
const DB_VERSION = 1;
const CL_WORD = "word";
const PATH_NOUN = "noun";
const PATH_PART = "part";
const PATH_VERB = "verb";
const TYPE_EDIT = "edit";
const TYPE_FAV = "fav";
const TYPE_SEARCH = "search";
const TYPE_REIBUN = "reibun";
const CL_SELECTED = "selected";
const ID_EDIT_NOUN = "edit-noun";
const ID_EDIT_PART = "edit-part";
const ID_EDIT_VERB = "edit-verb";
const ID_FAV_NOUN = "fav-noun";
const ID_FAV_PART = "fav-part";
const ID_FAV_VERB = "fav-verb";
const ID_SEARCH = "search";
const ID_REIBUN = "reibun";

const EL_EDIT_NOUN = document.getElementById(ID_EDIT_NOUN);
const EL_EDIT_PART = document.getElementById(ID_EDIT_PART);
const EL_EDIT_VERB = document.getElementById(ID_EDIT_VERB);
const EL_FAV_NOUN = document.getElementById(ID_FAV_NOUN);
const EL_FAV_PART = document.getElementById(ID_FAV_PART);
const EL_FAV_VERB = document.getElementById(ID_FAV_VERB);
const EL_SEARCH = document.getElementById(ID_SEARCH);
const EL_REIBUN = document.getElementById(ID_REIBUN);
const EL_CALC_NOUN = document.getElementById("calc-noun");
const EL_CALC_PART = document.getElementById("calc-part");
const EL_CALC_VERB = document.getElementById("calc-verb");

function Controller() {
  this.selectedWordIndex = null; //int
  this.selectedWordPath = null; //string
  this.selectedWordType = null; // string
  this.db = null; // obj
  this.initDatabase()
    .then(() => this.getReibun())
    .catch((error) => console.error(error));
  this.selectWord(EL_EDIT_NOUN);
}

Controller.prototype.selectWord = function (wordElement) {
  const wordIndex = this._getWordIndex(wordElement);
  this.selectedWordIndex = wordIndex;
  this.selectedWordPath = wordElement.dataset.path;
  this.selectedWordType = wordElement.dataset.type;
  const selectedWord = document.querySelector("." + CL_SELECTED);
  if (selectedWord) selectedWord.classList.remove(CL_SELECTED);
  wordElement.classList.add(CL_SELECTED);
};

Controller.prototype.selectNextWord = function () {
  const selectedWordElement = this.getSelectedWordElement();
  const nextWordElement = selectedWordElement.nextElementSibling;
  if (nextWordElement) {
    this.selectWord(nextWordElement);
    nextWordElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

Controller.prototype.selectPrevWord = function () {
  const selectedWordElement = this.getSelectedWordElement();
  const prevWordElement = selectedWordElement.previousElementSibling;
  if (prevWordElement) {
    this.selectWord(prevWordElement);
    prevWordElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

Controller.prototype.selectList = function (listElement) {
  const firstWordElementInList = listElement.firstElementChild;
  if (firstWordElementInList) this.selectWord(firstWordElementInList);
};

Controller.prototype.saveWord = function () {
  const selectedWordElement = this.getSelectedWordElement();
  const selectedWordPath = this.selectedWordPath;
  const selectedWordText = trim(selectedWordElement.value);
  if (selectedWordText != "") {
    const li = document.createElement("li");
    li.classList.add(CL_WORD);
    li.setAttribute("data-type", TYPE_FAV);
    li.setAttribute("data-path", selectedWordPath);
    li.innerText = eschtml(selectedWordText);
    const wordListElement = getListWordElementByPath(selectedWordPath);
    wordListElement.prepend(li);
  }
};

Controller.prototype.deleteWord = function () {
  const selectedWordElement = this.getSelectedWordElement();
  const prevWordElement = selectedWordElement.previousElementSibling;
  const nextWordElement = selectedWordElement.nextElementSibling;
  selectedWordElement.remove();
  if (prevWordElement) {
    this.selectWord(prevWordElement);
  } else if (nextWordElement) {
    this.selectWord(nextWordElement);
  } else {
    this.selectWord(EL_EDIT_NOUN);
  }
};

Controller.prototype.useWord = function () {
  const selectedWordElement = this.getSelectedWordElement();
  const selectedWordText = selectedWordElement.innerText;
  const selectedWordPath = this.selectedWordPath;
  const editWordElement = getEditWordElementByPath(selectedWordPath);
  editWordElement.value = eschtml(selectedWordText);
  calcInputTextWidth(editWordElement);
};

Controller.prototype.changeWord = function () {
  const path = this.selectedWordPath;
  const file = "csv/" + path + ".csv";
  fetch(file)
    .then((response) => response.text())
    .then((text) => {
      const lines = text.split("\n");
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      const randomWord = randomLine.split(",")[0];
      const editWordElement = getEditWordElementByPath(path);
      editWordElement.value = eschtml(randomWord);
      calcInputTextWidth(editWordElement);
    })
    .catch((error) => console.error(error));
};

Controller.prototype.changeWordByElement = function (editWordElement) {
  const file = "csv/" + editWordElement.dataset.path + ".csv";
  fetch(file)
    .then((response) => response.text())
    .then((text) => {
      const lines = text.split("\n");
      const randomLine = lines[Math.floor(Math.random() * lines.length)];
      const randomWord = randomLine.split(",")[0];
      editWordElement.value = eschtml(randomWord);
      calcInputTextWidth(editWordElement);
    })
    .catch((error) => console.error(error));
};

Controller.prototype.searchWords = function (path, searchWord) {
  fetch("csv/" + path + ".csv")
    .then((response) => response.text())
    .then((text) => {
      const lines = text.split("\n");
      let results = [];
      const katakanaSearch = searchWord.replace(/[\u3041-\u3096]/g, (match) => {
        return String.fromCharCode(match.charCodeAt(0) + 0x60);
      });
      const hiraganaSearch = searchWord.replace(/[\u30A1-\u30F6]/g, (match) => {
        return String.fromCharCode(match.charCodeAt(0) - 0x60);
      });
      lines.forEach((line) => {
        const [word, reading] = line.split(",");
        if (
          (word &&
            (word.startsWith(katakanaSearch) ||
              word.startsWith(hiraganaSearch))) ||
          (reading &&
            (reading.startsWith(katakanaSearch) ||
              reading.startsWith(hiraganaSearch)))
        ) {
          results.push(word);
        }
      });

      EL_SEARCH.innerHTML = "";

      if (results.length > 0) {
        const fragment = document.createDocumentFragment();
        results.forEach((suggestion) => {
          const li = document.createElement("li");
          li.classList.add(CL_WORD);
          li.dataset.path = path;
          li.dataset.type = TYPE_SEARCH;
          li.textContent = eschtml(suggestion);
          fragment.appendChild(li);
        });

        EL_SEARCH.appendChild(fragment);
      }
    })
    .catch((error) => console.error(error));
};

Controller.prototype.editStart = function () {
  const selectedWordElement = this.getSelectedWordElement();
  selectedWordElement.focus();
  EL_SEARCH.innerHTML = "";
};

Controller.prototype.editEnd = function () {
  document.activeElement.blur();
  EL_SEARCH.innerHTML = "";
};

Controller.prototype.initDatabase = function () {
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
};

Controller.prototype.getReibun = function () {
  return new Promise((resolve, reject) => {
    const transaction = this.db.transaction(DB_TABLE, "readonly");
    const store = transaction.objectStore(DB_TABLE);
    const getRequest = store.openCursor();
    EL_REIBUN.innerHTML = "";

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
};

Controller.prototype.saveReibun = function () {
  return new Promise((resolve, reject) => {
    const text =
      trim(EL_EDIT_NOUN.value) +
      trim(EL_EDIT_PART.value) +
      trim(EL_EDIT_VERB.value);
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
};

Controller.prototype.deleteReibun = function () {
  return new Promise((resolve, reject) => {
    const selectedWordElement = this.getSelectedWordElement();
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
};

Controller.prototype.getSelectedWordElement = function () {
  return document.querySelectorAll("." + CL_WORD)[this.selectedWordIndex];
};

Controller.prototype._findWordFromIndex = function (wordIndex) {
  return document.querySelectorAll("." + CL_WORD)[wordIndex];
};

Controller.prototype._findAllWordElements = function () {
  return document.querySelectorAll("." + CL_WORD);
};

Controller.prototype._getWordIndex = function (wordElement) {
  const AllWordElements = this._findAllWordElements();
  const AllWordElementsArray = Array.from(AllWordElements);
  return AllWordElementsArray.indexOf(wordElement);
};

let controller = new Controller();
controller.changeWordByElement(EL_EDIT_NOUN);
controller.changeWordByElement(EL_EDIT_PART);
controller.changeWordByElement(EL_EDIT_VERB);

const keysPressed = {};
let isKeyPressed = false;
let isComposing = false;
let isEditing = false;

document.addEventListener("keydown", function (event) {
  if (isKeyPressed) return;

  keysPressed[event.key] = true;

  const selectedWordPath = controller.selectedWordPath;
  const selectedWordType = controller.selectedWordType;

  isEditing = checkEditing();

  switch (event.key) {
    case "ArrowDown":
      if (isEditing) {
        event.preventDefault();
        if (!isComposing) {
          if (selectedWordType == TYPE_EDIT) {
            controller.selectList(EL_SEARCH);
          } else if (selectedWordType == TYPE_SEARCH) {
            controller.selectNextWord();
          }
        }
      } else {
        if (selectedWordType != TYPE_EDIT) {
          controller.selectNextWord();
        }
      }
      break;
    case "ArrowUp":
      if (isEditing) {
        event.preventDefault();
        if (selectedWordType == TYPE_SEARCH) {
          if (!controller.getSelectedWordElement().previousElementSibling) {
            controller.selectWord(getEditWordElementByPath(selectedWordPath));
          } else {
            controller.selectPrevWord();
          }
        }
      } else {
        if (selectedWordType != TYPE_EDIT) {
          controller.selectPrevWord();
        }
      }
      break;
    case "Enter":
      if (isEditing) {
        if (selectedWordType == TYPE_SEARCH) {
          controller.useWord();
          controller.editEnd();
          controller.selectWord(getEditWordElementByPath(selectedWordPath));
        }
      } else {
        if (selectedWordType == TYPE_FAV || selectedWordType == TYPE_SEARCH) {
          controller.useWord();
        } else if (selectedWordType == TYPE_EDIT) {
          controller.changeWord();
        }
      }
      break;
    case "d":
      if (isEditing) return;
      if (selectedWordType == TYPE_EDIT) {
        selectedWordElement.value == "";
      } else if (selectedWordType == TYPE_REIBUN) {
        controller.deleteReibun().then(() => controller.deleteWord());
      } else {
        controller.deleteWord();
      }
      break;
    case " ":
      if (isEditing) return;
      controller.saveReibun().then((data) => createReibunListElement(data));
      break;
    case "e":
      if (isEditing) return;
      if (selectedWordType == TYPE_EDIT) {
        event.preventDefault();
        controller.editStart();
      }
      break;
    case "Escape":
      if (!isEditing) return;
      controller.editEnd();
      break;
    case "s":
      if (isEditing) return;
      if (selectedWordType == TYPE_EDIT) controller.saveWord();
      break;
    case "n":
      if (isEditing) return;
      controller.selectList(EL_FAV_NOUN);
      break;
    case "p":
      if (isEditing) return;
      controller.selectList(EL_FAV_PART);
      break;
    case "v":
      if (isEditing) return;
      controller.selectList(EL_FAV_VERB);
      break;
    case "s":
      if (isEditing) return;
      controller.selectList(EL_SEARCH);
      break;
    case "r":
      if (isEditing) return;
      controller.selectList(EL_REIBUN);
      break;
    case "f":
      if (isEditing) return;
      if (selectedWordType == TYPE_EDIT) {
        if (selectedWordPath == PATH_NOUN) controller.selectWord(EL_EDIT_PART);
        if (selectedWordPath == PATH_PART) controller.selectWord(EL_EDIT_VERB);
        if (selectedWordPath == PATH_VERB) controller.selectWord(EL_EDIT_NOUN);
      } else {
        controller.selectWord(EL_EDIT_NOUN);
      }
      break;
  }
  isKeyPressed = true;
});

document.addEventListener("keyup", function (event) {
  delete keysPressed[event.key];
  isKeyPressed = false;
});

document.addEventListener("compositionstart", function () {
  isComposing = true;
});

document.addEventListener("compositionend", function (event) {
  isComposing = false;
  const text = event.target.value;
  const path = event.target.dataset.path;
  if (text.length > 0) {
    controller.searchWords(path, text);
  }
});

document.addEventListener("input", function (event) {
  const selectedWordPath = controller.selectedWordPath;
  const selectedWordType = controller.selectedWordType;
  const text = event.target.value;
  if (!isComposing)
    if (text.length > 0) controller.searchWords(selectedWordPath, text);
  if (selectedWordType == TYPE_SEARCH)
    controller.selectWord(getEditWordElementByPath(selectedWordPath));
  if (!text) EL_SEARCH.innerHTML = "";
  calcInputTextWidth(event.target);
});

function createReibunListElement(record) {
  const li = document.createElement("li");
  li.classList.add(CL_WORD);
  li.setAttribute("data-type", TYPE_REIBUN);
  li.setAttribute("data-id", record.id);
  li.textContent = eschtml(record.text);
  EL_REIBUN.prepend(li);
}

function getEditWordElementByPath(path) {
  switch (path) {
    case PATH_NOUN:
      return EL_EDIT_NOUN;
    case PATH_PART:
      return EL_EDIT_PART;
    case PATH_VERB:
      return EL_EDIT_VERB;
    default:
      return EL_EDIT_NOUN;
  }
}

function getListWordElementByPath(path) {
  switch (path) {
    case PATH_NOUN:
      return EL_FAV_NOUN;
    case PATH_PART:
      return EL_FAV_PART;
    case PATH_VERB:
      return EL_FAV_VERB;
    default:
      return EL_FAV_NOUN;
  }
}

function getCalcWidthElementByPath(path) {
  switch (path) {
    case PATH_NOUN:
      return EL_CALC_NOUN;
    case PATH_PART:
      return EL_CALC_PART;
    case PATH_VERB:
      return EL_CALC_VERB;
  }
}

function calcInputTextWidth(editWordElement) {
  const calcWidthElement = getCalcWidthElementByPath(
    editWordElement.dataset.path,
  );
  calcWidthElement.textContent = editWordElement.value;
  calcWidthElement.style.display = "inline";
  const editWordElementWidth = calcWidthElement.offsetWidth;
  calcWidthElement.style.display = "none";
  editWordElement.style.width = editWordElementWidth + "px";
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
  return str.replace(/^[\s\u3000]+|[\s\u3000]+$/g, "");
}

function checkEditing() {
  const focusedElement = document.activeElement;
  return focusedElement && focusedElement !== document.body;
}
