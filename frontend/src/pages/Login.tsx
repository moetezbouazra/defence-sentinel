import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { login } from '../lib/api';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error(t('pleaseFillAllFields'));
      return;
    }

    setLoading(true);
    try {
      const response = await login(email, password);
      
      // Store token in localStorage
      if (response.token) {
        localStorage.setItem('token', response.token);
        toast.success(t('loginSuccessful'));
        navigate('/dashboard');
      } else {
        toast.error(t('invalidResponse'));
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || t('loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('welcomeBack')}</h1>
          <p className="text-slate-400 mt-2">{t('signInToAccess')}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t('email')}</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="admin@sentinel.com"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t('password')}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('signingIn') : t('signIn')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          {t('dontHaveAccount')} <Link to="/register" className="text-blue-400 hover:text-blue-300">{t('register')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
