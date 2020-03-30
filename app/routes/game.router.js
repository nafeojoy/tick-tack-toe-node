import { client } from "../../server.conf";

export default (app, router, logger) => {

    router.route("/get-games")
        .get((req, res, next) => {
            client.query('SELECT * FROM game_status', (err, response) => {
                if (!err) {
                    res.json(response.rows)
                    next();
                } else {
                    res.send(err)
                    next();
                }
            })
        })

    router.route("/get-current-game/:game_code")
        .get((req, res, next) => {
            let current_game_code = req.params.game_code;

            client.query("SELECT * FROM game_status where game_code = '" + current_game_code + "'", (err, response) => {
                if (!err) {
                    res.json(response.rows)
                    next();
                } else {
                    res.send(err)
                    next();
                }
            })
        })

    router.route("/new-match")
        .post((req, res) => {
            console.log(req.body)
            let sp_insert_match =
                "CALL insert_match('" + req.body.game_code + "')";
            client.query(sp_insert_match, (err, response) => {
                if (!err) {
                    res.json(response)
                } else {
                    res.send(err)
                }
            })
        })

    router.route("/update-match")
        .put((req, res, next) => {
            let player = req.body.player;
            let sqr_no = req.body.sqr_no;
            let game_code = req.body.game_code;

            console.log(req.body)
                // {
                //     "player": "x",
                //     "sqr_no": 2,
                //     "game_code": "game_code2"
                // }


            let query_update_match = "UPDATE game_status SET box_" + sqr_no + " = '" + player + "' WHERE game_code = '" + game_code + "';";
            console.log(query_update_match)

            client.query(query_update_match, (err, response) => {
                if (!err) {
                    res.json(response)
                    next();
                } else {
                    res.send(err)
                    next();
                }
            })

        })
}