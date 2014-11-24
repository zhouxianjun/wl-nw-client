var url=require('url');
var fs=require('fs');
var path=require('path');
var express = require('express');
var app = express();
var http = require('http');
var server = http.createServer(app);                                            

app.all('/getFile', function(req, res){ 
	var file = req.query.path;
	var id = req.query.id;
	var sha = hex_sha1(file);
	console.log(file);
	fs.exists(file, function (exists) {
		var chats = getLocalStorage('chats') || [];
		if(!exists || !chats[id]){
			res.end();
		}else{
			var stat = fs.statSync(file);
			var input = fs.createReadStream(file);
			var length = 0;
			res.setHeader('content-length', stat.size);
			input.on("open",function(){
				input.pipe(res);
            });
			input.on("data",function(data){
				var files = getLocalStorage('files');
				if(!files || !files[sha]){
					input.end();
					res.end();
					return;
				}
				length += data.length;
				var loaded = Math.ceil((length / stat.size) * 100);
				var parent = $('#' + sha, chats[id].window.document.body);
				$('.load-bar-inner', parent).width(loaded + '%');
            });
			input.on('error', function(){
				chats[id].window.cancelFileTransfer(sha, file.substr(file.lastIndexOf('\\') + 1));
			});
			input.on("end",function(){
                res.end();
                var files = getLocalStorage('files');
				if(files && files[sha]){
	                chats[id].window.insertSystemMsg({
	    				time: moment().format('YYYY-MM-DD HH:mm:ss'),
	    				msg: '成功发送文件 '+file.substr(file.lastIndexOf('\\') + 1)+'。',
	    			});
	                chats[id].window.cancelFileTransfer(sha, file.substr(file.lastIndexOf('\\') + 1), true);
				}
            });
		}
	});
});                                            
app.all('/connection', function(req, res){
	res.write('success');
	res.end();
});                                                                                          
server.listen();
var fileHttpPort = server.address().port;
setLocalStorage('fileHttpPort', fileHttpPort);
console.log('server start at: ' + fileHttpPort);