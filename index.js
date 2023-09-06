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
    const stuCollection = client.db("internbd").collection("student");
    const clabatchCollection = client.db("internbd").collection("BatchClass");
    const expressCollection = client.db("internbd").collection("Express");

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // user colllecton-------------------------------
    app.get('/user', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    // -------------------------------------------------

    //Teacher Payment------------------------------------
    app.get('/adminDashboard/pay/:id', async (req, res) => {
      console.log(req.params.id);
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) }
      const result = await userCollection.findOne(query);
      res.send(result);

    });

    app.patch('/adminDashboard/pay/:id', async (req, res) => {

      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const options = { upsert: true };
      const updatedcls = req.body;
      const paydate = new Date(updatedcls.paydate);
      paydate.setHours(0, 0, 0, 0); // Set time to midnight
      const cls = {
        $set: {
          name: updatedcls.name,
          totalamount: parseFloat(updatedcls.totalamount),
          totalClass: parseFloat(updatedcls.totalClass),
          payamount: parseFloat(updatedcls.payamount),
          totalduemonths: parseFloat(updatedcls.totalduemonths),
          dueamount: parseFloat(updatedcls.dueamount),
          paydate: paydate,
        }
      }
      const result = await userCollection.updateOne(filter, cls, options);
      res.send(result);
    })
    //-------------------------------------------


    // user---------------------------
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
    // ---------------------------------
//Add Express--------------------------------
app.get('/adminDashboard/express', async (req, res) => {
  const newItem = req.body;
  const result = await expressCollection.find().toArray()
  res.send(result);
})
app.post('/adminDashboard/express', async (req, res) => {
  const newItem = req.body;
  const result = await expressCollection.insertOne(newItem)
  res.send(result);
});

app.get('/adminDashboard/instructors/paymentSum', async (req, res) => {
  
  const instructors = await userCollection.find({ role: 'Instructor' }).toArray();
  const paymentSum = instructors.reduce((sum, instructor) => sum + (instructor.payamount || 0), 0);
  
  if (isNaN(paymentSum)) {
      res.status(500).json({ error: 'Internal server error' });
  } else {
      res.json({ paymentSum });
  }
});
// -----------------------------------------------------------
    // Add Student -------------------------------------------
    app.get('/student', async (req, res) => {
      const newItem = req.body;
      const result = await stuCollection.find().toArray()
      res.send(result);
    })

    app.get('/student/:batch', async (req, res) => {

      const selectedBatch = req.params.batch;
      console.log(selectedBatch)

      const result = await stuCollection.find(selectedBatch).toArray()
      res.send(result);
    })


    app.post('/student', async (req, res) => {
      const newItem = req.body;
      const result = await stuCollection.insertOne(newItem)
      res.send(result);
    })
    //---------------------------------------------------


    // Add Student Attendance

    // extra

    app.post('/attendance', async (req, res) => {
      const { date, studentName, attendance } = req.body;

      try {
        const student = await stuCollection.findOne({ name: studentName });
        if (!student) {
          return res.status(404).json({ message: 'Student not found' });
        }

        const result = await stuCollection.updateOne(
          { _id: student._id },
          {
            $set: {
              lastAttendanceDate: new Date(date),
              attendance: attendance,
            },
            $push: {
              attendance_history: { date: new Date(date), attendance: attendance },
            },
          }
        );

        res.json({ message: 'Attendance submitted successfully' });
      } catch (error) {
        console.error('Error submitting attendance:', error);
        res.status(500).json({ message: 'Failed to submit attendance' });
      }
    });
    //----------------------------------------------------------------------/

    app.post('/student/:id', async (req, res) => {
      const studentId = req.params.id;
      console.log(studentId);
      const { attendance, date } = req.body;
      console.log(attendance, date)
      const filter = { _id: new ObjectId(studentId) };
      const updateDoc = {
        $set: {
          attendance: attendance,
          lastAttendanceDate: new Date(date),
        },
      };

      const result = await stuCollection.updateOne(filter, updateDoc);

      res.send(result)
    });

    app.get('/BatchClass', async (req, res) => {
      const result = await clabatchCollection.find().toArray();
      res.send(result);
    });

    // Add Batch and Class---------------------------------------
    app.post('/BatchClass', async (req, res) => {
      const newItem = req.body;

      const result = await clabatchCollection.insertOne(newItem)
      console.log(result);
      res.send(result);
    })
    // -----------------------------------------------------------

    // admin------------------------------------------------------
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

    // instractor----------------------------------------------
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
    // employee-------------------------------------------------
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
    // ---------------------------------------------------------------

    //classes----------------------------------------------------------
    app.get('/classes', async (req, res) => {
      const query = {};

      const cursor = classesCollection.find(query);
      const result = await cursor.toArray();

      res.send(result);
    })
    //----------------------------------------------------
    // add class---------------------------------------------------------
    app.post('/classes', async (req, res) => {
      const newItem = req.body;
      const result = await classesCollection.insertOne(newItem)
      res.send(result);
    })

    // delete class-------------------------------------------------------
    app.delete('/classes/:id', async (req, res) => {
      //console.log(id);
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      console.log(id);
      const result = await classesCollection.deleteOne(query);
      res.send(result);
    })

    // update class ---------------------------------------------------------
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