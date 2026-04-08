
import React from 'react';
import { User } from '../types';
import Button from '../components/Button';

interface ProfilePageProps {
  loggedInUser: User;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ loggedInUser }) => {
  const handleUpdateKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      // After selection, the app usually reloads or the key is injected.
      // Assuming successful selection as per guidelines.
    }
  };

  if (!loggedInUser) {
    return (
      <div className="p-4 bg-gray-900 min-h-full text-white text-center">
        <h2 className="text-2xl font-bold mb-4">Profile</h2>
        <p className="text-gray-400">Please log in to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 min-h-full text-white">
      <h2 className="text-2xl font-bold mb-6 text-center">My Profile</h2>
      
      <div className="bg-gray-800 p-8 rounded-xl shadow-md space-y-6 flex flex-col items-center">
        {loggedInUser.avatar && (
          <div className="relative mb-4">
            <img 
              src={loggedInUser.avatar} 
              alt={loggedInUser.name} 
              className="w-32 h-32 rounded-full border-4 border-indigo-600 object-cover shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-gray-800 rounded-full"></div>
          </div>
        )}
        <div className="w-full space-y-6">
          <div>
            <p className="text-base font-medium text-gray-400">User ID:</p>
            <p className="text-xl font-semibold">{loggedInUser.id}</p>
          </div>
          <div>
            <p className="text-base font-medium text-gray-400">Name:</p>
            <p className="text-xl font-semibold">{loggedInUser.name}</p>
          </div>
          <div>
            <p className="text-base font-medium text-gray-400">Email:</p>
            <p className="text-xl">{loggedInUser.email}</p>
          </div>
          <div>
            <p className="text-base font-medium text-gray-400">Role:</p>
            <p className="text-xl">{loggedInUser.role.replace(/_/g, ' ')}</p>
          </div>
          <div>
            <p className="text-base font-medium text-gray-400">Unit:</p>
            <p className="text-xl">{loggedInUser.unit}</p>
          </div>
          {loggedInUser.phone && (
            <div>
              <p className="text-base font-medium text-gray-400">Phone:</p>
              <p className="text-xl">{loggedInUser.phone}</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-10 space-y-6">
        <div className="p-6 bg-indigo-900/30 rounded-xl border border-indigo-500/50">
          <p className="text-lg font-medium text-indigo-200 mb-3">API Usage & Quota</p>
          <p className="text-sm text-indigo-300/70 mb-6 leading-relaxed">
            If you encounter "Quota Exceeded" errors, you can use your own Google Cloud paid API key for dedicated throughput.
          </p>
          <Button 
            variant="primary" 
            className="w-full py-4 text-base" 
            onClick={handleUpdateKey}
          >
            Update API Key
          </Button>
          <p className="text-xs text-center mt-4 text-indigo-400/50">
            Visit <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="underline">Billing Docs</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
