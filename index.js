import express from "express";
import bodyParser from "body-parser";
import exphbs from "express-handlebars";
import dailyExpenses from "./dailyexpenses.js";
import flash from "express-flash";
import session from "express-session";
import pgPromise from 'pg-promise';
import moment from "moment";
// import waiterRouter from "./routes/routes.js";
const app = express();
const pgp = pgPromise({});
import ShortUniqueId from 'short-unique-id';

const connectionString = process.env.DATABASE_URL || 'postgresql://codex:pg123@localhost:5432/expenses';

const config = {
    connectionString    
}

if(process.env.NODE_ENV == "production"){
    config.ssl = {
        rejectUnauthorized: false
    }
}

const db = pgp(config);
const expense = dailyExpenses(db);
// const Routers = waiterRouter(waiters, db)

app.use(session({
    secret: "<add a secret string here>",
    resave: false,
    saveUninitialized: true
}));
app.use(flash());

app.engine("handlebars", exphbs.engine({
    defaultLayout: "main"
}));
app.set("view engine", "handlebars");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(express.static("public"));

app.get("/", async function (req, res) {
    res.render("index");
});
app.get("/login", async function (req, res) {
    res.render("login");
});
app.get("/signup", async function (req, res) {
    res.render("signup");
});
app.post("/signup", async function (req, res) {
    const { name } = req.body;
    const theMail = req.body.email;
    const user = await expense.getUser(name);
    const uid = new ShortUniqueId();
    if(user.length == 0){
        await expense.addUser(name, theMail, uid());
        const shortId = await expense.getUser(name);
        req.session.user = shortId[0].unique_code;
        req.flash('success', 'You have successfully signed up');
        req.flash('theId', shortId[0].unique_code);
        setTimeout(() => {
            res.redirect("back");
        }, 5000);
    }else{
        req.flash('error', 'User already exists');
        res.redirect("/signup");
    }
});
app.post("/login", async function (req, res) {
    const theMail = req.body.email;
    const theCode = req.body.uniqueCode;
    const getName = await db.manyOrNone('select name from users where email = $1',[theMail]);
    // console.log(getCode[0].email);
    if(getName.length == 0){
        req.flash('error', 'User does not exist');
        res.redirect("/login");
        return;
    }
    const user = await expense.getUser(getName[0].name);
    const code = user[0].unique_code;
    if(theCode == code && theMail == user[0].email){
        req.flash('error', 'You have successfully logged in');
        setTimeout(() => {
        res.redirect(`/addUser/${getName[0].name}`);
        }, 3000);
      }else{
        req.flash('error', 'Invalid code');
        res.redirect("/login");
      }
});

app.get("/addUser/:name", async function (req, res) {
    const { name } = req.params;
    const theSpender = await expense.getUser(name);
    const user = theSpender[0].name;
    const theType = await expense.getExpenseType(name);
    // get the percentage of each type out of the total
    const total = theType.length;
    const food = theType.filter(type => type == "food").length;
    const transport = theType.filter(type => type == "transport").length;
    const entertainment = theType.filter(type => type == "entertainment").length;
    const other = theType.filter(type => type == "other").length;
    const foodPercentage = Math.round((food / total) * 100);
    const transportPercentage = Math.round((transport / total) * 100);
    const entertainmentPercentage = Math.round((entertainment / total) * 100);
    const otherPercentage = Math.round((other / total) * 100);
    res.render("addExpenses", {
        user,
        foodPercentage,
        transportPercentage,
        entertainmentPercentage,
        otherPercentage
    });
});

app.post("/addUser/:name", async function (req, res) {
    const { name } = req.params;
    const theExpense = req.body.expense;
    const thePrice = req.body.price;
    const typeOfExpense = req.body.typeofexpense;
    const theSpender = await expense.getUser(name);
    const userId = theSpender[0].id;
    const expenseId = await db.manyOrNone('select id from expense_types where name = $1', [typeOfExpense]);
    const expenseTypeId = expenseId[0].id;
    // date date not null
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const fullDate = `${day}/${month}/${year}`;
    await expense.addExpense(theExpense, thePrice, fullDate, userId, expenseTypeId);
    res.redirect(`/addUser/${name}`);
});


app.get("/viewexpenses/:name", async function (req, res) {    
    res.render("viewexpenses");
});

app.post("/viewexpenses/:name", async function (req, res) {
    const { name } = req.params;
    const firstDate = req.body.dayFrom;
    const secondDate = req.body.dayTo;
    const theSorting = req.body.sort;
    const theSpender = await expense.getUser(name);
    const userId = theSpender[0].id;
    if(firstDate == "" || secondDate == ""){
        req.flash('error', 'Please enter a date');
        res.redirect(`/viewexpenses/${name}`);
    }else{
        const theExpenses = await expense.getExpenses(firstDate, secondDate, userId, theSorting);
        res.render("viewexpenses", {
            theExpenses
        });
    }
});
app.listen(process.env.PORT || 3111, () => {
    console.log("App started at port", process.env.PORT || 3111);
});