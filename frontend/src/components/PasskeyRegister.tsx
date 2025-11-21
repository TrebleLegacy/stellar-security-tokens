import React, { useState } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const PasskeyRegister: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // 1. Iniciar registro no backend
      console.log('Starting registration for:', email);
      const { data: startData } = await axios.post(
        `${API_URL}/passkey/register/start`,
        { email, name },
        { withCredentials: true }
      );

      if (!startData.success) {
        throw new Error(startData.error || 'Erro ao iniciar registro');
      }

      console.log('Registration options received:', startData);

      // 2. Criar credencial com WebAuthn no navegador
      console.log('Creating passkey credential...');
      const credential = await startRegistration(startData.options);
      console.log('Credential created:', credential);

      // 3. Verificar registro no backend
      console.log('Verifying registration...');
      const { data: verifyData } = await axios.post(
        `${API_URL}/passkey/register/verify`,
        {
          userId: startData.userId,
          response: credential,
        },
        { withCredentials: true }
      );

      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Erro ao verificar registro');
      }

      console.log('Registration verified:', verifyData);

      // 4. Salvar token e dados do usuário
      localStorage.setItem('token', verifyData.token);
      localStorage.setItem('user', JSON.stringify(verifyData.user));
      localStorage.setItem('userRole', 'passkey_user');

      setSuccess(true);

      // 5. Redirecionar após 2 segundos
      setTimeout(() => {
        window.location.href = '/investor/dashboard';
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);
      
      let errorMessage = 'Erro ao registrar';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Mensagens específicas para erros comuns
      if (errorMessage.includes('NotAllowedError')) {
        errorMessage = 'Registro cancelado ou não autorizado pelo navegador';
      } else if (errorMessage.includes('NotSupportedError')) {
        errorMessage = 'Seu navegador não suporta Passkeys';
      } else if (errorMessage.includes('AbortError')) {
        errorMessage = 'Operação cancelada. Tente novamente';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Criar Conta com Passkey
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Registre-se usando biometria ou PIN do dispositivo
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 text-green-600 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="font-medium text-green-800">Registro concluído!</p>
                <p className="text-sm text-green-600">Redirecionando...</p>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Nome Completo
              </label>
              <input
                id="name"
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed text-sm sm:text-base"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs sm:text-sm text-red-800">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Registrando...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                    />
                  </svg>
                  Criar Conta com Passkey
                </>
              )}
            </button>

            <div className="text-center mt-4">
              <a
                href="/passkey/login"
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700"
              >
                Já tem uma conta? Faça login
              </a>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-start space-x-2 text-xs sm:text-sm text-gray-600">
            <svg
              className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <p className="font-medium text-gray-700 mb-0.5 text-xs sm:text-sm">O que é Passkey?</p>
              <p className="text-xs sm:text-sm">
                Passkeys usam biometria (impressão digital, FaceID) ou PIN do
                dispositivo para autenticação segura, sem necessidade de senha.
                Uma carteira Stellar será criada automaticamente para você.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasskeyRegister;
