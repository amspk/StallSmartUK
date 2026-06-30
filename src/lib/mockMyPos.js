// Mock myPOS payment integration.
// Swap the body of `mockMyPosPay` for a real myPOS Checkout API call when
// you're ready to go live -- the calling code (Checkout.jsx) doesn't need
// to change, it just awaits a { success, reference, error? } shape.

export function mockMyPosPay({ amount, cardNumber }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Simple deterministic mock: cards ending in 0000 fail, everything else succeeds.
      const fails = cardNumber?.replace(/\s/g, "").endsWith("0000");
      if (fails) {
        resolve({ success: false, error: "Card declined by issuing bank." });
      } else {
        resolve({
          success: true,
          reference: `MYPOS-MOCK-${Date.now().toString(36).toUpperCase()}`,
        });
      }
    }, 1600);
  });
}
