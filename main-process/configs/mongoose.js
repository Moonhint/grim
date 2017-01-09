var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var db = mongoose.createConnection('mongodb://localhost/grim');

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.info("> Db: connected to grim DB");
  // we're connected!
});

process.on('SIGINT', function(){
  db.close(function () {
     console.info('\n> Disconnected from grim DB through app termination');
   });
});
