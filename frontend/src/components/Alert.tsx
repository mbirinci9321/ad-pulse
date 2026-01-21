import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  className?: string;
}

export default function Alert({ type, message, onClose, className = '' }: AlertProps) {
  const config = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-500',
      text: 'text-green-900',
      icon: CheckCircleIcon,
      iconColor: 'text-green-600',
      title: 'Başarılı',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-500',
      text: 'text-red-900',
      icon: XMarkIcon,
      iconColor: 'text-red-600',
      title: 'Hata',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-400',
      text: 'text-yellow-900',
      icon: ExclamationCircleIcon,
      iconColor: 'text-yellow-600',
      title: 'Uyarı',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: InformationCircleIcon,
      iconColor: 'text-blue-400',
      title: 'Bilgi',
    },
  };

  const style = config[type];
  const Icon = style.icon;

  return (
    <div
      className={`${style.bg} ${style.border} ${style.text} border-l-4 px-4 py-3 rounded-md shadow-lg mb-6 ${className} animate-slide-in ${
        type === 'error' ? 'ring-2 ring-red-400' : 
        type === 'warning' ? 'ring-2 ring-yellow-400' : 
        type === 'success' ? 'ring-1 ring-green-300' : 
        'ring-1 ring-blue-300'
      }`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <Icon 
            className={`h-6 w-6 ${style.iconColor} ${
              type === 'error' ? 'animate-pulse' : 
              type === 'warning' ? 'animate-bounce' : 
              ''
            }`} 
            aria-hidden="true" 
          />
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-base">{style.title}</p>
                {type === 'error' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-200 text-red-900">
                    KRİTİK
                  </span>
                )}
                {type === 'warning' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-200 text-yellow-900">
                    UYARI
                  </span>
                )}
                {type === 'success' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-200 text-green-900">
                    BAŞARILI
                  </span>
                )}
              </div>
              <p className="text-sm mt-1.5 font-medium">{message}</p>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className={`ml-4 inline-flex ${style.text} hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  type === 'error' ? 'focus:ring-red-500' : 
                  type === 'warning' ? 'focus:ring-yellow-500' : 
                  type === 'success' ? 'focus:ring-green-500' : 
                  'focus:ring-blue-500'
                }`}
              >
                <span className="sr-only">Kapat</span>
                <XMarkIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
