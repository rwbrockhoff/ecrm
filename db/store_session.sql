insert into sessions(
    "session_name", 
    "session_color", 
    "session_price", 
    "actions", 
    "user_id",
    "template")

values ( $1, $2, $3, array_to_json($4), $5, $6 );

select session_id from sessions
where user_id=$5
order by session_id desc
limit 1;