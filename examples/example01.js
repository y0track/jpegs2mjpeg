var http = require('http');
var fs = require('fs');
var jpegs2mjpeg = require('..');
var recursive = require('recursive-readdir');

var port = 8081;
var inputDir = '../media';

// Get source files
var files = null;
recursive(inputDir, function (err, f) {
    if (err) console.log(err);
    files = f;
});

// Encoder 1
var coder1 = new jpegs2mjpeg();
var idx1 = 0;
coder1.on('ready', function () {
    if (coder1.send(fs.createReadStream(files[idx1]), 100)) {
        if (++idx1 == files.length) idx1 = 0;
    }
});

// Encoder 2
var coder2 = new jpegs2mjpeg({'delay': 150});
var idx2 = 0;
coder2.on('ready', function () {
    if (coder2.send(fs.createReadStream(files[idx2]))) {
        if (++idx2 == files.length) idx2 = 0;
    }
});

// HTTP test-server
http.createServer(function (req, res) {
    switch (req.url.split('?')[0]) {
        case '/':
            fs.readFile('index.html', function (err, data) {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(data);
            });
            break;
        case '/ch1':
            coder1.addClient(req, res);
            break;
        case '/ch2':
            coder2.addClient(req, res);
            break;
        default:
            break;
    }
}).listen(port);

console.log('Server listen on *:' + port);
