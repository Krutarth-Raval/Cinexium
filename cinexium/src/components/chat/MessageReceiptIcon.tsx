'use client';

export type MessageReceiptStatus = 'sent' | 'delivered' | 'read';

type ReceiptLikeMessage = {
  deliveredAt?: string | Date | null;
  isRead?: boolean | null;
};

export function getMessageReceiptStatus(message: ReceiptLikeMessage): MessageReceiptStatus {
  if (message.isRead) {
    return 'read';
  }

  if (message.deliveredAt) {
    return 'delivered';
  }

  return 'sent';
}

export function MessageReceiptIcon({
  status,
  className = '',
}: {
  status: MessageReceiptStatus;
  className?: string;
}) {
  const colorClass =
    status === 'read' ? 'text-primary-500' : 'text-white/45';

  if (status === 'sent') {
    return (
      <svg
        className={`h-3.5 w-3.5 ${colorClass} ${className}`}
        fill="none"
        viewBox="0 0 16 16"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3.5 8.5 6.5 11.5 12.5 5.5"
        />
      </svg>
    );
  }

  return (
    <svg
      className={`h-3.5 w-4 ${colorClass} ${className}`}
      fill="none"
      viewBox="0 0 20 16"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M1.5 8.5 4.5 11.5 9.5 6.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7.5 8.5 10.5 11.5 17.5 4.5"
      />
    </svg>
  );
}
