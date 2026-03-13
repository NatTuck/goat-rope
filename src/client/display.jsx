import { createRoot } from 'react-dom/client';
import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import * as ex from 'excalibur';
import spriteData from '../shared/goat-sprites.json';

function Display() {
  const canvasRef = useRef(null);
  const actorsRef = useRef({});
  const ropesRef = useRef([]);
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    async function init() {
      const engine = new ex.Engine({
        canvasElement: canvas,
        width: 800,
        height: 600,
        backgroundColor: new ex.Color(34, 68, 34)
      });

      const goatImage = new ex.ImageSource('/images/goat-sprites.png');
      await goatImage.load();

      const firstBox = spriteData[0].box;
      const goatSprite = goatImage.createSprite(
        firstBox[0],
        firstBox[1],
        firstBox[2] - firstBox[0],
        firstBox[3] - firstBox[1]
      );

      engine.start();

      const socket = io();

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
              height: 60
            });
            actor.graphics.use(goatSprite);
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
        console.error('ERROR', e.message);
      }
      });

      return () => {
        socket.disconnect();
      };
    }

    init();
  }, []);

  return (
    <>
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
    </>
  );
}

const root = createRoot(document.getElementById('app'));
root.render(<Display />);
