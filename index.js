import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const port = process.env.PORT || 8000;


app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);


const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
console.log("You successfully connected to MongoDB!");

const db = client.db("B14_A8_Events_Management");
const eventsCollection = db.collection("all-events");
const joinedEventsCollection = db.collection("joined-events");


const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
);


const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Unauthorized! Token missing." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload; // Contains user info (email, sub/id, etc.)
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Unauthorized! Invalid token." });
  }
};


app.get("/all-events", async (req, res) => {
  try {
    const events = await eventsCollection.find().toArray();
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/all-events", verifyToken, async (req, res) => {
  try {
    const newEvent = {
      ...req.body,
      organizerEmail: req.user.email, 
      createdAt: new Date(),
    };
    const result = await eventsCollection.insertOne(newEvent);
    res.status(201).json({
      message: "Event created successfully",
      eventId: result.insertedId,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/all-events/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid event ID format" });
    }

    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.patch("/all-events/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid event ID format" });
    }

    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }


    if (event.organizerEmail !== req.user.email) {
      return res.status(403).json({ error: "Forbidden: You do not own this event" });
    }

    const { _id, organizerEmail, ...updatedFields } = req.body;
    const result = await eventsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedFields },
    );

    res.json({
      message: "Event updated successfully",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.delete("/all-events/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid event ID format" });
    }

    const event = await eventsCollection.findOne({ _id: new ObjectId(id) });
    if (!event) {
      return res.status(404).json({ error: "Event not found" });
    }


    if (event.organizerEmail !== req.user.email) {
      return res.status(403).json({ error: "Forbidden: You do not own this event" });
    }

    const result = await eventsCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({
      message: "Event deleted successfully",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/my-events/:organizerEmail", verifyToken, async (req, res) => {
  try {
    const { organizerEmail } = req.params;

    // Verify requesting user matches the requested email
    if (req.user.email !== organizerEmail) {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }

    const events = await eventsCollection
      .find({ organizerEmail })
      .toArray();
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.post("/joined-events", verifyToken, async (req, res) => {
  try {
    const { eventId } = req.body;
    const userEmail = req.user.email; 

    const alreadyJoined = await joinedEventsCollection.findOne({
      eventId,
      userEmail,
    });
    if (alreadyJoined) {
      return res.status(409).json({ error: "Already joined" });
    }

    const result = await joinedEventsCollection.insertOne({
      ...req.body,
      userEmail,
      joinedAt: new Date(),
    });

    res.status(201).json({ message: "Joined successfully", id: result.insertedId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.get("/joined-events/:userEmail", verifyToken, async (req, res) => {
  try {
    const { userEmail } = req.params;

    if (req.user.email !== userEmail) {
      return res.status(403).json({ error: "Forbidden: Access denied" });
    }

    const events = await joinedEventsCollection.find({ userEmail }).toArray();
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

export default app;