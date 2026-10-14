const express = require("express");
const app = express();

app.use(express.json());

let marks = [99, 85, 75, 60];

app.get("/", (req, res) => {
    res.send("API is Working..");
});

// Read marks
app.get("/marks", (req, res) => {
    res.json(marks);
});

// Add marks
app.post("/marks", (req, res) => {
    marks.push(req.body.mark);
    res.send("Mark added");
});

// Update first mark
app.put("/marks", (req, res) => {
    marks[0] = req.body.mark;
    res.send("Mark updated");
});

// Delete first mark
app.delete("/marks", (req, res) => {
    marks.shift();
    res.send("Mark deleted");
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});