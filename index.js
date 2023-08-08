const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zmwk4eu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    const classesCollection = client.db("internbd").collection("class");
    const userCollection = client.db("internbd").collection("User");


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // user colllecton
    app.get('/user', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.post('/user', async (req, res) => {
      const user = req.body;
      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'user already exists' })
      }

      const result = await userCollection.insertOne(user);
      res.send(result);
    })
// admin
    app.patch('/user/student/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'Student'
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);

    })

    // instractor
    app.patch('/user/instructor/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'Instructor'
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);

    })
    // employee
    app.patch('/user/employee/:id', async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: 'Employee'
        },
      };

      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);

    })
    //classes
    app.get('/classes', async (req, res) => {
      const query = {};

      const cursor = classesCollection.find(query);
      const result = await cursor.toArray();

      res.send(result);
    })

    // add class
    app.post('/classes', async (req, res) => {
      const newItem = req.body;
      const result = await classesCollection.insertOne(newItem)
      res.send(result);
    })
    // delete class
    app.delete('/classes/:id', async (req, res) => {
      //console.log(id);
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      console.log(id);
      const result = await classesCollection.deleteOne(query);
      res.send(result);
    })
    // update class 
    app.get('/adminDashboard/update/:id', async (req, res) => {
      console.log(req.params.id);
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) }
      const result = await classesCollection.findOne(query);
      res.send(result);

    });
    app.patch('/adminDashboard/update/:id', async (req, res) => {

      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedcls = req.body;

      const cls = {
        $set: {


          Name: updatedcls.Name,

          AvailableSeats: parseFloat(updatedcls.AvailableSeats),

          Price: parseFloat(updatedcls.Price),

          Image: updatedcls.Image,

        }
      }

      const result = await classesCollection.updateOne(filter, cls, options);
      res.send(result);
    })
  } finally {


    //await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('running....')
})

app.listen(port, () => {
  console.log(`port running ${port}`);
})