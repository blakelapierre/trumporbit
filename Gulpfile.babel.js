import gulp from 'gulp';
import less from 'gulp-less';
import pipe from 'gulp-pipe';
import pug from 'gulp-pug';

gulp.task('index', ['style'],
  () =>
    pipe([
      gulp.src('src/index.pug'),
      pug(),
      gulp.dest('.')
    ]));


gulp.task('style',
  () =>
    pipe([
      gulp.src('src/*.less'),
      less(),
      gulp.dest('src')
    ]));