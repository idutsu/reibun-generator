# Reibun Generator

Reibun Generator is a web browser application primarily designed for local use, focused on generating Japanese example sentences. This application, built using Node.js, is optimized for PC use and is intended to be operated mainly through keyboard interactions.

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

This application will be available at `localhost:3000`.

## Application Structure

Reibun-Generator is composed of three main areas:

### Example Sentence Area

This is where you create Japanese example sentences. The sentences are composed of three types of words: nouns, particles, and verbs. By randomly changing these words, you can create simple yet unexpected Japanese example sentences.

### Favorites Area

This area is for saving words from the Example Sentence Area. (Note that these are not saved to a database, so they will be lost when the browser is refreshed.) Words can be selected and used in the example sentences by pressing the `K`.

### Search Area

This area displays potential word suggestions when editing a word in the Example Sentence Area. Words can be selected and used in the example sentences by pressing the `K`.

## Japanese Dictionaries

This application uses [`IPA Dictionary`](https://github.com/idutsu/reibun-generator/blob/main/license.txt) to create example sentences :

- [`noun.csv`](https://github.com/idutsu/reibun-generator/tree/main/csv/noun.csv): Contains nouns and their readings.
- [`part.csv`](https://github.com/idutsu/reibun-generator/tree/main/csv/part.csv): Contains particles.
- [`verb.csv`](https://github.com/idutsu/reibun-generator/tree/main/csv/verb.csv): Contains verbs and their readings.

## Usage

This application is designed to be used with a keyboard only, without the need for a mouse. Here are the key functionalities:

- Selected words are highlighted in green.
- `↑` `→` `↓` `←` Select the next word.
- `Enter`
    - If a word is selected in the Example Sentence Area, it will be replaced with a random word from the dictionary.
    - If a word is selected in the Favorites Area or the Search Area, it will be used to replace the word in the sentence.
- `K` Add the selected word in the Example Sentence Area to the Favorites Area.
- `E`
    - If a word in the Example Sentence Area is selected, edit that word.
    - While typing, the Search Area shows potential matching words.
- `ESC` Finish editing a word.
- `S` Save to the `reibun.csv` file.
- `Delete` Delete the selected word.
