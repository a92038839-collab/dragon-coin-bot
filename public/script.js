const tg = window.Telegram.WebApp;

tg.ready();
tg.expand();

let coins = 0;

const user = tg.initDataUnsafe?.user;

if (user) {
    document.getElementById("username").textContent =
        "👤 " + (user.first_name || user.username || "Player");
}

function tapCoin(event) {
    coins++;

    document.getElementById("coins").textContent =
        coins.toLocaleString() + " 🪙";

    const plus = document.createElement("div");

    plus.className = "plus";
    plus.textContent = "+1 🪙";

    plus.style.left = event.clientX + "px";
    plus.style.top = event.clientY + "px";

    document.body.appendChild(plus);

    setTimeout(() => {
        plus.remove();
    }, 800);
}