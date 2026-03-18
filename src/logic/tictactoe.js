/**
 * LÓGICA DE NEGOCIO DEL TRIQUI
 * Aquí se definen las reglas del juego: ganar, empatar y generar jugadas aleatorias.
 */

export const checkWinner = (board) => {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // Returns 'X' or 'O'
        }
    }
    return null;
};

export const isBoardFull = (board) => {
    return board.every((cell) => cell !== null);
};

export const getAvailableMoves = (board) => {
    return board
        .map((cell, index) => (cell === null ? index : null))
        .filter((val) => val !== null);
};

export const isTerminal = (board) => {
    return checkWinner(board) !== null || isBoardFull(board);
};

/**
 * FUNCIÓN DE UTILIDAD (Evaluación)
 * Por convención en IA:
 * MAX (X) gana = +1
 * MIN (O) gana = -1
 * Empate = 0
 */
export const getUtility = (board) => {
    const winner = checkWinner(board);
    if (winner === 'X') return 1;
    if (winner === 'O') return -1;
    return 0;
};

/**
 * Generates a random valid board state with a specific number of pieces.
 * Ensures the game is not already won.
 */
export const generateRandomValidBoard = (numPieces = 5) => {
    let attempts = 0;
    while (attempts < 50) {
        attempts++;
        const board = Array(9).fill(null);
        let currentPiece = 'X';
        let movesMade = 0;

        while (movesMade < numPieces) {
            const emptyIndices = getAvailableMoves(board);
            if (emptyIndices.length === 0) break;

            const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            board[randomIdx] = currentPiece;

            // If someone wins during generation, this is an invalid starting board (we want an ongoing game)
            if (checkWinner(board)) {
                break;
            }

            currentPiece = currentPiece === 'X' ? 'O' : 'X';
            movesMade++;
        }

        if (movesMade === numPieces && !checkWinner(board)) {
            return board; // Found a valid mid-game state
        }
    }

    // Fallback if random fails 50 times (very rare hook)
    return [
        'X', null, 'O',
        null, 'X', null,
        'O', null, null
    ];
};
