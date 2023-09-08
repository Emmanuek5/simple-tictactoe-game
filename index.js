const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;
const WINING_COMBINATIONS = [
    // Horizontal combinations
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    // Vertical combinations
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    // Diagonal combinations
    [0, 4, 8],
    [2, 4, 6],
    ];

// Keep track of connected players
const players = [];
let boards = [];
app.use(express.static(__dirname + "/public"));
app.set ("view engine", "ejs");


app.get("/", (req, res) => {
    res.render("index");
});

const activeGames = [];
const waitingPlayers = [];

io.on("connection", (socket) => {
  console.log("A user connected");

  // Add the player to the waiting list
  waitingPlayers.push(socket);

  // Check if there are enough waiting players to start a new game
  if (waitingPlayers.length >= 2) {
    const player1 = waitingPlayers.pop();
    const player2 = waitingPlayers.pop();
    

    
    // Create a new game instance
    const newGame = {
      players: [player1, player2],
      board: ["", "", "", "", "", "", "", "", ""],
      currentPlayer: "X",
      
    };

    activeGames.push(newGame);
    // Send the game data to the players
    player1.emit("init", {
      board: newGame.board,
      currentPlayer: newGame.currentPlayer,
      player: "X",
      
    });
    player2.emit("init", {
      board: newGame.board,
      currentPlayer: newGame.currentPlayer,
        player: "O",
    });

  }
  
  // Handle player moves
  socket.on("move", (data,player) => {
    const { cellIndex } = data;
    const gameIndex = activeGames.findIndex((game) => {
        return game.players.includes(socket);
    });
    let { board, currentPlayer } = activeGames[gameIndex];
    console.log(board, currentPlayer);
    // Update the board
    if (player === currentPlayer) {
        board[cellIndex] = currentPlayer;
    } else {
        socket.emit("not-your-turn");
        return;
    }
    // Send the updated board to the players
    activeGames[gameIndex].players.forEach((player) => {
        player.emit("update", { board, currentPlayer });
    });
    // Check if the game is over
    const isWin = checkWin(board, currentPlayer);
    const isDraw = checkDraw(board);
    if (isWin) {
        activeGames[gameIndex].players.forEach((player) => {
            player.emit("game-end", { winner: currentPlayer });
        });
    } else if (isDraw) {
        activeGames[gameIndex].players.forEach((player) => {
        player.emit("game-end", { draw: true });
    });
    }
    // Switch players
    activeGames[gameIndex].currentPlayer = currentPlayer === "X" ? "O" : "X";
  });

  // Handle game restart
  socket.on("restart", () => {
    let gameIndex = activeGames.findIndex((game) => {
        return game.players.includes(socket);
    });
    console.log(gameIndex, activeGames[gameIndex]);
    activeGames[gameIndex].board = ["", "", "", "", "", "", "", "", ""];
    activeGames[gameIndex].currentPlayer = "X";
    activeGames[gameIndex].players.forEach((player) => {
        player.emit("restart");
    });
  });

  // Check if the game is over
  function checkWin(board, currentPlayer) {
    return WINING_COMBINATIONS.some((combination) => {
      return combination.every((index) => {
        return board[index] === currentPlayer;
      });
    });
  }
  // Check if it's a draw
  function checkDraw(board) {
    return board.every((cell) => {
      return cell !== "";
    });
  }

  // Handle disconnects
  socket.on("disconnect", () => {
    console.log("A user disconnected");

    // Remove the player from the waiting list
    const index = waitingPlayers.indexOf(socket);
    if (index !== -1) {
      waitingPlayers.splice(index, 1);
    }

    // Remove the player from active games (if they were in one)
    for (const game of activeGames) {
      const playerIndex = game.players.indexOf(socket);
      if (playerIndex !== -1) {
        game.players.splice(playerIndex, 1);

        // Notify the other player that their opponent has disconnected
        if (game.players.length === 1) {
          game.players[0].emit("opponent-disconnected");
        }
      }
    }
  });

});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
