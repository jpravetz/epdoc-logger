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

if( true ) {
    var Logger = require('../index');
    var log = require('../index').get('test');

    log.date();
    log.info( "Hello world");

    Logger.setLogger( 'sos' );
    log.info("Hello SOS");
    log.date();
    log.verbose("Verbose message");
    log.debug("Debug message");
    log.error("Error message");
    log.warn("Warning message");
}
else {
    var timer;
    var result = {}
    console.log("setting timeout");
    var timer = setTimeout( function() {
        console.log( "Timeout");
        result.done = true;
    }, 3000 );
}

//while( result.done === undefined ) {
//    console.log( "result = %s", result.done );
//    // console.log("spinning");
//};

console.log( 'done');