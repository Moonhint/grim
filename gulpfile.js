'use strict';

const gulp = require('gulp'),
      // electron = require('electron-connect').server.create();

gulp.task('serve', function(){

  // Start browser process
  electron.start();

  // Restart browser process
  gulp.watch('app.js', electron.restart);

  // Reload renderer process
  gulp.watch(['index.js', 'index.html'], electron.reload);

});

gulp.task('default', ['serve']);
