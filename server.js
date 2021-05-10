const express = require("express");
const morgan = require("morgan");
const expressEdge = require("express-edge");
const mongoose = require("mongoose");
const expressSession = require("express-session");
const ConnectMongo = require("connect-mongo");
const bodyParser = require("body-parser");
const edge = require("edge.js"); // we will use this to set global variable

const app = express(); // This will create a express server

const dbUrl =
  "mongodb+srv://rbaghele:N9960372626n@apt-nodejs-cluster01.bqmfa.mongodb.net/node-learning?retryWrites=true&w=majority";
// DATABASE CONNECTION
mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB connected");
  })
  .catch((err) => {
    console.log(err);
  });

// Model creattion
const userSchema = mongoose.Schema({
  username: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
});

const User = mongoose.model("User", userSchema);

// Middleware
app.use(morgan("dev"));
app.use(expressEdge.engine);
app.use(express.static(`${__dirname}/public`)); // we are telling server to server static files from public folder
app.use(bodyParser.urlencoded({ extended: false })); // parse application/x-www-form-urlencoded
app.use(bodyParser.json()); // parse application/json
app.set("views", `${__dirname}/views`); // we tell the server that  - we have views(html or edge files) inisde __dirname/views -
app.use(
  expressSession({
    secret: "my nodejs project",
    store: new ConnectMongo({
      mongoUrl: dbUrl,
    }),
  })
);

app.use((req, res, next) => {
  edge.global("auth", req.session.userId);
  next();
});

// ROUTES - START
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/signup", (req, res) => {
  User.create(req.body, (err, user) => {
    if (err) {
      console.log(err);
      return res.render("signup", {
        error: "Fail to signup, please try again",
      });
    } else {
      res.redirect("login");
    }
  });
});

app.post("/login", (req, res) => {
  User.findOne(
    { email: req.body.email, password: req.body.password },
    {},
    (err, user) => {
      console.log("err", err);
      console.log("user", user);
      if (!user) {
        return res.render("login", {
          error: "Email or password is invalid",
        });
      } else {
        req.session.userId = user._id;
        return res.redirect("/");
      }
    }
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});
// ROUTES -END

// it will start listning on port 3000 - for request
app.listen(8000, () => {
  console.log("Sever is running");
});
