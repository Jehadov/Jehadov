// src/Admin/pages/AdminLogin.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
// Import setPersistence and browserSessionPersistence
import { 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    setPersistence,                // <--- IMPORT THIS
    browserSessionPersistence,     // <--- IMPORT THIS
    type User 
} from 'firebase/auth';
import { auth } from '../../firebase';
import { FaSignInAlt, FaSpinner } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

const AdminLogin: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    setCheckingAuth(true);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Optional: Add admin role check here
        const from = (location.state as any)?.from?.pathname || '/admin/dashboard';
        navigate(from, { replace: true });
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, [navigate, location.state]);


  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // --- SET PERSISTENCE TO 'SESSION' BEFORE SIGNING IN ---
      await setPersistence(auth, browserSessionPersistence);
      // --- END OF PERSISTENCE SETTING ---

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Login successful - useEffect with onAuthStateChanged will handle redirection
      console.log('Admin login successful with session persistence:', userCredential.user.uid);
      
    } catch (err: any) {
      console.error('Admin login error:', err.code, err.message);
      if (err.code === 'auth/user-not-found' || 
          err.code === 'auth/wrong-password' || 
          err.code === 'auth/invalid-credential') {
        setError(t('adminLogin.errors.invalidCredentials', 'Invalid email or password. Please try again.'));
      } else if (err.code === 'auth/invalid-email') {
        setError(t('adminLogin.errors.invalidEmail', 'The email address is not valid.'));
      } else if (err.code === 'auth/too-many-requests') {
        setError(t('adminLogin.errors.tooManyRequests', 'Access to this account has been temporarily disabled due to many failed login attempts. You can try again later.'));
      }
      else {
        setError(t('adminLogin.errors.generic', 'An unexpected error occurred. Please try again.'));
      }
    } finally {
      setLoading(false);
    }
  };
  
  const pageDirection = i18n.language === 'ar' ? 'rtl' : 'ltr';

  if (checkingAuth) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
        <FaSpinner className="fa-spin fa-2x text-primary" />
        <p className="ms-2">{t('adminLogin.checkingAuth', 'Checking authentication...')}</p>
      </div>
    );
  }
  
  // If currentUser becomes true, the useEffect above will navigate.
  // This prevents flashing the login form if already logged in within the current session.
  if (currentUser && !checkingAuth) { 
     return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
        <FaSpinner className="fa-spin fa-2x text-primary" />
        <p className="ms-2">{t('adminLogin.redirecting', 'Redirecting...')}</p>
      </div>
    );
  }

  return (
    <div dir={pageDirection} className={`lang-${i18n.language}`}>
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
        <div className="col-11 col-sm-8 col-md-6 col-lg-5 col-xl-4">
          <div className="card shadow-lg border-0 rounded-3">
            <div className="card-body p-4 p-sm-5">
              <div className="text-center mb-4">
                <h1 className="h3 fw-bold text-primary">
                  🛍️ {t('adminLogin.title', 'Admin Panel Login')}
                </h1>
                <p className="text-muted">
                  {t('adminLogin.subtitle', 'Access your store management dashboard.')}
                </p>
              </div>

              {error && (
                <div className="alert alert-danger text-center py-2" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin}>
                <div className="form-floating mb-3">
                  <input
                    type="email"
                    className="form-control"
                    id="adminEmail"
                    placeholder={t('adminLogin.placeholders.email', 'name@example.com')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <label htmlFor="adminEmail">{t('adminLogin.labels.email', 'Email address')}</label>
                </div>

                <div className="form-floating mb-3">
                  <input
                    type="password"
                    className="form-control"
                    id="adminPassword"
                    placeholder={t('adminLogin.placeholders.password', 'Password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <label htmlFor="adminPassword">{t('adminLogin.labels.password', 'Password')}</label>
                </div>
                
                <div className="d-grid mt-4">
                  <button
                    className="btn btn-primary btn-lg fw-bold"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FaSpinner className="fa-spin me-2" />
                        {t('adminLogin.buttons.loggingIn', 'Logging In...')}
                      </>
                    ) : (
                      <>
                        <FaSignInAlt className="me-2" />
                        {t('adminLogin.buttons.login', 'Login')}
                      </>
                    )}
                  </button>
                </div>
              </form>
              <div className="text-center mt-4">
                <Link to="/" className="small text-muted">
                  {t('adminLogin.backToSite', '← Back to Main Site')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
