require("dotenv").config();
let bodyParser = require("body-parser");
const validUrl = require("valid-url");
const shortId = require("shortid");
const express = require("express");
const cors = require("cors");
const app = express();

let mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Schema = mongoose.Schema;

const urlSchema = new Schema({
  original_url: String,
  short_url: String,
});

const urlModel = mongoose.model("url", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false }));

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

app.post("/api/shorturl", function (req, res, next) {
  url = req.body.url;
  shortUrl = shortId.generate();
  if (!validUrl.isWebUri(url)) {
    res.json({ error: "invalid url" });
  } else {
    try {
      urlModel
        .findOne({
          original_url: url,
        })
        .select()
        .exec()
        .then(function (err, urlFound) {
          if (err) return console.error(err);

          res.json({
            original_url: urlFound.original_url,
            short_url: urlFound.short_url,
          });
        });
      var newUrl = new urlModel({
        original_url: url,
        short_url: shortUrl,
      });
      newUrl.save();
      res.json({ original_url: url, short_url: shortUrl });
    } catch (err) {
      console.error(err);
      res.json({ error: err });
    }
  }
});

app.get("/api/shorturl/:shortUrl?", function (req, res) {
  urlModel
    .find({ short_url: req.params.shortUrl })
    .select()
    .exec()
    .then((url) => {
      res.redirect(url[0]["original_url"]);
    });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
