import type { AuditLog } from '.';

type LogMethod = 'log' | 'warn' | 'error';

export function setupGlobalLogging(logger: AuditLog) {
  const methods: LogMethod[] = ['log', 'warn', 'error'];

  methods.forEach((method) => {
    const original = console[method].bind(console);

    console[method] = (...args: any[]) => {
      original(...args);
      const action = args[0] ?? '';             
      const payload = args[1] ?? (args.length > 2 ? args.slice(1) : null);           
      logger.log(
        action,
        payload,
        method === 'log' ? 'info' : method === 'warn' ? 'warn' : 'error',
        {
            url: window.location.href,
            type: 'console'
        }
      );
    };
  });

  window.onerror = (message, source, lineno, colno, error) => {
    const action = String(message) ?? 'Unknown error';
    const payload = {
      source,
      lineno,
      colno,
      stack: error?.stack ?? null
    };
    logger.log(
      action,
      payload,
      'error',
        {
            url: window.location.href,
            type: 'console'
        }
    );
  };

  window.onunhandledrejection = (event) => {
    const action = 'Unhandled promise rejection';
    const payload = event.reason;
    logger.log(
      action,
      payload,
      'error',
      {
        url: window.location.href,
        type: 'error'
      }
    );
  };
}