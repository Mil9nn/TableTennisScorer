// Manual test to verify the commentary fix works
// This simulates the exact data structure from simple tracking mode

const mockShot = {
  _id: 'test-123',
  player: { _id: 'player1', fullName: 'John Doe' },
  side: 'side1',
  stroke: null, // Simple tracking - no stroke
  server: { _id: 'player2', fullName: 'Jane Smith' },
  originX: null,
  originY: null,
  landingX: null,
  landingY: null
};

const mockParticipants = [
  { _id: 'player1', fullName: 'John Doe' },
  { _id: 'player2', fullName: 'Jane Smith' }
];

const mockGames = [
  { gameNumber: 1, side1Score: 5, side2Score: 3, shots: [mockShot] }
];

const currentGameScore = { side1Score: 5, side2Score: 3 };

// Test the commentary generation logic manually
console.log('=== Manual Commentary Test ===');
console.log('Shot data:', JSON.stringify(mockShot, null, 2));
console.log('Participants:', mockParticipants.length);
console.log('Games:', mockGames.length);

// Simulate the hasDetailedTracking check
const hasDetailedTracking = 
  mockShot.stroke != null &&
  mockShot.originX != null &&
  mockShot.originY != null &&
  mockShot.landingX != null &&
  mockShot.landingY != null;

console.log('hasDetailedTracking:', hasDetailedTracking);

// Simulate shot parts generation
const shotParts = [];

if (hasDetailedTracking) {
  console.log('Would generate detailed commentary');
} else {
  console.log('Using simple tracking fallback logic');
  
  // Simple tracking mode - generate basic commentary
  if (mockShot.stroke) {
    const strokeName = mockShot.stroke ? mockShot.stroke.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Unknown';
    const strokeLower = strokeName.toLowerCase();
    if (strokeLower !== 'unknown') {
      shotParts.push(strokeLower);
    }
  }
  
  // Add generic winning shot description for simple tracking
  if (shotParts.length === 0) {
    shotParts.push('winning shot');
  } else {
    shotParts.push('to win the point');
  }
}

console.log('Shot parts:', shotParts);
const shotDescription = shotParts.join(', ');
console.log('Shot description:', shotDescription);

// Simulate full commentary
const winnerFirstName = 'John';
const fullCommentary = `<strong>${winnerFirstName}</strong> wins the point with a <strong>${shotDescription}</strong>. The game score is now <strong>5–3</strong> in favor of <strong>John Doe</strong>.`;

console.log('Final commentary:', fullCommentary);
console.log('HTML stripped:', fullCommentary.replace(/<\/?strong>/g, ''));
