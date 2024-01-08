# Reibun-Generator

Reibun-Generator is a web application for generating Japanese example sentences. This application is built using Node.js.

## Installation

To set up the application on your local environment, follow these steps:

### Clone the repository

First, clone the repository to your local machine:

```bash
git clone https://github.com/idutsu/reibun-generator.git
```

### Install dependencies

Navigate to the application directory and install the required dependencies:

```bash
cd reibun-generator
npm install
```

### Start the application

Run the application using the following command:

```bash
node app.js
```

The application will be available at `localhost:3000`.

## Japanese Dictionaries

The application uses three types of CSV dictionaries: `noun.csv`, `part.csv`, and `verb.csv`. Each of these files is composed of two columns:

| Word | Reading |
| ---- | ------- |
| 単語 | たんご |

- `noun.csv`: Contains nouns and their readings.
- `part.csv`: Contains particles and their readings.
- `verb.csv`: Contains verbs and their readings.

## Application Structure

Reibun-Generator is composed of three main areas:

### Example Sentence Area

This is where you create Japanese example sentences. The sentences are composed of three types of words: nouns, particles, and verbs. By randomly changing these words, you can create simple yet unexpected Japanese example sentences.

### Favorites Area

This area is for saving words from the Example Sentence Area. (Note that these are not saved to a database, so they will be lost when the browser is refreshed.) Words can be selected and used in the example sentences by pressing the K key.

### Search Area

This area displays potential word suggestions when editing a word in the Example Sentence Area. Selecting a word will reflect it in the example sentence.

## Usage

Reibun-Generator is designed to be used with a keyboard only, without the need for a mouse. Here are the key functionalities:

- Selected words are highlighted in green.
- `↑` `↓` `→` `←` Select the next word.
- `Enter`
    - If a word in the sentence is selected, replace it with a random word from the dictionary.
    - If a favorite word or a search word is selected, replace the word in the sentence with the selected one.
- `K` Add the selected word in the sentence to favorites.
- `E`
    - If a word in the sentence is selected, edit that word.
    - While typing, the search words area shows potential matching words.
- `ESC` Finish editing a word.
- `S` Save the sentence.
- `Delete` Delete the selected word.

This application emphasizes keyboard navigation for efficiency and ease of use.
