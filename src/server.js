const express = require('express');
const bodyparser = require('body-parser');
const request = require('request');
const app = express();
const port = 3000;
const fileSystem = require('fs');
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: true}));

const cassandra = require('cassandra-driver');
const client = new cassandra.Client({ contactPoints: ['127.0.0.1:9042'], localDataCenter: 'datacenter1', keyspace: 'Authentication' });

app.listen(port, () => console.log(`Example app listening on port ${port}!`));

app.get('/', function (request, resp) {
    fileSystem.readFile('./index.html', function(error, fileContent){
        if(error){
            resp.writeHead(500, {'Content-Type': 'text/plain'});
            resp.end('Error');
        }
        else{
            resp.writeHead(200, {'Content-Type': 'text/html'});
            resp.write(fileContent);
            resp.end();
        }
    });
});

app.post('/authenticate/minecraft', function (req, res) {
    if (req.body.username && req.body.password) {
        request.post(
            'https://authserver.mojang.com/authenticate',
            {json: {username: req.body.username, password: req.body.password, requestUser: true}},
            function (error, response, body) {
                if (!error && response.statusCode === 200 && body.user.id) {
                    const params = [body.user.id];
                    const query = 'SELECT * FROM "Authentication".user_info WHERE id = ?';
                    client.execute(query, params).then(result => console.log(result.rows[0]));
                    res.sendStatus(200);
                } else {
                    res.redirect("https://education.minecraft.net/login/")
                }
            }
        );
    } else {
        res.sendStatus(400);
    }
});
