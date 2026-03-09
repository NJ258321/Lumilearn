import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, className = '' }) => {
  return (
    <div className="min-h-screen bg-[#F7F9FC] flex justify-center">
      <div className={`w-full max-w-md bg-[#F7F9FC] min-h-screen relative shadow-2xl overflow-hidden flex flex-col ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default Layout;