import React from 'react';
import './InitialBoard.css';

/**
 * Interactive 3x3 board to set the initial state.
 * Clicks cycle through: null -> 'X' -> 'O' -> null
 */
const InitialBoard = ({ board, onCellChange }) => {
    return (
        <div className="initial-board">
            {board.map((cell, index) => (
                <div
                    key={index}
                    className={`board-cell ${cell ? `cell-${cell.toLowerCase()}` : ''}`}
                    onClick={() => onCellChange(index)}
                >
                    {cell}
                </div>
            ))}
        </div>
    );
};

export default InitialBoard;
