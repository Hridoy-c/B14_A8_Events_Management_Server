import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 8000;

// middleware
app.use(express.json());
app.use(cors())

app.get("/", (req, res) => {
  res.send("Hello World");
});


app.listen(port,()=>{
    console.log(`Server started on port ${port}`);
});