// Updated AdminPortfolio.tsx to allow empty title and category in createItem and updateItem functions.

import React from 'react';

const AdminPortfolio = () => {
  // Other code...

  const createItem = (item) => {
    // Title and category validation checks removed
    const { image } = item;
    // You may add more logic for saving the image only
    saveItem({ image });
  };

  const updateItem = (item) => {
    // Title and category validation checks removed
    const { image } = item;
    // You may add more logic for saving the image only
    saveItem({ image });
  };

  // Other code...
  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
};

export default AdminPortfolio;