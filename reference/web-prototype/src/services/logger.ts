export const logs: string[] = JSON.parse(localStorage.getItem('app_logs') || '[]');

export const getLogs = () => {
  return JSON.parse(localStorage.getItem('app_logs') || '[]');
};

export const addLog = (message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = `[${timestamp}] ${message}`;
  logs.push(logEntry);
  if (logs.length > 50) logs.shift(); // Keep last 50
  localStorage.setItem('app_logs', JSON.stringify(logs));
  console.log(message);
};
