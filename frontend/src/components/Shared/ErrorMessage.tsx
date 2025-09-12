// src/components/ErrorMessage.tsx
export default function ErrorMessage({ error }: { error: string }) {
  return <div className="text-red-600 font-semibold">{error}</div>;
}