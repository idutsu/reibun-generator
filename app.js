// index.js
import express from 'express';
import fs from 'fs';
import csv from 'csv-parser';
import {
    NOUN_CSV_PATH,
    PART_CSV_PATH,
    VERB_CSV_PATH,
    REIBUN_CSV_PATH,
    API_GET_NOUN,
    API_GET_PART,
    API_GET_VERB,
    API_POST_SEARCH,
    API_POST_SAVE
}  from './config.js';

const app = express();
const port = 3000;
 
app.use(express.static('public'));

app.get(API_GET_NOUN, (req, res) => {
    getRandomWordFromCsv(NOUN_CSV_PATH, res);
});

app.get(API_GET_PART, (req, res) => {
    getRandomWordFromCsv(PART_CSV_PATH, res);
});

app.get(API_GET_VERB, (req, res) => {
    getRandomWordFromCsv(VERB_CSV_PATH, res);
});

app.get(API_POST_SEARCH, (req, res) => {
    const inputText = req.query.input;
    const pathFile = req.query.path;
    searchWordsInCsv(pathFile, inputText, (results) => {
        res.json(results);
    });
});

app.use(express.json());

app.post(API_POST_SAVE, (req, res) => {
    const text = req.body.text;
    const stream = fs.createWriteStream(REIBUN_CSV_PATH, { flags: 'a' });
    stream.write(text + '\n');
    stream.end();
    res.json({ text : text });
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

function getRandomWordFromCsv(filePath, res) {
    let words = [];
    fs.createReadStream(filePath)
        .pipe(csv({
            headers: false
        }))
        .on('data', (row) => {
            words.push(row['0']);
        })
        .on('end', () => {
            const randomWord = words[Math.floor(Math.random() * words.length)];
            res.send(randomWord);
        });
}

function searchWordsInCsv(filePath, searchText, callback) {
    let results = [];
    fs.createReadStream('csv/' + filePath + '.csv')
        .pipe(csv({
            headers: false
        }))
        .on('data', (row) => {
            const word = row[0];
            const reading = row[1];

            const katakanaSearch = hiraganaToKatakana(searchText);
            const hiraganaSearch = katakanaToHiragana(searchText);

            if ((word && (word.startsWith(katakanaSearch) || word.startsWith(hiraganaSearch))) || 
                (reading && (reading.startsWith(katakanaSearch) || reading.startsWith(hiraganaSearch)))) {
                results.push(word);
            }
        })
        .on('end', () => {
            callback(results);
        });
}

function hiraganaToKatakana(str) {
    return str.replace(/[\u3041-\u3096]/g, match => {
        return String.fromCharCode(match.charCodeAt(0) + 0x60);
    });
}

function katakanaToHiragana(str) {
    return str.replace(/[\u30A1-\u30F6]/g, match => {
        return String.fromCharCode(match.charCodeAt(0) - 0x60);
    });
}