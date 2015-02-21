#!/usr/bin/env node
/*************************************************************************
 * Copyright(c) 2012-2014 Jim Pravetz <jpravetz@epdoc.com>
 * May be freely distributed under the MIT license.
 **************************************************************************/
    var _ = require('underscore');

const TIMER_INTERVAL = 2000;
const BUFFER_INTERVAL = 0; //1000;
var type = "console";
//var type = "sos";
//var type = "file";

var type = process.argv[process.argv.length - 1];

var Logger = require('../index');
Logger.setGlobalLogLevel('verbose');

_.each( [ 'console', 'file', 'sos' ], function(t) {
    console.log("Validating '" + t + "' logger class" );
    var LoggerClass = Logger.getLoggerClass(t);
    var logger = new LoggerClass();
    if( logger.type() !== t ) {
        console.log( "ERROR: Logger type is not " + t );
    }
});

var log = require('../index').get('test');
var params = { path: __dirname + "/temp.log", buffer: BUFFER_INTERVAL};
console.log("Testing for type '" + type + "'" + " and parameters " + JSON.stringify(params) );

log.date();
log.info("Hello world");

Logger.setLogger( type, params );
log.info("Hello " + Logger.getCurrentLogger().type() );
log.date();
log.verbose("Verbose message");
log.data('obj', {a: 3}).debug("Debug message");
log.error("Error message");
log.error("Error message");
log.fatal("Danger, danger!");
log.info();
log.warn("Warning message");
log.log('info', ["First line of message", "Second line of message", "third line of message"]);
Logger.logMessage({
    message: "Calling Logger.writeMessage",
    module: "MyModule",
    sid: "MySessionId",
    data: {key: "value"}
});

var idx = 0;
var timer = setInterval(function() {
    log.date();
    log.debug("Message %d", ++idx);
    var t = Logger.getStartTime();
    log.warn("We started at this time %s", new Date(t));
}, TIMER_INTERVAL);


console.log('done');