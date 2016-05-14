'use strict';

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose();

var app = express();

app.use(express.static('static'));
app.use(express.static(path.join(__dirname, 'bower_components')))

// parse application/json
app.use(bodyParser.json())

app.post('/scores', (req, res) => {
    var userName = 'rahul.p';
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
    
    db.close();    
    res.send('');
});


app.listen(3000, '0.0.0.0', () => {
    console.log('Express app listening on port 3000');
});