/**
 * Created by manalmohania on 24/3/18.
 */

var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
    host: 'localhost:9200',
    log: 'trace'
});

var AWS = require('aws-sdk');

function form_query(input){
    return '{ "query": { "multi_match" : { "query" :'+ "\"" + input + "\"" + ', "fields": ["code^4", "title^3", "description^1.5", "outcome"]} } }'
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var app     = express();

app.use(express.static(__dirname + '/public'));
app.use(express.static("."));
app.set('view engine', 'ejs');

//Note that in version 4 of express, express.bodyParser() was
//deprecated in favor of a separate 'body-parser' module.
app.use(bodyParser.urlencoded({ extended: true }));

AWS.config.region = 'eu-west-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'eu-west-1:b204af0c-7b63-4a54-a23f-1d9ddfd72f6f'
});

var lexruntime = new AWS.LexRuntime();


app.post('/myaction', function(req, res) {

    var params = {
        botAlias: 'IntelligentSearch', /* required */
        botName: 'IntelligentSearch', /* required */
        contentType: 'text/plain; charset=utf-8', /* required */
        inputStream: req.body.name, /* required */
        userId: 'tom', /* required */
        accept: 'text/plain; charset=utf-8',
        requestAttributes: {} /* This value will be JSON encoded on your behalf with JSON.stringify() */,
        sessionAttributes: {} /* This value will be JSON encoded on your behalf with JSON.stringify() */
    };
    lexruntime.postContent(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     {
            console.log(data);
            if ((JSON.parse(JSON.stringify(data))).message === 'Sorry, can you please repeat that?' || (JSON.parse(JSON.stringify(data))).message === 'Sorry, I could not understand. Goodbye.') {
                var allTitles = [];

                client.search({
                    index: 'courses',
                    // q: 'description:' + req.body.name
                    body: form_query(req.body.name)
                }, function getMoreUntilDone(error, response) {
                    // collect the title from each response
                    console.log("***");
                    console.log(response);
                    console.log("***");
                    var courses = response.hits.hits;

                    response.hits.hits.forEach(function (hit) {
                        allTitles.push([hit._source.code, hit._source.title]);
                    });
                    allTitles = allTitles.filter(onlyUnique);
                    console.log(allTitles.length)

                    // allTitles=[]

                    if(allTitles.length === 0) {
                        var XMLHttpRequest = require("w3c-xmlhttprequest").XMLHttpRequest

                        var search_phrase = req.body.name.replace(" ", "%20");

                        var allTitlesOnto = [];

                        var xhr = new XMLHttpRequest();
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState === XMLHttpRequest.DONE) {
                                allTitlesOnto=xhr.responseText.split("\n");
                                allTitlesOnto.shift();
                                if (allTitlesOnto[allTitlesOnto.length - 1] === ' ') {
                                    allTitlesOnto.pop();
                                }
                                console.log(allTitlesOnto);
                                for (var i = 0; i < allTitlesOnto.length; i++) {
                                    console.log();
                                    var course = allTitlesOnto[i].substr(0, 8);
                                    allTitles[i] = [course, ' ']
                                }
                                console.log("$$$");
                                console.log(allTitles);
                                console.log("$$$");
                            }
                        };

                        console.log("xhr starts")

                        xhr.open('GET', 'http://localhost:7200/repositories/CourseAIOntology?query=PREFIX%20luc%3A%20%3Chttp%3A%2F%2Fwww.ontotext.com%2Fconnectors%2Flucene%23%3E%20PREFIX%20inst%3A%20%3Chttp%3A%2F%2Fwww.ontotext.com%2Fconnectors%2Flucene%2Finstance%23%3E%20PREFIX%20rdfs%3A%20%3Chttp%3A%2F%2Fwww.w3.org%2F2000%2F01%2Frdf-schema%23%3E%20PREFIX%20%3A%20%3Chttp%3A%2F%2Fwww.ontotext.com%2Fconnectors%2Flucene%23%3E%20%20SELECT%20DISTINCT%20%3Fsubject%20%7B%20%20%20%3Fsearch%20a%20inst%3AcourseSearch%20%3B%20%20%20%20%20%20%20%20%20%20luc%3Aquery%20%22glossary%3A'+search_phrase+'%2C%20description%3A'+search_phrase+'%22%3B%20%20%20%20%20%20%20luc%3Aentities%20%3Fentity%20.%20%20%20%3Fentity%20rdfs%3Arelated_subject%20%3Fsubject%20%7D%20LIMIT%20100', true);
                        xhr.send(null);

                        console.log("xhr ends")


                    }
                    setTimeout(function (){

                        console.log("Sending")
                        res.render('search', {originalQuery: req.body.name, successfulHits: allTitles});

                    }, 500);


                    // res.send("Got" + allTitles);

                });
            }
            else {
                var message = (JSON.parse(JSON.stringify(data))).message;
                q_index= message.indexOf('?');
                question = message.substring(0, q_index + 1);
                answer = message.substring(q_index + 1, message.length)
                res.render('lexResponse', {originalQuery: req.body.name, question: question, answer: answer});
            }
        }           // successful response
    });

});

app.listen(8080, function() {
    console.log('Server running at http://127.0.0.1:8080/');
});

app.get('/', function(req,res) {
    res.sendfile('test.html');
});
