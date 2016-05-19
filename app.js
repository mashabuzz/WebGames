'use strict';

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var sqlite3 = require('sqlite3').verbose();
var passport = require('passport')
var passportLocal = require('passport-local');

var app = express();
var db = new sqlite3.Database('db/WebGames.db');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'js')));
app.use(express.static(path.join(__dirname, 'css')));

// parse application/json
app.use(bodyParser.json())

// parse application/urlencoded
app.use(bodyParser.urlencoded({ extended: false}));

app.use(cookieParser());
app.use(expressSession({
    secret: process.env.SESSION_SECRET || 'changeit',
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


passport.use(new passportLocal.Strategy((username, password, done) => {
    // TODO don't store raw password in db    
    db.serialize(function() {
       var query = `SELECT id, username, password FROM users WHERE username='${username}'`;
       console.log(`query = ${query}`);       
              
       db.all(query, (err, rows) => {
           if (rows.length === 0) {
               console.log(`User ${username} does not exist`);
               done(null, null);
           } else {               
               var row = rows[0];
               console.log(`row.id = ${row.ID}, row.username=${row.USERNAME}`);
               if(! err) {
                   if (row.PASSWORD === password) {     
                       console.log(`User ${username} is authorized`);  
                       done(null, {id: row.ID, username: row.USERNAME})
                   } else {
                       console.log(`User ${username} is unauthorized`);
                       done(null, null);
                   }
               } else {
                   done(err, null);
               }               
           }
       });            
    });
}));


passport.serializeUser((user, done) => {
    // serialize user to session
    done(null, user.id);
});


passport.deserializeUser((session, done) => {
    // deserialize user from session
    db.serialize(function() {
        var query = `SELECT username FROM USERS WHERE id=${session}`;
        console.log(`query = ${query}`);
        db.each(query, (err, row) => {
            done(null, {id: session, username: row.USERNAME});
        });
    });
});


app.get('/login', (req, res) => {
    // TODO Check if request is already authenticated
    res.render('login');      
});


app.get('/logout', (req, res) => {
   req.logout();
   res.redirect('/login'); 
});


app.post('/login', passport.authenticate('local'), (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/snake-single-player');
    } else {
        res.send('Authentication Failed');
    }
    
});


app.get('/register', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/snake-single-player');
    } else {
        res.render('register');   
    }     
});


app.post('/register', (req, res) => {
   // check if the username already exists then send 406 (Not Acceptable)
   var username = req.body.username;
   res.status(406).send(`Username ${username} already exists`); 
});


app.get('/snake-single-player', (req, res) => {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        res.render('snake-single-player', {
            user: req.user
        });    
    }        
});


app.post('/scores', (req, res) => {
    var userName = req.user.id;
    var gameName = req.body.game;
    var startTime = req.body.start_time;    
    var endTime = req.body.end_time;
    var score = req.body.score;
    
    var db = new sqlite3.Database('db/WebGames.db'); 
    
    db.serialize(function() {
        // TODO handle error
        var stmt = db.prepare('INSERT INTO SCORES VALUES(?, ?, ?, ?, ?)');
        stmt.run(userName, gameName, startTime, endTime, score);
        stmt.finalize();
    });
        
    res.send('');
});


app.listen(3000, '0.0.0.0', () => {
    console.log('Express app listening on port 3000');
});