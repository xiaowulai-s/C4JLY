var iconv = require('iconv-lite');
['pv.val=0', 'prints "PEAK:R",0', 'printh ff ff ff'].forEach(function (line) {
  var latin = iconv.encode(line, 'gbk').toString('latin1');
  console.log(JSON.stringify(line), '->', JSON.stringify(latin), 'latin1len=' + latin.length, 'gbklen=' + iconv.encode(line, 'gbk').length);
});