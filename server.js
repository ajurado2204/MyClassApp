/**
 * Created by Ale on 2/21/16.
 */
var express = require('express');
var bodyParser = require('body-parser');
var exphbs = require('express-handlebars');
var Sequelize = require('sequelize');
var passport = require('passport');
var passportLocal = require('passport-local');
var flash = require('connect-flash');
var bcrypt = require('bcryptjs');
const readline = require('readline');
const fs = require('fs');

var app = express();
var port = process.env.PORT || 8080;

var thisClassArray = [];

app.use(require('express-session')({
  secret: 'crackalackin',
  resave: true,
  saveUninitialized: true,
  cookie : { secure : false, maxAge : (4 * 60 * 60 * 1000) } // 4 hours
}));
app.use(flash());

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
    allowNull: false,
    validate:{
      notEmpty: true,
      isAlpha: true
    }
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: false,
    validate:{
      notEmpty: true,
      isAlpha: true
    }
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  }
}, {
  hooks: {
    beforeCreate: function(input){
      input.password = bcrypt.hashSync(input.password, 10);
    }
  }
});

var Class = sequelize.define('Class', {
  name: {
    type: Sequelize.STRING,
    allowNull: false,
  },
  limit: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  total: {
    type: Sequelize.INTEGER,
    allowNull: false
  }
});

var Instructor = sequelize.define('Instructor', {
  firstName: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      isAlpha: true
    }
  },
  lastName: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      isAlpha: true
    }
  },
  username: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  }
}, {
  hooks: {
    beforeCreate: function(input){
      input.password = bcrypt.hashSync(input.password, 10);
    }
  }
});

var InstructorClass = sequelize.define('instructorClass', {
  isTA: {
    type: Sequelize.BOOLEAN
  }
});

Student.belongsToMany(Class, {through: 'studentClass'});
Class.belongsToMany(Student, {through: 'studentClass'});
Instructor.belongsToMany(Class, {through: InstructorClass});
Class.belongsToMany(Instructor, {through: InstructorClass});



passport.use(new passportLocal.Strategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true,
    session: false
  },
  function(req, username, password, done) {

    if(username === undefined || username === '' || password === undefined || password === ''){
      done(null, false, {msg: "/?msg=Incorrect username or password"});
      return;
    }
    if(req.body.category === '' || req.body.category === undefined){
      done(null, false, {msg: "/?msg=Please choose one from the selection above"});
      return;
    }

    if(req.body.category === "2"){
      Student.findOne({
        where: {
          username: username
        }
      }).then(function(student) {
        //check password against hash
        if(student){
          bcrypt.compare(password, student.dataValues.password, function(err, success) {
            if (success) {
              //if password is correct authenticate the user with cookie
              done(null, {username:username, category: req.body.category});
            } else{
              done(null, false, {msg: "/?msg=Password Incorrect"});
            }
          });
        } else {
          done(null, false, {msg: "/?msg=Student not found"});
        }
      });
    }
    else if(req.body.category === "1"){
      Instructor.findOne({
        where: {
          username: username
        }
      }).then(function(instructor) {
        //check password against hash
        if(instructor){
          bcrypt.compare(password, instructor.dataValues.password, function(err, success) {
            if (success) {
              //if password is correct authenticate the user with cookie
              done(null, {username:username, category: req.body.category});
            } else{
              done(null, false, {msg: "/?msg=Password Incorrect"});
            }
          });
        } else {
          done(null, false, {msg: "/?msg=Instructor not found"});
        }
      });
    }
  }
));

passport.serializeUser(function(user, done) {
  done(null, {username:user.username, category: user.category});
});
passport.deserializeUser(function(username, done) {
  done(null, {username: username, category: username.category});

});



app.get('/', function(req,res) {
  var error = req.flash('error');
  if(error !== undefined){
    res.render('login', {msg: error[0]});
  }else{
    res.render('login');
  }

});



