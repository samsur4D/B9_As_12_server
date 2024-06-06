const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.wkehc2o.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server (optional starting in v4.7)
    // await client.connect();

    const petCollection = client.db("pawpixieDb").collection("pet");
    const userCollection = client.db("pawpixieDb").collection("users");
    const campaignsCollection = client.db("pawpixieDb").collection("campaigns");
    const cartCollection = client.db("pawpixieDb").collection("carts");

    // user api
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // get all pets data in pet collection
    app.get('/pet', async (req, res) => {
      const result = await petCollection.find().toArray();
      res.send(result);
    });
    // _________________________update
    app.get('/pet/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await petCollection.findOne(query);
      res.send(result);
    });

    // post a new pet
    app.post('/pet', async (req, res) => {
      const item = req.body;
      const result = await petCollection.insertOne(item);
      res.send(result);
    });

    // Update pet adoption status
    app.put('/pet/adopt/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          adopted: true
        },
      };
      const result = await petCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // get all campaigns data in campaigns collection
    app.get('/campaigns', async (req, res) => {
      const result = await campaignsCollection.find().toArray();
      res.send(result);
    });

    // get cart items for a user
    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    // post a new cart item
    app.post('/carts', async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('PAW PIXIE IS RUNNING');
});

app.listen(port, () => {
  console.log(`Paw Pixxie is running on port ${port}`);
});
