import React, { useState, useMemo, useEffect } from 'react';
import './index.css';
import Configurator from './components/Configurator';
import SimulatorControls from './components/SimulatorControls';
import TreeViewer from './components/TreeViewer';
import NarratorPanel from './components/NarratorPanel';
import { generateMinimaxTree } from './logic/minimax';
import { isTerminal, getUtility, generateRandomValidBoard } from './logic/tictactoe';

/**
 * CONSTANTES DE MODO DE APLICACIÓN
 * Determinan qué interfaz y lógica se muestra al usuario.
 */
const MODE_SETUP = 'setup';       // Configuración del tablero inicial
const MODE_SIMULATE = 'simulate'; // Visualización del árbol Minimax
const MODE_PLAY = 'play';         // Modo partida real contra la IA

function App() {
  /**
   * ESTADO DEL JUEGO Y TABLERO
   */
  const [board, setBoard] = useState([
    'O', 'O', 'X',
    null, 'X', null,
    'O', 'X', null
  ]);
  const [isMaxTurn, setIsMaxTurn] = useState(false); // O's turn (3 Xs, 3 Os)

  // App view state
  const [appMode, setAppMode] = useState(MODE_SETUP);

  // Interactive Play State
  const [humanSymbol, setHumanSymbol] = useState('X');
  const [gameResult, setGameResult] = useState(null); // null, 'X', 'O', 'Draw'
  const [waitingForAnimation, setWaitingForAnimation] = useState(false);
  const [aiBestMove, setAiBestMove] = useState(null);
  const [showApplyMoveBtn, setShowApplyMoveBtn] = useState(false);

  /**
   * ESTADO DE LA SIMULACIÓN
   * Controla la reproducción del árbol (pasos, velocidad, reproducción automática).
   */
  const [treeData, setTreeData] = useState(null);
  const [simulationSteps, setSimulationSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  /**
   * EFECTO DE REPRODUCCIÓN (Playback Loop)
   * Este useEffect maneja el avance automático de los pasos de la simulación.
   */
  useEffect(() => {
    let interval;
    if (isPlaying && currentStep < simulationSteps.length) {
      interval = setInterval(() => {
        setCurrentStep(prev => prev + 1);
      }, 500 / playbackSpeed); // Dynamic speed step delay
    } else if (isPlaying && currentStep >= simulationSteps.length) {
      setIsPlaying(false);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentStep, simulationSteps.length, playbackSpeed]);

  /**
   * ESTADOS DERIVADOS DEL ÁRBOL
   * Calcula qué nodos son visibles o están activos basándose en 'currentStep'.
   * Esto permite "viajar en el tiempo" por la ejecución del algoritmo.
   */
  const { nodeStates, activeNodeId, propagatingNodeId } = useMemo(() => {
    const states = {};
    let activeId = null;
    let propId = null;

    if (!treeData) return { nodeStates: states, activeNodeId: null, propagatingNodeId: null };

    // Set root as visible initially
    states['node_root'] = { visible: true, utility: null, bestChildId: null };

    for (let i = 0; i < currentStep; i++) {
      const step = simulationSteps[i];
      if (!step) continue;

      if (step.type === 'VISIT_NODE') {
        if (!states[step.nodeId]) states[step.nodeId] = { visible: true, utility: null, bestChildId: null };
        states[step.nodeId].visible = true;
        activeId = step.nodeId;
        propId = null;
      }
      else if (step.type === 'EVALUATE_LEAF') {
        if (states[step.nodeId]) states[step.nodeId].utility = step.utility;
        propId = step.nodeId;
      }
      else if (step.type === 'ADD_CHILD_EDGE') {
        if (!states[step.childId]) states[step.childId] = { visible: true, utility: null, bestChildId: null };
      }
      else if (step.type === 'PROPAGATE_UTILITY') {
        if (states[step.nodeId]) {
          states[step.nodeId].utility = step.utility;
          states[step.nodeId].bestChildId = step.bestChildId;
        }
        propId = step.nodeId;
        activeId = step.nodeId;
      }
    }

    return { nodeStates: states, activeNodeId: activeId, propagatingNodeId: propId };
  }, [treeData, simulationSteps, currentStep]);

  const handleCellChange = (index) => {
    if (appMode !== MODE_SETUP) return;
    setBoard(prev => {
      const newBoard = [...prev];
      const current = newBoard[index];
      if (current === null) newBoard[index] = 'X';
      else if (current === 'X') newBoard[index] = 'O';
      else newBoard[index] = null;
      return newBoard;
    });
  };

  const checkGameResult = (currentBoard) => {
    if (isTerminal(currentBoard)) {
      const utility = getUtility(currentBoard);
      if (utility === 1) return 'X';
      if (utility === -1) return 'O';
      return 'Draw';
    }
    return null;
  };

  /**
   * LÓGICA DE JUEGO (MODO PLAY)
   * Maneja el turno del humano y prepara la respuesta de la IA.
   */
  const handleHumanPlay = (index) => {
    if (appMode !== MODE_PLAY || waitingForAnimation || gameResult || board[index] !== null) return;

    // 1. Human makes a move
    const newBoard = [...board];
    newBoard[index] = humanSymbol;
    setBoard(newBoard);

    // Check if human won (shouldn't happen against perfect minimax, but good to have)
    const result = checkGameResult(newBoard);
    if (result) {
      setGameResult(result);
      return;
    }

    // 2. Prepare AI turn
    // AI is 'X' if human is 'O', else AI is 'O'. Wait... 
    // In our minimax, MAX is always 'X', MIN is 'O'.
    const isAiMax = humanSymbol === 'O';
    setIsMaxTurn(isAiMax); // It's now AI's turn

    // 3. Generate simulation for AI thought process
    const { root, steps } = generateMinimaxTree(newBoard, isAiMax);

    // The best move for the root node is its 'bestChildId'. We need to extract the 'moveIndex' from that child.
    const bestChild = root.children.find(c => c.id === root.bestChildId);
    setAiBestMove(bestChild ? bestChild.moveIndex : null);
    setShowApplyMoveBtn(false);

    setTreeData(root);
    setSimulationSteps(steps);
    setCurrentStep(0);
    setWaitingForAnimation(true);
    setIsPlaying(true);
    setPlaybackSpeed(1.5); // Fast forward AI thought slightly
  };

  // Watch for AI animation to finish
  useEffect(() => {
    if (appMode === MODE_PLAY && waitingForAnimation && currentStep >= simulationSteps.length && !isPlaying) {
      if (aiBestMove !== null) {
        // Animation finished, prompt user to manually apply the move
        setShowApplyMoveBtn(true);
      } else {
        setWaitingForAnimation(false);
      }
    } else {
      setShowApplyMoveBtn(false);
    }
  }, [appMode, waitingForAnimation, currentStep, simulationSteps.length, isPlaying, aiBestMove]);

  const handleApplyAiMove = () => {
    setBoard(prev => {
      const nextBoard = [...prev];
      const aiSymbol = humanSymbol === 'X' ? 'O' : 'X';
      nextBoard[aiBestMove] = aiSymbol;

      // Check if AI won
      const result = checkGameResult(nextBoard);
      if (result) setGameResult(result);

      return nextBoard;
    });
    setWaitingForAnimation(false);
    setShowApplyMoveBtn(false);
    setTreeData(null); // Clear tree to return to board view
  };

  /**
   * VALIDACIÓN DEL TABLERO
   * Evita estados imposibles o árboles demasiado grandes para el navegador.
   */
  const { isValid, validationMsg } = useMemo(() => {
    let xCount = 0;
    let oCount = 0;
    let emptyCount = 0;
    board.forEach(cell => {
      if (cell === 'X') xCount++;
      else if (cell === 'O') oCount++;
      else emptyCount++;
    });

    if (Math.abs(xCount - oCount) > 1) {
      return { isValid: false, validationMsg: "Tablero inválido: La diferencia entre fichas X y O no puede ser mayor a 1." };
    }
    if (emptyCount > 6) {
      return { isValid: false, validationMsg: "Por favor coloca al menos 3 fichas para evitar congelar el navegador generando árboles gigantes (máximo 6 casillas vacías)." };
    }
    return { isValid: true, validationMsg: "" };
  }, [board]);

  const handleGenerate = () => {
    const { root, steps } = generateMinimaxTree(board, isMaxTurn);
    setTreeData(root);
    setSimulationSteps(steps);
    setCurrentStep(0);
    setIsPlaying(false);
    setAppMode(MODE_SIMULATE);
  };

  const handleStartPlayMode = (playerSymbol) => {
    setHumanSymbol(playerSymbol);

    // Generate a mid-game board with 6 random valid moves 
    // This leaves 3 empty spaces (even smaller tree!)
    const initialBoard = generateRandomValidBoard(6);
    setBoard(initialBoard);

    setGameResult(null);
    setTreeData(null);
    setAppMode(MODE_PLAY);
    setWaitingForAnimation(false);
    setShowApplyMoveBtn(false);

    // If initial board has 5 moves (3 X's, 2 O's), and Human wants to be 'O',
    // then 'O' should play next. But wait, Human is O, so Human plays.
    // If Human wants to be 'X', it's 'O's turn (AI). 
    // Wait, to keep it simple, if 5 moves are made, 3 are X, 2 are O.
    // It is ALWAYS O's turn to play the 6th move.

    const xCount = initialBoard.filter(c => c === 'X').length;
    const oCount = initialBoard.filter(c => c === 'O').length;

    // The player whose turn it is in the randomly generated board
    const nextPlayerTurn = xCount > oCount ? 'O' : 'X';

    if (playerSymbol !== nextPlayerTurn) {
      // It's the AI's turn to play first on this random board
      const isAiMax = playerSymbol === 'O'; // AI is X = MAX
      setIsMaxTurn(isAiMax);
      setWaitingForAnimation(true);

      const { root, steps } = generateMinimaxTree(initialBoard, isAiMax);
      const bestChild = root.children.find(c => c.id === root.bestChildId);
      setAiBestMove(bestChild ? bestChild.moveIndex : null);

      setTreeData(root);
      setSimulationSteps(steps);
      setCurrentStep(0);
      setIsPlaying(true);
      setPlaybackSpeed(1.5);
      setShowApplyMoveBtn(false);
    } else {
      // It is the Human's turn corresponding to the board state
      setIsMaxTurn(playerSymbol === 'X'); // if human is X, it's MAX turn
    }
  };

  const handleResetVisuals = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleClearTree = () => {
    setTreeData(null);
    setSimulationSteps([]);
    setCurrentStep(0);
    setIsPlaying(false);
    setAppMode(MODE_SETUP);
  };

  /**
   * RENDERIZADO DE LA INTERFAZ
   */
  return (
    <div className="app-container">
      <header className="header">
        <div className="flex-row gap-2">
          <h1>Simulador del juego triqui con IA</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', backgroundColor: 'var(--bg-panel)', padding: '4px 10px', borderRadius: '12px' }}>
            Minimax {appMode === MODE_PLAY && "- Modo Juego"}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className={appMode === MODE_SETUP || appMode === MODE_SIMULATE ? "primary" : ""}
            style={appMode === MODE_PLAY ? { backgroundColor: 'transparent', border: '1px solid var(--border-color)' } : {}}
            onClick={handleClearTree}
          >
            Modo Análisis (Simulador)
          </button>
          <button
            className={appMode === MODE_PLAY ? "primary" : ""}
            style={appMode !== MODE_PLAY ? { backgroundColor: 'transparent', border: '1px solid var(--border-color)' } : {}}
            onClick={() => handleStartPlayMode('X')}
          >
            Jugar contra IA
          </button>
        </div>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          {appMode !== MODE_PLAY && (
            <Configurator
              board={board}
              onCellChange={handleCellChange}
              isMaxTurn={isMaxTurn}
              onTurnChange={setIsMaxTurn}
              onGenerate={handleGenerate}
              isValid={isValid}
              validationMsg={validationMsg}
            />
          )}

          {appMode === MODE_PLAY && (
            <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="panel-header"><h2>🕹️ Partida Activa</h2></div>
              <div style={{ padding: '0 1rem 1rem' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Juegas como <strong>{humanSymbol}</strong>.
                  <br /><span style={{ fontSize: '0.85rem' }}>El tablero inicializa aleatoriamente para mantener el árbol de decisiones visualmente manejable.</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button onClick={() => handleStartPlayMode('X')} style={{ width: '100%', backgroundColor: humanSymbol === 'X' ? 'var(--accent-primary)' : 'var(--bg-body)' }}>Jugar como X</button>
                  <button onClick={() => handleStartPlayMode('O')} style={{ width: '100%', backgroundColor: humanSymbol === 'O' ? 'var(--accent-primary)' : 'var(--bg-body)' }}>Jugar como O</button>
                </div>
              </div>
            </div>
          )}

          {(appMode === MODE_SIMULATE || (appMode === MODE_PLAY && waitingForAnimation)) && (
            <SimulatorControls
              hasGenerated={!!treeData}
              currentStep={currentStep}
              totalSteps={simulationSteps.length}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onNext={() => setCurrentStep(prev => Math.min(prev + 1, simulationSteps.length))}
              onPrev={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
              onReset={handleResetVisuals}
              playbackSpeed={playbackSpeed}
              onSpeedChange={setPlaybackSpeed}
            />
          )}
        </aside>

        <section className="sim-area">
          {appMode === MODE_SETUP && (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '3rem', opacity: 0.2 }}>🌳</div>
              <p>Configura el estado inicial y haz clic en "Generar Árbol Minimax"</p>
            </div>
          )}

          {(appMode === MODE_SIMULATE || (appMode === MODE_PLAY && waitingForAnimation)) && treeData && (
            <>
              <TreeViewer
                treeData={treeData}
                nodeStates={nodeStates}
                activeNodeId={activeNodeId}
                propagatingNodeId={propagatingNodeId}
              />
              <NarratorPanel steps={simulationSteps} currentStep={currentStep} />

              {showApplyMoveBtn && (
                <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 1000 }}>
                  <button
                    className="primary"
                    style={{ fontSize: '1.2rem', padding: '1rem 2rem', boxShadow: '0 8px 30px rgba(99, 102, 241, 0.4)', animation: 'pulse 2s infinite' }}
                    onClick={handleApplyAiMove}
                  >
                    🚀 Aplicar Jugada de la IA al Tablero
                  </button>
                </div>
              )}
            </>
          )}

          {appMode === MODE_PLAY && !waitingForAnimation && (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <div style={{ height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, color: gameResult ? (gameResult === 'Draw' ? 'var(--text-muted)' : 'var(--accent-success)') : 'var(--text-primary)' }}>
                  {gameResult ? (gameResult === 'Draw' ? '¡Empate!' : `¡Ganó ${gameResult}!`) : 'Tu Turno'}
                </h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 120px)', gridTemplateRows: 'repeat(3, 120px)', gap: '10px', backgroundColor: 'var(--border-color)', padding: '10px', borderRadius: '12px' }}>
                {board.map((cell, i) => (
                  <div
                    key={i}
                    onClick={() => handleHumanPlay(i)}
                    style={{
                      backgroundColor: 'var(--bg-panel)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '4rem',
                      fontWeight: 'bold',
                      color: cell === 'X' ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                      cursor: (cell === null && !gameResult) ? 'pointer' : 'default',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => { if (cell === null && !gameResult) e.target.style.backgroundColor = 'var(--bg-body)' }}
                    onMouseLeave={(e) => { if (cell === null && !gameResult) e.target.style.backgroundColor = 'var(--bg-panel)' }}
                  >
                    {cell}
                  </div>
                ))}
              </div>
              <div style={{ height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1rem' }}>
                {gameResult && (
                  <button className="primary" onClick={() => handleStartPlayMode(humanSymbol)}>
                    Jugar de Nuevo
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
