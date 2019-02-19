const gulp = require('gulp');
const babel = require('gulp-babel');

function transpile() {
  return gulp.src('./src/*.js')
    .pipe(babel({ presets: ['@babel/env']}))
    .pipe(gulp.dest('./public/'));
}

function watch() {
  return gulp.watch('./src/*.js', transpile);
}

gulp.task(transpile);
gulp.task(watch);
