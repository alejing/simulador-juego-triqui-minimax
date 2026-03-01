import React, { useState, useMemo, useEffect } from 'react';
import './index.css';
import Configurator from './components/Configurator';
import SimulatorControls from './components/SimulatorControls';
import TreeViewer from './components/TreeViewer';
import NarratorPanel from './components/NarratorPanel';
import { generateMinimaxTree } from './logic/minimax';

function App() {
  // Configurator state - pre-fill some moves so tree isn't massive
  const [board, setBoard] = useState([
    'O', 'O', 'X',
    null, 'X', null,
    'O', 'X', null
  ]);
  const [isMaxTurn, setIsMaxTurn] = useState(true);

  // Simulation engine state
  const [treeData, setTreeData] = useState(null);
  const [simulationSteps, setSimulationSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Playback loop effect
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

  // Derived Node States by walking up to 'currentStep'
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
    if (treeData) return; // Lock board once tree is generated
    setBoard(prev => {
      const newBoard = [...prev];
      const current = newBoard[index];
      if (current === null) newBoard[index] = 'X';
      else if (current === 'X') newBoard[index] = 'O';
      else newBoard[index] = null;
      return newBoard;
    });
  };

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
    // Generate Tree logic
    const { root, steps, nodes } = generateMinimaxTree(board, isMaxTurn);
    setTreeData(root);
    setSimulationSteps(steps);
    setCurrentStep(0);
    setIsPlaying(false);
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
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="flex-row gap-2">
          <h1>Simulador de Minimax</h1>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', backgroundColor: 'var(--bg-panel)', padding: '4px 10px', borderRadius: '12px' }}>
            Triqui (Tres en raya)
          </span>
        </div>
        {treeData && (
          <button style={{ backgroundColor: 'transparent', border: '1px solid var(--border-color)' }} onClick={handleClearTree}>
            Editar Estado Inicial
          </button>
        )}
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <Configurator
            board={board}
            onCellChange={handleCellChange}
            isMaxTurn={isMaxTurn}
            onTurnChange={setIsMaxTurn}
            onGenerate={handleGenerate}
            isValid={isValid}
            validationMsg={validationMsg}
          />

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
        </aside>

        <section className="sim-area">
          {!treeData ? (
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '3rem', opacity: 0.2 }}>🌳</div>
              <p>Configura el estado inicial y haz clic en "Generar Árbol Minimax"</p>
            </div>
          ) : (
            <>
              <TreeViewer
                treeData={treeData}
                nodeStates={nodeStates}
                activeNodeId={activeNodeId}
                propagatingNodeId={propagatingNodeId}
              />
              <NarratorPanel steps={simulationSteps} currentStep={currentStep} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
