// GroupItem.js
import React from 'react';
import PropTypes from 'prop-types';

const GroupItem = ({ group, onJoin, loadingJoin }) => {
  return (
    <div style={styles.itemContainer}>
      <img
        src={group.poster || 'https://via.placeholder.com/150x225?text=No+Image'}
        alt={`${group.name} cover`}
        style={styles.poster}
        loading="lazy" // Enables lazy loading
        onClick={() => onJoin(group.id)}
        role="button"
        aria-label={`Join ${group.name} group`}
        tabIndex="0"
        onKeyPress={(e) => {
          if (e.key === 'Enter') onJoin(group.id);
        }}
      />
      <p style={styles.name}>{group.name}</p>
      <button
        onClick={() => onJoin(group.id)}
        style={styles.joinButton}
        disabled={loadingJoin}
        aria-label={`Join ${group.name} group`}
      >
        {loadingJoin ? 'Joining...' : 'Join'}
      </button>
    </div>
  );
};

GroupItem.propTypes = {
  group: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    poster: PropTypes.string, // Optional: URL to cover image
  }).isRequired,
  onJoin: PropTypes.func.isRequired,
  loadingJoin: PropTypes.bool.isRequired,
};

const styles = {
  itemContainer: {
    minWidth: '150px',
    marginRight: '15px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    transition: 'transform 0.2s, box-shadow 0.2s',
  },
  poster: {
    width: '150px',
    height: '225px',
    objectFit: 'cover',
    cursor: 'pointer',
    borderRadius: '3px',
    marginBottom: '10px',
  },
  name: {
    fontSize: '16px',
    textAlign: 'center',
    marginBottom: '10px',
    color: '#333',
  },
  joinButton: {
    padding: '8px 12px',
    borderRadius: '3px',
    border: 'none',
    backgroundColor: '#28a745',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'background-color 0.3s',
    width: '100%',
  },
};

export default GroupItem;