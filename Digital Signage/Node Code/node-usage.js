var fs = require('fs');
var $ = jQuery = require('jQuery');
require('../../node_modules/jquery-csv/src/jquery.csv.js');

var sample = 'IPTV_Channels.csv';
//var sample = '../../node_modules/jquery-csv/examples/data/sample.csv';
fs.readFile(sample, 'UTF-8', function(err, csv) {
  $.csv.toArrays(csv, {}, function(err, data) {
    for(var i=0, len=data.length; i<len; i++) {
      console.log(data[i]);
    }
  });
});
