import React, { useState } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const PasskeyLogin: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // 1. Iniciar autenticação no backend
      console.log('Starting authentication...');
      const { data: startData } = await axios.post(
        `${API_URL}/passkey/login/start`,
        {},
        { withCredentials: true }
      );

      if (!startData.success) {
        throw new Error(startData.error || 'Erro ao iniciar login');
      }

      console.log('Authentication options received:', startData);

      // 2. Obter credencial do navegador
      console.log('Getting passkey credential...');
      const credential = await startAuthentication(startData.options);
      console.log('Credential obtained:', credential);

      // 3. Verificar autenticação no backend
      console.log('Verifying authentication...');
      const { data: verifyData } = await axios.post(
        `${API_URL}/passkey/login/verify`,
        { response: credential },
        { withCredentials: true }
      );

      if (!verifyData.success) {
        throw new Error(verifyData.error || 'Erro ao verificar login');
      }

      console.log('Authentication verified:', verifyData);

      // 4. Salvar token e dados do usuário
      localStorage.setItem('token', verifyData.token);
      localStorage.setItem('user', JSON.stringify(verifyData.user));
      localStorage.setItem('userRole', 'passkey_user');

      setSuccess(true);

      // 5. Redirecionar após 1 segundo
      setTimeout(() => {
        window.location.href = '/investor/dashboard';
      }, 1000);
    } catch (err: any) {
      console.error('Login error:', err);
      
      let errorMessage = 'Erro ao fazer login';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Mensagens específicas para erros comuns
      if (errorMessage.includes('NotAllowedError')) {
        errorMessage = 'Login cancelado ou não autorizado pelo navegador';
      } else if (errorMessage.includes('NotSupportedError')) {
        errorMessage = 'Seu navegador não suporta Passkeys';
      } else if (errorMessage.includes('AbortError')) {
        errorMessage = 'Operação cancelada. Tente novamente';
      } else if (errorMessage.includes('Challenge não encontrado')) {
        errorMessage = 'Sessão expirada. Tente novamente';
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
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Login com Passkey
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Use biometria ou PIN para acessar sua conta
          </p>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center">
              <svg
                className="w-6 h-6 text-green-600 mb-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <p className="text-center font-medium text-green-800">
              Login realizado com sucesso!
            </p>
            <p className="text-center text-sm text-green-600 mt-1">
              Redirecionando para o dashboard...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex">
                  <svg
                    className="w-4 h-4 text-red-600 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <p className="text-xs sm:text-sm text-red-800">{error}</p>
                </div>
              </div>
            )}

            <button
              onClick={handleLogin}
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
                  Autenticando...
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
                  Entrar com Passkey
                </>
              )}
            </button>

            <div className="text-center">
              <a
                href="/passkey/register"
                className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Não tem uma conta? Registre-se
              </a>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <svg
                className="w-6 h-6 text-blue-600 mx-auto mb-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <p className="text-xs text-gray-600 font-medium">Seguro</p>
            </div>
            <div>
              <svg
                className="w-6 h-6 text-blue-600 mx-auto mb-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <p className="text-xs text-gray-600 font-medium">Rápido</p>
            </div>
            <div>
              <svg
                className="w-6 h-6 text-blue-600 mx-auto mb-1.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <p className="text-xs text-gray-600 font-medium">Sem senha</p>
            </div>
          </div>

          <div className="mt-4 flex items-start space-x-2 text-xs text-gray-500">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p>
              Sua carteira Stellar está vinculada à sua passkey. Use qualquer
              dispositivo registrado para acessar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasskeyLogin;
