// src/pages/Careers.tsx (or your path)
import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { useTranslation } from 'react-i18next'; // Import useTranslation

interface CareerForm {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  resumeURL: string;
  coverLetter: string;
}

const defaultFormState: CareerForm = { // Renamed to avoid conflict with default keyword if any
  fullName: '',
  email: '',
  phone: '',
  position: '',
  resumeURL: '',
  coverLetter: '',
};

const Careers: React.FC = () => {
  const { t, i18n } = useTranslation(); // Initialize the hook
  const [formData, setFormData] = useState<CareerForm>(defaultFormState);
  const [loading, setLoading] = useState(false);

  // Determine the direction based on the current language
  const pageDirection = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Get translated alert messages
    const successMsg = t('careersPage.alerts.success', 'Application submitted successfully!');
    const failureMsg = t('careersPage.alerts.failure', 'Failed to submit application.');

    try {
      await addDoc(collection(db, 'careers'), {
          ...formData,
          submittedAt: new Date().toISOString(), // Good practice to add a timestamp
      });
      alert(successMsg);
      setFormData(defaultFormState);
    } catch (error) {
      console.error('Error submitting application:', error);
      alert(failureMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Wrapper div for page-specific direction control
    <div dir={pageDirection} className={`careers-page-wrapper lang-${i18n.language}`}>
      <div className="container my-5">
        <h2 className="mb-4 display-5 text-center"> {/* Made heading bigger and centered */}
          {t('careersPage.title', 'Join Our Team')}
        </h2>

        <form onSubmit={handleSubmit} className="row g-3 p-4 border rounded shadow-sm bg-white"> {/* Added some padding and style to form */}
          <div className="col-md-6">
            <label htmlFor="fullName" className="form-label">{t('careersPage.labels.fullName', 'Full Name')}</label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              className="form-control"
              placeholder={t('careersPage.placeholders.fullName', 'Enter your full name')}
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="email" className="form-label">{t('careersPage.labels.email', 'Email Address')}</label>
            <input
              type="email"
              name="email"
              id="email"
              className="form-control"
              placeholder={t('careersPage.placeholders.email', 'your.email@example.com')}
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="phone" className="form-label">{t('careersPage.labels.phone', 'Phone Number')}</label>
            <input
              type="tel"
              name="phone"
              id="phone"
              className="form-control"
              placeholder={t('careersPage.placeholders.phone', 'e.g., +962 7...')}
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-md-6">
            <label htmlFor="position" className="form-label">{t('careersPage.labels.position', 'Position Applying For')}</label>
            <input
              type="text"
              name="position"
              id="position"
              className="form-control"
              placeholder={t('careersPage.placeholders.position', 'e.g., Sales Manager, Web Developer')}
              value={formData.position}
              onChange={handleChange}
              required
            />
          </div>

          <div className="col-12">
            <label htmlFor="resumeURL" className="form-label">{t('careersPage.labels.resumeURL', 'Link to Resume/CV')}</label>
            <input
              type="url"
              name="resumeURL"
              id="resumeURL"
              className="form-control"
              placeholder={t('careersPage.placeholders.resumeURL', 'https://your-resume-link.com')}
              value={formData.resumeURL}
              onChange={handleChange}
              required
            />
             <div className="form-text">
                {t('careersPage.helpText.resumeURL', 'Please provide a shareable link (e.g., Google Drive, Dropbox, LinkedIn).')}
            </div>
          </div>

          <div className="col-12">
            <label htmlFor="coverLetter" className="form-label">{t('careersPage.labels.coverLetter', 'Cover Letter')} <span className="text-muted small">{t('optional', '(Optional)')}</span></label>
            <textarea
              name="coverLetter"
              id="coverLetter"
              className="form-control"
              placeholder={t('careersPage.placeholders.coverLetter', 'Tell us why you are a good fit...')}
              rows={5}
              value={formData.coverLetter}
              onChange={handleChange}
            ></textarea>
          </div>

          <div className="col-12 text-end">
            <button
              type="submit"
              className="btn btn-primary btn-lg" // Made button larger
              disabled={loading}
            >
              {loading 
                ? t('careersPage.buttons.submitting', 'Submitting...') 
                : t('careersPage.buttons.submit', 'Submit Application')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Careers;