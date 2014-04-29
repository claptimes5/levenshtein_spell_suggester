// Unit tests for spellingSuggestor.js

var chai = require("chai");
var assert = chai.assert;
var file = require('./spellingSuggestor.js');

var fs = require('fs');

describe('spellingSuggestor', function () {
  var spellingSuggestor = null;
  var wordFrequencies = [
        ['bankruptcy', 659],
        ['babysit', 1059],
        ['baby', 11112],
        ['bass', 1371]];
  var misspelledQueries = ['babys', 'backpeddle', 'backruptcy'];


  beforeEach(function () {
    spellingSuggestor = file.spellingSuggestor;
  });

  it('should have paths for input files', function () {
    assert.equal(spellingSuggestor.wordFrequenciesPath, "/word_frequency.csv");
    assert.equal(spellingSuggestor.misspelledQueriesPath, "/misspelled_queries.csv");
  });

  it('should load test word frequencies using parseCSVFile', function (done) {
    spellingSuggestor.parseCSVFile("/test_files/word_frequency.csv", function (data) {
      data.forEach(function (element, index) {
        assert.equal(element[0], wordFrequencies[index][0]);
        assert.equal(element[1], wordFrequencies[index][1]);
      });

      done();
    });
  });

  it('should load test misspelled queries using parseCSVLine', function (done) {
    spellingSuggestor.parseCSVLine("/test_files/misspelled_queries.csv", function (line, index) {
      assert.equal(line, misspelledQueries[index]);
      if (index == misspelledQueries.length - 1) done();
    });
  });

  it('should find matching objects for "babys" and max distance of 2', function () {
    var testWord = 'babys';
    var expected = ['babysit', 'baby', 'bass'];

    results = spellingSuggestor.findMatchingObjects(testWord, wordFrequencies, 0, 2);

    results.forEach(function (item, index) {
      assert.include(expected, item[0]);
    });
  });

  it('should find matching objects for "babys" and max distance of 1', function () {
    var testWord = 'babys';
    var expected = ['baby'];
    var notExpected = ['babysit', 'bass'];

    results = spellingSuggestor.findMatchingObjects(testWord, wordFrequencies, 0, 1);

    results.forEach(function (item, index) {
      assert.include(expected, item[0]);
      assert.notInclude(notExpected, item[0]);
    });
  });

  it('should find no matching objects for "backpeddle" and max distance of 2', function () {
    var testWord = 'backpeddle';
    var expected = [];

    results = spellingSuggestor.findMatchingObjects(testWord, wordFrequencies, 0, 2);

    results.forEach(function (item, index) {
      assert.include(expected, item[0]);
    });
  });

  it('should sort object array by second column', function () {
    expedtedSortedData = [
        ['baby', 11112],
        ['bass', 1371],
        ['babysit', 1059],
        ['bankruptcy', 659],
        ];

    sorted = spellingSuggestor.sortByMatches(wordFrequencies);
    sorted.forEach(function (item, index) {
      assert.equal(item[0], expedtedSortedData[index][0]);
    });
  });

  it('should pretty print the matching words for "babys"', function () {
    var misspelledWord = "babys";
    var matchingWordObjets = [
        ['babysit', 1059],
        ['baby', 11112],
        ['bass', 1371]];

    var formattedString = spellingSuggestor.formatOutput(misspelledWord, matchingWordObjets);

    assert.equal(formattedString, "* babys: [\"babysit\",\"baby\",\"bass\"]\n");
  });

  it('should organize word frequencies by word length', function () {
    var expectedOrganizedWordFrequencies = {
      4: [
          ['baby', 11112],
          ['bass', 1371]
      ],
      7: [
          ['babysit', 1059],
      ],
      10: [
          ['bankruptcy', 659]
      ]
    };

    var organizedWords = spellingSuggestor.organizeWordsByLength(wordFrequencies);

    Object.keys(organizedWords).forEach(function (key) {
      organizedWords[key].forEach(function (item, index) {
        assert.equal(expectedOrganizedWordFrequencies[key][index][1], item[1]);
        assert.equal(expectedOrganizedWordFrequencies[key][index][0], item[0]);
      });
    });

  });

  it('should pretty print no matching words for "backpeddle"', function () {
    var misspelledWord = "backpeddle";
    var matchingWordObjets = [];

    var formattedString = spellingSuggestor.formatOutput(misspelledWord, matchingWordObjets);

    assert.equal(formattedString, "* backpeddle: []\n");
  });

  it('should write out to "test_suggestions.txt" the expected output', function (done) {
    expectedOutput = ["* babys: [\"baby\",\"bass\",\"babysit\"]",
                     "* backpeddle: []",
                     "* backruptcy: [\"bankruptcy\"]"];
    spellingSuggestor.wordFrequenciesPath = "/test_files/word_frequency.csv";
    spellingSuggestor.misspelledQueriesPath = "/test_files/misspelled_queries.csv";
    spellingSuggestor.suggestionsPath = 'test_files/test_suggestions.txt';

    fs.unlink('test_files/test_suggestions.txt', function (err) {
      //if (err) throw err;
      //console.log('successfully deleted /test_files/test_suggestions.txt');
    });

    spellingSuggestor.init();


    // Check file
    setTimeout(function () {
      check(done, function () {
        var array = fs.readFileSync('test_files/test_suggestions.txt').toString().split('\n');
        array.forEach(function (item, index) {
          if (item) {
            assert.equal(item, expectedOutput[index]);
          }
          if (index == expectedOutput.length - 1) done();
        });
      });
    }, 100);
  });
});

describe('levenshtein', function () {
  var levenshtein = file.levenshtein;
  var wordFrequencies = [
        ['bankruptcy', 659],
        ['babysit', 1059],
        ['baby', 11112],
        ['bass', 1371]];
  var misspelledQueries = ['babys', 'backpeddle', 'backruptcy'];


  it('should show a distance of 0 between "babys" and "babys", maxDistance 0', function () {
    assert.equal(levenshtein('babys', 'babys', 0), 0);
  });
  
  it('should show a distance of 0 between "babys" and "babys", maxDistance 2', function () {
    assert.equal(levenshtein('babys', 'babys', 2), 0);
  });
  
  it('should show a distance of 1 between "babys" and "baby", maxDistance 2', function () {
    assert.equal(levenshtein('babys', 'baby', 2), 1);
  });
  
  it('should show a distance of 1 between "baby" and "babys", maxDistance 2', function () {
    assert.equal(levenshtein('baby', 'babys', 2), 1);
  });
  
  it('should show a distance of 2 between "become" and "come", maxDistance 2', function () {
    assert.equal(levenshtein('become', 'come', 2), 2);
  });
  
  it('should show a distance of 2 between "come" and "become", maxDistance 2', function () {
    assert.equal(levenshtein('come', 'become', 2), 2);
  });
});

function check(done, f) {
  try {
    f();
    //done();
  } catch (e) {
    done(e);
  }
}