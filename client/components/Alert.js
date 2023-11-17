export default function Alert({title, className = "text-base mb-4"}) {
  return(
    <div className={"bg-amber-100 rounded-md border-dashed border border-amber-200 px-6 py-2 justify-center flex text-amber-800 " + className}>
      <span className="text-center">{title}</span>
    </div>
  )
}
