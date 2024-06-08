const express = require('express');
const cors = require('cors');
const jwt =  require('jsonwebtoken');
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



    // jwt api
    app.post('/jwt' , async (req,res)=>{
      const user = req.body;
      const token = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET , {expiresIn: '1h'});
      res.send({ token })
    })


    // middle wares verify 
    const verifyToken = (req,res,next)=>{
      console.log(req.headers);
      // console.log("inside verify token" , req.headers.authorization);
      if(!req.headers.authorization){
        return res.status(401).send({ message: 'forbidden access' });
      }
      const token = req.headers.authorization.split(' ')[1];
           jwt.verify(token , process.env.ACCESS_TOKEN_SECRET , (err , decoded)=>{
               if(err){
                  return res.status(401).send({ message: 'forbidden access' })
               }
               req.decoded = decoded ;
               next();
           } )
      
    }

    const verifyAdmin = async(req,res,next)=>{
      const email = req.decoded.email;
      const query ={email: email};
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if(!isAdmin){
       return res.status(403).send({message: 'forbidden Access'})
      }
      next();
   }

    // user api

  app.get('/users' , verifyToken , verifyAdmin  , async (req,res)=>{
   
     const result = await userCollection.find().toArray()
     res.send(result)
  })

  app.get('/users/admin/:email' , verifyToken , async(req,res)=>{
    const email = req.params.email;
    if(email !== req.decoded.email){
      return res.status(403).send({message: 'Unauthoreized Access'})
    }
    const query = {email: email};
    const user = await userCollection.findOne(query);
    let admin = false;
    if(user){
      admin = user?.role === 'admin';
    }
    res.send({ admin });
 })

    app.post('/users', async (req, res) => {
      const user = req.body;
      // inset email if user doesnt exist
      const query = {email: user.email}
      const existingUser = await userCollection.findOne(query)
      if(existingUser){
         return res.send({message: 'User Aleready exist' , insertedId: null})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.delete('/users/:id', verifyToken , verifyAdmin , async (req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await userCollection.deleteOne(query)
      res.send(result)

    })
    // admin make
 
    app.patch('/users/admin/:id' , verifyToken , verifyAdmin , async(req,res)=>{
      const id =req.params.id;
      const filter = {_id: new ObjectId(id)};
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter , updatedDoc)
      res.send(result)

  })

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
    // upadte a pet data--------------------------------------------------------------------------
app.put('/pet/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };
    const updatePet = req.body;
    const pet = {
      $set: {
        name: updatePet.name,
        age: updatePet.age,
        breed: updatePet.breed,
        details: updatePet.details,
        longDescription: updatePet.longDescription,
        status: updatePet.status,
        location: updatePet.location,
        image: updatePet.image
      }
    };
    const result = await petCollection.updateOne(filter, pet, options); 
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: 'Failed to update pet' });
  }
});
// delete pet
app.delete('/pet/:id' , async(req,res)=>{
  const id = req.params.id;
  const query = {_id: new ObjectId(id) }
  const result = await  petCollection.deleteOne(query);
  res.send(result)
})

// --------------------------------------------------------------------------------------------------------------
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
    // -------------------------------
  
    // -------------------------------

    app.post('/campaigns', async (req, res) => {
      const item = req.body;
      const result = await campaignsCollection.insertOne(item);
      res.send(result);
    });
// catrs it means all adoption request get------------------
    // get cart items for a user
    app.get('/carts', async (req, res) => {
      const result = await cartCollection.find().toArray();
      res.send(result);
    });
   

    // post a new cart item
    app.post('/carts', async (req, res) => {
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem);
      res.send(result);
    });

    app.delete('/carts/:id' , async(req,res)=>{
      const id = req.params.id;
      const query = {_id: new ObjectId(id) }
      const result = await  cartCollection.deleteOne(query);
      res.send(result)
    })















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
