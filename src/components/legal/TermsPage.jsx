import { useNavigate } from 'react-router-dom'

const TermsOfService = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="spiritual-card p-8">
          {/* Header with back button */}
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm bg-saffron-600/10 text-saffron-600 hover:bg-saffron-600/20 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <h1 className="text-3xl font-bold text-foreground">Terms of Service</h1>
          </div>

          {/* Terms of Service Content */}
          <div className="prose prose-gray max-w-none space-y-6 text-foreground">
            <p className="text-sm text-muted-foreground">
              <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using Agamvani (the "Service"), you accept and agree to be bound by the terms and provisions of this agreement. 
                If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p className="leading-relaxed">
                Agamvani provides a radio streaming platform featuring devotional music and spiritual content related to Sattguru Sukhramji Maharaj's teachings. 
                The Service is accessible through our mobile application and web platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. User Registration and Account</h2>
              <p className="leading-relaxed mb-2">To access certain features of the Service, you must:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security and confidentiality of your login credentials</li>
                <li>Accept responsibility for all activities that occur under your account</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. User Conduct</h2>
              <p className="leading-relaxed mb-2">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
                <li>Attempt to gain unauthorized access to the Service or related systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Upload, transmit, or distribute any malicious code or harmful content</li>
                <li>Impersonate any person or entity</li>
                <li>Harvest or collect information about other users without their consent</li>
                <li>Use the Service in any way that could damage, disable, or impair the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Intellectual Property Rights</h2>
              <p className="leading-relaxed">
                All content included in the Service, including but not limited to audio recordings, text, graphics, logos, and software, 
                is the property of Agamvani or its content suppliers and is protected by copyright, trademark, and other intellectual property laws. 
                You may not reproduce, distribute, modify, or create derivative works without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Disclaimer of Warranties</h2>
              <p className="leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. 
                WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE FROM VIRUSES OR OTHER HARMFUL COMPONENTS.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
              <p className="leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, AGAMVANI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
                CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, 
                OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Account Termination</h2>
              <p className="leading-relaxed mb-2">
                We reserve the right to suspend or terminate your account and access to the Service at our sole discretion, without notice, for:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violation of these Terms of Service</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Extended periods of inactivity</li>
              </ul>
              <p className="leading-relaxed mt-3">
                You may also request account deletion at any time through the account settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Modifications to Service and Terms</h2>
              <p className="leading-relaxed">
                We reserve the right to modify or discontinue the Service at any time, with or without notice. 
                We may also update these Terms of Service from time to time. Your continued use of the Service after any changes 
                constitutes acceptance of those changes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
              <p className="leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Information</h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> <a href="mailto:ramsdigilib@ramsabha.in" className="text-saffron-600 hover:underline">ramsdigilib@ramsabha.in</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsOfService
