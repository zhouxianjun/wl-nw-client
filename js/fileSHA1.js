var crypt = require('crypto');
var fs = require('fs');
function sha1(path, cb){
	var shasum = crypt.createHash('sha1');

	var s = fs.ReadStream(path);
	s.on('data', function(d) {
		shasum.update(d);
	});

	s.on('end', function() {
		var d = shasum.digest('hex');
		if(typeof cb === 'function'){
			cb(d, path);
		}
	});
}