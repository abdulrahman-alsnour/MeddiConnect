import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
} from '@mui/material';
import {
  Close,
  Image,
  Send,
  VideoLibrary,
  AttachFile,
  Cancel,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

interface CreatePostProps {
  open: boolean;
  onClose: () => void;
  onPostCreated: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ open, onClose, onPostCreated }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Check total file count (max 10 files)
    const currentCount = uploadedFiles.length;
    const newFilesCount = files.length;
    if (currentCount + newFilesCount > 10) {
      setError(`Maximum 10 files allowed. You already have ${currentCount} file(s).`);
      return;
    }

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file size (max 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        setError(`File "${file.name}" exceeds 10MB limit`);
        return;
      }

      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    // Add new files to existing ones
    setUploadedFiles([...uploadedFiles, ...newFiles]);
    setMediaPreviews([...mediaPreviews, ...newPreviews]);
    setCurrentPreviewIndex(mediaPreviews.length); // Show the first new file
    setError(null);
  };

  const handleRemoveMedia = (index: number) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(mediaPreviews[index]);
    
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    
    setUploadedFiles(newFiles);
    setMediaPreviews(newPreviews);
    
    // Adjust current index if needed
    if (currentPreviewIndex >= newPreviews.length && newPreviews.length > 0) {
      setCurrentPreviewIndex(newPreviews.length - 1);
    } else if (newPreviews.length === 0) {
      setCurrentPreviewIndex(0);
    }
  };

  const handleRemoveAllMedia = () => {
    // Revoke all object URLs
    mediaPreviews.forEach(url => URL.revokeObjectURL(url));
    setUploadedFiles([]);
    setMediaPreviews([]);
    setCurrentPreviewIndex(0);
    setMediaUrl('');
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError('Please enter some content for your post');
      return;
    }

    if (!user?.token) {
      setError('User not authenticated. Please log in again.');
      return;
    }

    // Validate token is not empty
    if (!user.token.trim()) {
      setError('Invalid authentication token. Please log in again.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create FormData to send files and other fields
      const formData = new FormData();
      formData.append('content', content.trim());
      formData.append('privacy', 'PUBLIC'); // All posts are public
      
      // Add all media files
      uploadedFiles.forEach((file) => {
        formData.append('mediaFiles', file);
      });

      // Note: Backend extracts providerId from JWT token for security
      // We don't need to send providerId in the request body
      const response = await fetch('http://localhost:8080/posts/create', {
        method: 'POST',
        headers: {
          // Don't set Content-Type header - browser will set it with boundary for FormData
          'Authorization': `Bearer ${user.token.trim()}`,
        },
        body: formData,
      });

      // Check if response has content before parsing JSON
      const contentType = response.headers.get('content-type');
      let data: any = {};
      
      if (contentType && contentType.includes('application/json')) {
        const text = await response.text();
        if (text) {
          try {
            data = JSON.parse(text);
          } catch (e) {
            console.error('Failed to parse JSON response:', e);
            data = { message: 'Invalid response from server' };
          }
        }
      }

      console.log('Create post response status:', response.status);
      console.log('Create post response data:', data);

      if (response.ok && data.status === 'success') {
        // Revoke all preview URLs
        mediaPreviews.forEach(url => URL.revokeObjectURL(url));
        
        // Reset form
        setContent('');
        setMediaUrl('');
        setUploadedFiles([]);
        setMediaPreviews([]);
        setCurrentPreviewIndex(0);
        
        // Close dialog and refresh posts
        onClose();
        onPostCreated();
      } else {
        // Handle different error cases
        if (response.status === 401) {
          setError('Your session has expired. Please log in again.');
        } else if (response.status === 403) {
          setError('You do not have permission to create posts. Only doctors can create posts.');
        } else if (response.status === 413) {
          setError(data.message || 'File size exceeds the maximum allowed limit of 10MB per file. Please reduce the file size and try again.');
        } else {
          setError(data.message || `Failed to create post (${response.status})`);
        }
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError('Failed to create post. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Revoke all preview URLs
    mediaPreviews.forEach(url => URL.revokeObjectURL(url));
    
    setContent('');
    setMediaUrl('');
    setError(null);
    setUploadedFiles([]);
    setMediaPreviews([]);
    setCurrentPreviewIndex(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Create New Post</Typography>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Content */}
          <TextField
            multiline
            rows={4}
            fullWidth
            placeholder="Share medical insights, tips, or updates with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            variant="outlined"
            sx={{ mt: 1 }}
          />

          {/* Media Upload Buttons */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <Button
              variant="outlined"
              component="label"
              startIcon={<Image />}
              size="small"
              disabled={uploadedFiles.length >= 10}
            >
              Upload Images ({uploadedFiles.length}/10)
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                hidden
                onChange={handleFileUpload}
              />
            </Button>
            
            {uploadedFiles.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={handleRemoveAllMedia}
              >
                Remove All
              </Button>
            )}
          </Box>

          {/* Media Preview Carousel */}
          {mediaPreviews.length > 0 && (
            <Card sx={{ position: 'relative' }}>
              {/* Navigation Arrows */}
              {mediaPreviews.length > 1 && (
                <>
                  <IconButton
                    onClick={() => setCurrentPreviewIndex((prev) => 
                      prev > 0 ? prev - 1 : mediaPreviews.length - 1
                    )}
                    sx={{
                      position: 'absolute',
                      left: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      zIndex: 2,
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.8)',
                      }
                    }}
                    size="small"
                  >
                    <NavigateBefore />
                  </IconButton>
                  <IconButton
                    onClick={() => setCurrentPreviewIndex((prev) => 
                      prev < mediaPreviews.length - 1 ? prev + 1 : 0
                    )}
                    sx={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      bgcolor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      zIndex: 2,
                      '&:hover': {
                        bgcolor: 'rgba(0, 0, 0, 0.8)',
                      }
                    }}
                    size="small"
                  >
                    <NavigateNext />
                  </IconButton>
                </>
              )}
              
              {/* Remove Current Media Button */}
              <IconButton
                onClick={() => handleRemoveMedia(currentPreviewIndex)}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.8)',
                  },
                  zIndex: 2,
                }}
                size="small"
              >
                <Cancel />
              </IconButton>
              
              {/* Current Media Preview */}
              {(() => {
                const currentFile = uploadedFiles[currentPreviewIndex];
                const currentPreview = mediaPreviews[currentPreviewIndex];
                const isImage = currentFile?.type.startsWith('image/');
                const isVideo = currentFile?.type.startsWith('video/');
                
                return (
                  <>
                    {isImage ? (
                      <CardMedia
                        component="img"
                        image={currentPreview}
                        alt={`Upload preview ${currentPreviewIndex + 1}`}
                        sx={{
                          maxHeight: 300,
                          objectFit: 'contain',
                        }}
                      />
                    ) : isVideo ? (
                      <CardMedia
                        component="video"
                        src={currentPreview}
                        controls
                        sx={{
                          maxHeight: 300,
                          width: '100%',
                        }}
                      />
                    ) : null}
                    
                    {/* Media Info and Counter */}
                    <Box sx={{ p: 1, bgcolor: 'action.hover', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        {currentFile?.name} ({(currentFile!.size / 1024 / 1024).toFixed(2)} MB)
                      </Typography>
                      {mediaPreviews.length > 1 && (
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          {currentPreviewIndex + 1} / {mediaPreviews.length}
                        </Typography>
                      )}
                    </Box>
                  </>
                );
              })()}
            </Card>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={loading ? <CircularProgress size={16} /> : <Send />}
          disabled={loading || !content.trim()}
        >
          {loading ? 'Posting...' : 'Post'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreatePost;
