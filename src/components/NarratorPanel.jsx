import React, { useEffect, useRef, useState } from 'react';
import { MessageSquare, ChevronDown } from 'lucide-react';

const NarratorPanel = ({ steps, currentStep }) => {
    const endOfMessagesRef = useRef(null);
    const [isMinimized, setIsMinimized] = useState(false);

    // Draggable logic
    const [position, setPosition] = useState({
        x: window.innerWidth > 800 ? window.innerWidth - 370 : 20,
        y: 80
    });
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPos = useRef({ x: 0, y: 0 });

    // Handle window resize to keep it on screen
    useEffect(() => {
        const handleResize = () => {
            setPosition(prev => ({
                x: Math.min(prev.x, window.innerWidth - 350),
                y: Math.min(prev.y, window.innerHeight - 50)
            }));
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMouseDown = (e) => {
        // Prevent drag if clicking on the scrollbar or inside the message area
        if (e.target.closest('.narrator-messages')) return;

        setIsDragging(true);
        dragStartPos.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        };
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;

        const newX = e.clientX - dragStartPos.current.x;
        const newY = e.clientY - dragStartPos.current.y;

        // Boundaries
        const boundedX = Math.max(0, Math.min(newX, window.innerWidth - (isMinimized ? 200 : 350)));
        const boundedY = Math.max(0, Math.min(newY, window.innerHeight - 50));

        setPosition({ x: boundedX, y: boundedY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    // Filter to get only the messages up to the current step
    const visibleSteps = steps.slice(0, currentStep + 1).filter(step => step && step.message);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (endOfMessagesRef.current) {
            endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [visibleSteps.length]);

    if (visibleSteps.length === 0) return null;

    return (
        <div style={{
            position: 'fixed',
            left: `${position.x}px`,
            top: `${position.y}px`,
            width: isMinimized ? 'auto' : '350px',
            maxHeight: isMinimized ? 'auto' : '300px',
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: isMinimized ? '0.5rem 1rem' : '1rem',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 100,
            overflow: 'hidden',
            fontFamily: 'monospace',
            fontSize: '0.85rem',
            transition: isDragging ? 'none' : 'width 0.3s ease, height 0.3s ease, padding 0.3s ease',
            userSelect: 'none' // Prevent text selection during drag
        }}>
            <div
                style={{
                    color: 'var(--accent-primary)',
                    fontWeight: 'bold',
                    marginBottom: isMinimized ? '0' : '8px',
                    borderBottom: isMinimized ? 'none' : '1px solid var(--border-color)',
                    paddingBottom: isMinimized ? '0' : '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    userSelect: 'none'
                }}
                onMouseDown={handleMouseDown}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MessageSquare size={16} /> Narrador Lógico
                </div>
                <div
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent drag mousedown when clicking toggle
                        setIsMinimized(!isMinimized);
                    }}
                    style={{ cursor: 'pointer', padding: '0 4px' }}
                    title={isMinimized ? "Mostrar Narrador" : "Ocultar Narrador"}
                >
                    {!isMinimized && <ChevronDown size={16} />}
                </div>
            </div>

            {!isMinimized && (
                <div
                    className="narrator-messages"
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        cursor: 'text',
                        userSelect: 'text',
                        overflowY: 'auto',
                        flex: 1,
                        minHeight: 0,
                        paddingRight: '4px'
                    }}
                >
                    {visibleSteps.map((step, index) => {
                        const isLast = index === visibleSteps.length - 1;
                        return (
                            <div key={index} style={{
                                color: isLast ? 'var(--text-primary)' : 'var(--text-muted)',
                                opacity: isLast ? 1 : 0.6,
                                transition: 'all 0.3s ease'
                            }}>
                                {`> ${step.message}`}
                            </div>
                        );
                    })}
                    <div ref={endOfMessagesRef} />
                </div>
            )}
        </div>
    );
};

export default NarratorPanel;
