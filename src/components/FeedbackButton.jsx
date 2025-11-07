import { useState } from 'react'
import FeedbackModal from './FeedbackModal'
import { MessageCircle } from 'lucide-react'

function FeedbackButton() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-40 sm:bottom-24 right-6 z-50 w-14 h-14 rounded-full shadow-divine hover:shadow-spiritual transition-all duration-300 flex items-center justify-center group hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #FF9933 0%, #F59E0B 100%)' }}
        title="Share Feedback"
      >
        <MessageCircle className="w-6 h-6 text-white group-hover:animate-pulse" />
      </button>

      {showModal && <FeedbackModal onClose={() => setShowModal(false)} />}
    </>
  )
}

export default FeedbackButton
