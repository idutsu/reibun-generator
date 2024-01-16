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

let controller = new CsvController();

app.use(express.static("public"));

app.get("/dic/get/word/random/:path", (req, res) => {
  const filePath = controller.getCsvFilePath("edit", req.params.path);
  controller.send(res, filePath, true, getRandomWordFromCsv);
});

app.post("/dic/save/word/fav/:path/:word", (req, res) => {
  const filePath = controller.getCsvFilePath("fav", req.params.path);
  const word = req.params.word;
  controller.write(res, filePath, word);
});

app.post("/dic/delete/word/fav/:path/:word", (req, res) => {
  const filePath = controller.getCsvFilePath("fav", req.params.path);
  const deleteWord = req.params.word;
  controller.delete(res, filePath, deleteWord);
});

app.get("/dic/get/words/fav/:path", (req, res) => {
  const filePath = controller.getCsvFilePath("fav", req.params.path);
  controller.send(res, filePath, false, getFavoriteWordsFromCsv);
});

app.get("/dic/get/words/search/:path/:word", (req, res) => {
  const filePath = controller.getCsvFilePath("edit", req.params.path);
  const searchWord = req.params.word;
  controller.send(res, filePath, true, getSearchWordsFromCsv, searchWord);
});

app.get("/dic/get/reibun", (req, res) => {
  const filePath = controller.getCsvFilePath("save", "reibun");
  controller.send(res, filePath, false, getReibunFromCsv);
});

app.post("/dic/save/reibun/:reibun", (req, res) => {
  const filePath = controller.getCsvFilePath("save", "reibun");
  const reibun = req.params.reibun;
  controller.write(res, filePath, reibun);
});

app.post("/dic/delete/reibun/:reibun", (req, res) => {
  const filePath = controller.getCsvFilePath("save", "reibun");
  const deleteReibun = req.params.reibun;
  controller.delete(res, filePath, deleteReibun);
});

app.listen(port, () => {
  console.log(`Reibun Generator listening at http://localhost:${port}`);
});
