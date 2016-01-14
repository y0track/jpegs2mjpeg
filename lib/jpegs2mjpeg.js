/*!
 * jpegs2mjpeg
 *
 *
 *
 * Copyright(c) 2015 Dmitry Rybin <postbox2020@yandex.ru>
 * MIT Licensed
 */


/**
 * Dep`s
 */

const util = require('util');
const Transform = require('stream').Transform;


/**
 * Constructor
 *
 * @param options
 * @returns {Jpegs2mjpeg}
 * @constructor
 */

function Jpegs2mjpeg(options) {
    if (!(this instanceof Jpegs2mjpeg))
        return new Jpegs2mjpeg(options);
    Transform.call(this);
    var opt = options instanceof Object ? util._extend({}, options) : {};
    this._boundary = 'boundary' in opt ? opt['boundary'] : 'xboundary';
    this._event = 'event' in opt ? opt['event'] : 'ready';
    this._delay = 'delay' in opt ? opt['delay'] : 0;
    this._ready = false;
    this._clients = [];
}
util.inherits(Jpegs2mjpeg, Transform);


/**
 * Ready to go
 *
 */

Jpegs2mjpeg.prototype.start = function () {
    this._ready = true;
    this.emit(this._event);
};


/**
 * Send new data
 *
 * @param fs    - readable stream descriptor
 * @param delay - optional delay
 * @returns {boolean}
 */

Jpegs2mjpeg.prototype.send = function (fs, delay) {
    var self = this
        , ret = false;
    delay |= this._delay;
    if (self._ready) {
        self._ready = false;
        fs.on('end', function () {
            var _timeout = setTimeout(function () {
                clearTimeout(_timeout);
                self.start();
            }, delay);
        }).pipe(self, {end: false});
        ret = true;
    }
    return ret;
};


/**
 * Serve new clients
 *
 * @param req
 * @param res
 */

Jpegs2mjpeg.prototype.addClient = function (req, res) {
    var self = this
        , needStart = !self._clients.length;
    self._clients.push(res);
    res.writeHead(200, {
        'Expires': 'Sun, 01 Jun 1970 00:00:00 GMT',
        'Content-Type': 'multipart/x-mixed-replace; boundary=' + self._boundary,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
    });
    req.socket.on('close', function () {
        self._clients.splice(self._clients.indexOf(res), 1);
        if (!self._clients.length) self._ready = false;
    });
    if (needStart) self.start();
};


/**
 * Serving clients
 *
 * @param imageJpeg
 * @param encoding
 * @param callback
 * @private
 */

Jpegs2mjpeg.prototype._transform = function (imageJpeg, encoding, callback) {
    var self = this;
    if (!self._clients.length) return callback();
    for (var i = 0, len = self._clients.length; i < len; i++) {
        var res = self._clients[i];
        res.write("--" + self._boundary + "\r\n");
        res.write("Content-Type: image/jpeg\r\n");
        res.write("Content-Length: " + imageJpeg.length + "\r\n");
        res.write("\r\n");
        res.write(imageJpeg, 'binary');
        res.write("\r\n");
    }
    callback();
};


/**
 * Exports
 */

module.exports = function (options) {
    return new Jpegs2mjpeg(options);
};
