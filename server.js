/**
 * Created by Ale on 2/21/16.
 */
var express = require('express');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var Sequelize = require('sequelize');

var app = express();
var port = process.env.PORT || 8080;

var sequelize = new Sequelize('myClass_db', 'root', '', {
  host:'localhost',
  dialect: 'mysql'
});

app.use(bodyParser.urlencoded({extended: false}));
app.use('/js', express.static("public/js"));
app.use('/css', express.static("public/css"));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');



sequelize.sync().then(function() {
  app.listen(port, function() {
    console.log("Listening on port %s", port);
  });
}).catch(function(err){
  if(err){throw err;}
});
