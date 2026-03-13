import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

let globalSocket = null;

function Controller() {
  const [goat, setGoat] = useState(null);
  const [connected, setConnected] = useState(false);
  const [inputs, setInputs] = useState({ up: false, down: false, left: false, right: false, rope: false });

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io();
    }

    globalSocket.on('connect', () => {
      setConnected(true);
      globalSocket.emit('join');
    });

    globalSocket.on('disconnect', () => {
      setConnected(false);
    });

    globalSocket.on('assigned', (data) => {
      setGoat(data);
    });
  }, []);

  function handleInput(dir, pressed) {
    setInputs(prev => ({ ...prev, [dir]: pressed }));
    if (globalSocket) {
      globalSocket.emit('input', { dir, pressed });
    }
  }

  if (!connected) {
    return <div className="connecting">Connecting...</div>;
  }

  if (!goat) {
    return <div className="connecting">Waiting for goat assignment...</div>;
  }

  return (
    <>
      <div className="goat-name" style={{ '--goat-color': goat.color }}>
        {goat.name}
      </div>

      <div className="controls">
        <div />
        <button
          className={`btn ${inputs.up ? 'active' : ''}`}
          style={{ '--goat-color': goat.color }}
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
          className={`btn ${inputs.left ? 'active' : ''}`}
          style={{ '--goat-color': goat.color }}
          onTouchStart={() => handleInput('left', true)}
          onTouchEnd={() => handleInput('left', false)}
          onMouseDown={() => handleInput('left', true)}
          onMouseUp={() => handleInput('left', false)}
          onMouseLeave={() => handleInput('left', false)}
        >
          ◀
        </button>
        <button
          className={`btn ${inputs.down ? 'active' : ''}`}
          style={{ '--goat-color': goat.color }}
          onTouchStart={() => handleInput('down', true)}
          onTouchEnd={() => handleInput('down', false)}
          onMouseDown={() => handleInput('down', true)}
          onMouseUp={() => handleInput('down', false)}
          onMouseLeave={() => handleInput('down', false)}
        >
          ▼
        </button>
        <button
          className={`btn ${inputs.right ? 'active' : ''}`}
          style={{ '--goat-color': goat.color }}
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
        className={`rope-btn ${inputs.rope ? 'active' : ''}`}
        onTouchStart={() => handleInput('rope', true)}
        onTouchEnd={() => handleInput('rope', false)}
        onMouseDown={() => handleInput('rope', true)}
        onMouseUp={() => handleInput('rope', false)}
        onMouseLeave={() => handleInput('rope', false)}
      >
        ROPE
      </button>

      <div className="hint">Hold ROPE to pull connected goats</div>
    </>
  );
}

const root = createRoot(document.getElementById('app'));
root.render(<Controller />);
