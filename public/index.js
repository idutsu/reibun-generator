const EL_ROOT = document.getElementById("root");
const EL_EDIT_NOUN = document.getElementById("edit-noun");
const EL_EDIT_PART = document.getElementById("edit-part");
const EL_EDIT_VERB = document.getElementById("edit-verb");
const EL_KEEP_LIST_NOUN = document.getElementById("keep-noun");
const EL_KEEP_LIST_PART = document.getElementById("keep-part");
const EL_KEEP_LIST_VERB = document.getElementById("keep-verb");
const EL_SEARCH_LIST = document.getElementById("search");
const STATUS_BAR = document.getElementById('status');

const CLASS_CURRENT_DATA = "current";
const CLASS_DATA = "data";
const CLASS_LIST = "list";

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
  this.currentDataIndex;
  this.currentData;
  this.lists = EL_ROOT.querySelectorAll("." + CLASS_LIST);

  this.initCurrentData(EL_EDIT_NOUN);
}

Controller.prototype._getAllData = function() {
  return EL_ROOT.querySelectorAll("." + CLASS_DATA);
}

Controller.prototype._getDataIndex = function(element) {
  const data = Array.from(this._getAllData());
  return data.indexOf(element);
}

Controller.prototype.getCurrentDataType = function() {
  return this.currentData.dataset.type;
}

Controller.prototype.getCurrentDataPath = function() {
  return this.currentData.dataset.path;
}

Controller.prototype._setCurrentData = function(element) {
  this.currentData = element;
  this.currentDataIndex = this._getDataIndex(element);
  this._setCurrentDataClass();
}

Controller.prototype.initCurrentData = function() {
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
  const nextDataIndex = this.currentDataIndex + 1;
  const data = this._getAllData();
  const nextData = data[nextDataIndex];
  if (nextData) {
    this._setCurrentData(nextData);
  }
};

Controller.prototype.prevData = function() {
  const prevDataIndex = this.currentDataIndex - 1;
  const data = this._getAllData();
  const prevData = data[prevDataIndex];
  if (prevData) {
    this._setCurrentData(prevData);
  }
}

Controller.prototype.nextList = function(index) {
  let currentListIndex = index !== undefined ? index : this.getCurrentListIndex();
  let nextList;
  let nextData = null;
  while (!nextData && currentListIndex < this.lists.length - 1) {
    currentListIndex++;
    nextList = this.lists[currentListIndex];
    if (nextList) {
      nextData = nextList.querySelector('.' + CLASS_DATA);
    }
  }
  if (nextData) {
    this._setCurrentData(nextData);
  }
}

Controller.prototype.prevList = function(index) {
  let currentListIndex = index !== undefined ? index : this.getCurrentListIndex();
  let prevList;
  let prevData = null;
  while (!prevData && currentListIndex > 0) {
    currentListIndex--;
    prevList = this.lists[currentListIndex];
    if (prevList) {
      prevData = prevList.querySelector('.' + CLASS_DATA);
    }
  }
  if (prevData) {
    this._setCurrentData(prevData);
  }
}

