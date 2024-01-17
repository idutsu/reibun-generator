(function () {
  const PATH_NOUN = "noun";
  const PATH_PART = "part";
  const PATH_VERB = "verb";
  const TYPE_EDIT = "edit";
  const TYPE_FAV = "fav";
  const TYPE_SEARCH = "search";
  const TYPE_REIBUN = "reibun";
  const CL_WORD = "word";
  const CL_SELECTED = "selected";
  const EL_REIBUN = document.getElementById("reibun");
  const EL_EDIT_NOUN = document.getElementById("edit-noun");
  const EL_EDIT_PART = document.getElementById("edit-part");
  const EL_EDIT_VERB = document.getElementById("edit-verb");
  const EL_FAV_NOUN = document.getElementById("fav-noun");
  const EL_FAV_PART = document.getElementById("fav-part");
  const EL_FAV_VERB = document.getElementById("fav-verb");
  const EL_SEARCH = document.getElementById("search");
  const BOX_SEARCH = document.getElementById("search-box");
  const EL_LOGS = document.getElementById("logs");
  const EL_CALC_NOUN = document.getElementById("calc-noun");
  const EL_CALC_PART = document.getElementById("calc-part");
  const EL_CALC_VERB = document.getElementById("calc-verb");

  class Controller {
    constructor() {
      this.selectedWordElement = null;
    }

    selectWord(wordElement) {
      let selectedWordElement = this.selectedWordElement;
      if (selectedWordElement) {
        selectedWordElement.classList.remove(CL_SELECTED);
      }
      this.selectedWordElement = wordElement;
      this.selectedWordElement.classList.add(CL_SELECTED);
    }

    selectNextWord() {
      const nextWordElement = this.selectedWordElement.nextElementSibling;
      if (nextWordElement) {
        this.selectWord(nextWordElement);
        nextWordElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }

    selectPrevWord() {
      const prevWordElement = this.selectedWordElement.previousElementSibling;
      if (prevWordElement) {
        this.selectWord(prevWordElement);
        prevWordElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }

    selectList(listElement) {
      const firstWordElementInList = listElement.firstElementChild;
      if (firstWordElementInList) this.selectWord(firstWordElementInList);
    }

    saveWord() {
      const selectedWordPath = this.selectedWordElement.dataset.path;
      const selectedWordText = trim(this.selectedWordElement.value);
      if (trim(selectedWordText) == "") return;
      isFetching = true;
      fetch(`/dic/save/word/fav/${selectedWordPath}/${selectedWordText}`, {
        method: "POST",
      })
        .then((response) => response.text())
        .then((data) => {
          const li = document.createElement("li");
          li.classList.add(CL_WORD);
          li.setAttribute("data-type", TYPE_FAV);
          li.setAttribute("data-path", selectedWordPath);
          li.innerText = eschtml(data);
          const wordListElement = getListWordElementByPath(selectedWordPath);
          wordListElement.prepend(li);
          writeLog(`「${data}」をお気に入りに保存しました`);
        })
        .finally(() => (isFetching = false))
        .catch((error) => console.error("Error:", error));
    }

    deleteWord() {
      const selectedWordElement = this.selectedWordElement;
      const selectedWordText = trim(selectedWordElement.innerHTML);

      if (selectedWordText == "") return;

      const selectedWordPath = selectedWordElement.dataset.path;
      isFetching = true;
      fetch(`/dic/delete/word/fav/${selectedWordPath}/${selectedWordText}`, {
        method: "POST",
      })
        .then((response) => response.text())
        .then((data) => {
          this.removeWord();
          writeLog(`「${data}」を削除しました`);
        })
        .finally(() => (isFetching = false))
        .catch((error) => console.error("Error:", error));
    }

    useWord() {
      const selectedWordElement = this.selectedWordElement;
      const selectedWordText = selectedWordElement.innerText;
      const selectedWordPath = selectedWordElement.dataset.path;
      const editWordElement = getEditWordElementByPath(selectedWordPath);
      editWordElement.value = eschtml(selectedWordText);
      calcInputTextWidth(editWordElement);
    }

    changeWord() {
      const path = this.selectedWordElement.dataset.path;
      isFetching = true;
      fetch(`/dic/get/word/random/${path}`)
        .then((response) => response.text())
        .then((text) => {
          const randomWord = text.split(",")[0];
          const editWordElement = getEditWordElementByPath(path);
          editWordElement.value = eschtml(randomWord);
          calcInputTextWidth(editWordElement);
        })
        .finally(() => (isFetching = false))
        .catch((error) => console.error("Error:", error));
    }

    changeWordByElement(editWordElement) {
      isFetching = true;
      const path = editWordElement.dataset.path;
      fetch(`/dic/get/word/random/${path}`)
        .then((response) => response.text())
        .then((text) => {
          const randomWord = text.split(",")[0];
          editWordElement.value = eschtml(randomWord);
          calcInputTextWidth(editWordElement);
        })
        .finally(() => (isFetching = false))
        .catch((error) => console.error("Error:", error));
    }

    searchWords(path, word) {
      isFetching = true;
      fetch(`/dic/get/words/search/${path}/${word}`)
        .then((response) => response.json())
        .then((results) => {
          EL_SEARCH.innerHTML = "";
          if (results.length > 0) {
            showSearchBox();
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
        .finally(() => (isFetching = false))
        .catch((error) => console.error(error));
    }

    editStart() {
      this.selectedWordElement.focus();
      EL_SEARCH.innerHTML = "";
    }

    editEnd() {
      document.activeElement.blur();
      hideSearchBox();
    }

    getReibun() {
      isFetching = true;
      fetch("/dic/get/reibun")
        .then((response) => response.json())
        .then((results) => {
          results.forEach((reibun) => {
            createReibunListElement(reibun);
          });
        })
        .finally(() => (isFetching = false))
        .catch((error) => console.error("Error:", error));
    }

    getFavoriteWords(path) {
      isFetching = true;
      fetch(`/dic/get/words/fav/${path}`)
        .then((response) => response.json())
        .then((results) => {
          const favoriteListElement = getListWordElementByPath(path);
          results.forEach((word) => {
            createFavoriteListElement(word, path, favoriteListElement);
          });
        })
        .finally(() => (isFetching = false))
        .catch((error) => console.error("Error:", error));
    }

    saveReibun() {
      const reibun =
        trim(EL_EDIT_NOUN.value) +
        trim(EL_EDIT_PART.value) +
        trim(EL_EDIT_VERB.value);
      if (trim(reibun) == "") return;
      isFetching = true;
      fetch(`/dic/save/reibun/${reibun}`, {
        method: "POST",
      })
        .then((response) => response.text())
        .then((data) => {
          if (data) {
            createReibunListElement(data);
            writeLog(`例文「${data}」を保存しました`);

          }
        })
        .finally(() => (isFetching = false))
        .catch((error) => console.error("Error:", error));
    }

    deleteReibun() {
      const selectedWordElement = this.selectedWordElement;
      const selectedWordText = trim(selectedWordElement.innerHTML);

      if (selectedWordText == "") return;

      isFetching = true;
      fetch(`/dic/delete/reibun/${selectedWordText}`, {
        method: "POST",
      })
        .then((response) => response.text())
        .then((data) => {
          this.removeWord();
          writeLog(`例文「${data}」を削除しました`);
        })
        .finally(() => (isFetching = false))
        .catch((error) => console.error("Error:", error));
    }

    removeWord() {
      const selectedWordElement = this.selectedWordElement;
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
    }
  }

  let isFetching = false;

  let controller = new Controller();
  controller.selectWord(EL_EDIT_NOUN);
  controller.changeWordByElement(EL_EDIT_NOUN);
  controller.changeWordByElement(EL_EDIT_PART);
  controller.changeWordByElement(EL_EDIT_VERB);
  controller.getReibun();
  controller.getFavoriteWords(PATH_NOUN);
  controller.getFavoriteWords(PATH_PART);
  controller.getFavoriteWords(PATH_VERB);
  writeLog("Reibun Generator Start!");

  const keysPressed = {};
  let isKeyPressed = false;
  let isComposing = false;
  let isEditing = false;

  document.addEventListener("keydown", (event) => {
    if (isKeyPressed) return;
    if (isFetching) return;

    keysPressed[event.key] = true;

    const selectedWordElement = controller.selectedWordElement;
    const selectedWordPath = selectedWordElement.dataset.path;
    const selectedWordType = selectedWordElement.dataset.type;

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
            if (!selectedWordElement.previousElementSibling) {
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
          controller.deleteReibun();
        } else {
          controller.deleteWord();
        }
        break;
      case " ":
        if (isEditing) return;
        controller.saveReibun();
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
          if (selectedWordPath == PATH_NOUN)
            controller.selectWord(EL_EDIT_PART);
          if (selectedWordPath == PATH_PART)
            controller.selectWord(EL_EDIT_VERB);
          if (selectedWordPath == PATH_VERB)
            controller.selectWord(EL_EDIT_NOUN);
        } else {
          controller.selectWord(EL_EDIT_NOUN);
        }
        break;
    }
    isKeyPressed = true;
  });

  document.addEventListener("keyup", (event) => {
    delete keysPressed[event.key];
    isKeyPressed = false;
  });

  document.addEventListener("compositionstart", () => {
    isComposing = true;
  });

  document.addEventListener("compositionend", (event) => {
    isComposing = false;
    const text = event.target.value;
    const path = event.target.dataset.path;
    if (text.length > 0) {
      controller.searchWords(path, text);
    }
  });

  document.addEventListener("input", (event) => {
    const selectedWordElement = controller.selectedWordElement;
    const selectedWordPath = selectedWordElement.dataset.path;
    const selectedWordType = selectedWordElement.dataset.type;
    const text = event.target.value;
    if (!isComposing) {
      if (text.length > 0) {
        controller.searchWords(selectedWordPath, text);
      } else {
        hideSearchBox();
      }
    }
    if (selectedWordType == TYPE_SEARCH) {
      controller.selectWord(getEditWordElementByPath(selectedWordPath));
    }
    // if (text.length === 0) {
    //   hideSearchBox();
    // }
    calcInputTextWidth(event.target);
  });

  function createReibunListElement(data) {
    const li = document.createElement("li");
    li.classList.add(CL_WORD);
    li.setAttribute("data-type", TYPE_REIBUN);
    li.textContent = eschtml(data);
    EL_REIBUN.prepend(li);
  }

  function createFavoriteListElement(word, path, listElement) {
    const li = document.createElement("li");
    li.classList.add(CL_WORD);
    li.setAttribute("data-type", TYPE_FAV);
    li.setAttribute("data-path", path);
    li.textContent = eschtml(word);
    listElement.prepend(li);
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

  function hideSearchBox() {
    BOX_SEARCH.style.display = "none";
    EL_SEARCH.innerHTML = "";
  }

  function showSearchBox() {
    BOX_SEARCH.style.display = "block";
  }

  function writeLog(log) {
    if (EL_LOGS.innerText.length > 50) {
      EL_LOGS.innerText = log;
    } else {
      EL_LOGS.innerText = log + "\n" + EL_LOGS.innerText;
    }
  }
})();
