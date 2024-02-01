import express from "express";
import CsvController from "./src/csvcontroller.js";
import {
  getFavoriteWordsFromCsv,
  getRandomWordFromCsv,
  getReibunFromCsv,
  getSearchWordsFromCsv,
} from "./src/csvfunctions.js";

const app = express();
const port = 3000;

app.use(express.static("public"));

app.get("/dic/get/:type/:path/:data", (req, res) => {
  const { type, path, data } = req.params;
  let callback = null;
  let args = null;
  switch (type) {
    case "edit":
      if (data == "null") {
        callback = getRandomWordFromCsv;
      } else {
        callback = getSearchWordsFromCsv;
        args = data;
      }
      break;
    case "fav":
      callback = getFavoriteWordsFromCsv;
      break;
    case "reibun":
      callback = getReibunFromCsv;
      break;
  }
  CsvController.get(res, type, path, true, callback, args);
});

app.post("/dic/save/:type/:path/:data", (req, res) => {
  CsvController.save(res, req.params.type, req.params.path, req.params.data);
});

app.post("/dic/delete/:type/:path/:data", (req, res) => {
  CsvController.del(res, req.params.type, req.params.path, req.params.data);
});

app.listen(port, () => {
  console.log(`Reibun Generator listening at http://localhost:${port}`);
});
