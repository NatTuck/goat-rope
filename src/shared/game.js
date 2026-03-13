export const GOAT_COLORS = ['#e74c3c', '#3498db', '#f39c12', '#9b59b6'];
export const ADJECTIVES = ['Fluffy', 'Spiky', 'Thunder', 'Nugget', 'Bouncy', 'Grumpy', 'Fuzzy', 'Sneaky', 'Chill', 'Zippy', 'Grunty', 'Wobbly'];
export const NOUNS = ['Storm', 'Taco', 'Ninja', 'Captain', 'Pudge', 'Rocket', 'Muffin', 'Blitz', 'Chomp', 'Waffle', 'Zap', 'Bean'];

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const GOAT_SIZE = 60;
export const ROPE_RANGE = 150;
export const ROPE_PULL_FORCE = 3;
export const MOVE_SPEED = 4;

export function generateName() {
  const adj = ADJECTIVES[0];
  const noun = NOUNS[0];
  return `${adj} ${noun}`;
}

export function createGame() {
  return {
    players: {},
    ropes: []
  };
}

export function createPlayer(id, x, y, color, name) {
  return {
    id,
    x,
    y,
    color,
    name,
    inputs: { up: false, down: false, left: false, right: false, rope: false },
    ropeTarget: null
  };
}

export function getGameState(game) {
  return {
    players: Object.values(game.players).map(p => ({
      id: p.id,
      x: p.x,
      y: p.y,
      color: p.color,
      name: p.name,
      ropeTarget: p.ropeTarget
    })),
    ropes: game.ropes
  };
}

export function addPlayer(game, id, color, name) {
  const x = GAME_WIDTH / 2;
  const y = GAME_HEIGHT / 2;
  game.players[id] = createPlayer(id, x, y, color, name);
  return game.players[id];
}

export function setInput(game, playerId, direction, pressed) {
  const player = game.players[playerId];
  if (player && player.inputs.hasOwnProperty(direction)) {
    player.inputs[direction] = pressed;
  }
}

export function updateGame(game) {
  const playerIds = Object.keys(game.players);

  playerIds.forEach(id => {
    const p = game.players[id];
    if (!p) return;

    if (p.inputs.left) p.x -= MOVE_SPEED;
    if (p.inputs.right) p.x += MOVE_SPEED;
    if (p.inputs.up) p.y -= MOVE_SPEED;
    if (p.inputs.down) p.y += MOVE_SPEED;

    p.x = Math.max(GOAT_SIZE / 2, Math.min(GAME_WIDTH - GOAT_SIZE / 2, p.x));
    p.y = Math.max(GOAT_SIZE / 2, Math.min(GAME_HEIGHT - GOAT_SIZE / 2, p.y));

    if (p.inputs.rope && !p.ropeTarget) {
      let closest = null;
      let closestDist = ROPE_RANGE;

      playerIds.forEach(otherId => {
        if (otherId === id) return;
        const other = game.players[otherId];
        if (!other) return;
        if (other.ropeTarget === id) return;

        const dx = other.x - p.x;
        const dy = other.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < closestDist) {
          closestDist = dist;
          closest = otherId;
        }
      });

      if (closest) {
        p.ropeTarget = closest;
        game.players[closest].ropeTarget = id;
        game.ropes.push({ from: id, to: closest });
      }
    }

    if (!p.inputs.rope && p.ropeTarget) {
      const target = game.players[p.ropeTarget];
      if (target) {
        target.ropeTarget = null;
      }
      p.ropeTarget = null;
      game.ropes = game.ropes.filter(r =>
        !(r.from === id || r.to === id)
      );
    }
  });

  playerIds.forEach(id => {
    const p = game.players[id];
    if (!p || !p.ropeTarget) return;

    const target = game.players[p.ropeTarget];
    if (!target) return;

    const dx = target.x - p.x;
    const dy = target.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 30) {
      const pull = ROPE_PULL_FORCE;
      const nx = dx / dist;
      const ny = dy / dist;

      p.x += nx * pull;
      p.y += ny * pull;
      target.x -= nx * pull;
      target.y -= ny * pull;
    }
  });

  return game;
}

export function removePlayer(game, id) {
  game.ropes = game.ropes.filter(r => r.from !== id && r.to !== id);
  delete game.players[id];
  Object.values(game.players).forEach(p => {
    if (p.ropeTarget === id) {
      p.ropeTarget = null;
    }
  });
  return game;
}
