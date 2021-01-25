const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

require('dotenv').config(); //.env variables
const app = express();
app.use(bodyParser.urlencoded({
  extended: true
}));
app.set("view engine", "ejs");
app.use(express.static("public"));

//============DB START=====================
const uri = process.env.uri;
mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  function(err) {
    if (err) console.log(err);
    console.log("DB connected.");
  }
);

const schema = new mongoose.Schema({
  url: String,
  customName: String
});

const user = mongoose.model("user", schema); //collection

const saveToDB = async (userURL, userCustomName) => {
  console.log("SAVING TO DB....");
  const userData = new user({
    url: userURL,
    customName: userCustomName
  });
  await userData.save();
  console.log("SAVED TO DB SUCCESFULLY!");
}

//check in DB, if not found then save to DB,return 1 otherwise return 1 if found!
const checkNameInDB = async (userURL, userCustomName) => {
  console.log("CHECKING IN DB....");
  const data = await user.find({
    customName: userCustomName
  });
  if (data.length == 1) return 1; //found

  //not found
  await saveToDB(userURL, userCustomName);
  return 0;
}

//get link from DB if found, otherwise return home link
const getLinkFromDB = async (name) => {
  console.log("Getting link from DB for name: " + name);
  const data = await user.find({
    customName: name
  });
  // console.log("DATA",data);

  if (data.length !== 0) //found
    return data[0].url;
  else
    return herokuLink;
}

const herokuLink = "https://www.testing.com"; //home link of website!
const regex = /[^A-Za-z1-9]/g; //regex to have only alphabets and numbers

app.get("/", (req, res) => {
  res.render("index", {
    userURL: "",
    userCustomName: "",
    custom_link: " ",
  });
});

app.post("/", (req, res) => {
  let userURL = req.body.inputURL;
  let userCustomName = req.body.inputCustomName;
  let resultCustomURL = "";

  if (userCustomName.match(regex) != null) //user entered inproper custom name
    res.redirect("/");
  else {
    //check in DB
    const checkinDBPromise = checkNameInDB(userURL, userCustomName);

    checkinDBPromise.then((response) => {
      if (response === 0) { //not present in DB
        resultCustomURL = herokuLink + "/" + userCustomName;
      }

      res.render("index", {
        userURL: userURL,
        userCustomName: userCustomName,
        custom_link: resultCustomURL,
      });
    });
  }
});

app.get("/:name", (req, res) => {
  const name = req.params.name;
  const getLinkPromise = getLinkFromDB(name);
  getLinkPromise.then((response) => {
    console.log("Redirecting to " + response);
    res.redirect(response);
  });
});

app.listen(80, () => {
  console.log("Server started!");
});
