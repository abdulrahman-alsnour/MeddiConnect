import React, { useState } from 'react';
import SocialFeed from '../components/SocialFeed';
import CreatePost from '../components/CreatePost';
import DoctorLayout from '../components/DoctorLayout';

const DoctorDashboard = () => {
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePostCreated = () => {
    // Increment refreshTrigger to trigger refresh in SocialFeed
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <DoctorLayout 
      title="Doctor Dashboard"
      subtitle="Connect with your medical community and share insights"
    >
      {/* Social Feed */}
      <SocialFeed 
        onCreatePost={() => setCreatePostOpen(true)} 
        refreshTrigger={refreshTrigger}
      />

      {/* Create Post Dialog */}
      <CreatePost
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        onPostCreated={handlePostCreated}
      />
    </DoctorLayout>
  );
};

export default DoctorDashboard;
