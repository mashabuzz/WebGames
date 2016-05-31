'use strict';

var express = require('express');
var path = require('path');
var socketIO = require('socket.io');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var passport = require('passport')
var passportLocal = require('passport-local');
var models = require('./models');

var app = express();
var http = require('http').Server(app);

var io = new socketIO(http);
var userDao = new models.UserDao();
var scoreDao = new models.ScoreDao();


app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'js')));
app.use(express.static(path.join(__dirname, 'css')));


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));


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
    
    userDao.getUser(null, username, (err, user) => {
        if (err) {
            console(`Error while retrieving User ${username} from db`);
            done(err, null);
        } else if (!user) {
            console.log(`User ${username} does not exist`);
            done(null, null);
        } else if (user.password === password) {
            console.log(`User ${username} is authorized`);
            done(null, user);
        } else {
            console.log(`User ${username} is unauthorized, provided password ${password}, actual password ${user.password}`);
            done(null, null);
        }
    });                   
    
}));


passport.serializeUser((user, done) => {
    // serialize user to session
    done(null, user.id);
});


passport.deserializeUser((session, done) => {
    
    // deserialize user from session
    userDao.getUser(session, null, (err, user) => {        
        if (err) {
            console(`Error while retrieving User with id ${session} from db`);
            done(err, null);
        } else {
            done(null, user);
        }
    });    
});


app.get('/', (req, res) => {
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        res.render('index', {user: req.user});
    }
});


app.get('/login', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.render('login');    
    }          
});


app.get('/logout', (req, res) => {
   req.logout();
   res.redirect('/login'); 
});


app.post('/login', passport.authenticate('local'), (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.send('Authentication Failed');
    }
    
});


app.get('/register', (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect('/');
    } else {
        res.render('register');   
    }     
});


app.post('/register', (req, res) => {
   // check if the username already exists then send 406 (Not Acceptable)
   var username = req.body.username;
   var password = req.body.password;
   if (!username) {
       res.status(406).send(`Username is empty`);
   } else if (!password) {
       res.status(406).send(`Password is empty`);
   } else if (password.length < 3) {
       res.status(406).send(`Password is too short, needs to be atleast 3 characters`);
   } else {
       userDao.createUser(username, password, (err, duplicateUser) => {
           if(!duplicateUser) {
               // new user created successfully
               res.redirect('/login'); 
           } else {
               // the provided username already exists
               res.status(406).send(`Username ${username} already exists`);  
           }
       });       
   }  
});


app.get('/snake-single-player', (req, res) => {
    var gameName = 'vintage-snake';
    if (!req.isAuthenticated()) {
        res.redirect('/login');
    } else {
        scoreDao.topScores(req.user.id, 5, gameName, (data) => {
            res.render('snake-single-player', {
                gameName: gameName,
                user: req.user,
                rows: data,
                isPlayer: true, 
                playerName: req.user.username
            });
        });
    }        
});


app.get('/snake-single-player/:playername', (req, res) => {
    var gameName = 'vintage-snake';
    if (!req.isAuthenticated()) {
        res.redirect('/login');        
    } else {
        res.render('snake-single-player', {
            gameName: gameName,
            user: req.user,            
            isPlayer: false, 
            playerName: req.params.playername
        });
    }
});


/**
 * Gets the top scores for the user
 */
app.get('/scores', (req, res) => {
    if (!req.isAuthenticated()) {
        res.status(401).send('Unauthorized');
    } else {
        
        var urlQueryParams = url.parse(req.url, true).query;
        var count = urlQueryParams.count || 5;
        var gameName = urlQueryParams.gameName;        
        scoreDao.topScores(req.user.id, count, gameName, (data) => {
            res.header("Content-Type", "application/json");
            res.send(JSON.stringify({items: data}));
        }); 
    }       
});


app.post('/scores', (req, res) => {    
    scoreDao.addScore(req.user.id, req.body.game, req.body.start_time, req.body.end_time, req.body.score);        
    res.send('');
});


http.listen(3000, () => {
    console.log('Express app listening on port 3000');
});


var io = new socketIO(http);
var nsp = io.of('/single-player-snake');

nsp.on('connection', (socket) => {
   
   console.log('A user connected');   
   
   socket.on('disconnect', () => {
      console.log('user disconnected'); 
   });
   
   socket.on('room', (room) => {
       socket.join(room);
       socket.room = room;
       console.log(`A user joined room = ${room} in snake-single-player`);
   }); 
   
   socket.on('data_msg', (msg) => {      
      socket.broadcast.to(socket.room).emit('data_msg', msg);
   });
});