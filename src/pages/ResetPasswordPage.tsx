import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Lấy token từ URL
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get('token');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await axios.post(`/api/users/resetpassword?token=${token}`, { newPassword });
      setMessage('Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        navigate('/login');
      }, 700);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn.');
      } else {
        setError('Token không hợp lệ hoặc đã hết hạn.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div className="flex items-center justify-center min-h-screen">Token không hợp lệ.</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-blue-200 relative overflow-hidden"
    >
      <motion.form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md z-10"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Đặt lại mật khẩu</h2>
        <label htmlFor="newPassword" className="block mb-2 font-medium">Mật khẩu mới</label>
        <input
          id="newPassword"
          type="password"
          className="w-full p-2 border rounded mb-4"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded-full shadow-md hover:bg-green-700 transition font-semibold text-base"
          disabled={loading}
        >
          {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
        </button>
        {message && <div className="mt-4 text-green-600">{message}</div>}
        {error && <div className="mt-4 text-red-600">{error}</div>}
      </motion.form>
    </motion.div>
  );
};

export default ResetPasswordPage;
