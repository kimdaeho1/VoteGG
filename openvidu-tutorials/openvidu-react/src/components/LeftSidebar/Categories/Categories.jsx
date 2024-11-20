import React from 'react';
import './Categories.css';

const Categories = () => {
  const categories = ['Home', 'Topics', 'Live', 'Favorites', 'Settings'];

  return (
    <div className="categories">
      {categories.map((category, index) => (
        <div key={index} className="category-item">
          {category}
        </div>
      ))}
    </div>
  );
};

export default Categories;
