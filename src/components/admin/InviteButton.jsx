import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import InviteUserModal from './InviteUserModal';

const InviteButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-6 sm:bottom-6 bg-orange-600 text-white p-4 rounded-full shadow-lg hover:bg-orange-700 transition-colors duration-300 hover:shadow-xl z-40 flex items-center gap-2"
        title="Invite new user"
      >
        <UserPlus className="w-6 h-6" />
        <span className="hidden sm:inline text-sm font-medium">Invite User</span>
      </button>

      <InviteUserModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default InviteButton;
