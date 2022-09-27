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
        req.flash('success', 'You have successfully signed up');
        res.redirect("/login");
    }else{
        req.flash('error', 'User already exists');
        res.redirect("/signup");
    }
});
app.post("/login", async function (req, res) {
    const theMail = req.body.email;
    const theCode = req.body.uniqueCode;
    const getName = await db.manyOrNone('select name from users where email = $1',[theMail]);
    const name = getName.name;
    // get Unique code
    const getCode = await db.manyOrNone('select unique_code from users where email = $1',[theMail]);
    const code = getCode.unique_code;
    if(theCode == code){
    res.redirect(`/addUser/${name}`);
    }else {
        if (theCode != code){
            req.flash('error', 'Invalid code');
        }
        else if (theMail != theMail){
            req.flash('error', 'User does not exist');
        }
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
    const fullDate = `${year}-${month}-${day}`;
    await expense.addExpense(theExpense, thePrice, fullDate, userId, expenseTypeId);
    res.redirect(`/addUser/${name}`);
});


app.listen(process.env.PORT || 3111, () => {
    console.log("App started at port", process.env.PORT || 3111);
});