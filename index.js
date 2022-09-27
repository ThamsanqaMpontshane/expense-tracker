import express from "express";
import bodyParser from "body-parser";
import exphbs from "express-handlebars";
import dailyExpenses from "./dailyexpenses.js";
import flash from "express-flash";
import session from "express-session";
import pgPromise from 'pg-promise';
// import waiterRouter from "./routes/routes.js";
const app = express();
const pgp = pgPromise({});

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
app.post("/addUser", async function (req, res) {
    const { name } = req.body;
    if (name == "") {
        req.flash('error', 'Please enter your name');
        res.redirect('/');
    }
    // else if name is not valid
    // regex
    const regex = /^[a-zA-Z]+$/;
    if (regex.test(name) == false) {
        req.flash('error', 'Please enter a valid name');
        res.redirect('/');
        return;
    }
    await expense.addUser(name);
    const theSpender = await expense.getUser(name);
    const user = theSpender[0].name;
    res.redirect(`/addUser/${user}`);
});

app.get("/addUser/:name", async function (req, res) {
    const { name } = req.params;
    const theSpender = await expense.getUser(name);
    const user = theSpender[0].name;
    const theType = await expense.getExpenseType(name);
    console.log(theType);
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
    const fullDate = `${year}-${month}-${day}`;
    await expense.addExpense(theExpense, thePrice, fullDate, userId, expenseTypeId);
    res.redirect(`/addUser/${name}`);
});


app.listen(process.env.PORT || 3111, () => {
    console.log("App started at port", process.env.PORT || 3111);
});