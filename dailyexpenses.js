function dailyExpenses(db){
    async function addUser(name,mail,code){
        const nameRegex = /^[a-zA-Z]+$/;
        const mailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        const upperName = name.toUpperCase();
        const nameValid = nameRegex.test(upperName);
        const selectName = await db.manyOrNone('select * from users where name = $1',[upperName]);
        if(selectName.length == 0 && nameValid == true && mailRegex.test(mail)){
            return await db.none('insert into users (name,email,unique_code) values ($1,$2,$3)',[upperName,mail,code]);
        }
    }
    async function getUser(name){
        const upperName = name.toUpperCase();
        return await db.manyOrNone('select * from users where name = $1',[upperName]);
    }
    // function to add expense
    async function addExpense(name, amount, date, userId , expenseId){
        return await db.none(`INSERT INTO addExpenses (name, amount, date , expense_type_id , user_id) VALUES ('${name}', '${amount}', '${date}', '${expenseId}', '${userId}')`);
    }
    // select expense_type_id from addExpenses where user_id = (select id from users where name = [name])
    async function getExpenseType(name){
        const upperName = name.toUpperCase();
        const select = await db.manyOrNone('select expense_type_id from addExpenses where user_id = (select id from users where name = $1)',[upperName]);
        // store the expense_type_id in an array
        const expenseType = [];
        for(let i = 0; i < select.length; i++){
            expenseType.push(select[i].expense_type_id);
        }
        // select the expense_type_id from expense_types where id = [id]
        const expenseTypeArray = [];
        for(let i = 0; i < expenseType.length; i++){
            const expenseTypeSelect = await db.manyOrNone('select name from expense_types where id = $1',[expenseType[i]]);
            expenseTypeArray.push(expenseTypeSelect[0].name);
        }
        return expenseTypeArray;
    }

    return {
        addUser,
        getUser,
        addExpense,
        getExpenseType
    }
}

export default dailyExpenses;