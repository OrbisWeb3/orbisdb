export default function Alert({
  title,
  className = "text-base mb-4",
  color = "amber",
}) {
  function getStyle() {
    switch (color) {
      case "sky":
        return "bg-sky-50 border-sky-200 text-sky-800";
      case "amber":
        return "bg-amber-50 border-amber-200 text-amber-800";
      case "red":
        return "bg-red-50 border-red-200 text-red-800";
      case "green":
        return "bg-green-50 border-green-200 text-green-800";
      default:
        return "bg-amber-50 border-amber-200 text-amber-800";
    }
  }
  return (
    <div
      className={`rounded-md border-dashed border px-6 py-2 justify-center flex ${getStyle()} ${className}`}
    >
      <span className="text-center">{title}</span>
    </div>
  );
}
