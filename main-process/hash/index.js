module.exports = function(str){
  var Crypto = require('crypto');
	var tmp = Crypto.createHash('md5');
	var hashString = tmp.update(str);
	return hashString.digest('base64');
};
