const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();

let coins = 0;
let userId = null;

const user = tg.initDataUnsafe?.user;

if (user) {

    userId = user.id;

    document.getElementById("username").textContent =
        "👤 " + (
            user.first_name ||
            user.username ||
            "Player"
        );

    loadUser();
}

async function loadUser() {

    try {

        const response = await fetch("/api/user", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                id: user.id,
                username: user.username || "",
                first_name: user.first_name || ""
            })
        });

        const data = await response.json();

        coins = Number(data.coins);

        document.getElementById("coins").textContent =
            coins.toLocaleString() + " 🪙";

    } catch (error) {

        console.error(
            "User yuklash xatosi:",
            error
        );
    }
}

async function tapCoin(event) {

    if (!userId) {
        return;
    }

    try {

        const response = await fetch("/api/tap", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                id: userId
            })
        });

        const data = await response.json();

        coins = Number(data.coins);

        document.getElementById("coins").textContent =
            coins.toLocaleString() + " 🪙";

        showPlus(event);

    } catch (error) {

        console.error(
            "Coin xatosi:",
            error
        );
    }
}

function showPlus(event) {

    const plus = document.createElement("div");

    plus.className = "plus";

    plus.textContent = "+1 🪙";

    plus.style.left =
        event.clientX + "px";

    plus.style.top =
        event.clientY + "px";

    document.body.appendChild(plus);

    setTimeout(() => {
        plus.remove();
    }, 800);
}