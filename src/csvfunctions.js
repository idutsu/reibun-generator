export function getFavoriteWordsFromCsv(csvData) {
  return csvData.split("\n").filter((line) => line.trim());
}

export function getRandomWordFromCsv(csvData) {
  const lines = csvData.split("\n").filter((line) => line.trim());
  const randomNumber = Math.floor(Math.random() * lines.length);
  return {
    id: randomNumber,
    text: lines[randomNumber].split(",")[0],
  };
}

export function getReibunFromCsv(csvData) {
  return csvData.split("\n").filter((line) => line.trim());
}

export function getSearchWordsFromCsv(csvData, searchWord) {
  const lines = csvData.split("\n");
  let results = [];
  const katakanaSearch = searchWord.replace(/[\u3041-\u3096]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) + 0x60);
  });
  const hiraganaSearch = searchWord.replace(/[\u30A1-\u30F6]/g, (match) => {
    return String.fromCharCode(match.charCodeAt(0) - 0x60);
  });

  lines.forEach((line, index) => {
    const [word, reading] = line.split(",");
    if (
      (word &&
        (word.startsWith(katakanaSearch) || word.startsWith(hiraganaSearch))) ||
      (reading &&
        (reading.startsWith(katakanaSearch) ||
          reading.startsWith(hiraganaSearch)))
    ) {
      results.push({ id: index, text: word });
    }
  });
  return results;
}
