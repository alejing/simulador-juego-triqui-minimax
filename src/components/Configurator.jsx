import React from 'react';
import InitialBoard from './InitialBoard';

const Configurator = ({ board, onCellChange, isMaxTurn, onTurnChange, onGenerate, isValid, validationMsg }) => {
    return (
        <div className="configurator">
            <section>
                <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>Estado Inicial</h2>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                    <InitialBoard board={board} onCellChange={onCellChange} />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Primer Turno</label>
                    <div className="flex-row gap-1">
                        <button
                            className={isMaxTurn ? 'active-max' : ''}
                            onClick={() => onTurnChange(true)}
                            style={isMaxTurn ? { backgroundColor: 'var(--color-max)', color: '#000', borderColor: 'var(--color-max)' } : {}}
                        >
                            MAX (X)
                        </button>
                        <button
                            className={!isMaxTurn ? 'active-min' : ''}
                            onClick={() => onTurnChange(false)}
                            style={!isMaxTurn ? { backgroundColor: 'var(--color-min)', color: '#000', borderColor: 'var(--color-min)' } : {}}
                        >
                            MIN (O)
                        </button>
                    </div>
                </div>

                {!isValid && (
                    <div style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', marginBottom: '1rem', padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px' }}>
                        {validationMsg}
                    </div>
                )}
            </section>

            <section>
                <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-muted)' }}>Motor de Simulación</h2>
                <div className="flex-col gap-1">
                    <button
                        disabled={!isValid}
                        onClick={onGenerate}
                        style={{
                            padding: '0.75rem',
                            fontWeight: '600',
                            backgroundColor: isValid ? 'var(--accent-primary)' : 'var(--bg-panel)',
                            color: isValid ? 'white' : 'var(--text-muted)'
                        }}
                    >
                        Generar Árbol Minimax
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Configurator;
