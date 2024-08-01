require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("node:dns");
const { MongoClient } = require("mongodb");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// Connect to database
const client = new MongoClient(
  "mongodb+srv://tidaktau:KGytY5uvX7eXB5mE@cluster0.9shpezm.mongodb.net/urlshortner?retryWrites=true&w=majority&appName=Cluster0"
);
const db = client.db("urlshortner");
const collection = db.collection("urls");

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.post("/api/shorturl", function (req, res) {
  const originalUrl = req.body.url

  // Parsing url dan take hostname (domain)
  const parsedUrl = new URL(req.body.url);
  const hostName = parsedUrl.hostname;

  // Regex
  const regex = /(https:|http:)\/{2}([a-z].+)/gi;

  // Short url
  let shortUrl = Math.floor(Math.random() * 1000);

  // verify a submitted URL
  let result = (url) => {
    dns.lookup(url, async (err, addres) => {
      if (!addres) {
        return res.json({
          error: err.message,
        });
      } else {
        const data = {
          original_url: originalUrl,
          short_url: shortUrl,
        };
        const result = await collection.insertOne(data);

        res.json({
          original_url: parsedUrl,
          short_url: shortUrl,
        });
      }
    });
  };

  if (regex.test(parsedUrl)) {
    result(hostName);
  } else {
    res.json({
      error: "invalid url",
    });
  }
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const { short_url } = req.params;
  const parsedShortUrl = parseInt(short_url);
  const result = await collection.findOne({ short_url: parsedShortUrl });
  if (result) {
    res.redirect(result.original_url);
  } else {
    res.json({
      error: "invalid url"
    })
  }
})


app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
