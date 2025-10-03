import { useState } from 'react';

interface RenewalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRenew: (verificationCode: string) => void;
  selectedCount: number;
}

export default function RenewalModal({ isOpen, onClose, onRenew, selectedCount }: RenewalModalProps) {
  const [verificationCode, setVerificationCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length === 6) {
      onRenew(verificationCode);
      setVerificationCode('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Renew Membership</h2>
          <p className="text-gray-600 mt-1">
            Renewing {selectedCount} customer{selectedCount > 1 ? 's' : ''} for 1 month
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code *
            </label>
            <div className="text-sm text-gray-500 mb-3">
              Enter the 6-digit verification code: <strong>123456</strong>
            </div>
            <input
              type="text"
              required
              maxLength={6}
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-center text-xl font-mono tracking-widest"
              placeholder="000000"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verificationCode.length !== 6}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Confirm Renewal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}