/**
 * Tic-Tac-Toe Game Logic Functions
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
 * Utility evaluation function.
 * By convention: MAX (X) win = +1, MIN (O) win = -1, Draw = 0.
 */
export const getUtility = (board) => {
    const winner = checkWinner(board);
    if (winner === 'X') return 1;
    if (winner === 'O') return -1;
    return 0;
};
