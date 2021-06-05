const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const MongoClient  = require('mongodb').MongoClient;
const ObjectID = require("mongodb").ObjectID;
const cors = require('cors');

app.use(express.json())
app.use(cors())
app.set('port', 3000)
app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
})


//connect to mongoDB
let db;
MongoClient.connect('mongodb+srv://hellBent:Oladimeji@cluster0.ovsdy.mongodb.net', (err, client)=>{
    console.log('getting here')
    if (err) {
        console.log(err)
    } else {
        console.log('no error')
        db = client.db('Webstore')
    }
})


app.get('/', (req,res,next) =>{
    res.send('Select a collection, e.g., /collection/messages');
})

app.param('collectionName', (req,res,next, collectionName) =>{
    req.collection = db.collection(collectionName);
    console.log('collection Name:', collectionName);
    return next();
});

//getting the incoming requests
app.use((req, res, next) => {
  console.log("Incoming request to: " + req.url);
  next();
});

//fetch all lessons
app.get('/collection/:collectionName', (req, res, next) => {
    req.collection.find({}).toArray((e, results) => {
        console.log(results);
        if (e) return next(e)
        res.send(results)
    })
})

//Post to orders
app.post("/collection/:collectionName", (req, res, next) => {
    const Orders = req.body;
    req.collection
      .insertOne(Orders)
      .then((_) => {
        res.status(200).send({
          status: true,
          message: "Order submitted",
        });
      })
      .catch((err) => {
        res.status(404).send({
          status: false,
          message: "Can't submit order due to error from me",
        });
      });
  });

//update lessons
app.put("/collection/:collectionName", (req, res, next) => {
    const lessons = req.body.lessons;
    let ItemCount = 0;
    lessons.forEach((lesson) => {
      req.collection
        .findOne({
          _id: new ObjectID(lesson._id),
        })
        .then((existingLesson) => {
          existingLesson.spaces -= lesson.spaces;
          return existingLesson;
        })
        .then((existingLesson) => {
          return req.collection.updateOne(
            {
              _id: new ObjectID(lesson._id),
            },
            {
              $set: {
                spaces: existingLesson.spaces,
              },
            },
            (err, res) => {
              if (err) console.error(err);
            }
          );
        })
        .then(() => {
          ItemCount++;
          if (ItemCount == lessons.length) {
            res.send({
              message: `${ ItemCount } lessons updated successfully!`,
              status: true,
            });
          }
        })
        .catch((err) => {
          console.error(err);
        });
    });
  });

const port = process.env.PORT || 3000
console.log(port);
app.listen(port);