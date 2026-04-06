'use client';

interface WsIndicatorProps {
  isConnected: boolean;
}

export default function WsIndicator({ isConnected }: WsIndicatorProps) {
  return (
    <div
      title={isConnected ? 'Live updates active' : 'Connecting...'}
      className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium shadow-sm"
    >
      <span
        className={`h-2 w-2 rounded-full ${
          isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
        }`}
      />
      <span className="text-gray-600">{isConnected ? 'Live' : 'Connecting'}</span>
    </div>
  );
}
