import React, { useState } from 'react';
import { Bell, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';

interface NotificationBellProps {
  count?: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ count = 0 }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'ORDER_PAID':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'ORDER_COMPLETED':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'ACCOUNT_VERIFIED':
        return <CheckCircle className="w-4 h-4 text-primary" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-dark-lighter border border-gray-800 rounded-xl shadow-xl z-50">
          <div className="p-3 border-b border-gray-800">
            <h3 className="font-semibold">通知</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {count === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无新通知</p>
              </div>
            ) : (
              <div className="p-2">
                {/* Mock notifications */}
                <div className="p-3 hover:bg-dark rounded-lg cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">订单已完成</p>
                      <p className="text-xs text-gray-500">您的订单 #12345 已完成</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
