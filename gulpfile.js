var gulp = require('gulp'),
    concat = require('gulp-concat'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify'),
    gutil = require('gulp-util'),
    pump = require('pump'),
    gBabel = require('gulp-babel');

gulp.task('source', function () {
    return gulp.src(['./src/promise.js'])
        .pipe(gulp.dest('./dist'))
})

gulp.task('js', function () {
    return gulp.src(['src/promise.js'])
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        .pipe(concat('promise-ployfill.min.js'))
        .pipe(gBabel({
            presets: ['es2015']
        }))
        .pipe(uglify())
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist'))
})

// gulp.task('debugging', function (cb) {
//     pump([
//         gulp.src('./src/promise.js'),
//         uglify(),
//         gulp.dest('./dist/')
//     ], cb);
// })

gulp.task('default', ['source', 'js'])