const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const app = express();

app.get('/', (req, res) => {
    res.send('working');
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f1z8e.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {



    app.get('/volunteerWorks', (req, res) => {
        const workDB = client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTIONONE);
        const volunteersDB = client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTIONTWO);
        
        workDB.find({})
            .toArray((err, works) => {
                res.send(works);
            })
    })
});

app.listen(process.env.PORT || 5000);