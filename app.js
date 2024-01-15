const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');
const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));

let csvCache = {};

app.get('/dic/:path', (req, res) => {
    const filePath = path.join(__dirname, 'csv', req.params.path + '.csv');

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }
    // キャッシュされている場合
    if (csvCache[filePath]) {
        return res.send(getRandomLineFromCsv(csvCache[filePath]));
    }
    // キャッシュされていない場合、ファイルを読み込む
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Internal Server Error');
        }
        csvCache[filePath] = data;
        res.send(getRandomLineFromCsv(data));
    });
});


app.get('/dic/search/:path/:searchWord', (req, res) => {
    const filePath = path.join(__dirname, 'csv', req.params.path + '.csv');
    const searchWord = req.params.searchWord;

    if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
    }
    // キャッシュされている場合
    if (csvCache[filePath]) {
        return res.send(searchCsv(csvCache[filePath], searchWord));
    }
    // キャッシュされていない場合、ファイルを読み込む
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).send('Internal Server Error');
        }
        csvCache[filePath] = data;
        res.send(searchCsv(data, searchWord));
    });
});


const getRandomLineFromCsv = (csvData) => {
    const lines = csvData.split("\n").filter(line => line.trim());
    return lines[Math.floor(Math.random() * lines.length)];
};


const searchCsv = (csvData, searchWord) => {
    const lines = csvData.split("\n");
    let results = [];
    const katakanaSearch = searchWord.replace(
        /[\u3041-\u3096]/g,
        (match) => {
            return String.fromCharCode(match.charCodeAt(0) + 0x60);
        },
    );
    const hiraganaSearch = searchWord.replace(
        /[\u30A1-\u30F6]/g,
        (match) => {
            return String.fromCharCode(match.charCodeAt(0) - 0x60);
        },
    );

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
    return results;
};














app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});