import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from 'mongodb';
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
const collection = db.db("B14_A8_Events_Management")
const eventsCollection = collection.collection("all-events");



app.get('/all-events', async (req, res) => {
    try {
        const events = await eventsCollection.find().toArray();
        res.send(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/all-events', async (req, res) => {
    try {
        const newEvent = req.body;
        const result = await eventsCollection.insertOne(newEvent);
        res.status(201).json({ message: 'Event created successfully', eventId: result.insertedId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}); 

app.get('/all-events/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const event = await eventsCollection.findOne({ _id: new ObjectId(eventId) });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
})

app.patch('/all-events/:id', async (req, res) => {
    try {
        const eventId = req.params.id;
        const updatedEvent = req.body;
        const result = await eventsCollection.updateOne(
            { _id: new ObjectId(eventId) },
            { $set: updatedEvent }
        );
        res.json({ message: 'Event updated successfully', modifiedCount: result.modifiedCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
    })

app.get('/my-events/:organizerEmail', async (req, res) => {
    try {
        const email = req.params.organizerEmail;
        const events = await eventsCollection.find({ organizerEmail: email }).toArray();
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }

})



// http://localhost:8000/all-events
app.listen(port,()=>{
    console.log(`Server started on port ${port}`);
});