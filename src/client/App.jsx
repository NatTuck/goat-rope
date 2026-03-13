import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import * as ex from 'excalibur';

export default function App() {
  const [route, setRoute] = useState(null);

  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/controller') {
      setRoute('controller');
    } else {
      setRoute('game');
    }
  }, []);

  if (!route) return null;

  if (route === 'controller') {
    return <Controller />;
  }
  return <Game />;
}

function Game() {
  const canvasRef = useRef(null);
  const actorsRef = useRef({});
  const ropesRef = useRef([]);
  const [playerCount, setPlayerCount] = useState(0);
  const logRef = useRef(() => {});

  useEffect(() => {
    const socket = io();
    window.gameSocket = socket;

    logRef.current = (...args) => {
      socket.emit('log', args.map(a => String(a)));
    };

    socket.on('connect', () => {

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const engine = new ex.Engine({
        canvasElement: canvas,
        width: 800,
        height: 600,
        backgroundColor: new ex.Color(34, 68, 34)
      });

      engine.start();

      socket.on('gameState', (state) => {
        try {
          const actors = actorsRef.current;
          
          setPlayerCount(state.players.length);

          const currentIds = new Set(state.players.map(p => p.id));

          Object.keys(actors).forEach(id => {
            if (!currentIds.has(id)) {
              actors[id].kill();
              delete actors[id];
            }
          });

          state.players.forEach(player => {
            let actor = actors[player.id];
            if (!actor) {
              actor = new ex.Actor({
                x: player.x,
                y: player.y,
                width: 60,
                height: 60,
                color: ex.Color.fromHex(player.color.replace('#', ''))
              });
              engine.currentScene.add(actor);
              actors[player.id] = actor;
            }
            actor.pos.x = player.x;
            actor.pos.y = player.y;
          });

          ropesRef.current.forEach(rope => rope.kill());
          ropesRef.current = [];

          state.ropes.forEach(rope => {
              const from = state.players.find(p => p.id === rope.from);
            const to = state.players.find(p => p.id === rope.to);
            if (from && to) {
              const line = new ex.Actor({ x: 400, y: 300, width: 800, height: 600 });
              line.graphics.use(
                new ex.Line({
                  start: new ex.Vector(from.x - 400, from.y - 300),
                  end: new ex.Vector(to.x - 400, to.y - 300),
                  color: ex.Color.fromHex('8b4513'),
                  thickness: 4
                })
              );
              engine.add(line);
              ropesRef.current.push(line);
            }
          });
        } catch (e) {
          logRef.current('ERROR', e.message);
        }
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a3d15'
    }}>
      <canvas ref={canvasRef} width={800} height={600} style={{
        border: '4px solid #4a7c3f',
        borderRadius: '8px',
        background: '#2d5a27'
      }} />
      <div style={{
        marginTop: '20px',
        color: '#8fbc5f',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        {playerCount === 0 ? 'Waiting for players...' : `${playerCount} goat${playerCount !== 1 ? 's' : ''} connected`}
      </div>
      <div style={{
        marginTop: '10px',
        color: '#6a9c4f',
        fontSize: '14px'
      }}>
        Go to /controller on your phone to join!
      </div>
    </div>
  );
}

function Controller() {
  const [goat, setGoat] = useState(null);
  const [connected, setConnected] = useState(false);
  const [inputs, setInputs] = useState({ up: false, down: false, left: false, right: false, rope: false });

  useEffect(() => {
    const socket = io();
    window.socket = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join');
    });

    socket.on('assigned', (data) => {
      setGoat(data);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  function handleInput(dir, pressed) {
    setInputs(prev => ({ ...prev, [dir]: pressed }));
    if (window.socket && window.socket.connected) {
      window.socket.emit('input', { dir, pressed });
    }
  }

  if (!connected) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a3d15',
        color: '#8fbc5f'
      }}>
        Connecting...
      </div>
    );
  }

  if (!goat) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1a3d15',
        color: '#8fbc5f'
      }}>
        Waiting for goat assignment...
      </div>
    );
  }

  const buttonStyle = (active, color) => ({
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: 'none',
    background: active ? color : '#3a6a3a',
    boxShadow: active ? `0 0 20px ${color}` : '0 4px 0 #1a3d15',
    transform: active ? 'translateY(4px)' : 'none',
    transition: 'all 0.1s',
    touchAction: 'manipulation'
  });

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a3d15',
      gap: '20px',
      userSelect: 'none',
      WebkitUserSelect: 'none'
    }}>
      <div style={{
        background: goat.color,
        padding: '15px 30px',
        borderRadius: '20px',
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#fff',
        textShadow: '2px 2px 0 rgba(0,0,0,0.3)'
      }}>
        {goat.name}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <div />
        <button
          style={buttonStyle(inputs.up, goat.color)}
          onTouchStart={() => handleInput('up', true)}
          onTouchEnd={() => handleInput('up', false)}
          onMouseDown={() => handleInput('up', true)}
          onMouseUp={() => handleInput('up', false)}
          onMouseLeave={() => handleInput('up', false)}
        >
          ▲
        </button>
        <div />
        <button
          style={buttonStyle(inputs.left, goat.color)}
          onTouchStart={() => handleInput('left', true)}
          onTouchEnd={() => handleInput('left', false)}
          onMouseDown={() => handleInput('left', true)}
          onMouseUp={() => handleInput('left', false)}
          onMouseLeave={() => handleInput('left', false)}
        >
          ◀
        </button>
        <button
          style={buttonStyle(inputs.down, goat.color)}
          onTouchStart={() => handleInput('down', true)}
          onTouchEnd={() => handleInput('down', false)}
          onMouseDown={() => handleInput('down', true)}
          onMouseUp={() => handleInput('down', false)}
          onMouseLeave={() => handleInput('down', false)}
        >
          ▼
        </button>
        <button
          style={buttonStyle(inputs.right, goat.color)}
          onTouchStart={() => handleInput('right', true)}
          onTouchEnd={() => handleInput('right', false)}
          onMouseDown={() => handleInput('right', true)}
          onMouseUp={() => handleInput('right', false)}
          onMouseLeave={() => handleInput('right', false)}
        >
          ▶
        </button>
      </div>

      <button
        style={{
          width: '120px',
          height: '120px',
          borderRadius: '50%',
          border: 'none',
          background: inputs.rope ? '#8b4513' : '#5a3a1a',
          boxShadow: inputs.rope ? '0 0 30px #8b4513' : '0 6px 0 #2a1a0a',
          transform: inputs.rope ? 'translateY(6px)' : 'none',
          transition: 'all 0.1s',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#fff',
          touchAction: 'manipulation'
        }}
        onTouchStart={() => handleInput('rope', true)}
        onTouchEnd={() => handleInput('rope', false)}
        onMouseDown={() => handleInput('rope', true)}
        onMouseUp={() => handleInput('rope', false)}
        onMouseLeave={() => handleInput('rope', false)}
      >
        ROPE
      </button>

      <div style={{ color: '#6a9c4f', fontSize: '14px', marginTop: '10px' }}>
        Hold ROPE to pull connected goats
      </div>
    </div>
  );
}
