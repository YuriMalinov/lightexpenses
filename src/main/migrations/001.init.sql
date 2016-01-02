--create schema if not exists lightexpenses;

create table lightexpenses.app_user (
  id text primary key,
  email text,
  name text not null,
  password text not null
);

create table lightexpenses.userconnection (
  userid text not null,
  providerid text not null,
  provideruserid text not null,
  rank integer not null,
  displayname text,
  profileurl text,
  imageurl text,
  accesstoken text not null,
  secret text,
  refreshtoken text,
  expiretime bigint,
  constraint userconnection_pkey primary key (userid, providerid, provideruserid)
);

create table lightexpenses.expense_category
(
  id serial primary key,
  uuid uuid not null,
  name text not null,
  owner_id text not null references lightexpenses.app_user (id) on delete cascade,
  parent_category_id integer references lightexpenses.expense_category (id) on delete set null
);

create unique index ix_expense_category_uuid on lightexpenses.expense_category (uuid);

create index ix_expense_category_owner on lightexpenses.expense_category (owner_id);

create table lightexpenses.expense
(
  id serial primary key,
  uuid uuid not null,
  amount double precision not null,
  date timestamp without time zone,
  description text,
  expense_category_id integer not null references lightexpenses.expense_category (id)
);

create unique index ix_expense_uuid on lightexpenses.expense (uuid);

create index ix_expense_expense_category_id on lightexpenses.expense (expense_category_id);