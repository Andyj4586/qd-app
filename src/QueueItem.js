// QueueItem.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './QueueItem.css'; // Import the CSS file

const QueueItem = ({ item, markAsWatched }) => {
  const [showDescription, setShowDescription] = useState(false);

  const toggleDescription = () => {
    setShowDescription(!showDescription);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      toggleDescription();
    }
  };

  return (
    <div
      className={`itemContainer ${showDescription ? 'active' : ''}`}
      aria-live="polite"
    >
      <h3 className="title">{item.name}</h3>
      <img
        src={item.poster || 'https://via.placeholder.com/150x225?text=No+Image'}
        alt={`${item.name} poster`}
        className="poster"
        onClick={toggleDescription}
        role="button"
        aria-expanded={showDescription}
        tabIndex="0"
        onKeyPress={handleKeyPress}
      />
      <p className="service">{item.service}</p>
      <p className={`description ${showDescription ? 'show' : ''}`}>
        {item.description}
      </p>
      <button
        onClick={() => markAsWatched(item.id)}
        className="watchButton"
        aria-label={`Mark ${item.name} as watched`}
      >
        Mark as Watched
      </button>
    </div>
  );
};

// Define PropTypes for better type checking
QueueItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    service: PropTypes.string.isRequired,
    poster: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
  markAsWatched: PropTypes.func.isRequired,
};

export default QueueItem;