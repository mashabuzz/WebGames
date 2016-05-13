'use strict';

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');

var app = express();

app.use(express.static('static'));
app.use(express.static(path.join(__dirname, 'bower_components')))

// parse application/x-www-form-urlencoded
//app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.post('/scores', (req, res) => {
    console.log(req.body);
    res.send('');
});


app.listen(3000, '0.0.0.0', () => {
    console.log('Express app listening on port 3000');
});