// QueueItem.js
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './QueueItem.css'; // Import the CSS file

const QueueItem = ({ item, markAsWatched }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle the expanded state
  const toggleExpand = () => {
    setIsExpanded((prev) => !prev);
  };

  // Handle keyboard accessibility
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      toggleExpand();
    }
  };

  return (
    <div
      className={`itemContainer ${isExpanded ? 'expanded' : ''}`}
      onClick={toggleExpand}
      onKeyPress={handleKeyPress}
      role="button"
      tabIndex="0"
      aria-expanded={isExpanded}
      aria-label={`${item.name} queue item`}
    >
      <h3 className="title">{item.name}</h3>
      <img
        src={item.poster || 'https://via.placeholder.com/150x225?text=No+Image'}
        alt={`${item.name} poster`}
        className="poster"
      />
      <p className="service">{item.service}</p>
      
      {/* Description */}
      {isExpanded && (
        <p className="description">{item.description}</p>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering the toggle
          markAsWatched(item.id);
        }}
        className="removeButton"
        aria-label={`Remove ${item.name} from queue`}
      >
        Remove
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