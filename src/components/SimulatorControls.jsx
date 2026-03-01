import React from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';

const SimulatorControls = ({ currentStep, totalSteps, onPlay, onPause, onNext, onPrev, isPlaying, onReset, hasGenerated, playbackSpeed, onSpeedChange }) => {
    if (!hasGenerated) return null;

    return (
        <div className="flex-col gap-1" style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Controles de Simulación</h3>
            <div className="flex-row gap-1" style={{ justifyContent: 'space-between' }}>
                <button onClick={onPrev} disabled={currentStep === 0 || isPlaying} style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0.5rem' }} title="Atrás">
                    <SkipBack size={18} />
                </button>
                {isPlaying ? (
                    <button onClick={onPause} style={{ flex: 1, backgroundColor: 'var(--accent-danger)', color: 'white', borderColor: 'var(--accent-danger)', display: 'flex', justifyContent: 'center', padding: '0.5rem' }} title="Pausar">
                        <Pause size={18} />
                    </button>
                ) : (
                    <button onClick={onPlay} disabled={currentStep >= totalSteps} style={{ flex: 1, backgroundColor: 'var(--accent-success)', color: 'white', borderColor: 'var(--accent-success)', display: 'flex', justifyContent: 'center', padding: '0.5rem' }} title="Iniciar">
                        <Play size={18} fill="currentColor" />
                    </button>
                )}
                <button onClick={onNext} disabled={currentStep >= totalSteps || isPlaying} style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0.5rem' }} title="Siguiente">
                    <SkipForward size={18} />
                </button>
            </div>
            <button onClick={onReset} style={{ marginTop: '0.5rem', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <RotateCcw size={16} /> Reiniciar Visuales
            </button>

            {/* Speed Control */}
            <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Velocidad</span>
                    <span>{playbackSpeed}x</span>
                </div>
                <input
                    type="range"
                    min="0.2" max="3" step="0.2"
                    value={playbackSpeed}
                    onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: 'var(--accent-primary)', cursor: 'ew-resize' }}
                />
            </div>

            {/* Progress Bar */}
            <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    <span>Progreso</span>
                    <span>{currentStep} / {totalSteps}</span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-panel)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0}%`,
                        height: '100%',
                        backgroundColor: 'var(--accent-primary)',
                        transition: 'width 0.2s ease-out'
                    }} />
                </div>
            </div>
        </div>
    );
};

export default SimulatorControls;
