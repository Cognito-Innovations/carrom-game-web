const WEB_APP_URL = import.meta.env.VITE_SHEETS_WEBHOOK_URL;

export const appendWinnerToSheet = async (data: {
  email: string;
  score: number;
  timestamp: string;
}) => {
  if (!WEB_APP_URL) {
    console.warn('Sheets webhook URL not configured');
    return;
  }

  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    const text = await response.text();
    console.log('Sheets response:', text);
  } catch (error) {
    console.error('Failed to call sheets:', error);
  }
};
