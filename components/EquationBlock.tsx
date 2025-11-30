import React from 'react';

interface EquationBlockProps {
  title?: string;
  children: React.ReactNode;
}

const EquationBlock: React.FC<EquationBlockProps> = ({ title, children }) => {
  return (
    <div className="my-6 p-4 bg-white border-l-4 border-indigo-500 shadow-sm rounded-r-md">
      {title && <h4 className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-2">{title}</h4>}
      <div className="font-serif text-lg text-slate-800 text-center overflow-x-auto">
        {children}
      </div>
    </div>
  );
};

export default EquationBlock;