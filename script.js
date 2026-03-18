// get references to HTML elements
const statusDiv = document.getElementById("status");
const turnDiv = document.getElementById("turn");
const boardDiv = document.getElementById("board");
const restartBtn = document.getElementById("restart");

// websocket connection
let socket;

// player symbol (X or O)
let mySymbol = null;

// whether it's my turn
let myTurn = false;

// local board state (9 cells)
let board = Array(9).fill("");

// whether game is active
let gameActive = false;


// establish websocket connection
function connect() {

    // connect to server
   const protocol = window.location.protocol === "https:" ? "wss://" : "ws://";
    const host = window.location.host;
    
    console.log("Attempting connection to:", protocol + host);
    socket = new WebSocket(protocol + host);

    socket.onopen = () => {
        console.log("Connected successfully!");
        statusDiv.textContent = "Connected. Waiting for opponent...";
    };

socket.onerror = (e) => {
    console.log("WebSocket error", e);
};

socket.onclose = (e) => {
    console.log("WebSocket closed", e);
    if (gameActive) return;
    gameActive = false;
    restartBtn.style.display = "inline-block";
    restartBtn.textContent = "New Game";
};

    // when message received from server
    socket.onmessage = (event) => {

        // convert JSON string to object
        const data = JSON.parse(event.data);

        // game start
        if (data.type === "start") {
            mySymbol = data.symbol;
            myTurn = mySymbol === "X"; // X starts first
            gameActive = true;

            statusDiv.textContent = "Game started! You are " + mySymbol;

            updateTurnUI();
            renderBoard();

            restartBtn.style.display = "inline-block";
            restartBtn.textContent = "End Game";
        }

        // board update from server
        if (data.type === "update") {
            board[data.position] = data.symbol;

            // switch turn
            myTurn = data.symbol !== mySymbol;

            updateTurnUI();
            renderBoard();
        }

        // win message
        if (data.type === "win") {
            gameActive = false;

            if (data.winner === mySymbol)
                statusDiv.textContent = "You Win!";
            else
                statusDiv.textContent = "You Lose!";

            turnDiv.textContent = "";
            restartBtn.style.display = "inline-block";
            restartBtn.textContent = "New Game";
        }

        // draw message
        if (data.type === "draw") {
            gameActive = false;

            statusDiv.textContent = "It's a Draw!";
            turnDiv.textContent = "";

            restartBtn.style.display = "inline-block";
            restartBtn.textContent = "New Game";
        }
    };

    // when connection closes
    socket.onclose = () => {

        // ignore if game was active
        if (gameActive) return;

        gameActive = false;

        restartBtn.style.display = "inline-block";
        restartBtn.textContent = "New Game";
    };
}


// update turn text
function updateTurnUI() {

    if (!gameActive) return;

    if (myTurn)
        turnDiv.textContent = "Your Turn (" + mySymbol + ")";
    else
        turnDiv.textContent = "Opponent's Turn";
}


// render board UI
function renderBoard() {

    // clear existing board
    boardDiv.innerHTML = "";

    // loop through all 9 cells
    board.forEach((cell, index) => {

        const div = document.createElement("div");
        div.className = "cell";

        // if cell already filled
        if (cell) {
            div.textContent = cell;
            div.classList.add(cell);       // X or O styling
            div.classList.add("disabled");
        }

        // disable all if game not active
        if (!gameActive) {
            div.classList.add("disabled");
        }

        // disable if not your turn
        if (gameActive && !myTurn) {
            div.classList.add("disabled");
        }

        // enable empty cells during your turn
        if (gameActive && myTurn && cell === "") {
            div.classList.remove("disabled");
        }

        // click event
        div.onclick = () => {

            // allow only valid move
            if (!gameActive || !myTurn) return;
            if (board[index] !== "") return;

            // temporarily disable turn
            myTurn = false;
            renderBoard();

            // send move to server
            socket.send(JSON.stringify({
                type: "move",
                position: index
            }));
        };

        // add cell to board
        boardDiv.appendChild(div);
    });
}


// restart / end game button
restartBtn.onclick = () => {

    // if game is active → end game
    if (gameActive && restartBtn.textContent === "End Game") {

        socket.send(JSON.stringify({
            type: "exit"
        }));

        gameActive = false;
        statusDiv.textContent = "You ended the game.";
        turnDiv.textContent = "";
        restartBtn.textContent = "New Game";
        return;
    }

    // start new game
    board = Array(9).fill("");
    renderBoard();
    connect();
};


// initial setup
renderBoard();
connect();
