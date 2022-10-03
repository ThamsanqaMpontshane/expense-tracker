import assert from 'assert';
import dailyExpenses from "../dailyexpenses.js";
import pgPromise from 'pg-promise';
import ShortUniqueId from 'short-unique-id';

const pgp = pgPromise({});

const connectionString = process.env.DATABASE_URL || 'postgresql://codex:pg123@localhost:5432/expenses_test';

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

describe('The daily expenses app', function(){
    beforeEach(async function(){
        await db.manyOrNone('delete from addExpenses');
        await db.manyOrNone('delete from users where id > 0');
    });

    it('should be able to add a user and return the length of the users', async function(){
        const name = "John";
        const mail = "john@gmail.com";
        const uid = new ShortUniqueId();
        await expense.addUser(name,mail,uid());
        const users = await db.manyOrNone('select * from users');
        assert.equal(1,users.length);
    });
    it('should be able to add a user', async function(){
        const name = "John";
        const toupper = name.toUpperCase();
        const mail = "john@gmail.com";
        const uid = new ShortUniqueId();
        await expense.addUser(toupper,mail,uid());
        const theName = await expense.getUser(toupper);
        assert.equal(toupper,theName[0].name);
    });
    it('should be able to add expenses for a user', async function(){
        // ?user details
        const name = "John";
        const toupper = name.toUpperCase();
        const mail = "john@gmail.com";
        const uid = new ShortUniqueId();
        await expense.addUser(toupper,mail,uid());
        const theName = await expense.getUser(toupper);
        // ?expenses details
        const expense_name = "pizza";
        const expense_amount = 100;
        const expense_date = "2020-10-10";
        const expense_type = "food";
        const expense_id = await db.manyOrNone('select id from expense_types where name = $1', [expense_type]);
        const expense_id2 = expense_id[0].id;
        const user_id = theName[0].id;
        await expense.addExpense(expense_name,expense_amount,expense_date,user_id,expense_id2);
        const theExpense = await db.manyOrNone('select * from addExpenses');
        assert.equal(expense_name,theExpense[0].name);
        assert.equal(expense_amount,theExpense[0].amount);
        assert.equal(user_id,theExpense[0].user_id);
    });
    it('should be able to get the expenses for a user', async function(){
        // ?user details
        const name = "John";
        const toupper = name.toUpperCase();
        const mail = "john@gmail.com";
        const uid = new ShortUniqueId();
        await expense.addUser(toupper,mail,uid());
        const theName = await expense.getUser(toupper);
        // ?expenses details
        const expense_name = "pizza";
        const expense_amount = 100;
        const expense_date = "2020-10-10";
        const expense_type = "food";
        const expense_id = await db.manyOrNone('select id from expense_types where name = $1', [expense_type]);
        const expense_id2 = expense_id[0].id;
        const user_id = theName[0].id;
        await expense.addExpense(expense_name,expense_amount,expense_date,user_id,expense_id2);
        await expense.addExpense("burger",200,"2020-10-10",user_id,expense_id2);
        const theExpense = await db.manyOrNone('select * from addExpenses');
        assert.equal(2,theExpense.length);
        if(theExpense.length > 1){
            assert.equal(expense_name,theExpense[0].name);
            assert.equal(expense_amount,theExpense[0].amount);
            assert.equal(user_id,theExpense[0].user_id);
        }
    });

    after(async function(){
        await db.manyOrNone('delete from addExpenses');
        await db.manyOrNone('delete from users');
        pgp.end();
    });
});
