import React from 'react';

const ContentWrapper = ({ children }) => {
  return (
    <div className="app-content-wrapper">
      {children}
    </div>
  );
};

export default ContentWrapper;
