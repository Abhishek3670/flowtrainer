// src/components/Loading.tsx
export default function Loading({ label = "Loading..." }) {
  return <div className="text-gray-500 italic">{label}</div>;
}