/*************************************************************************
 * ARMOR5 CONFIDENTIAL
 * Copyright 2013 Armor5, Inc. All Rights Reserved.
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

/**
 * Middleware adds a unique id to each request
 */

var reqId = 0;

module.exports = function() {

    return function(req,res,next) {

        req._reqId = ++reqId;
        next();
    };

};

