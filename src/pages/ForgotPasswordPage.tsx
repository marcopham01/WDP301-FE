import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await axios.post('/api/users/forgotPassword', { email });
      setMessage('Vui lòng kiểm tra email để đặt lại mật khẩu.');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Email không tồn tại hoặc có lỗi xảy ra.');
      } else {
        setError('Email không tồn tại hoặc có lỗi xảy ra.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 relative overflow-hidden"
    >
      {/* Nút back home */}
      <div className="absolute top-6 left-6 z-20">
        <button
          type="button"
          className="flex items-center gap-2 shadow-lg px-4 py-2 rounded-full bg-white/90 hover:bg-white border-gray-200 hover:border-blue-500 transition-all duration-300 hover:shadow-xl backdrop-blur-sm border text-gray-800"
          onClick={() => navigate('/login')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>
          <span className="font-medium">Quay lại</span>
        </button>
      </div>
      {/* Form quên mật khẩu */}
      <motion.form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md z-10"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Quên mật khẩu</h2>
        <label htmlFor="email" className="block mb-2 font-medium">Email</label>
        <input
          id="email"
          type="email"
          className="w-full p-2 border rounded mb-4"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded-full shadow-md hover:bg-green-700 transition mb-2 font-semibold text-base"
          disabled={loading}
        >
          {loading ? 'Đang gửi...' : 'Gửi email đặt lại mật khẩu'}
        </button>
        {message && <div className="mt-4 text-green-600">{message}</div>}
        {error && <div className="mt-4 text-red-600">{error}</div>}
      </motion.form>
    </motion.div>
  );
};

export default ForgotPasswordPage;
