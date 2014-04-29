var csv = require('csv');
var async = require('async');
var SimpleFileWriter = require('simple-file-writer');


exports.spellingSuggestor = {
  // Input file paths
  wordFrequenciesPath: "/frequent_words.csv",
  misspelledQueriesPath: "/misspelled.csv",
  
  // Output files path
  suggestionsPath: './suggestions.txt',

  // Common words and their frequencies
  wordFrequencies: null,
  
  // Hash of frequent words organized by length
  frequentWordsByLength: null,

  // Object to hold file writer
  suggestionsWriter: null,

  // Time stats
  timeGettingIndices: null,
  timeSorting: null,
  timeFormatting: null,
  startTime: null,


  // Read in files and begin parsing of misspelled words
  init: function () {
    var context = this;
    context.timeGettingIndices = 0;
    context.timeSorting = 0;
    context.timeFormatting = 0;
    context.startTime = new Date();

    this.suggestionsWriter = new SimpleFileWriter(context.suggestionsPath);

    // Parse input data
    this.parseCSVFile(this.wordFrequenciesPath, function (data) {
      context.wordFrequencies = data;
      context.frequentWordsByLength = context.organizeWordsByLength(data);
      context.parseMisspelled();
    });

  },
  
  organizeWordsByLength: function (wordFrequencies) {
    organizedWordPairs = {};
    
    wordFrequencies.forEach(function (item) {
      var wordLength = item[0].length;
      var wordLengthArray = organizedWordPairs[wordLength] || [];
      wordLengthArray.push([item[0], parseInt(item[1])]);
      organizedWordPairs[wordLength] = wordLengthArray;
    });
    
    return organizedWordPairs;
  },

  // Read in each line of misspelled words file, determine matching words from the 
  //   word frequencies list and format those matches for output. 
  parseMisspelled: function () {
    var context = this;
    var misspelled_q = async.queue(function (word, callback) {

      // Get indices of matching words in wordFrequency list
      var startIndices = new Date();
      var matchingObjects = [];
          
      // Run the matching algorithm for all words +- 2 character lengths from this word
      var wordLength = word.length;
      for (var i = -2; i < 3; i++) {
        matchingObjects.pushArray(context.findMatchingObjects(word, context.frequentWordsByLength[wordLength + i], 0, 2));
      }
      
      context.timeGettingIndices += new Date() - startIndices;

      var sortedObjects = context.sortByMatches(matchingObjects);

      // Format matching words 
      var startFormat = new Date();
      var formattedOutput = context.formatOutput(word, sortedObjects);
      context.timeFormatting += new Date() - startFormat;
      
      // Write out to csv 
      context.suggestionsWriter.write(formattedOutput);

      callback();

    }, 1);

    misspelled_q.drain = function () {
      var elapsedT = new Date() - context.startTime;
//      console.log('elapsed timeGettingIndices: ', context.timeGettingIndices);
//      console.log('elapsed timeFormatting: ', context.timeFormatting);
//      console.log('elapsed time: ', elapsedT);
    };


    this.parseCSVLine(this.misspelledQueriesPath, function (data, index) {
      misspelled_q.push(data);
    });
  },

  // Parse csv file
  // Callback takes entire data array
  parseCSVFile: function (inputFile, callback) {
    csv()
      .from.path(__dirname + inputFile, {
        delimiter: ',',
        escape: '"'
      })
      .to.array(callback);
  },

  // Parse line of csv. 
  // Callback takes (line, index) 
  parseCSVLine: function (inputFile, callback) {
    csv()
      .from.path(__dirname + inputFile, {
        delimiter: ',',
        escape: '"'
      })
      .on('record', callback);

  },

  // Examine each word in matching array by finding the Levenshtein distance 
  //   up to specified threshold. 
  // word - word to match
  // matching array - array of objects with potential matching words { 'lime', 12 }
  // arrayIndex - index in matching array where word exists 
  // maxDistance - maximum changes needed to match words
  // returns array of matching objects
  findMatchingObjects: function (word, matchingArray, arrayIndex, maxDistance) {
    if (matchingArray) {
      var matchingObjects = [];
      matchingArray.forEach(function (element, index, array) {

        var lev = exports.levenshtein(word, element[arrayIndex], maxDistance);
        if (lev >= 0 && lev <= maxDistance) {

          // Push word frequency object that matches closely
          matchingObjects.push(element);
        }
      });
      return matchingObjects;
    }
  },

  // Sort matching word objects of form ["word", frequencyCount] by frequency count in descending order
  sortByMatches: function (items) {
    return items.sort(function (a, b) {
      //var a_i = a, b_i = b;
      if (a[1] > b[1]) {
        // Left side has more matches
        return -1;
      } else if (a[1] < b[1]) {
        // Right side has more matches
        return 1;
      } else {
        // a must be equal to b
        return 0;
      }
    });
  },

  // Format output as specified in assignment
  formatOutput: function (misspelledWord, matchingWordObjets) {
    var matchingWordArray = matchingWordObjets.map(function (elem) {
      return elem[0];
    });
    var outputString = "* " + misspelledWord + ": " + JSON.stringify(matchingWordArray) + "\n";
    return outputString;
  },
};

