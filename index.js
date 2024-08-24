const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri =`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nksmhfq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
      await client.connect();
     const menuCollection = client.db('coca-colaDb').collection('menu')
     const cartCollection = client.db('coca-colaDb').collection('carts')
     const userCollection = client.db('coca-colaDb').collection('users')
    
      //  jwt related api
      app.post('/jwt',async(req,res)=>{
        const user = req.body;
        const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,{
          expiresIn:'1h' });
          res.send({ token })
      })

      // middlewares
      const verifToken =(req,res,next) =>{
        console.log('inside verify token',req.headers.authorization);
        if(!req.headers.authorization){
          return res.status(401).send({message:'forbidden access'});

        }

        const token = req.headers.authorization.split(' ')[1];
        jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>{
          if(err){
            return res.status(401).send({message:'forbidden access'})
          }
          req.decoded =decoded;
          next();
        })
      }

     app.get('/menu',async(req,res) =>{
        const result = await menuCollection.find().toArray()
        res.send(result)
     })

    //  users related api

    app.get('/users',async(req,res) =>{
      const result = await userCollection.find().toArray()
      res.send(result);
    })

    app.post('/users',verifToken,async(req,res)=>{
      const user = req.body;
      // insert email if user doesnt exists:
      // you can do this many ways(1.email unique ,2.upsert, 3.simple chaking)
      const query = {email:user.email}
      const existingUser = await userCollection.findOne(query);
      if(existingUser){
        return res.send({message:'user already exists',insertedId:null})
      }
      const result = await userCollection.insertOne(user);
      res.send(result);

    });

    app.patch('/users/admin/:id',async(req,res)=>{
      const id = req.params.id;
      const filter ={_id: new ObjectId(id)};
      const updatedDoc ={
        $set:{
          role:'admin'
        }
      }
      const result = await userCollection.updateOne(filter,updatedDoc);
      res.send(result)
    })

    app.delete('/users/:id',async(req,res)=>{
      const id = req.params.id;
      const query ={_id: new ObjectId(id)}
      const result =await userCollection.deleteOne(query);
      res.send(result);
    })

    //  carts collection

    app.get('/carts',async(req,res)=>{
      const email= req.query.email;
      const query= {email:email}
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });

    app.delete('/carts/:id',async(req,res)=>{
      const id = req.params.id;
      const query ={_id:new ObjectId(id)}
      const result = await cartCollection.deleteOne(query);
      res.send(result)
    })
    
    app.post('/carts',async(req,res)=>{
      const cartItem = req.body;
      const result = await cartCollection.insertOne(cartItem)
      res.send(result)
    })

      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
    //   await client.close();
    }
  }
  run().catch(console.dir);


app.get('/',(req,res)=>{
    res.send('coca-cola is drinking')
})

app.listen(port,()=>{
    console.log(`Coca-cola is Drinking on port ${port}`);
})