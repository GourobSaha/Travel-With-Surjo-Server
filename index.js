const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Travel More Server is Running')
})

app.listen(port, () => {
    console.log(`Travel More Server is Running on Port: ${port}`);
})