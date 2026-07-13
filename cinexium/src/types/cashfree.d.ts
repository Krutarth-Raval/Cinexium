declare module '@cashfreepayments/cashfree-js' {
  export const load: (options: { mode: 'sandbox' | 'production' }) => Promise<any>;
}
