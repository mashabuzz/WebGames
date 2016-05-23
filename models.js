var sqlite3 = require('sqlite3').verbose();

var db = new sqlite3.Database('db/WebGames.db');


function User(id, username, password) {
    this.id = id;
    this.username = username;
    this.password = password;
}


function UserDao() {
    
    this.nextUserId = 1;
    
    var that = this;
    (function () {
        // initialize the nextUserId
        var query = "select max(id) as id from users";
        console.log(`query = ${query}`);
        db.all(query, (err, rows) => {
           if (rows.length > 0) {
               that.nextUserId = rows[0].id + 1;
           } 
           console.log(`NextUserId = ${that.nextUserId}`);
        });
    })();
    
    this.getUser = function (id, username, callback) {
        
        db.serialize(() => {
            var query;
            if (id) {
                query = `SELECT id as id, username as username, password as password FROM users WHERE id=${id}`;
            } else if (username) {
                query = `SELECT id as id, username as username, password as password FROM users WHERE username='${username}'`;
            } else {
                throw new Error('Both id and username are passed as null in UserDao.getUser()');
            }
            console.log(`query = ${query}`);
            
            db.all(query, (err, rows) => {
                var user = null;
                if (err) {
                    callback(err, null);
                } else if (rows.length === 0) {
                    callback(null, null);
                } else {
                    var row = rows[0];
                    user = new User(row.id, row.username, row.password);
                    callback(null, user);
                }                
            });           
        });        
    }
    
    this.createUser = function (username, password, callback) {
        db.serialize(() => {
            // first check if the username already exists
            var query = `SELECT id as id, username as username, password as passowrd FROM users WHERE username='${username}'`;
            console.log(`query = ${query}`);
            db.all(query, (err, rows) => {
                if (rows.length > 0) {
                    // username already exists
                    var row = rows[0];
                    var duplicateUser = new User(row.id, row.username, row.password);
                    callback(null, duplicateUser);
                } else {
                    var stmt = db.prepare(`INSERT INTO USERS VALUES (?, ?, ?)`);
                    stmt.run(that.nextUserId++, username, password);
                    stmt.finalize();
                    callback(null, null);
                }
            });
        });
    }
}


function ScoreDao() {
    
    this.addScore = function (userId, gameName, startTime, endTime, score) {
        db.serialize(function() {
            // TODO handle error
            var stmt = db.prepare('INSERT INTO SCORES VALUES(?, ?, ?, ?, ?)');
            stmt.run(userId, gameName, startTime, endTime, score);
            stmt.finalize();
        });
    }
    
    this.topScores = function (userId, count, gameName, callback) {
        db.serialize(() => {
            var query = `select date(starttime) as date, score as score, (strftime('%s', endtime) - strftime('%s', starttime))` + 
                            `as duration from scores where userid=${userId} and gamename='${gameName}' order by score desc limit ${count}`;
            
            console.log(`query = ${query}`);
            db.all(query, (err, rows) => {
                var items = [];
                for (var i = 0; i < rows.length; i++) {
                    items.push({
                        date: rows[i].date,
                        score: rows[i].score,
                        duration: rows[i].duration
                    });
                }
                callback(items);     
            });
        });
    }
}


module.exports = {
    User: User,
    UserDao: UserDao,
    ScoreDao: ScoreDao
}