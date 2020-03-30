

// var gulp = require("gulp");
import gulp from 'gulp';
import nodemon from 'gulp-nodemon';
import pm2 from 'pm2';



gulp.task('serve', function (done) {
  nodemon({
    script: 'server.js'
  , ext: 'js html'
  , env: { 'NODE_ENV': 'development' }
  , done: done
  })
})



gulp.task('serve:live', function (done) {
  pm2.connect(true, function () {
    pm2.start({
      name: 'public',
      script: 'server.js',
    }, function () {
      pm2.streamLogs('all', 1);
      done();
    });
  });
})

