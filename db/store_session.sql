insert into sessions(
    "session_name", 
    "session_color", 
    "session_price", 
    "action_list", 
    "user_id")

values ( $1, $2, $3, array_to_json($4), $5 );