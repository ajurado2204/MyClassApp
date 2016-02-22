/**
 * Created by Ale on 2/21/16.
 */
var express = require('express');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var Sequelize = require('sequelize');
var passport = require('passport');
var passportLocal = require('passport-local');

var app = express();
var port = process.env.PORT || 8080;

app.use(require('express-session')({
  secret: 'crackalackin',
  resave: true,
  saveUninitialized: true,
  cookie : { secure : false, maxAge : (4 * 60 * 60 * 1000) } // 4 hours
}));

var sequelize = new Sequelize('myClass_db', 'root', '', {
  host:'localhost',
  dialect: 'mysql'
});

app.use(bodyParser.urlencoded({extended: false}));
app.use('/js', express.static("public/js"));
app.use('/css', express.static("public/css"));
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.use(passport.initialize());
app.use(passport.session());

var Student = sequelize.define('Student', {
  firstName: {
    type: Sequelize.STRING,
    validate:{
      notNull: true
    }
  },
  lastName: {
    type: Sequelize.STRING,
    validate:{
      notNull: true
    }
  },
  username: {
    type: Sequelize.STRING,
    validate: {
      notNull: true
    }
  },
  password: {
    type: Sequelize.STRING,
    validate: {
      notNull: true
    }
  }
});

var Class = sequelize.define('Class', {
  name: {
    type: Sequelize.STRING,
    validate: {
      notNull: true
    }
  }
});

var Instructor = sequelize.define('Instructor', {
  firstName: {
    type: Sequelize.STRING,
    validate: {
      notNull: true
    }
  },
  lastName: {
    type: Sequelize.STRING,
    validate: {
      notNull: true
    }
  },
  username: {
    type: Sequelize.STRING,
    validate: {
      notNull: true
    }
  },
  password: {
    type: Sequelize.STRING,
    validate: {
      notNull: true
    }
  },
  isTA: {
    type: Sequelize.BOOLEAN,
    validate: {
      notNull: true
    }
  }
});

Student.belongsToMany(Class, {through: 'studentClass'});
Class.belongsToMany(Student, {through: 'studentClass'});
Instructor.belongsToMany(Class, {through: 'instructorClass'});
Class.belongsToMany(Instructor, {through: 'instructorClass'});



app.get('/', function(req,res) {
  res.render('login', {msg: req.query.msg});
});

app.post('/login', function(req, res){

  if(req.body.username === undefined || req.body.username === '' || req.body.password === undefined || req.body.password === ''){
    res.redirect('/?msg=Incorrect username or password');
  }
  if(req.body.category === '' || req.body.category === undefined){
    res.redirect('/?msg=Please choose one of the options above');
  }

});





sequelize.sync().then(function() {
  app.listen(port, function() {
    console.log("Listening on port %s", port);
  });
}).catch(function(err){
  if(err){throw err;}
});
