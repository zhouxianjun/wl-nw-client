var fs = require('fs');
var url = require('url');  
var http = require('http');
function updateDownload(file_url, cb, progress, error){
	var fileName = file_url.substring(file_url.lastIndexOf('/') + 1);
	var savepath = '';
	var DOWNLOAD_DIR = 'update\\';  
	savepath = global.process.execPath;
	savepath = savepath.substring(0, savepath.lastIndexOf('\\') + 1);
	savepath = savepath + DOWNLOAD_DIR;
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
		            if(typeof cb === 'function'){
		            	cb(file);
		            }
		            console.log(fileName + ' downloaded to ' + savepath);  
		        });
	    		res.on('data', function(data) {  
	    			if(typeof progress === 'function'){
	    				length += data.length;
		            	var loaded = Math.ceil((length / tol) * 100)
		            	progress(loaded);
		            }
		        });
				res.pipe(file);
	    	}else{
	    		isok = false;
	    		if(typeof error === 'function'){
	    			error(res);
	            }
	    	}
	    });  
	}
}