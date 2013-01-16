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

//var type = "console";
var type = "sos";
//var type = "file";

var testObject = {
    getSessionId: function() {
        return "SESSIONID";
    }
}

var Logger = require('../index');
Logger.setGlobalLogLevel( 'verbose' );
Logger.setSessionIdCallback( 'getSessionId' );
var log = require('../index').get('test');

log.date();
log.info( "Hello world");

Logger.setLogger( type, { path: "temp.log" } );
log.info(testObject,"Hello " + Logger.getLogger().type );
log.date();
log.verbose( "Verbose message");
log.debug( testObject, "Debug message");
log.error(testObject,"Error message");
log.fatal("Danger, danger!");
log.warn("Warning message");
log.log( 'info', ["First line of message", "Second line of message", "third line of message"] );

var idx = 0;
var timer = setInterval( function() {
    log.date();
    log.debug( "Message %d", ++idx );
    var t = Logger.getStartTime();
    log.warn( "We started at this time %s", new Date(t) );
}, 3000 );


console.log( 'done');