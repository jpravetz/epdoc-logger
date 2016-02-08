/*****************************************************************************
 * dateutil.js
 * CONFIDENTIAL Copyright 2012-2016 Jim Pravetz. All Rights Reserved.
 *****************************************************************************/

exports.toISOLocalString = toISOLocalString;
exports.formatMS = formatMS;

/**
 * 
 * @param din Parameter that is passed to a date constructor. 
 * @returns {String}
 */
function toISOLocalString(din){
	function tz(m) { return ((m<0)?'+':'-')+pad(Math.abs(m)/60)+':'+pad(Math.abs(m)%60); };
	var d = new Date(din);
	return d.getFullYear()+'-'
	+ pad(d.getMonth()+1)+'-'
	+ pad(d.getDate())+'T'
	+ pad(d.getHours())+':'
	+ pad(d.getMinutes())+':'
	+ pad(d.getSeconds())+'.'
	+ pad000(d.getMilliseconds())
	+ tz(d.getTimezoneOffset());
};

function _toISOLocaleString(d,bNoMs){
    function tz(m) { return ((m<0)?'+':'-')+pad(Math.abs(m)/60)+':'+pad(Math.abs(m)%60); };
    var s = String(d.getFullYear())+'-'
        + pad(d.getMonth()+1)+'-'
        + pad(d.getDate())+'T'
        + pad(d.getHours())+':'
        + pad(d.getMinutes())+':'
        + pad(d.getSeconds());
    if( bNoMs !== true ) {
        s += '.' + pad000(d.getMilliseconds())
    }
    s += tz(d.getTimezoneOffset());
    return s;
}


/**
 * Format ms as MM:SS.mmm
 * @param ms
 * @returns {String}
 */
function formatMS( ms ) {
	var milliseconds = ms % 1000;
	var seconds = Math.floor( ms / 1000 ) % 60;
	var minutes = Math.floor( ms / ( 60 * 1000 ) );
	return pad(minutes) + ':' + pad(seconds) + '.' + pad000(milliseconds);
};

function pad(n){return n<10 ? '0'+n : n;};
function pad000(n){return n<10 ? '00'+n : (n<100 ? '0'+n : n);};