app.post('/login', passport.authenticate('local', {
  successRedirect: '/homepage',
  failureRedirect: '/',
  failureFlash : true
}));



app.get('/register', function(req,res) {
  res.render('registration', {msg: req.query.msg});
});



app.post('/register', function(req,res) {
  if(req.body.username.length < 5){
    res.redirect("/register?msg=Username must be longer than 5 characters");
  }else if(req.body.password.length < 5){
    res.redirect("/registration?msg=Password must be longer than 5 characters");
  }

  if(req.body.category === '' || req.body.category === undefined){
    res.redirect("/register?msg=Please choose one from the selection above");
  }else{
    if(req.body.category === "2"){
      Student.create({
        firstName: req.body.fname, lastName: req.body.lname,  username: req.body.username, password: req.body.password
      }).then(function(student){
        res.redirect('/');
      }).catch(function(err) {
        console.log(err);
        res.redirect('/register?msg=' + err.errors[0].message);
      });
    }else{
      Instructor.create({
        firstName: req.body.fname, lastName: req.body.lname,  username: req.body.username, password: req.body.password
      }).then(function(instructor){
        res.redirect('/');
      }).catch(function(err) {
        console.log(err);
        res.redirect('/register?msg=' + err.errors[0].message);
      });
    }
  }
});


app.get('/homepage', function(req, res){

  //if student
  if(req.user.category === "2"){

    Class.findAll().then(function(classes) {
      var classArray = [];

      for(var i = 0; i < classes.length; i++){
        classArray.push({class: classes[i].dataValues.name});
      }

      res.render('homepage', {
        user: req.user.username,
        category: true,
        isAuthenticated: req.isAuthenticated(),
        class: classArray
      });
    })
  }
  //else if(req.user.category === "1"){
  //  Class.findAll().then(function(classes) {
  //    var classArray = [];
  //
  //    for(var i = 0; i < classes.length; i++){
  //      classArray.push({class: classes[i].dataValues.name});
  //    }
  //
  //    res.render('homepage', {
  //      user: req.user.username,
  //      category: false,
  //      isAuthenticated: req.isAuthenticated(),
  //      class: classArray
  //    });
  //  })
  //}
});


app.post('/registeredClass', function(req, res){

  var array = JSON.stringify(req.body.classesSel);
  console.log("HELOOOOOOOOOO " + array[0]);

  //for(var i = 0;i < array.length; i++){
  //  Class.findOne({
  //    where: {
  //      name: username
  //    }
  //  })
  //  studentClass.create().then(function(){
  //
  //  })
  //}


  console.log(JSON.stringify(req.body));
  res.render('homepage', {
    user: req.user.username,
    category: true,
    isAuthenticated: req.isAuthenticated(),
    class: thisClassArray
  });
  //res.redirect('/homepage', );
  //res.render('classRegistration', {
  //  user: req.user.username,
  //  category: true,
  //  isAuthenticated: req.isAuthenticated()
  //});
})

app.get('/classRegistration', function(req, res){

  if(req.user.category === "2"){

    Class.findAll().then(function(classes) {
      var classArray = [];

      for(var i = 0; i < classes.length; i++){
        classArray.push({class: classes[i].dataValues.name});
      }

      thisClassArray = classArray;
      res.render('homepage', {
        user: req.user.username,
        category: true,
        registration: true,
        isAuthenticated: req.isAuthenticated(),
        class: classArray
      });
    })
  }
})

sequelize.sync().then(function() {

  const rl = readline.createInterface({
    input: fs.createReadStream('classes.txt')
  });

  rl.on('line', function(line){
    Class.findOrCreate({
      where: {
        name: line
      },
      defaults: {
        limit: 10,
        total: 0}
    }).spread(function(user, created) {
      //console.log(user.get({
      //  plain: true
      //}));
      //console.log(created);
    });
  });


  app.listen(port, function() {
    console.log("Listening on port %s", port);
  });
}).catch(function(err){
  if(err){throw err;}
});
