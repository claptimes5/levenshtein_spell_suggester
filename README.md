# Levenshtein Spelling Suggester #

Spelling suggester implementation that uses word closeness comparison and word 
frequencies to suggest fixes to misspelled words. 

Input:

* `frequent_words.csv` - Contains list of common words and thier frequencies
* `misspelled.csv` - Contains list of misspelled words

Output:

* `suggestions.txt` - Spelling suggestions in the format: `* <misspelled query>: <array of suggestions>`
   
   Example: `* basicly: ["basil","basic","easily","basically"]`
   
## Run

* Uses NPM

`var file = require('./spellingSuggestor.js');`
`file.spellingSuggestor.init();`

## Tests

Requires the following modules: 

* 'mocha'
* 'chai'
* 'fs'

Then run `mocha`. 


# Attributions

* Apache Levenshtein algorithm 
  <http://commons.apache.org/proper/commons-lang/javadocs/api-3.1/src-html/org/apache/commons/lang3/StringUtils.html#line.6170></http:>