


create table votes (
  voteId integer primary key autoincrement,
  userId integer not null,
  title text not null,
  desc text,
  deadline text not null,
  anonymous number not null,
  multiple number not null
);

create table options (
  optionId integer primary key autoincrement,
  voteId integer not null,
  content text not null
);

create table voteOptions (
  voteOptionId integer primary key autoincrement,
  userId integer not null,
  voteId integer not null,
  optionId integer not null
)
