const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initDatabase() {
    try {

        // Jadval bo'lmasa yaratadi
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY,
                username TEXT,
                first_name TEXT,
                coins BIGINT DEFAULT 0,
                promo_code TEXT UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Eski INTEGER bo'lsa BIGINT ga o'tkazadi
        await pool.query(`
            ALTER TABLE users
            ALTER COLUMN id TYPE BIGINT
            USING id::BIGINT
        `);

        // coins ham katta sonlarni qabul qilsin
        await pool.query(`
            ALTER TABLE users
            ALTER COLUMN coins TYPE BIGINT
            USING coins::BIGINT
        `);

        console.log("✅ Database tayyor!");

    } catch (error) {
        console.error("❌ Database xatosi:", error);
    }
}


// USER
app.post("/api/user", async (req, res) => {

    try {

        const {
            id,
            username,
            first_name
        } = req.body;

        if (!id) {
            return res.status(400).json({
                error: "User ID kerak"
            });
        }

        let result = await pool.query(
            `SELECT * FROM users WHERE id = $1`,
            [id.toString()]
        );

        if (result.rows.length === 0) {

            let promoCode;

            // Takrorlanmaydigan 5 belgili kod
            while (true) {

                promoCode = Math.random()
                    .toString(36)
                    .substring(2, 7)
                    .toUpperCase();

                const check = await pool.query(
                    `SELECT id FROM users WHERE promo_code = $1`,
                    [promoCode]
                );

                if (check.rows.length === 0) {
                    break;
                }
            }

            result = await pool.query(
                `
                INSERT INTO users
                (id, username, first_name, coins, promo_code)
                VALUES ($1, $2, $3, 0, $4)
                RETURNING *
                `,
                [
                    id.toString(),
                    username || "",
                    first_name || "",
                    promoCode
                ]
            );
        }

        res.json({
            id: result.rows[0].id,
            username: result.rows[0].username,
            first_name: result.rows[0].first_name,
            coins: Number(result.rows[0].coins),
            promo_code: result.rows[0].promo_code
        });

    } catch (error) {

        console.error("USER ERROR:", error);

        res.status(500).json({
            error: "User server xatosi"
        });
    }
});


// TAP
app.post("/api/tap", async (req, res) => {

    try {

        const { id } = req.body;

        if (!id) {
            return res.status(400).json({
                error: "User ID kerak"
            });
        }

        const result = await pool.query(
            `
            UPDATE users
            SET coins = coins + 1
            WHERE id = $1
            RETURNING coins
            `,
            [id.toString()]
        );

        if (result.rows.length === 0) {

            return res.status(404).json({
                error: "User topilmadi"
            });
        }

        res.json({
            coins: Number(result.rows[0].coins)
        });

    } catch (error) {

        console.error("TAP ERROR:", error);

        res.status(500).json({
            error: "Coin qo'shishda xato"
        });
    }
});


// RATING
app.get("/api/rating", async (req, res) => {

    try {

        const result = await pool.query(`
            SELECT
                id,
                username,
                first_name,
                coins,
                RANK() OVER (ORDER BY coins DESC) AS position
            FROM users
            ORDER BY coins DESC
            LIMIT 100
        `);

        res.json(result.rows);

    } catch (error) {

        console.error("RATING ERROR:", error);

        res.status(500).json({
            error: "Rating xatosi"
        });
    }
});


// HOME
app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );

});


app.listen(PORT, () => {

    console.log(
        `🐉 Dragon Coin running on port ${PORT}`
    );

});