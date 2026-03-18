import { isTerminal, getUtility, getAvailableMoves } from './tictactoe';

let nodeIdCounter = 0;

/**
 * GENERADOR DEL ÁRBOL MINIMAX
 * Esta función es el corazón de la IA. Realiza una búsqueda en profundidad (DFS)
 * y registra cada paso para que podamos animarlo después en la interfaz.
 * 
 * @param {Array} initialBoard Tablero actual (arreglo de 9 posiciones)
 * @param {boolean} isMaxTurn ¿Es el turno de MAX (X)?
 * @returns {Object} El árbol generado y la lista de pasos cronológicos.
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

    // Función recursiva para recorrer el árbol (DFS)
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

        // REGLA DE PARADA: ¿Es un estado terminal (ganador o empate)?
        if (isTerminal(node.board)) {
            // Asignamos la "Utilidad" estática (puntos) del estado final
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

        // Si no es terminal, generamos todos los estados posibles siguientes
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

            // REGLA MINIMAX: 
            // - Si soy MAX (X), busco el hijo con la mayor utilidad.
            // - Si soy MIN (O), busco el hijo con la menor utilidad.
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
