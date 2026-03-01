import React from 'react';
import './TreeNode.css';

/**
 * Renders a single Node (3x3 board) in the SVG Tree
 */
const TreeNode = ({ nodeData, isActive, isEval, utilityValue }) => {
    const { board, isMaxPlayer, turn, utility, bestChildId } = nodeData;

    const playerColor = isMaxPlayer ? 'var(--color-max)' : 'var(--color-min)';

    // Decide utility color
    let utilityClass = 'util-neutral';
    let displayUtil = utilityValue; // ONLY use the simulation-provided utility value to prevent showing ahead of time

    if (displayUtil === 1) utilityClass = 'util-max';
    else if (displayUtil === -1) utilityClass = 'util-min';

    return (
        <div className={`tree-node ${isActive ? 'active-node' : ''} ${isEval ? 'eval-pulse' : ''}`} style={{ borderColor: playerColor }}>

            {/* Turn Indicator */}
            <div className="node-header" style={{ color: playerColor }}>
                {isMaxPlayer ? 'MAX (X)' : 'MIN (O)'}
            </div>

            {/* Mini Board */}
            <div className="mini-board">
                {board.map((cell, i) => (
                    <div key={i} className={`mini-cell ${cell ? `text-${cell.toLowerCase()}` : ''}`}>
                        {cell}
                    </div>
                ))}
            </div>

            {/* Utility Label */}
            {displayUtil !== null && displayUtil !== undefined && (
                <div className={`utility-badge ${utilityClass}`}>
                    {displayUtil > 0 ? `+${displayUtil}` : displayUtil}
                </div>
            )}
        </div>
    );
};

export default TreeNode;
