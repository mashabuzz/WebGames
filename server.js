'use strict';

var express = require('express');
var app = express();

app.use(express.static('static'));

app.listen(3000, '0.0.0.0', () => {
    console.log('Express app listening on port 3000');
});