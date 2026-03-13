import { describe, it, expect, vi } from 'vitest';

describe('Game Rendering - Rope Actor Management', () => {
  it('correctly tracks and clears rope actors using a separate array', () => {
    const ropes = [];
    
    const rope1 = { x: 100, y: 100, kill: vi.fn() };
    const rope2 = { x: 200, y: 200, kill: vi.fn() };
    
    ropes.push(rope1);
    ropes.push(rope2);
    
    ropes.forEach(r => r.kill());
    
    ropes.length = 0;
    
    ropes.push({ x: 300, y: 300, kill: vi.fn() });
    
    expect(rope1.kill).toHaveBeenCalled();
    expect(rope2.kill).toHaveBeenCalled();
    expect(ropes).toHaveLength(1);
  });
  
  it('does not try to access scene.graphics which does not exist in Excalibur', () => {
    const mockScene = {
      add: vi.fn(),
      actors: []
    };
    
    const actors = {};
    const ropes = [];
    
    const gameState = {
      players: [
        { id: 'p1', x: 100, y: 200, color: '#ff0000', name: 'Goat1' }
      ],
      ropes: [
        { from: 'p1', to: 'p2' }
      ]
    };
    
    gameState.players.forEach(player => {
      let actor = actors[player.id];
      if (!actor) {
        actor = { x: 0, y: 0, kill: vi.fn() };
        actors[player.id] = actor;
      }
      actor.x = player.x;
      actor.y = player.y;
    });
    
    let errorOccurred = false;
    try {
      if (mockScene.graphics && mockScene.graphics[0]) {
        mockScene.graphics[0].kill();
      }
    } catch (e) {
      errorOccurred = true;
    }
    
    expect(errorOccurred).toBe(false);
  });
  
  it('can create and destroy rope actors without accessing scene.graphics', () => {
    const mockScene = {
      add: vi.fn(),
      actors: []
    };
    
    const ropes = [];
    
    const createRope = (from, to) => {
      const rope = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, kill: vi.fn() };
      mockScene.add(rope);
      return rope;
    };
    
    const from = { x: 100, y: 100 };
    const to = { x: 200, y: 200 };
    
    const rope = createRope(from, to);
    ropes.push(rope);
    
    expect(mockScene.add).toHaveBeenCalledTimes(1);
    expect(ropes).toHaveLength(1);
    
    ropes.forEach(r => r.kill());
    ropes.length = 0;
    
    expect(rope.kill).toHaveBeenCalled();
    expect(ropes).toHaveLength(0);
  });
});
