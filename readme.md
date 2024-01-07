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

### Configure the application

Modify the `config.js` file with the development CSV paths:


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


## Usage

Reibun-Generator is designed to be used with a keyboard only, without the need for a mouse. Here are the key functionalities:

- Selected words are highlighted in green.
- `↑` `↓` `→` `←`: Select the next word.
- `Enter`: 
    - If a word in the sentence is selected, replace it with a random word from the dictionary.
    - If a favorite word or a search word is selected, replace the word in the sentence with the selected one.
- `K`: Add the selected word in the sentence to favorites.
- `E`: 
    - If a word in the sentence is selected, edit that word.
    - While typing, the search words area shows potential matching words.
- `ESC`: Finish editing a word.
- `S`: Save the sentence to `reibun.csv`.
- `Delete`: Delete the selected word.

This application emphasizes keyboard navigation for efficiency and ease of use.
