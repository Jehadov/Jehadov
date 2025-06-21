// src/pages/CustomerService.tsx (or your path)
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from 'react-i18next'; // Import useTranslation

const CustomerService: React.FC = () => {
  const { t, i18n } = useTranslation(); // Initialize the hook
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Determine the direction based on the current language
  const pageDirection = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const successMsg = t('customerServicePage.alerts.success', 'Message sent successfully!');
    const failureMsg = t('customerServicePage.alerts.failure', 'Failed to send message.');

    try {
      await addDoc(collection(db, 'customerMessages'), {
        name,
        email,
        message,
        createdAt: new Date().toISOString(), // Good practice: use ISO string for universal time
      });
      alert(successMsg);
      setName('');
      setEmail('');
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert(failureMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Wrapper div for page-specific direction control
    <div dir={pageDirection} className={`customer-service-page-wrapper lang-${i18n.language}`}>
      <div className="container my-5">
        <h2 className="text-center mb-4 display-5"> {/* Made heading bigger */}
          {t('customerServicePage.title', 'Customer Service')}
        </h2>

        <div className="row">
          {/* Contact Info */}
          <div className="col-lg-5 mb-4">
            <div className="p-4 bg-light rounded shadow-sm h-100">
              <h5>{t('customerServicePage.contactUs.title', 'Contact Us')}</h5>
              <p className="mb-2">
                <strong>{t('customerServicePage.contactUs.emailLabel', 'Email:')}</strong>{' '}
                <a href="mailto:Jehad.taha@outlook.com">Jehad.taha@outlook.com</a>
              </p>
              <p className="mb-2">
                <strong>{t('customerServicePage.contactUs.phoneLabel', 'Phone:')}</strong>{' '}
                <a href="tel:+962790730270">(+962) 7 9073 0270</a>
              </p>
              <p>
                <strong>{t('customerServicePage.contactUs.whatsappLabel', 'WhatsApp:')}</strong>{' '}
                <a
                  href="https://api.whatsapp.com/send/?phone=%2B962790730270&text&type=phone_number&app_absent=0"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('customerServicePage.contactUs.whatsappLinkText', 'Message us on WhatsApp')}
                </a>
              </p>
            </div>
          </div>

          {/* Message Form */}
          <div className="col-lg-7">
            <div className="p-4 border rounded shadow-sm">
              <h5>{t('customerServicePage.messageForm.title', 'Send Us a Message')}</h5>
              <form onSubmit={handleSubmit} className="row g-3 mt-2">
                <div className="col-md-6">
                  {/* It's good practice to add labels for accessibility, even if placeholders are present */}
                  <label htmlFor="csFullName" className="form-label visually-hidden">{t('customerServicePage.messageForm.placeholders.yourName', 'Your Name')}</label>
                  <input
                    type="text"
                    id="csFullName"
                    name="name"
                    className="form-control"
                    placeholder={t('customerServicePage.messageForm.placeholders.yourName', 'Your Name')}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="csEmail" className="form-label visually-hidden">{t('customerServicePage.messageForm.placeholders.yourEmail', 'Your Email')}</label>
                  <input
                    type="email"
                    id="csEmail"
                    name="email"
                    className="form-control"
                    placeholder={t('customerServicePage.messageForm.placeholders.yourEmail', 'Your Email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="col-12">
                  <label htmlFor="csMessage" className="form-label visually-hidden">{t('customerServicePage.messageForm.placeholders.yourMessage', 'Your Message')}</label>
                  <textarea
                    id="csMessage"
                    name="message"
                    className="form-control"
                    placeholder={t('customerServicePage.messageForm.placeholders.yourMessage', 'Your Message')}
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="col-12 text-end">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading 
                      ? t('customerServicePage.messageForm.buttons.sending', 'Sending...') 
                      : t('customerServicePage.messageForm.buttons.send', 'Send Message')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerService;