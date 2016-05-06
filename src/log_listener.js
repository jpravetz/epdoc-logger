/*****************************************************************************
 * log_listener.js.js
 * CONFIDENTIAL Copyright 2016 James Pravetz. All Rights Reserved.
 *****************************************************************************/


var LogListener = function (options) {
    this.buffer = [];
    this.output = (options && options.output);
};

LogListener.prototype.clear = function () {
    this.buffer = [];
};

LogListener.prototype.onMessage = function (params) {
    this.buffer.push(params);
    if (this.output) {
        console.log(JSON.stringify(params));
    }
};


LogListener.prototype.wait = function (params, bClear) {

    var self = this;

    function compareObject (p, obj) {
        if (!obj) {
            return false;
        }
        var pkeys = Object.keys(p);
        var bMatch = true;
        for (var pdx = 0; bMatch && pdx < pkeys.length; pdx++) {
            var pkey = pkeys[pdx];
            if (p[pkey] instanceof RegExp) {
                if( typeof obj[pkey] !== 'string' || !p[pkey].test(obj[pkey]) ) {
                    bMatch = false;
                }
            } else if (typeof p[pkey] === 'object') {
                bMatch = bMatch && compareObject(p[pkey], obj[pkey]);
            } else {
                if (p[pkey] != obj[pkey]) {
                    bMatch = false;
                }
            }
        }
        return bMatch;
    }

    function findIndex () {
        for (var idx = 0; idx < self.buffer.length; idx++) {
            var m = self.buffer[idx];
            var bMatch = compareObject(params, m);
            if (bMatch) {
                return idx;
            }
        }
        return -1;
    }

    return new Promise(function (resolve) {
        var timer = setInterval(function () {
            var idx = findIndex();
            if (idx >= 0) {
                var msg = self.buffer[idx];
                if (bClear) {
                    self.buffer = self.buffer.slice(idx + 1);
                }
                clearInterval(timer);
                resolve(msg);
            }
        }, 500);
    });
};

module.exports = LogListener;
