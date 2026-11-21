export function safeReturnTo(value) {
  return /^\/(?:sign\/[a-f\d]{64}|contracts\/[a-f\d]{24})$/i.test(value || '') ? value : '';
}
