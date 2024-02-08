export default function Alert({title, className = "text-base mb-4", color = "amber"}) {
  return(
    <div className={`rounded-md border-dashed border px-6 py-2 justify-center flex ${"bg-"+color+"-50 border-"+color+"-200 text-"+color+"-800"} ${className}`}>
      <span className="text-center">{title}</span>
    </div>
  )
}
