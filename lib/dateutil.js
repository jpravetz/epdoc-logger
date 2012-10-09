/*************************************************************************
 * ARMOR5 CONFIDENTIAL
 * Copyright 2012 Armor5, Inc. All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains the property
 * of Armor5, Inc. and its suppliers, if any. The intellectual and
 * technical concepts contained herein are proprietary to Armor5, Inc.
 * and its suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material is
 * strictly forbidden unless prior written permission is obtained from
 * Armor5, Inc..
 **************************************************************************/

exports.toISOLocalString = toISOLocalString;
exports.toYYYYMMDDString = toYYYYMMDDString;
exports.toSortableString = toSortableString;
exports.formatMS = formatMS;
exports.toFileString = toFileString;

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

/**
 * @param din
 * @returns Return a string of the form 20121231235959 in localtime.
 */
function toFileString(din,ms) {
	var d = new Date(din);
	return d.getFullYear()
	+ pad(d.getMonth()+1)
	+ pad(d.getDate())
	+ pad(d.getHours())
	+ pad(d.getMinutes())
	+ pad(d.getSeconds())
	+ (ms?pad000(d.getMilliseconds()):'');
};

function toYYYYMMDDString(din){
	var d = new Date(din);
	return d.getFullYear()+'-'
	+ pad(d.getMonth()+1)+'-'
	+ pad(d.getDate());
};

function toSortableString(din){
	var d = new Date(din);
	return d.getFullYear()+'/'
	+ pad(d.getMonth()+1)+'/'
	+ pad(d.getDate())+' '
	+ pad(d.getHours())+':'
	+ pad(d.getMinutes())+':'
	+ pad(d.getSeconds()); /*+
	+ tz(d.getTimezoneOffset());*/
};

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

