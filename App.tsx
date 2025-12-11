import React, { useState, useEffect, useCallback } from 'react';
import { CardData, GameState, GameMode, DifficultyLevel } from './types';
import { generateThemePairs } from './services/geminiService';
import Card from './components/Card';

// Utility to shuffle array
const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    cards: [],
    flippedCards: [],
    matchedCount: 0,
    moves: 0,
    timer: 0,
    isPlaying: false,
    isGameOver: false,
    isGenerating: false,
    difficulty: 6, // Default 6 pairs (12 cards)
    mode: GameMode.CLASSIC_IMAGE,
  });

  const [customTheme, setCustomTheme] = useState('Space Exploration');
  const [showSettings, setShowSettings] = useState(true);

  // Timer Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState.isPlaying && !gameState.isGameOver) {
      interval = setInterval(() => {
        setGameState(prev => ({ ...prev, timer: prev.timer + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.isPlaying, gameState.isGameOver]);

  // Match Checking Logic
  useEffect(() => {
    if (gameState.flippedCards.length === 2) {
      const [first, second] = gameState.flippedCards;
      
      if (first.pairId === second.pairId) {
        // Match found
        setGameState(prev => ({
          ...prev,
          flippedCards: [],
          matchedCount: prev.matchedCount + 1,
          cards: prev.cards.map(card => 
            card.id === first.id || card.id === second.id 
              ? { ...card, isMatched: true, isFlipped: true } 
              : card
          )
        }));
      } else {
        // No match
        const timeoutId = setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            flippedCards: [],
            cards: prev.cards.map(card => 
              card.id === first.id || card.id === second.id 
                ? { ...card, isFlipped: false } 
                : card
            )
          }));
        }, 1000);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [gameState.flippedCards]);

  // Win Condition
  useEffect(() => {
    if (gameState.isPlaying && gameState.matchedCount === gameState.difficulty) {
      setGameState(prev => ({ ...prev, isGameOver: true, isPlaying: false }));
    }
  }, [gameState.matchedCount, gameState.difficulty, gameState.isPlaying]);

  const initializeGame = async () => {
    setGameState(prev => ({ ...prev, isGenerating: true, isGameOver: false, isPlaying: false, matchedCount: 0, moves: 0, timer: 0 }));
    setShowSettings(false);

    let deck: CardData[] = [];

    try {
      if (gameState.mode === GameMode.CLASSIC_IMAGE) {
        // Classic Image Logic
        const seed = Date.now();
        for (let i = 0; i < gameState.difficulty; i++) {
          const imageUrl = `https://picsum.photos/seed/${seed + i}/400/400`;
          deck.push({ id: `a-${i}`, pairId: i, content: imageUrl, type: 'image', isFlipped: false, isMatched: false });
          deck.push({ id: `b-${i}`, pairId: i, content: imageUrl, type: 'image', isFlipped: false, isMatched: false });
        }
      } else {
        // AI Theme Logic
        const pairs = await generateThemePairs(customTheme, gameState.difficulty);
        pairs.forEach((pair, index) => {
          deck.push({ id: `a-${index}`, pairId: index, content: pair.item1, type: 'text', isFlipped: false, isMatched: false });
          deck.push({ id: `b-${index}`, pairId: index, content: pair.item2, type: 'text', isFlipped: false, isMatched: false });
        });
      }

      setGameState(prev => ({
        ...prev,
        cards: shuffle(deck),
        isGenerating: false,
        isPlaying: true,
      }));
    } catch (error) {
      console.error("Failed to start game", error);
      setGameState(prev => ({ ...prev, isGenerating: false }));
      alert("Failed to generate game content. Please check API settings or try Classic Mode.");
    }
  };

  const handleCardClick = (clickedCard: CardData) => {
    if (gameState.flippedCards.length >= 2 || clickedCard.isMatched || clickedCard.isFlipped) return;

    setGameState(prev => ({
      ...prev,
      moves: prev.flippedCards.length === 1 ? prev.moves + 1 : prev.moves,
      flippedCards: [...prev.flippedCards, clickedCard],
      cards: prev.cards.map(card => 
        card.id === clickedCard.id ? { ...card, isFlipped: true } : card
      )
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-purple-500 selection:text-white">
      
      {/* Header */}
      <header className="fixed top-0 w-full bg-gray-900/90 backdrop-blur-md border-b border-gray-800 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <i className="fas fa-brain text-purple-500 text-2xl animate-pulse"></i>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              MindMatch AI
            </h1>
          </div>
          
          <div className="flex items-center space-x-4 md:space-x-8 text-sm md:text-base">
            <div className="flex flex-col items-center">
              <span className="text-gray-400 text-xs uppercase tracking-wide">Moves</span>
              <span className="font-mono font-bold text-lg">{gameState.moves}</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-gray-400 text-xs uppercase tracking-wide">Time</span>
              <span className="font-mono font-bold text-lg">{formatTime(gameState.timer)}</span>
            </div>
            <button 
              onClick={() => {
                setGameState(prev => ({ ...prev, isPlaying: false, isGameOver: false }));
                setShowSettings(true);
              }}
              className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              title="Settings / New Game"
            >
              <i className="fas fa-cog text-gray-300 text-lg"></i>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 max-w-4xl mx-auto flex flex-col items-center min-h-screen justify-center">
        
        {/* Loading State */}
        {gameState.isGenerating && (
          <div className="flex flex-col items-center justify-center space-y-6 animate-pulse">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xl font-medium text-purple-300">
              {gameState.mode === GameMode.AI_THEME ? `Consulting Gemini for "${customTheme}"...` : "Shuffling Deck..."}
            </p>
          </div>
        )}

        {/* Game Grid */}
        {!gameState.isGenerating && !showSettings && (
          <div className={`grid gap-3 md:gap-4 w-full perspective-1000
            ${gameState.difficulty === 4 ? 'grid-cols-4 max-w-sm' : 
              gameState.difficulty === 6 ? 'grid-cols-3 md:grid-cols-4 max-w-xl' : 
              'grid-cols-4 max-w-2xl'}`}
          >
            {gameState.cards.map(card => (
              <Card 
                key={card.id} 
                card={card} 
                onClick={handleCardClick} 
                disabled={gameState.flippedCards.length >= 2}
              />
            ))}
          </div>
        )}
      </main>

      {/* Settings Modal (Overlay) */}
      {showSettings && !gameState.isGenerating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-800 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-md p-6 md:p-8 relative overflow-hidden">
            {/* Decorative BG Blob */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <h2 className="text-3xl font-bold text-white mb-6 text-center">New Game</h2>
            
            {/* Mode Selection */}
            <div className="mb-6 space-y-3">
              <label className="text-sm text-gray-400 uppercase font-semibold">Game Mode</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setGameState(prev => ({ ...prev, mode: GameMode.CLASSIC_IMAGE }))}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${gameState.mode === GameMode.CLASSIC_IMAGE ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-gray-700 hover:border-gray-600 text-gray-400'}`}
                >
                  <i className="fas fa-image text-2xl mb-2"></i>
                  <span className="font-medium">Classic</span>
                </button>
                <button 
                  onClick={() => setGameState(prev => ({ ...prev, mode: GameMode.AI_THEME }))}
                  className={`p-4 rounded-xl border flex flex-col items-center justify-center transition-all ${gameState.mode === GameMode.AI_THEME ? 'border-purple-500 bg-purple-500/10 text-white' : 'border-gray-700 hover:border-gray-600 text-gray-400'}`}
                >
                  <i className="fas fa-wand-magic-sparkles text-2xl mb-2"></i>
                  <span className="font-medium">AI Match</span>
                </button>
              </div>
            </div>

            {/* AI Input */}
            {gameState.mode === GameMode.AI_THEME && (
              <div className="mb-6 animate-fadeIn">
                <label className="text-sm text-gray-400 uppercase font-semibold mb-2 block">AI Theme Topic</label>
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-3.5 text-gray-500"></i>
                  <input 
                    type="text" 
                    value={customTheme}
                    onChange={(e) => setCustomTheme(e.target.value)}
                    placeholder="e.g. Harry Potter, Physics, 90s Music"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">Gemini will generate related pairs based on this topic.</p>
              </div>
            )}

            {/* Difficulty */}
            <div className="mb-8">
              <label className="text-sm text-gray-400 uppercase font-semibold mb-2 block">Difficulty (Pairs)</label>
              <div className="flex space-x-3 bg-gray-900 p-1 rounded-xl">
                {[4, 6, 8].map((level) => (
                  <button
                    key={level}
                    onClick={() => setGameState(prev => ({ ...prev, difficulty: level as DifficultyLevel }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${gameState.difficulty === level ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={initializeGame}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/25 transition-all transform hover:scale-[1.02]"
            >
              Start Game
            </button>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState.isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="text-center">
            <div className="mb-6 inline-block">
              <i className="fas fa-trophy text-6xl text-yellow-400 animate-bounce-short"></i>
            </div>
            <h2 className="text-5xl font-black text-white mb-2 tracking-tight">Victory!</h2>
            <p className="text-gray-400 text-lg mb-8">You mastered the board.</p>
            
            <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-8">
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <div className="text-gray-500 text-xs uppercase">Time</div>
                <div className="text-2xl font-mono font-bold text-white">{formatTime(gameState.timer)}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <div className="text-gray-500 text-xs uppercase">Moves</div>
                <div className="text-2xl font-mono font-bold text-white">{gameState.moves}</div>
              </div>
            </div>

            <button 
              onClick={() => {
                setGameState(prev => ({ ...prev, isGameOver: false }));
                setShowSettings(true);
              }}
              className="px-8 py-3 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-gray-200 transition-colors shadow-lg"
            >
              Play Again
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;