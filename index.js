const express = require('express');
var cors = require('cors');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const { cloudinary } = require('./utils/cloudinary');
const admin = require('firebase-admin');
require('dotenv').config();
const ObjectId = require('mongodb').ObjectId;


const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 100000 }));

admin.initializeApp({
    credential: admin.credential.cert({
        "type": process.env.TYPE,
        "project_id": process.env.PROJECT_ID,
        "private_key_id": process.env.PRIVATE_KEY_ID,
        "private_key": JSON.parse(process.env.PRIVATE_KEY).replace(/\\n/g, '\n'),
        "client_email": process.env.CLIENT_EMAIL,
        "client_id": process.env.CLIENT_ID,
        "auth_uri": process.env.AUTH_URI,
        "token_uri": process.env.TOKEN_URI,
        "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER,
        "client_x509_cert_url": process.env.CLIENT_CERT_URL
    }),
    databaseURL: "https://volunteer-network-own.firebaseio.com"
});

app.get('/', (req, res) => {
    res.send('working');
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f1z8e.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

client.connect(err => {
    const workDB = client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTIONONE);
    const volunteersDB = client.db(process.env.DB_NAME).collection(process.env.DB_COLLECTIONTWO);

    app.post('/registeredVolunteer', (req, res) => {
        volunteersDB.insertOne(req.body)
            .then(result => {
                res.send(result.insertedCount > 0)
            });
    });

    app.get('/volunteerWorks', (req, res) => {
        workDB.find({})
            .toArray((err, works) => {
                res.send(works);
            })
    });

    app.get('/volunteerJoinedWork', (req, res) => {
        const userEmail = req.query.email;
        const bearer = req.headers.authorization;

        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];

            admin.auth().verifyIdToken(idToken)
                .then(decodedToken => {
                    if (userEmail == decodedToken.email) {
                        findVolunteerTask(res, decodedToken.email)
                    }
                })
                .catch(error => {
                    res.status(401).send();
                });
        } else {
            res.status(401).send('unauthorized access');
        }
    });

    const findVolunteerTask = (res, email) => {
        volunteersDB.find({ 'data.username': email })
            .toArray((err, works) => {
                res.send(works);
            })
    };

    app.post('/submitCreatedEvent', (req, res) => {
        workDB.insertOne(req.body)
            .then(result => {
                res.status(200).send({ response: 'event added successfully' });
            })
    });

    app.post('/submitImage', (req, res) => {
        const imageString = req.body.data;
        cloudinary.uploader.upload(imageString, {
            upload_preset: 'mxxk2q4u'
        }, (err, result) => {
            res.send({ url: result.url });
        })
    });

    app.get('/volunteersList', (req, res) => {

        volunteersDB.find({})
            .toArray((err, result) => {
                let uniqueVolunteerUserName = [];
                let uniqueVolunteer = [];
                for (let i = 0; i < result.length; i++) {
                    const des = uniqueVolunteerUserName.includes(result[i].data.username)
                    if (!des) {
                        uniqueVolunteer.push(result[i]);
                        uniqueVolunteerUserName.push(result[i].data.username);
                    }
                }
                res.send(uniqueVolunteer);
            })
    });

    app.delete('/deleteVolunteer/:userName', (req, res) => {
        const userName = req.params.userName;
        volunteersDB.deleteMany({
            'data.username': userName
        })
            .then(result => {
                res.send(result.deletedCount > 0);
            })
    });

    app.delete('/deleteTask/:id', (req, res) => {
        const id = req.params.id;

        volunteersDB.deleteOne({
            _id: ObjectId(id)
        })
            .then(result => {
                res.send(result.deletedCount > 0);
            })

    });


});

app.listen(process.env.PORT || 5000);