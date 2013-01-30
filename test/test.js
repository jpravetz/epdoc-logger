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

const TIMER_INTERVAL = 2000;
const BUFFER_INTERVAL = 0; //1000;
var type = "console";
//var type = "sos";
//var type = "file";

var Logger = require('../index');
Logger.setGlobalLogLevel( 'verbose' );
var log = require('../index').get('test');

log.date();
log.info( "Hello world");

Logger.setLogger( { type: type, path: __dirname + "/temp.log", buffer: BUFFER_INTERVAL } );
log.info("Hello " + Logger.getLogger().type );
log.date();
log.verbose( "Verbose message");
log.data('obj',{a:3}).debug( "Debug message");
log.error("Error message");
log.error("Error message");
log.fatal("Danger, danger!");
log.info();
log.warn("Warning message");
log.log( 'info', ["First line of message", "Second line of message", "third line of message"] );
Logger.logMessage( { message: "Calling Logger.writeMessage", module: "MyModule", sid: "MySessionId", data: { key: "value" } } );

var idx = 0;
var timer = setInterval( function() {
    log.date();
    log.debug( "Message %d", ++idx );
    var t = Logger.getStartTime();
    log.warn( "We started at this time %s", new Date(t) );
}, TIMER_INTERVAL );


console.log( 'done');