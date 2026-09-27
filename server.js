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

// Database yaratish
async function initDatabase() {
    try {
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

        console.log("Database tayyor!");
    } catch (error) {
        console.error("Database xatosi:", error);
    }
}

initDatabase();

// Foydalanuvchini olish/yaratish
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
            "SELECT * FROM users WHERE id = $1",
            [id]
        );

        if (result.rows.length === 0) {

            const promoCode = Math.random()
                .toString(36)
                .substring(2, 7)
                .toUpperCase();

            result = await pool.query(
                `
                INSERT INTO users
                (id, username, first_name, coins, promo_code)
                VALUES ($1, $2, $3, 0, $4)
                RETURNING *
                `,
                [
                    id,
                    username || "",
                    first_name || "",
                    promoCode
                ]
            );
        }

        res.json(result.rows[0]);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Server xatosi"
        });
    }
});

// Coin qo'shish
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
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: "User topilmadi"
            });
        }

        res.json({
            coins: result.rows[0].coins
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Server xatosi"
        });
    }
});

// Reyting
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

        console.error(error);

        res.status(500).json({
            error: "Rating xatosi"
        });
    }
});

// Asosiy sahifa
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "public", "index.html")
    );
});

app.listen(PORT, () => {
    console.log(
        `Dragon Coin running on port ${PORT}`
    );
});