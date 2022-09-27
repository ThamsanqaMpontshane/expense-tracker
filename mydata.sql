CREATE TABLE users (
    id serial primary key,
    name varchar(255) not null
);

CREATE TABLE expense_types (
    id serial primary key,
    name varchar(255) not null
);

INSERT INTO expense_types (name) VALUES ('food'), ('transport'), ('entertainment'), ('other');

CREATE TABLE addExpenses (
    id serial primary key,
    name varchar(255) not null,
    amount integer not null,
    date date not null,
    expense_type_id integer not null references expense_types(id),
    user_id integer not null references users(id)
); 