// Conversion of Java Apache Commons algorithm to JavaScript
// http://commons.apache.org/proper/commons-lang/javadocs/api-3.1/src-html/org/apache/commons/lang3/StringUtils.html#line.6170
exports.levenshtein = function (s, t, threshold) {
  var n = s.length; // length of s
  var m = t.length; // length of t

  // if one string is empty, the edit distance is necessarily the length of the other
  if (n === 0) {
    return m <= threshold ? m : -1;
  } else if (m === 0) {
    return n <= threshold ? n : -1;
  }

  if (n > m) {
    // swap the two strings to consume less memory
    var tmp = s;
    s = t;
    t = tmp;
    n = m;
    m = t.length;
  }

  var p = new Array(n + 1); // 'previous' cost array, horizontally
  var d = new Array(n + 1); // cost array, horizontally
  var _d = []; // placeholder to assist in swapping p and d

  // fill in starting table values
  var boundary = Math.min(n, threshold) + 1;
  for (var i = 0; i < boundary; i++) {
    p[i] = i;
  }
  // these fills ensure that the value above the rightmost entry of our 
  // stripe will be ignored in following loop iterations
  //Arrays.fill(p, boundary, p.length, Integer.MAX_VALUE);
  for (var i = boundary; i < p.length; i++) {
    p[i] = Number.MAX_VALUE;
  }

  for (var i = 0; i < d.length; i++) {
    d[i] = Number.MAX_VALUE;
  }

  // iterates through t
  for (var j = 1; j <= m; j++) {
    var t_j = t.charAt(j - 1); // jth character of t
    d[0] = j;

    // compute stripe indices, constrain to array size
    var min = Math.max(1, j - threshold);
    var max = Math.min(n, j + threshold);

    // the stripe may lead off of the table if s and t are of different sizes
    if (min > max) {
      return -1;
    }

    // ignore entry left of leftmost
    if (min > 1) {
      d[min - 1] = Number.MAX_VALUE;
    }

    // iterates through [min, max] in s
    for (var i = min; i <= max; i++) {
      if (s.charAt(i - 1) == t_j) {
        // diagonally left and up
        d[i] = p[i - 1];
      } else {
        // 1 + minimum of cell to the left, to the top, diagonally left and up
        d[i] = 1 + Math.min(Math.min(d[i - 1], p[i]), p[i - 1]);
      }
    }

    // copy current distance counts to 'previous row' distance counts
    _d = p;
    p = d;
    d = _d;
  }

  // if p[n] is greater than the threshold, there's no guarantee on it being the correct
  // distance
  if (p[n] <= threshold) {
    return p[n];
  } else {
    return -1;
  }
};

Array.prototype.pushArray = function(arr) {
    this.push.apply(this, arr);
};
