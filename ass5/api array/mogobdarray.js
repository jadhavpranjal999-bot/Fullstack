const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(express.json());

// MongoDB connection
const url = "mongodb://127.0.0.1:27017";
const client = new MongoClient(url);

async function start() {
    await client.connect();
    console.log("MongoDB Connected");

    const db = client.db("marksDB");
    const collection = db.collection("marks");

    // GET - View marks
    app.get("/marks", async (req, res) => {
        const data = await collection.find().toArray();
        res.json(data);
    });

    // POST - Add marks
    app.post("/marks", async (req, res) => {
        await collection.insertOne({
            mark: req.body.mark
        });
        res.send("Mark added");
    });

    // PUT - Update marks
    app.put("/marks/:id", async (req, res) => {
        const id = new ObjectId(req.params.id);

        await collection.updateOne(
            { _id: id },
            { $set: { mark: req.body.mark } }
        );

        res.send("Mark updated");
    });

    // DELETE - Delete marks
    app.delete("/marks/:id", async (req, res) => {
        const id = new ObjectId(req.params.id);

        await collection.deleteOne({ _id: id });
        res.send("Mark deleted");
    });

    app.listen(3000, () => {
        console.log("Server running on port 3000");
    });
}

start().catch(console.error);