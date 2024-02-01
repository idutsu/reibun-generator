(() => {
  const PATH_NOUN = "noun";
  const PATH_PART = "part";
  const PATH_VERB = "verb";
  const TYPE_EDIT = "edit";
  const TYPE_FAV = "fav";
  const TYPE_SEARCH = "search";
  const TYPE_REIBUN = "reibun";
  const TYPE_CALC = "calc";

  const CL_SELECTABLE = "selectable";
  const CL_SELECTED = "selected";

  const A_KEY = "a";
  const F_KEY = "f";
  const E_KEY = "e";
  const S_KEY = "s";
  const R_KEY = "r";
  const V_KEY = "v";
  const N_KEY = "n";
  const P_KEY = "p";
  const D_KEY = "d";
  const SPACE_KEY = " ";
  const ENTER_KEY = "Enter";
  const ESC_KEY = "Escape";
  const DELETE_KEY = "Delete";
  const ARROW_DOWN_KEY = "ArrowDown";
  const ARROW_UP_KEY = "ArrowUp";
  const ARROW_LEFT_KEY = "ArrowLeft";
  const ARROW_RIGHT_KEY = "ArrowRight";

  const EL_REIBUN = document.getElementById("reibun");
  const EL_EDIT_NOUN = document.getElementById("edit-noun");
  const EL_EDIT_PART = document.getElementById("edit-part");
  const EL_EDIT_VERB = document.getElementById("edit-verb");
  const EL_FAV_NOUN = document.getElementById("fav-noun");
  const EL_FAV_PART = document.getElementById("fav-part");
  const EL_FAV_VERB = document.getElementById("fav-verb");
  const EL_SEARCH = document.getElementById("search");
  const EL_SEARCH_BOX = document.getElementById("search-box");
  const EL_LOGS = document.getElementById("logs");
  const EL_CALC_NOUN = document.getElementById("calc-noun");
  const EL_CALC_PART = document.getElementById("calc-part");
  const EL_CALC_VERB = document.getElementById("calc-verb");

  const KEY_TO_EL = {
    edit: {
      noun: EL_EDIT_NOUN,
      part: EL_EDIT_PART,
      verb: EL_EDIT_VERB,
    },
    fav: {
      noun: EL_FAV_NOUN,
      part: EL_FAV_PART,
      verb: EL_FAV_VERB,
    },
    calc: {
      noun: EL_CALC_NOUN,
      part: EL_CALC_PART,
      verb: EL_CALC_VERB,
    },
    reibun: EL_REIBUN,
    search: EL_SEARCH,
    logs: EL_LOGS,
  };

  const PATH_TO_NAME = {
    noun: "名詞",
    part: "助詞",
    verb: "動詞",
  };

  let selEl = null;
  let selPath = null;
  let selType = null;
  let isEdit = false;
  let isFetch = false;
  let isKeyPressed = false;
  let isCompose = false;
  let keysPressed = {};

  const get = (type, path, data, callback, ...args) => {
    if (isFetch) return;
    isFetch = true;
    return fetch(`/dic/get/${type}/${path}/${data}/`)
      .then((response) => response.json())
      .then((res) => {
        callback(res, type, path, ...args);
        isFetch = false;
        return res;
      })
      .catch((error) => console.error("Error:", error));
  };

  const save = (type, path, data, callback, ...args) => {
    if (isFetch) return;
    data = trim(data);
    if (data == "") return;
    isFetch = true;
    fetch(`/dic/save/${type}/${path}/${data}`, {
      method: "POST",
    })
      .then((response) => response.json())
      .then((res) => {
        callback(res, type, path, data, ...args);
        isFetch = false;
      })
      .catch((error) => console.error("Error:", error));
  };

  const del = (type, path, data, callback, ...args) => {
    if (isFetch) return;
    data = trim(data);
    if (data == "") return;
    isFetch = true;
    fetch(`/dic/delete/${type}/${path}/${data}`, {
      method: "POST",
    })
      .then((response) => response.text())
      .then((res) => {
        callback(res, type, path, data, ...args);
        isFetch = false;
      })
      .finally(() => (isFetch = false))
      .catch((error) => console.error("Error:", error));
  };

  const select = (element) => {
    if (selEl) selEl.classList.remove(CL_SELECTED);
    selEl = element;
    selType = element.dataset.type;
    selPath = element.dataset.path;
    selEl.classList.add(CL_SELECTED);
  };

  const getReibun = () => {
    get(TYPE_EDIT, PATH_NOUN, null, getRandomWordCb, EL_EDIT_NOUN)
      .then(() =>
        get(TYPE_EDIT, PATH_PART, null, getRandomWordCb, EL_EDIT_PART),
      )
      .then(() =>
        get(TYPE_EDIT, PATH_VERB, null, getRandomWordCb, EL_EDIT_VERB),
      )
      .then(() => {})
      .catch((err) => console.error(err));
  };

  const selectTo = (direction) => {
    switch (direction) {
      case "next":
        direction = "nextElementSibling";
        break;
      case "prev":
        direction = "previousElementSibling";
    }
    let el = selEl;
    while (el) {
      el = el[direction];
      if (el && el.classList.contains(CL_SELECTABLE)) {
        select(el);
        scrollElement(el);
        break;
      }
    }
    return selEl;
  };

  const selectArea = (element) => {
    let el = element.firstElementChild;
    while (el) {
      if (el.classList.contains(CL_SELECTABLE)) {
        select(el);
        break;
      }
      el = el.nextElementSibling;
    }
  };

  const useWord = () => {
    const selText = selEl.innerText;
    const editEl = KEY_TO_EL[TYPE_EDIT][selPath];
    select(editEl);
    editEl.value = eschtml(selText);
    calcInputTextWidth(editEl);
  };

  const removeWord = () => {
    const prevEl = selEl.previousElementSibling;
    const nextEl = selEl.nextElementSibling;
    selEl.remove();
    if (prevEl) {
      select(prevEl);
    } else if (nextEl) {
      select(nextEl);
    } else {
      select(EL_EDIT_NOUN);
    }
  };

  const editStart = () => {
    selEl.focus();
  };

  const editEnd = () => {
    document.activeElement.blur();
  };

  const saveWordToFavCb = (res, type, path) => {
    if (res.found) {
      log(`${PATH_TO_NAME[path]}「${res.text}」はすでにお気に入りです`);
    } else {
      const fragment = document.createDocumentFragment();
      createLine(fragment, res.text, TYPE_FAV, path);
      KEY_TO_EL[TYPE_FAV][selPath].prepend(fragment);
      log(`${PATH_TO_NAME[path]}「${res.text}」をお気に入りに追加しました`);
    }
  };

  const saveReibunCb = (res, type, path) => {
    if (!res.found) {
      const fragment = document.createDocumentFragment();
      createLine(fragment, res.text, TYPE_REIBUN);
      EL_REIBUN.appendChild(fragment);
    }
    log(
      `例文「${res.text}」${res.found ? "はすでに存在します" : "を保存しました"}`,
    );
  };

  const saveWordToDicCb = (res, type, path) => {
    if (res.found) {
      log(`「${res.text}」は${PATH_TO_NAME[path]}辞書に存在します`);
    } else {
      log(`「${res.text}」を${PATH_TO_NAME[path]}辞書に保存しました`);
    }
  };

  const getWordsCb = (res, type, path) => {
    const fragment = document.createDocumentFragment();
    res.forEach((data) => {
      createLine(fragment, data, type, path);
    });
    const el = path ? KEY_TO_EL[type][path] : KEY_TO_EL[type];
    el.appendChild(fragment);
  };

  const getRandomWordCb = (res, type, path, el) => {
    el.value = eschtml(res.text);
    el.dataset.id = res.id;
    calcInputTextWidth(el);
  };

  const getSearchWordsCb = (res, type, path) => {
    EL_SEARCH.innerHTML = "";
    if (res.length > 0) {
      showSearchBox();
      const fragment = document.createDocumentFragment();
      res.forEach((data) => {
        const p = document.createElement("p");
        p.classList.add(CL_SELECTABLE);
        p.dataset.path = path;
        p.dataset.type = TYPE_SEARCH;
        p.dataset.id = data.id;
        p.textContent = eschtml(data.text);
        fragment.appendChild(p);
      });
      EL_SEARCH.appendChild(fragment);
    } else {
      hideSearchBox();
    }
  };

  const deleteFavCb = (res, type, path, data, el) => {
    log(`お気に入りから${PATH_TO_NAME[path]}「${res}」を削除しました`);
    removeWord();
  };

  const deleteReibunCb = (res, type, path, data, el) => {
    log(`例文から「${res}」を削除しました`);
    removeWord();
  };

  const deleteSearchCb = (res, type, path, data, el) => {
    log(`辞書から${PATH_TO_NAME[path]}「${res}」を削除しました`);
    removeWord();
    if (isShow(EL_SEARCH) && !EL_SEARCH.hasChildNodes()) {
      hideSearchBox();
      editEnd();
    }
  };

  const deleteEditCb = (res, type, path, data) => {
    log(`辞書から${PATH_TO_NAME[path]}「${res}」を削除しました`);
  };

  const keyDownHandler = (event) => {
    if (isKeyPressed) return;
    if (isFetch) return;

    keysPressed[event.key] = true;
    isEdit = checkEditing();

    switch (event.key) {
      case A_KEY:
        switch (isEdit) {
          case false:
            switch (selType) {
              case TYPE_EDIT:
                getReibun();
                break;
            }
            break;
        }
        break;
      case F_KEY:
        switch (isEdit) {
          case false:
            switch (selType) {
              case TYPE_EDIT:
                switch (selPath) {
                  case PATH_NOUN:
                    select(EL_EDIT_PART);
                    break;
                  case PATH_PART:
                    select(EL_EDIT_VERB);
                    break;
                  case PATH_VERB:
                    select(EL_EDIT_NOUN);
                    break;
                }
                break;
              default:
                select(EL_EDIT_NOUN);
                break;
            }
            break;
        }
        break;
      case ARROW_DOWN_KEY:
        switch (selType) {
          case TYPE_FAV:
          case TYPE_SEARCH:
          case TYPE_REIBUN:
            selectTo("next");
            break;
          case TYPE_EDIT:
            selectArea(EL_SEARCH);
            break;
        }
        break;
      case ARROW_UP_KEY:
        switch (selType) {
          case TYPE_FAV:
          case TYPE_REIBUN:
            selectTo("prev");
            break;
          case TYPE_SEARCH:
            switch (isEdit) {
              case true:
                event.preventDefault();
                if (selEl.previousElementSibling) {
                  selectTo("prev");
                } else {
                  select(KEY_TO_EL[TYPE_EDIT][selPath]);
                }
                break;
              case false:
                selectTo("prev");
                break;
            }
            break;
        }
        break;
      case ARROW_LEFT_KEY:
      case ARROW_RIGHT_KEY:
        break;
      case ENTER_KEY:
        switch (isEdit) {
          case true:
            event.preventDefault();
            switch (selType) {
              case TYPE_SEARCH:
                useWord();
                editEnd();
                hideSearchBox();
                break;
            }
            break;
          case false:
            switch (selType) {
              case TYPE_EDIT:
                get(selType, selPath, null, getRandomWordCb, selEl);
                break;
              case TYPE_FAV:
                useWord();
                break;
            }
            break;
        }
        break;
      case DELETE_KEY:
        switch (isEdit) {
          case false:
            switch (selType) {
              case TYPE_EDIT:
                del(TYPE_EDIT, selPath, selEl.value, deleteEditCb);
                break;
              case TYPE_REIBUN:
                del(TYPE_REIBUN, null, selEl.innerText, deleteReibunCb, selEl);
                break;
              case TYPE_FAV:
                del(TYPE_FAV, selPath, selEl.innerText, deleteFavCb, selEl);
                break;
            }
            break;
          case true:
            switch (selType) {
              case TYPE_SEARCH:
                del(TYPE_EDIT, selPath, selEl.innerText, deleteSearchCb, selEl);
                break;
            }
            break;
        }
        break;
      case E_KEY:
        switch (selType) {
          case TYPE_EDIT:
            switch (isEdit) {
              case false:
                editStart();
                get(TYPE_EDIT, selPath, selEl.value, getSearchWordsCb);
                event.preventDefault();
                break;
            }
            break;
        }
        break;
      case ESC_KEY:
        switch (isEdit) {
          case true:
            editEnd();
            hideSearchBox();
            switch (selType) {
              case TYPE_SEARCH:
                select(KEY_TO_EL[TYPE_EDIT][selPath]);
                break;
            }
            break;
        }
        break;
      case S_KEY:
        switch (isEdit) {
          case false:
            switch (selType) {
              case TYPE_EDIT:
                save(TYPE_FAV, selPath, selEl.value, saveWordToFavCb);
                break;
            }
            break;
        }
        break;
      case D_KEY:
        switch (isEdit) {
          case false:
            switch (selType) {
              case TYPE_EDIT:
                save(TYPE_EDIT, selPath, selEl.value, saveWordToDicCb);
                break;
            }
            break;
        }
        break;
      case SPACE_KEY:
        switch (isEdit) {
          case false:
            switch (selType) {
              case TYPE_EDIT:
                const reibun =
                  EL_EDIT_NOUN.value + EL_EDIT_PART.value + EL_EDIT_VERB.value;
                save(TYPE_REIBUN, null, reibun, saveReibunCb);
                break;
            }
            break;
        }
        break;
      case N_KEY:
        switch (isEdit) {
          case false:
            selectArea(EL_FAV_NOUN);
            break;
        }
        break;
      case P_KEY:
        switch (isEdit) {
          case false:
            selectArea(EL_FAV_PART);
            break;
        }
        break;
      case V_KEY:
        switch (isEdit) {
          case false:
            selectArea(EL_FAV_VERB);
            break;
        }
        break;
      case R_KEY:
        switch (isEdit) {
          case false:
            selectArea(EL_REIBUN);
            break;
        }
        break;
    }
    isKeyPressed = true;
  };

  const keyUpHandler = (event) => {
    delete keysPressed[event.key];
    isKeyPressed = false;
  };

  const composingStartHandler = (event) => {
    isCompose = true;
  };

  const composingEndHandler = (event) => {
    if (selType !== TYPE_EDIT) return;
    isCompose = false;
    const text = trim(event.target.value);
    const path = event.target.dataset.path;
    text.length > 0
      ? get(TYPE_EDIT, path, text, getSearchWordsCb)
      : hideSearchBox();
  };

  const inputHandler = (event) => {
    if (selType === TYPE_SEARCH) select(KEY_TO_EL[TYPE_EDIT][selPath]);
    if (selType !== TYPE_EDIT) return;
    const text = event.target.value;
    const path = event.target.dataset.path;
    if (!isCompose) {
      text.length > 0
        ? get(TYPE_EDIT, path, text, getSearchWordsCb)
        : hideSearchBox();
    }
    calcInputTextWidth(event.target);
  };

  const createLine = (fragment, data, type, path) => {
    const p = document.createElement("p");
    p.classList.add(CL_SELECTABLE);
    p.setAttribute("data-type", type);
    if (path !== undefined) p.setAttribute("data-path", path);
    p.textContent = eschtml(data);
    fragment.prepend(p);
  };

  const calcInputTextWidth = (editEl) => {
    const calcWidthElement = KEY_TO_EL[TYPE_CALC][editEl.dataset.path];
    calcWidthElement.textContent = editEl.value;
    const editWordElementWidth = calcWidthElement.offsetWidth;
    editEl.style.width = editWordElementWidth + "px";
  };

  const checkEditing = () => {
    const focusedElement = document.activeElement;
    return focusedElement && focusedElement !== document.body;
  };

  const hideSearchBox = () => {
    EL_SEARCH_BOX.style.display = "none";
    EL_SEARCH.innerHTML = "";
  };

  const showSearchBox = () => {
    EL_SEARCH_BOX.style.display = "block";
  };

  const log = (log) => {
    const logs = EL_LOGS.innerText.split("\n");
    EL_LOGS.innerText = log + "\n" + logs.slice(0, 3).join("\n");
  };

  const scrollElement = (el) => {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const isShow = (el) => {
    return el.style.dissplay !== "none" || el.style.visibility !== "hidden";
  };

  const eschtml = (str) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const trim = (str) => {
    return str.replace(/^[\s\u3000]+|[\s\u3000]+$/g, "");
  };

  //initialization
  select(EL_EDIT_NOUN);
  get(TYPE_EDIT, PATH_NOUN, null, getRandomWordCb, EL_EDIT_NOUN)
    .then(() => get(TYPE_EDIT, PATH_PART, null, getRandomWordCb, EL_EDIT_PART))
    .then(() => get(TYPE_EDIT, PATH_VERB, null, getRandomWordCb, EL_EDIT_VERB))
    .then(() => get(TYPE_REIBUN, null, null, getWordsCb))
    .then(() => get(TYPE_FAV, PATH_NOUN, null, getWordsCb))
    .then(() => get(TYPE_FAV, PATH_PART, null, getWordsCb))
    .then(() => get(TYPE_FAV, PATH_VERB, null, getWordsCb))
    .then(() => {
      document.addEventListener("keydown", keyDownHandler);
      document.addEventListener("keyup", keyUpHandler);
      document.addEventListener("compositionstart", composingStartHandler);
      document.addEventListener("compositionend", composingEndHandler);
      document.addEventListener("input", inputHandler);
      log("Reibun Generator Start!");
    })
    .catch((err) => {
      console.error(err);
      log(err.message);
    });
})();
