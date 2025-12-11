import React from 'react';
import { CardData } from '../types';

interface CardProps {
  card: CardData;
  onClick: (card: CardData) => void;
  disabled: boolean;
}

const Card: React.FC<CardProps> = ({ card, onClick, disabled }) => {
  
  const handleClick = () => {
    if (!disabled && !card.isFlipped && !card.isMatched) {
      onClick(card);
    }
  };

  return (
    <div 
      className={`relative w-full aspect-square perspective-1000 cursor-pointer group select-none`}
      onClick={handleClick}
    >
      <div 
        className={`w-full h-full relative transform-style-3d transition-all duration-500 ease-in-out ${card.isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front of Card (Face Down) */}
        <div 
          className="absolute w-full h-full backface-hidden rounded-xl shadow-lg
                     bg-gradient-to-br from-indigo-600 to-purple-700 
                     border-2 border-indigo-400/30
                     flex items-center justify-center
                     group-hover:scale-[1.02] transition-transform"
        >
          <i className="fas fa-brain text-4xl text-white/20"></i>
        </div>

        {/* Back of Card (Face Up) */}
        <div 
          className={`absolute w-full h-full backface-hidden rotate-y-180 rounded-xl shadow-xl overflow-hidden
                     flex items-center justify-center p-2 text-center
                     ${card.isMatched 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-700 ring-4 ring-green-400' 
                        : 'bg-white text-gray-900'}
                     `}
        >
          {card.type === 'image' ? (
            <img 
              src={card.content} 
              alt="Memory Card" 
              className="w-full h-full object-cover rounded-lg"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full">
              <span className={`font-bold ${card.content.length > 10 ? 'text-sm' : 'text-lg md:text-xl'} break-words leading-tight`}>
                {card.content}
              </span>
              {card.isMatched && (
                <div className="mt-1 text-xs text-white uppercase font-bold tracking-wider opacity-80">Matched</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Card;