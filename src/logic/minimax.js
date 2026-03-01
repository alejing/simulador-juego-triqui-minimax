import { isTerminal, getUtility, getAvailableMoves } from './tictactoe';

let nodeIdCounter = 0;

/**
 * Generates the full Minimax search tree from a given initial state.
 * Records the chronological steps of DFS to replay as an animation.
 * 
 * @param {Array} initialBoard 1D array of length 9 with 'X', 'O', or null
 * @param {boolean} isMaxTurn true if it's MAX (X)'s turn, false for MIN (O)
 * @returns {Object} { root, steps, maxDepth, allNodesMap }
 */
export const generateMinimaxTree = (initialBoard, isMaxTurn) => {
    nodeIdCounter = 0;
    const steps = [];
    const allNodesMap = new Map();
    let maxTreeDepth = 0;

    const root = {
        id: `node_root`,
        board: [...initialBoard],
        isMaxPlayer: isMaxTurn,
        turn: isMaxTurn ? 'X' : 'O',
        children: [],
        utility: null,
        bestChildId: null,
        moveIndex: null, // Move that led here from parent
        depth: 0,
        parentId: null
    };

    // DFS recursive tree traversal
    const traverse = (node) => {
        allNodesMap.set(node.id, node);
        if (node.depth > maxTreeDepth) maxTreeDepth = node.depth;

        // Step Event: Visiting a node for the first time
        steps.push({
            type: 'VISIT_NODE',
            nodeId: node.id,
            // Deep clone node data for snapshot at visit time
            nodeSnapshot: { ...node, children: [] },
            message: `[Turno de ${node.isMaxPlayer ? 'MAX' : 'MIN'}]: Evaluando el estado actual del tablero...`
        });

        if (isTerminal(node.board)) {
            node.utility = getUtility(node.board);
            // Step Event: Evaluate leaf
            steps.push({
                type: 'EVALUATE_LEAF',
                nodeId: node.id,
                utility: node.utility,
                message: `[Hoja Terminal]: El juego termina aquí. Se asigna una utilidad estática de ${node.utility > 0 ? '+' : ''}${node.utility} para MAX.`
            });
            return node.utility;
        }

        const availableMoves = getAvailableMoves(node.board);
        let bestUtility = node.isMaxPlayer ? -Infinity : Infinity;
        let bestChildId = null;

        for (let move of availableMoves) {
            const newBoard = [...node.board];
            newBoard[move] = node.turn;

            const childNode = {
                id: `node_${++nodeIdCounter}`,
                board: newBoard,
                isMaxPlayer: !node.isMaxPlayer,
                turn: !node.isMaxPlayer ? 'X' : 'O',
                children: [],
                utility: null,
                bestChildId: null,
                moveIndex: move,
                depth: node.depth + 1,
                parentId: node.id
            };

            node.children.push(childNode);

            // Step Event: Add child connection visually
            steps.push({
                type: 'ADD_CHILD_EDGE',
                parentId: node.id,
                childId: childNode.id,
                message: `[Explorando Opción]: Simulando colocar '${node.turn}' en la casilla ${move}.`
            });

            const childUtility = traverse(childNode);

            // Minimax evaluation rules
            if (node.isMaxPlayer) {
                if (childUtility > bestUtility) {
                    bestUtility = childUtility;
                    bestChildId = childNode.id;
                }
            } else {
                if (childUtility < bestUtility) {
                    bestUtility = childUtility;
                    bestChildId = childNode.id;
                }
            }
        }

        node.utility = bestUtility;
        node.bestChildId = bestChildId;

        // Step Event: After children return, propagate utility upwards
        steps.push({
            type: 'PROPAGATE_UTILITY',
            nodeId: node.id,
            utility: node.utility,
            bestChildId: node.bestChildId,
            message: `[Decisión ${node.isMaxPlayer ? 'MAX' : 'MIN'}]: Tras evaluar todas las ramas, la mejor opción garantiza una utilidad de ${node.utility > 0 ? '+' : ''}${node.utility}. Se propaga hacia arriba.`
        });

        return bestUtility;
    };

    traverse(root);

    return { root, steps, maxDepth: maxTreeDepth, nodes: allNodesMap };
};
