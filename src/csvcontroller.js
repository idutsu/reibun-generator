import fs from "fs";
import * as pathUtils from "path";

const CsvController = (() => {
  const csvFiles = {
    edit: {
      noun: "noun.csv",
      part: "part.csv",
      verb: "verb.csv",
    },
    fav: {
      noun: "fav-noun.csv",
      part: "fav-part.csv",
      verb: "fav-verb.csv",
    },
    search: {
      noun: "noun.csv",
      part: "part.csv",
      verb: "verb.csv",
    },
    reibun: "reibun.csv",
  };

  const cache = {};

  function _set(type, path) {
    const filePath =
      typeof csvFiles[type] === "string"
        ? csvFiles[type]
        : csvFiles[type][path];

    if (!filePath) {
      throw new Error(`File Not Found: type=${type}, path=${path}`);
    }
    return pathUtils.join(process.cwd(), "csv", filePath);
  }

  function _read(filePath, cacheFlag) {
    if (cacheFlag && cache[filePath]) {
      return Promise.resolve(cache[filePath]);
    } else {
      return fs.promises.readFile(filePath, "utf8").then((data) => {
        if (cacheFlag) cache[filePath] = data;
        return data;
      });
    }
  }

  function _send(res, data, status) {
    if (status) res.status(status);
    res.send(data);
  }

  function get(res, type, path, cacheFlag, callback, ...args) {
    const filePath = _set(type, path);
    _read(filePath, cacheFlag)
      .then((data) => {
        if (callback && typeof callback === "function") {
          _send(res, callback(data, ...args));
        } else {
          _send(res, data);
        }
      })
      .catch((err) => {
        if (err.code === "ENOENT") {
          _send(res, "File Not Found", 404);
        } else {
          console.error(err);
          _send(res, "Internal Server Error", 500);
        }
      });
  }

  function save(res, type, path, str) {
    const filePath = _set(type, path);
    const inputData = str.split(",");
    let found = false;

    _read(filePath, false)
      .then((data) => {
        const lines = data.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const elements = lines[i].split(",");
          if (elements[0] === inputData[0]) {
            found = true;
            break;
          }
        }
        if (!found) {
          data += "\n" + str;
        }
        delete cache[filePath];
        return fs.promises.writeFile(filePath, data, "utf8");
      })
      .then(() => {
        _send(res, { found: found, text: str });
      })
      .catch((err) => {
        console.error(err);
        _send(res, "Internal Server Error", 500);
      });
  }

  function del(res, type, path, str) {
    const filePath = _set(type, path);
    _read(filePath, false)
      .then((data) => {
        const lines = data.split("\n");

        const nonMatchingLines = lines.filter(
          (line) => line.split(",")[0].trim() !== str.split(",")[0],
        );
        const filteredLines = nonMatchingLines.filter(
          (line) => line.trim() !== "",
        );

        const updatedData = filteredLines.join("\n");
        delete cache[filePath];
        return fs.promises.writeFile(filePath, updatedData, "utf8");
      })
      .then(() => {
        _send(res, str);
      })
      .catch((err) => {
        console.error(err);
        _send(res, "Internal Server Error", 500);
      });
  }

  return {
    get: get,
    save: save,
    del: del,
  };
})();

export default CsvController;
