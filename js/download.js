var fs = require('fs');
var url = require('url');  
var http = require('http');  
function download(file_url, file_name, cb, progress, path, sha, error){
	var fileName = '';
	var savepath = '';
	if(!path || path == ''){
		var DOWNLOAD_DIR = 'files\\';  
		savepath = global.process.execPath;
		savepath = savepath.substring(0, savepath.lastIndexOf('\\') + 1);
		savepath = savepath + DOWNLOAD_DIR;
		fileName = file_name;
	}else{
		savepath = path.substring(0, path.lastIndexOf('\\') + 1);
		fileName = path.substring(path.lastIndexOf('\\') + 1);
	}
	fs.exists(savepath, function (exists) {
		if(!exists){
			fs.mkdir(savepath, 0777, function(){
				download_file_httpget(file_url);
			});
		}else{
			download_file_httpget(file_url);
		}
	});
	  
	// Function to download file using HTTP.get  
	var download_file_httpget = function(file_url) {  
		var isok = false;
		var file = fs.createWriteStream(savepath + fileName);  
		  
		http.get(file_url, function(res) {
			if(res.statusCode == 200){
	    		isok = true;
	    		var tol = parseInt(res.headers['content-length']);
	    		var length = 0;
	    		file.on('close', function() {  
	    			if(isNaN(tol) || tol != length){
	    				isok = false;
	    				if(typeof error === 'function'){
	    					error(fileName);
			            }
	    				fs.unlink(file.path);
	    	    		return;
					}
		            if(typeof cb === 'function'){
		            	cb(file);
		            }
		            console.log(fileName + ' downloaded to ' + savepath);  
		        });
	    		res.on('data', function(data) {  
	    			var files = getLocalStorage('files');
					if(!files || !files[sha]){
						res.req.abort();
						return;
					}
	    			if(typeof progress === 'function'){
	    				length += data.length;
		            	var loaded = Math.ceil((length / tol) * 100);
		            	progress(loaded);
		            }
		        });
				res.pipe(file);
	    	}else{
	    		isok = false;
	    		if(typeof error === 'function'){
					error(fileName);
	            }
	    		fs.unlink(file.path);
	    	}
	    }).on('error', function(e) {
	    	isok = false;
	    	if(typeof error === 'function'){
				error(fileName);
            }
	    	fs.unlink(file.path);
	    });  
	}
}