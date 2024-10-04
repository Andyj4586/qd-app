// CreateGroup.js
import React, { useState, useEffect } from 'react';
import { db, auth, storage } from './firebase'; // Ensure 'storage' is exported from firebase.js
import {
  collection,
  addDoc,
  updateDoc,
  arrayUnion,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'; // Import storage functions

function CreateGroup() {
  const [name, setName] = useState('');
  const [image, setImage] = useState(null); // State to store the selected image file
  const [preview, setPreview] = useState(null); // State to store the image preview URL
  const [uploadProgress, setUploadProgress] = useState(0); // State to track upload progress
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handler for image selection with validation
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (jpeg, png, gif, webp).');
        setImage(null);
        return;
      }

      if (file.size > maxSize) {
        setError('Image size should not exceed 5MB.');
        setImage(null);
        return;
      }

      setImage(file);
      setError(''); // Clear any previous errors
    }
  };

  // useEffect to handle image preview
  useEffect(() => {
    if (image) {
      const objectUrl = URL.createObjectURL(image);
      setPreview(objectUrl);

      // Cleanup the object URL when component unmounts or image changes
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPreview(null);
    }
  }, [image]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a group name.');
      return;
    }

    setError('');
    setSuccess('');
    setUploadProgress(0); // Reset upload progress

    try {
      let imageUrl = '';

      // If an image is selected, upload it to Firebase Storage
      if (image) {
        const imageRef = ref(
          storage,
          `group_covers/${auth.currentUser.uid}_${Date.now()}_${image.name}`
        );
        const uploadTask = uploadBytesResumable(imageRef, image);

        // Listen for state changes, errors, and completion of the upload.
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
            console.log('Upload is ' + progress + '% done');
          },
          (error) => {
            console.error('Error uploading image:', error);
            setError('Could not upload image. Please try again.');
          },
          async () => {
            // Upload completed successfully, now get the download URL
            imageUrl = await getDownloadURL(uploadTask.snapshot.ref);

            // Proceed to create the group document
            const groupsCollection = collection(db, 'groups');
            const newGroup = await addDoc(groupsCollection, {
              name: name.trim(),
              poster: imageUrl, // Use the uploaded image URL
              members: [auth.currentUser.uid],
              createdAt: serverTimestamp(),
            });

            // Add group ID to user's groups array
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            await updateDoc(userDocRef, {
              groups: arrayUnion(newGroup.id),
            });

            setName('');
            setImage(null);
            setUploadProgress(0);
            setSuccess('Group created successfully!');
            setError('');
          }
        );

        // Return early to prevent executing the rest of the function until upload is complete
        return;
      }

      // If no image is selected, proceed to create the group document without poster
      const groupsCollection = collection(db, 'groups');
      const newGroup = await addDoc(groupsCollection, {
        name: name.trim(),
        poster: imageUrl, // Empty string if no image
        members: [auth.currentUser.uid],
        createdAt: serverTimestamp(),
      });

      // Add group ID to user's groups array
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userDocRef, {
        groups: arrayUnion(newGroup.id),
      });

      setName('');
      setImage(null);
      setUploadProgress(0);
      setSuccess('Group created successfully!');
      setError('');
    } catch (error) {
      console.error('Error creating group:', error);
      setError('Could not create group. Please try again.');
    }
  };

  return (
    <div style={styles.container}>
      <h2>Create a New Group</h2>
      {error && <p style={styles.error}>{error}</p>}
      {success && <p style={styles.success}>{success}</p>}
      <form onSubmit={handleCreateGroup} style={styles.form}>
        <input
          type="text"
          placeholder="Group Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          style={styles.input}
        />

        {/* Hidden File Input */}
        <input
          type="file"
          id="group-image-upload"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />

        {/* Custom Upload Button */}
        <label htmlFor="group-image-upload" style={styles.uploadButton}>
          {image ? 'Image Selected' : 'Upload Group Profile Image'}
        </label>

        {/* Display Selected Image Name */}
        {image && <p style={styles.imageName}>{image.name}</p>}

        <button
          type="submit"
          style={{
            ...styles.button,
            cursor:
              uploadProgress > 0 && uploadProgress < 100
                ? 'not-allowed'
                : 'pointer',
            backgroundColor:
              uploadProgress > 0 && uploadProgress < 100
                ? '#888'
                : '#333',
          }}
          disabled={uploadProgress > 0 && uploadProgress < 100}
        >
          {uploadProgress > 0 && uploadProgress < 100
            ? 'Uploading...'
            : 'Create Group'}
        </button>
      </form>

      {/* Image Preview */}
      {preview && (
        <div style={styles.previewContainer}>
          <img src={preview} alt="Selected Group" style={styles.previewImage} />
        </div>
      )}

      {/* Progress Bar */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div style={styles.progressContainer}>
          <div
            style={{ ...styles.progressBar, width: `${uploadProgress}%` }}
          ></div>
          <p style={styles.progressText}>
            {Math.round(uploadProgress)}% uploaded
          </p>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '30px auto',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    backgroundColor: '#f9f9f9',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: '10px',
  },
  input: {
    padding: '10px',
    marginBottom: '15px',
    borderRadius: '3px',
    border: '1px solid #ccc',
    fontSize: '16px',
    outline: 'none',
    transition: 'border 0.3s',
  },
  uploadButton: {
    padding: '10px 15px',
    marginBottom: '5px',
    borderRadius: '3px',
    border: '1px solid #ccc',
    backgroundColor: '#007bff',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    textAlign: 'center',
    display: 'inline-block',
  },
  imageName: {
    marginBottom: '15px',
    fontSize: '14px',
    color: '#555',
    textAlign: 'center',
  },
  button: {
    padding: '10px 15px',
    borderRadius: '3px',
    border: 'none',
    backgroundColor: '#333',
    color: '#fff',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    minWidth: '120px',
    opacity: '1',
  },
  error: {
    color: 'red',
    marginBottom: '15px',
  },
  success: {
    color: 'green',
    marginBottom: '15px',
  },
  progressContainer: {
    width: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: '5px',
    overflow: 'hidden',
    marginTop: '10px',
    position: 'relative',
  },
  progressBar: {
    height: '10px',
    backgroundColor: '#76c7c0',
    transition: 'width 0.3s',
  },
  progressText: {
    fontSize: '12px',
    color: '#555',
    textAlign: 'center',
    marginTop: '5px',
  },
  previewContainer: {
    marginTop: '15px',
    textAlign: 'center',
  },
  previewImage: {
    width: '150px',
    height: '225px',
    objectFit: 'cover',
    borderRadius: '3px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
};

export default CreateGroup;