const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.swsfudh.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized Access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.send(401).send({ message: 'Unauthorized Access' })
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        const serviceCollection = client.db('travelMore').collection('services');
        const reviewCollection = client.db('travelMore').collection('reviews');

        //JWT
        app.post('/jwt', (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10h' });
            res.send({ token });
        });

        app.get('/services', async (req, res) => {
            const size = parseInt(req.query.size);
            // console.log(size);
            const query = {};
            const cursor = serviceCollection.find(query).limit(size).sort({ _id: -1 });
            const services = await cursor.toArray();
            res.send(services);
        });
        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const service = await serviceCollection.findOne(query);
            res.send(service);
        });

        //Reviews API
        app.get("/reviews", verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if (decoded.email !== req.query.email) {
                return res.send(403).send({ message: 'Unauthorized Access' })
            }
            console.log('Reviews API', decoded);
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email,
                };
            };
            const cursor = reviewCollection.find(query).sort({ date: -1 });
            const reviews = await cursor.toArray();
            // console.log(query)
            res.send(reviews);
        });

        app.get("/reviewServices", async (req, res) => {
            let query = {};
            if (req.query.service_id) {
                query = {
                    service_id: req.query.service_id,
                };
            };

            const cursor = reviewCollection.find(query).sort({ date: -1 });
            const reviews = await cursor.toArray();
            // console.log(query)
            res.send(reviews);
        });


        //Insert Services
        app.post('/services', async (req, res) => {
            const services = req.body;
            const result = await serviceCollection.insertOne(services);
            res.send(result);
        });
        //Insert Reviews
        app.post('/reviews', async (req, res) => {
            const reviews = req.body;
            const result = await reviewCollection.insertOne(reviews);
            res.send(result);
        });

        app.delete("/reviews/:id", async (req, res) => {
            const id = req.params.id;
            // console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.deleteOne(query);
            res.send(result);
        });

        app.get("/reviews/:id", async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await reviewCollection.findOne(query);
            res.send(result);
            console.log(result);
        });

        //update
        app.put("/reviews/:id", async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const reviews = req.body;
            const option = { upsert: true };
            const date = new Date();
            const updatedReview = {
                $set: {
                    date: reviews.date,
                    review: reviews.review,
                },
            };
            const result = await reviewCollection.updateOne(filter, updatedReview, option);
            res.send(result);
        });
    }
    finally { }
}

run().catch(error => console.error(error));

app.get('/', (req, res) => {
    res.send('Travel More Server is Running')
})

app.listen(port, () => {
    console.log(`Travel More Server is Running on Port: ${port}`);
})