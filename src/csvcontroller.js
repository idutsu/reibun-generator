import fs from "fs";
import path from "path";

export default class CsvController {
  constructor() {
    this.csvFiles = {
      save: {
        reibun: "reibun.csv",
      },
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
    };
    this.cache = {};
  }

  getCsvFilePath(t, p) {
    return path.join(process.cwd(), "csv", this.csvFiles[t][p]);
  }

  _read(filePath, cache) {
    return new Promise((resolve, reject) => {
      if (!fs.existsSync(filePath)) {
        return reject(new Error("File not found"));
      }

      if (this.cache[filePath]) {
        return resolve(this.cache[filePath]);
      } else {
        fs.readFile(filePath, "utf8", (err, data) => {
          if (err) {
            return reject(err);
          } else {
            if (cache) {
              this.cache[filePath] = data;
            }
            return resolve(data);
          }
        });
      }
    });
  }

  _send(res, data) {
    res.send(data);
  }

  send(res, filePath, cache, callback, ...args) {
    this._read(filePath, cache)
      .then((data) => {
        const processedData = callback(data, ...args);
        this._send(res, processedData);
      })
      .catch((err) => {
        if (err.code === "ENOENT") {
          res.status(404).send("File not found");
        } else {
          res.status(500).send("Internal Server Error");
        }
      });
  }

  write(res, filePath, str) {
    return new Promise((resolve, reject) => {
      fs.appendFile(filePath, str + "\n", "utf8", (err) => {
        if (err) {
          reject(err);
        } else {
          res.send(str);
          resolve("Data appended successfully");
        }
      });
    }).catch((err) => {
      res.status(500).send("Internal Server Error");
    });
  }

  delete(res, filePath, str) {
    this._read(filePath, false)
      .then((data) => {
        const lines = data.split("\n");
        const filteredLines = lines.filter((line) => line.trim() !== str);
        const updatedData = filteredLines.join("\n");
        return new Promise((resolve, reject) => {
          fs.writeFile(filePath, updatedData, "utf8", (err) => {
            if (err) {
              reject("Internal Server Error");
            } else {
              resolve(str);
            }
          });
        });
      })
      .then((deletedWord) => {
        res.send(deletedWord);
      })
      .catch((errorMessage) => {
        res.status(500).send(errorMessage);
      });
  }
}
