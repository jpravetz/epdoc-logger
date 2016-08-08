'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var watchify = require('watchify');
// var source = require('vinyl-source-stream');
// var buffer = require('vinyl-buffer');
// var rename = require('gulp-rename');
var del = require('del');
var spawn = require('child_process').spawn;
var jsdoc = require('gulp-jsdoc3');


// var _ = require('underscore');
// var path = require('path');
// var moment = require('moment');

//var config = require('./gulp/config');


gulp.task('clean', function () {
    return del(['out']);
});

gulp.task('doc', function (cb) {
    var config = require('./jsdoc.json');
    gulp.src(['README.md', './src/**/*.js'], {read: false})
        .pipe(jsdoc(config, cb));
});

gulp.task('watch', function(cb) {
    gulp.watch(['README.md', 'index.js', './src/**/*.js'], ['doc']);
});

gulp.task('default',['doc']);
