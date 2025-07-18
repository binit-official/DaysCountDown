// src/components/Footer.tsx

import React from 'react';

export const Footer = () => {
  return (
    <footer className="w-full py-6 mt-12 border-t border-primary/20">
      <div className="container mx-auto text-center text-muted-foreground">
        <p className="text-sm">&copy; {new Date().getFullYear()} Days Count Down. All Rights Reserved.</p>
        <p className="text-xs mt-2">Stop making excuses. Start making progress.</p>
      </div>
    </footer>
  );
};