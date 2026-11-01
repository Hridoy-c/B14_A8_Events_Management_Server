import express from "express";
import cors from "cors";
import { MongoClient } from 'mongodb';
import "dotenv/config";

const app = express();
const port = process.env.PORT || 8000;

// middleware
app.use(express.json());
app.use(cors())



const client = new MongoClient(process.env.MONGODB_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

const db = await connectToMongoDB();







app.get('/events', (req, res)=>{

})



app.listen(port,()=>{
    console.log(`Server started on port ${port}`);
});