Controller.prototype.deleteData = function() {
  const prevData = this.currentData.previousElementSibling;
  if (prevData) {
    this.currentData.remove();
    this._setCurrentData(prevData);
  } else {
    const nextData = this.currentData.nextElementSibling;
    if (nextData) {
      this.currentData.remove();
      this._setCurrentData(nextData);
    } else {
      index = this.getCurrentListIndex();
      this.currentData.remove();
      this.prevList(index);
    }
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
  switch (path) {
    case DATA_PATH_NOUN:
      EL_EDIT_NOUN.value = word;
      break;
    case DATA_PATH_PART:
      EL_EDIT_PART.value = word;
      break;
    case DATA_PATH_VERB:
      EL_EDIT_VERB.value = word;
      break;
  }
}

Controller.prototype.saveData = function() {
  const saveData = EL_EDIT_NOUN.innerText + EL_EDIT_PART.innerText + EL_EDIT_VERB.innerText;
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

Controller.prototype.fetchRondomWordFromCsv = function(path) {
  fetch('/' + path)
    .then(response => response.text())
    .then(word => {
      document.getElementById('edit-' + path).value = word;
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
        // controller._setCurrentData(EL_SEARCH_LIST.querySelector('li'));
      } else {
      }
    })
    .catch(error => console.error('Error:', error));
};

Controller.prototype.startEdit = function() {
  const element = this.currentData;
  element.focus();
  EL_SEARCH_LIST.innerHTML = "";
  // const selection = window.getSelection();
  // const range = document.createRange();
  // range.selectNodeContents(element);
  // range.collapse(false);
  // selection.removeAllRanges();
  // selection.addRange(range);
}

Controller.prototype.endEdit = function() {
  [EL_EDIT_NOUN, EL_EDIT_PART, EL_EDIT_VERB].forEach(element => {
    element.blur();
  });
}


let controller = new Controller();
controller.fetchRondomWordFromCsv(DATA_PATH_NOUN);
controller.fetchRondomWordFromCsv(DATA_PATH_PART);
controller.fetchRondomWordFromCsv(DATA_PATH_VERB);

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
      if (!isEditing) {
        if (currentDataType == DATA_TYPE_SLOT) {
          controller.nextList();
        } else {
          controller.nextData();
          currentData.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      } else {
        if (currentDataType == DATA_TYPE_SLOT) {
          const searchWord = EL_SEARCH_LIST.querySelector('li');
          if (searchWord) {
            controller.endEdit();
            controller._setCurrentData(searchWord);
          }
        } else {
          if (currentDataType == DATA_TYPE_SEARCH && currentData.nextElementSibling) {
            event.preventDefault();
            controller.nextData();
            currentData.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }
      }
      break;
    case 'ArrowUp':
      if (!isEditing) {
        if (currentDataType != DATA_TYPE_SLOT) {
          if (!currentData.previousElementSibling) {
            controller.initCurrentData();
          } else {
            controller.prevData();
            currentData.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }
      } else {
        if (currentDataType == DATA_TYPE_SEARCH && currentData.previousElementSibling) {
          controller.prevData();
          currentData.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
      break;
    case 'ArrowRight':
      if (isEditing) return;
      if (currentDataType == DATA_TYPE_SLOT) {
        controller.nextData();
      } else {
        controller.nextList();
      }
      break;
    case 'ArrowLeft':
      if (isEditing) return;
      if (currentDataType == DATA_TYPE_SLOT) {
        controller.prevData();
      } else {
        controller.prevList();
      }
      break;
    case 'Enter':
      if (!isEditing) {
        if (currentDataType == DATA_TYPE_KEEP || currentDataType == DATA_TYPE_SEARCH) {
          controller.useData();
        } else if (currentDataType == DATA_TYPE_SLOT) {
          const path = controller.getCurrentDataPath();
          controller.fetchRondomWordFromCsv(path);
        }
      } else {
        // event.preventDefault();
        // controller.endEdit();
        // if (currentDataType == DATA_TYPE_SEARCH && !isComposing) {
        //   controller.useData();
        //   controller.endEdit();
        // }
      }
      break;
    case 'Delete':
      if (currentDataType == DATA_TYPE_SLOT && !isEditing) {
        controller.currentData.innerText = "";
      } else {
        controller.deleteData();
      }
      break;
    case 's':
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
      if (currentDataType == DATA_TYPE_SLOT) {
        controller.keepData();
      }
      break;
    case 'n':
      if (isEditing) return;
      controller._setCurrentData(EL_EDIT_NOUN);
      break;
    case 'p':
      if (isEditing) return;
      controller._setCurrentData(EL_EDIT_PART);
      break;
    case 'v':
      if (isEditing) return;
      controller._setCurrentData(EL_EDIT_VERB);
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
    if (!isComposing) {
      const text = event.target.value;
      const path = event.target.dataset.path
      if (text.length > 0) {
        controller.fetchSearchWordsFromCsv(text, path);
      }
    }
  });
});
