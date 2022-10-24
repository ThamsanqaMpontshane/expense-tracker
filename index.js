import express from "express";
import bodyParser from "body-parser";
import exphbs from "express-handlebars";
import dailyExpenses from "./dailyexpenses.js";
import flash from "express-flash";
import session from "express-session";
import pgPromise from 'pg-promise';
import addExpenseRoutes from "./routes/routes.js";
const app = express();
const pgp = pgPromise({});
import ShortUniqueId from 'short-unique-id';

const connectionString = process.env.DATABASE_URL || 'postgresql://codex:pg123@localhost:5432/expenses';

const config = {
    connectionString    
}

if(process.env.NODE_ENV === "production"){
    config.ssl = {
        rejectUnauthorized: false
    }
}

const db = pgp(config);
const expense = dailyExpenses(db);
const Routes = addExpenseRoutes(expense,db);

app.use(session({
    secret: "admin",
    resave: false,
    saveUninitialized: true,
    cookie: {
        sameSite: "strict"
    }
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
app.get("/", Routes.HomeRoute);
app.get("/login", Routes.LoginRoute);
app.get("/signup", Routes.SignupRoute);
app.post("/signup",Routes.SignupPostRoute);
app.post("/login", Routes.LoginPostRoute);
app.get("/addUser/:name", Routes.AddUserRoute);
app.post("/addUser/:name", Routes.AddUserPostRoute);
app.get("/viewexpenses/:name", Routes.ViewExpenses);
app.post("/viewexpenses/:name", Routes.ViewExpensesPost);
app.listen(process.env.PORT || 3111, () => {
    console.log("App started at port", process.env.PORT || 3111);
});