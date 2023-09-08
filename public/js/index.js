

// Inside your existing script tag
const socket = io();
const cells = document.querySelectorAll(".cell");
const board = document.getElementById("board");
    const winningMessage = document.querySelector(".winning-message");
    const restartButton = document.querySelector(".restart-button");
    const winningMessageText = document.querySelector(".winning-message-text");
let currentPlayer;
let game;
let player;
const X_CLASS = "X";
const CIRCLE_CLASS = "O";


     function startGame() {
       // Initialize the game
       socket.on("init", (data) => {
         currentPlayer = data.currentPlayer;
         game = data.gameIndex;
          player = data.player;
         updateBoard(data.board);
       });
       cells.forEach((cell) => {
         cell.innerHTML = "";
         cell.classList.remove(X_CLASS);
         cell.classList.remove(CIRCLE_CLASS);
       });
       setBoardHoverClass();
       winningMessage.classList.remove("show");
     }

     
function restartGame() {
  socket.emit("restart", game);
  
}


socket.on("not-your-turn", () => {
  winningMessageText.innerHTML = "It's not your turn";
  winningMessage.classList.add("show");
  setTimeout(() => {
    winningMessage.classList.remove("show");
  }, 3000);
});

socket.on("restart", () => {
  startGame();
});

function setBoardHoverClass() {
  board.classList.remove(X_CLASS);
  board.classList.remove(CIRCLE_CLASS);
  if (currentPlayer === "X") {
    board.classList.add(X_CLASS);
  } else {
    board.classList.add(CIRCLE_CLASS);
  }
}

//Handle oppenent disconnect
socket.on("opponent-disconnected", () => {
  winningMessageText.innerHTML = "Your opponent left the game";
  winningMessage.classList.add("show");
});




//Handle game end
socket.on("game-end", (data) => {
  if (data.winner) {
    winningMessageText.innerHTML = `${data.winner} has won!`;
  } else if (data.draw) {
    winningMessageText.innerHTML = `It's a draw!`;
  }
  winningMessage.classList.add("show");
});



// Update the game board
socket.on("update", (data) => {
  currentPlayer = data.currentPlayer;
  updateBoard(data.board);
});

// Handle player clicks
cells.forEach((cell, index) => {
  cell.addEventListener("click", () => {
    if (currentPlayer === "X" && cell.innerHTML === "") {
      socket.emit("move", { cellIndex: index },player);
    } else if (currentPlayer === "O" && cell.innerHTML === "") {
      socket.emit("move", { cellIndex: index },player);
    }
  });
});

// Function to update the game board
function updateBoard(boardData) {
  for (let i = 0; i < cells.length; i++) {
    cells[i].innerHTML = boardData[i];
  }
}


restartButton.addEventListener("click", restartGame);
startGame();