import React from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
}

export const Tooltip: React.FC<TooltipProps> = ({ text, children, position = 'top' }) => {
  const positionClasses = position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';

  const arrowClasses = position === 'top'
    ? 'top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4'
    : 'bottom-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-b-4';

  return (
    <div className="relative group inline-flex">
      {children}
      <div
        role="tooltip"
        className={`absolute ${positionClasses} w-max max-w-xs hidden group-hover:block bg-gray-700 dark:bg-black text-white text-xs font-semibold rounded-md py-1.5 px-3 z-20 shadow-lg pointer-events-none transition-opacity duration-200 opacity-0 group-hover:opacity-100`}
      >
        {text}
        <div className={`absolute ${arrowClasses} w-0 h-0 border-gray-700 dark:border-black`} />
      </div>
    </div>
  );
};
